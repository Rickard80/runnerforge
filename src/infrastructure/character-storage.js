import { catalogNames } from '../domain/data/catalog.js';
import { AMP_PROFILES, EMERGED_AMP } from '../domain/data/amp-profiles.js';
import { CONCEPTS, conceptsForRole } from '../domain/data/concepts.js';
import { ATTRIBUTES, NO_WOUND_ATTRIBUTE, RANDOM_CONCEPT, ROLE, WOUND_TYPE } from '../domain/data/rules.js';
import { ALTERNATE_WOUND_PRESETS, blank } from '../domain/model.js';
import { normalizeName } from '../domain/names.js';

const STORE = 'anarchy2.characters.v1';
const legacyRoles = new Map([
  ['Fighter', ROLE.Muscle], ['Magician', ROLE.Awakened], ['Technologist', ROLE.Tech], ['Social', ROLE.Influence]
]);

export function readSavedCharacters() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}

export function writeSavedCharacters(charactersObj) {
  localStorage.setItem(STORE, JSON.stringify(charactersObj));
}

export function restoreCharacter(savedObj) {
  const defaults = blank();
  const characterObj = { ...defaults, ...savedObj };
  characterObj.woundSettings = restoreWoundSettings(savedObj.woundSettings, defaults.woundSettings);
  restoreConcept(characterObj);
  characterObj.amps = characterObj.amps.map(restoreAmp);
  characterObj.items = characterObj.items.map(restoreItem);
  return characterObj;
}

function restoreWoundSettings(savedWoundsObj, defaultWoundsObj) {
  const wounds = { ...defaultWoundsObj, ...savedWoundsObj };
  const { alternateFirewall, alternateBody } = wounds;
  if (wounds.alternateType === 'Damage') wounds.alternateType = WOUND_TYPE.Vehicle;
  if (wounds.alternateAttribute === NO_WOUND_ATTRIBUTE && wounds.alternateType === WOUND_TYPE.Matrix && alternateFirewall != null) {
    wounds.alternateArmorIncrease = alternateFirewall;
  }
  if (wounds.alternateType === WOUND_TYPE.Vehicle && !Object.hasOwn(savedWoundsObj ?? {}, 'vehicleBody')) {
    wounds.vehicleBody = alternateBody ?? null;
    if (alternateBody == null && wounds.alternateAttribute === NO_WOUND_ATTRIBUTE) {
      wounds.vehicleBody = wounds.alternateArmorIncrease;
      wounds.alternateArmorIncrease = null;
    }
  }
  delete wounds.alternateFirewall;
  delete wounds.alternateBody;
  if (!Object.hasOwn(ALTERNATE_WOUND_PRESETS, wounds.alternateType)) {
    wounds.alternateType = defaultWoundsObj.alternateType;
    wounds.alternateAttribute = defaultWoundsObj.alternateAttribute;
  }
  if (!ATTRIBUTES.includes(wounds.alternateAttribute)) {
    wounds.alternateAttribute = ALTERNATE_WOUND_PRESETS[wounds.alternateType].attribute;
  }
  return wounds;
}

function restoreConcept(characterObj) {
  characterObj.role = legacyRoles.get(characterObj.role) ?? characterObj.role;
  if (characterObj.role !== ROLE.Any && !Object.hasOwn(CONCEPTS, characterObj.role)) characterObj.role = ROLE.Any;
  if (!conceptsForRole(characterObj.role).some(conceptObj => conceptObj.name === characterObj.concept)) characterObj.concept = RANDOM_CONCEPT;
}

function restoreAmp(ampObj) {
  return ampObj.name === 'Emerged' && ampObj.source === AMP_PROFILES[EMERGED_AMP].source
    ? { ...ampObj, name: EMERGED_AMP }
    : ampObj;
}

function restoreItem(itemObj) {
  const type = normalizeName(itemObj.type);
  return catalogNames(type).length ? { ...itemObj, type } : itemObj;
}
