import { AMP_PROFILES } from './data/amp-profiles.js';
import { ATTRIBUTE, ATTRIBUTES, ITEM_TYPE, LEVEL, LEVELS, LIMITS, METATYPE, NO_WOUND_ATTRIBUTE, RANDOM_CONCEPT, ROLE, WOUND_SEVERITY, WOUND_TYPE } from './data/rules.js';
import { getSpecializations } from './specializations.js';

const money = amount => new Intl.NumberFormat('en-US').format(Math.round(amount)) + '¥';
const pick = valuesArr => valuesArr[Math.floor(Math.random() * valuesArr.length)];
export const ALTERNATE_WOUND_PRESETS = {
  [WOUND_TYPE.Mental]: { attribute: ATTRIBUTE.Willpower },
  [WOUND_TYPE.Matrix]: { attribute: NO_WOUND_ATTRIBUTE, armorName: 'Firewall' },
  [WOUND_TYPE.Vehicle]: { attribute: NO_WOUND_ATTRIBUTE, armorName: WOUND_TYPE.Vehicle }
};

const blank = () => ({
  name: '',
  metatype: METATYPE.Human,
  level: LEVEL.Runner,
  role: ROLE.Any,
  concept: RANDOM_CONCEPT,
  personality: true,
  attributes: Object.fromEntries(ATTRIBUTES.map(attributeStr => [attributeStr, 2])),
  edge: 4,
  skills: [],
  knowledge: [],
  amps: [],
  items: [],
  keywords: [],
  dispositions: [],
  cues: [],
  portrait: '',
  essence: '',
  notes: '',
  riskReduction: [],
  woundSettings: {
    mainArmorName: '',
    mainArmorIncrease: null,
    alternateArmorName: '',
    alternateArmorIncrease: null,
    alternateAttribute: ALTERNATE_WOUND_PRESETS[WOUND_TYPE.Mental].attribute,
    alternateType: WOUND_TYPE.Mental,
    vehicleBody: null
  },
  wounds: {
    [WOUND_SEVERITY.Light]: 0,
    [WOUND_SEVERITY.Serious]: 0,
    [WOUND_SEVERITY.Incapacitated]: 0
  },
  mentalWounds: {
    [WOUND_SEVERITY.Light]: 0,
    [WOUND_SEVERITY.Serious]: 0,
    [WOUND_SEVERITY.Incapacitated]: 0
  }
});
const priceSkill = rawRating => {
  const rating = Math.max(0, Math.floor(+rawRating || 0));
  return Math.min(rating, 5) * 2500 + Math.max(rating - 5, 0) * 5000;
};
const priceAmp = ampObj => (+ampObj.rating || 0) * 5000;
const ampArmor = ampObj => ampObj.armor ?? AMP_PROFILES[ampObj.name]?.armor;

export function equipArmorAmp(characterObj, ampObj) {
  if (ampArmor(ampObj) === undefined) return;
  characterObj.items = characterObj.items.filter(itemObj => itemObj.type !== ITEM_TYPE.Armor);
  characterObj.amps = characterObj.amps.map(existingAmpObj => existingAmpObj.mainArmor ? { ...existingAmpObj, mainArmor: false } : existingAmpObj);
  ampObj.mainArmor = true;
}

export function woundArmor(characterObj) {
  const amps = characterObj.amps.filter(ampObj => ampArmor(ampObj) !== undefined);
  const active = amps.find(ampObj => ampObj.mainArmor);
  const orderedAmps = active ? [active, ...amps.filter(ampObj => ampObj !== active)] : amps;
  const armor = [
    ...orderedAmps.map(ampObj => ({ name: ampObj.name, protection: ampArmor(ampObj) })),
    ...characterObj.items.filter(itemObj => itemObj.type === ITEM_TYPE.Armor).map(itemObj => ({
      name: itemObj.name,
      protection: Number(itemObj.name?.match(/\((\d+)\)/)?.[1] ?? 0)
    }))
  ];
  const alternateName = ALTERNATE_WOUND_PRESETS[characterObj.woundSettings?.alternateType]?.armorName;
  const [main, alternate] = ['main', 'alternate'].map((slotStr, index) => ({
    name: characterObj.woundSettings?.[`${slotStr}ArmorName`]?.trim() || (index === 1 && alternateName) || armor[index]?.name || '',
    protection: characterObj.woundSettings?.[`${slotStr}ArmorIncrease`] ?? armor[index]?.protection ?? 0
  }));
  return { main, alternate };
}

