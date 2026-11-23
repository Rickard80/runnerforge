import { CATALOG } from '../domain/data/catalog.js';
import { AMP_PROFILES, EMERGED_AMP } from '../domain/data/amp-profiles.js';
import { CONCEPTS, conceptsForRole } from '../domain/data/concepts.js';
import { ATTRIBUTES } from '../domain/data/rules.js';
import { ALTERNATE_WOUND_PRESETS, blank } from '../domain/model.js';
import { normalizeName } from '../domain/names.js';

const STORE = 'anarchy2.characters.v1';
const legacyRoles = new Map([
  ['Fighter', 'Muscle'], ['Magician', 'Awakened'], ['Technologist', 'Tech'], ['Social', 'Influence']
]);

export function readSavedCharacters() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}

export function writeSavedCharacters(characters) {
  localStorage.setItem(STORE, JSON.stringify(characters));
}

export const restoreCharacter = saved => {
  const defaults = blank();
  const s = { ...defaults, ...saved, woundSettings: { ...defaults.woundSettings, ...saved.woundSettings } };
  const wounds = s.woundSettings;
  const { alternateFirewall, alternateBody } = wounds;
  if (wounds.alternateType === 'Damage') wounds.alternateType = 'Vehicle';
  if (wounds.alternateAttribute === '---' && wounds.alternateType === 'Matrix' && alternateFirewall != null) {
    wounds.alternateArmorIncrease = alternateFirewall;
  }
  if (wounds.alternateType === 'Vehicle' && !Object.hasOwn(saved.woundSettings ?? {}, 'vehicleBody')) {
    wounds.vehicleBody = alternateBody ?? null;
    if (alternateBody == null && wounds.alternateAttribute === '---') {
      wounds.vehicleBody = wounds.alternateArmorIncrease;
      wounds.alternateArmorIncrease = null;
    }
  }
  delete wounds.alternateFirewall;
  delete wounds.alternateBody;
  if (!Object.hasOwn(ALTERNATE_WOUND_PRESETS, wounds.alternateType)) {
    wounds.alternateType = defaults.woundSettings.alternateType;
    wounds.alternateAttribute = defaults.woundSettings.alternateAttribute;
  }
  if (!ATTRIBUTES.includes(wounds.alternateAttribute)) {
    wounds.alternateAttribute = ALTERNATE_WOUND_PRESETS[wounds.alternateType].attribute;
  }
  s.role = legacyRoles.get(s.role) ?? s.role;
  if (s.role !== 'Any' && !Object.hasOwn(CONCEPTS, s.role)) s.role = 'Any';
  if (!conceptsForRole(s.role).some(c => c.name === s.concept)) s.concept = 'Random';
  s.amps = s.amps.map(amp => amp.name === 'Emerged' && amp.source === AMP_PROFILES[EMERGED_AMP].source
    ? { ...amp, name: EMERGED_AMP }
    : amp);
  s.items = s.items.map(item => {
    const type = normalizeName(item.type);
    return Object.hasOwn(CATALOG, type) ? { ...item, type } : item;
  });
  return s;
};