export function mainArmor(characterObj) {
  const { main } = woundArmor(characterObj);
  return { ...main, name: main.name || 'No armor' };
}

export function woundThresholds(typeStr, resistance, protection = 0) {
  const base = Number(resistance) || 0;
  const armor = Number(protection) || 0;
  if (typeStr === WOUND_TYPE.Vehicle) return [1, 2, 3].map(multiplier => multiplier * base + armor);
  const light = base + (typeStr === WOUND_TYPE.Matrix ? 0 : armor);
  return [light, light + 3, light + 6];
}

const maxed = characterObj => ATTRIBUTES.filter((attributeStr, index) => +characterObj.attributes[attributeStr] >= LIMITS[characterObj.metatype][index]).length;
export function calc(characterObj) {
  const level = LEVELS[characterObj.level];
  const costs = characterCosts(characterObj);
  const spent = Object.values(costs).reduce((total, amount) => total + amount, 0);
  const warnings = characterWarnings(characterObj, level, spent);
  return { ...costs, spent, remaining: level.budget - spent, warnings };
}

function characterCosts(characterObj) {
  const skills = characterObj.skills.reduce((total, skillObj) =>
    total + priceSkill(skillObj.rating) + getSpecializations(skillObj).filter(Boolean).length * 2500, 0);
  const knowledge = characterObj.knowledge.filter(x => x.trim()).length * 2500;
  const amps = characterObj.amps.reduce((total, ampObj) => total + priceAmp(ampObj), 0);
  const items = characterObj.items.reduce((total, itemObj) => total + (+itemObj.cost || 0), 0);
  return { attr: attributeCosts(characterObj), skills, knowledge, amps, items };
}

function attributeCosts(characterObj) {
  let attr = 0;
  ATTRIBUTES.forEach((attributeStr, index) => {
    const rating = Math.max(0, Math.floor(+characterObj.attributes[attributeStr] || 0));
    attr += rating * 10000;
    if (rating >= LIMITS[characterObj.metatype][index]) attr += 10000;
  });
  return attr;
}

function characterWarnings(characterObj, levelObj, spent) {
  const warnings = [];
  const essence = String(characterObj.essence ?? '').trim().replace(',', '.');
  if (essence && Number(essence) <= 0) warnings.push('Essence must be greater than 0.');
  if (characterObj.items.filter(x => x.type === ITEM_TYPE.Equipment).length > 4) warnings.push(
    'Maximum 4 equipment items; remove extras.');
  if (spent > levelObj.budget) warnings.push('Budget exceeded by ' + money(spent - levelObj.budget));
  ATTRIBUTES.forEach((attributeStr, index) => {
    const v = +characterObj.attributes[attributeStr];
    if (v < 1 || v > LIMITS[characterObj.metatype][index]) warnings.push(attributeStr + ' exceeds metatype range 1–' + LIMITS[characterObj.metatype][index] +
      ' (override permitted)')
  });
  if (maxed(characterObj) > levelObj.max) warnings.push('Level allows ' + levelObj.max + ' attribute(s) at metatype maximum; found ' +
    maxed(characterObj));
  characterObj.skills.forEach(x => {
    if (x.rating > levelObj.skill) warnings.push(x.name + ' exceeds starting skill limit ' + levelObj.skill);
    if (x.specialization && x.rating < 1) warnings.push(x.name + ' specialization requires rating 1+');
    if (x.rating > 8) warnings.push(x.name + ' exceeds general skill cap 8')
  });
  return warnings;
}

export {
  money,
  pick,
  blank,
  priceSkill,
  priceAmp,
  maxed
};
