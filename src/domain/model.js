import { AMP_PROFILES } from './data/amp-profiles.js';
import { ATTRIBUTES, LIMITS, LEVELS } from './data/rules.js';
import { getSpecializations } from './specializations.js';

export const isFreeCommlink = name => /commlink/i.test(name);
const money = n => new Intl.NumberFormat('en-US').format(Math.round(n)) + '¥';
const uid = () => Math.random().toString(36).slice(2, 10);
const pick = a => a[Math.floor(Math.random() * a.length)];
export const ALTERNATE_WOUND_PRESETS = {
  Mental: { attribute: 'Willpower' },
  Matrix: { attribute: '---', armorName: 'Firewall' },
  Vehicle: { attribute: '---', armorName: 'Vehicle' }
};

const blank = () => ({
  name: '',
  metatype: 'Human',
  level: 'Runner',
  role: 'Any',
  concept: 'Random',
  personality: true,
  attributes: Object.fromEntries(ATTRIBUTES.map(a => [a, 2])),
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
  riskReduction: 0,
  woundSettings: {
    mainArmorName: '',
    mainArmorIncrease: null,
    alternateArmorName: '',
    alternateArmorIncrease: null,
    alternateAttribute: ALTERNATE_WOUND_PRESETS.Mental.attribute,
    alternateType: 'Mental',
    vehicleBody: null
  },
  wounds: {
    light: 0,
    serious: 0,
    incapacitated: 0
  },
  mentalWounds: {
    light: 0,
    serious: 0,
    incapacitated: 0
  }
});
const priceSkill = r => Array.from({
  length: Math.max(0, +r || 0)
}, (_, i) => i < 5 ? 2500 : 5000).reduce((a, b) => a + b, 0);
const priceAmp = amp => (+amp.rating || 0) * 5000;
const ampArmor = amp => amp.armor ?? AMP_PROFILES[amp.name]?.armor;

export function equipArmorAmp(s, amp) {
  if (ampArmor(amp) === undefined) return;
  s.items = s.items.filter(item => item.type !== 'armor');
  s.amps = s.amps.map(existing => existing.mainArmor ? { ...existing, mainArmor: false } : existing);
  amp.mainArmor = true;
}

export function woundArmor(s) {
  const amps = s.amps.filter(amp => ampArmor(amp) !== undefined);
  const active = amps.find(amp => amp.mainArmor);
  const orderedAmps = active ? [active, ...amps.filter(amp => amp !== active)] : amps;
  const armor = [
    ...orderedAmps.map(amp => ({ name: amp.name, protection: ampArmor(amp) })),
    ...s.items.filter(item => item.type === 'armor').map(item => ({
      name: item.name,
      protection: Number(item.name?.match(/\((\d+)\)/)?.[1] ?? 0)
    }))
  ];
  const alternateName = ALTERNATE_WOUND_PRESETS[s.woundSettings?.alternateType]?.armorName;
  const [main, alternate] = ['main', 'alternate'].map((slot, index) => ({
    name: s.woundSettings?.[`${slot}ArmorName`]?.trim() || (index === 1 && alternateName) || armor[index]?.name || '',
    protection: s.woundSettings?.[`${slot}ArmorIncrease`] ?? armor[index]?.protection ?? 0
  }));
  return { main, alternate };
}

export function mainArmor(s) {
  const { main } = woundArmor(s);
  return { ...main, name: main.name || 'No armor' };
}

export function woundThresholds(type, resistance, protection = 0) {
  const base = Number(resistance) || 0;
  const armor = Number(protection) || 0;
  if (type === 'Vehicle') return [1, 2, 3].map(multiplier => multiplier * base + armor);
  const light = base + (type === 'Matrix' ? 0 : armor);
  return [light, light + 3, light + 6];
}

const maxed = s => ATTRIBUTES.filter((a, i) => +s.attributes[a] >= LIMITS[s.metatype][i]).length;
export function calc(s) {
  const level = LEVELS[s.level];
  let attr = 0;
  ATTRIBUTES.forEach((a, i) => {
    const n = +s.attributes[a] || 0;
    for (let k = 1; k <= n; k++) attr += k === LIMITS[s.metatype][i] ? 20000 : 10000
  });
  const skills = s.skills.reduce((total, skill) =>
    total + priceSkill(skill.rating) + getSpecializations(skill).filter(Boolean).length * 2500, 0);
  const knowledge = s.knowledge.filter(x => x.trim()).length * 2500;
  const amps = s.amps.reduce((total, amp) => total + priceAmp(amp), 0);
  const items = s.items.reduce((n, x) => n + (x.type === 'equipment' && isFreeCommlink(x.name) ? 0 : (+x.cost || 0)),
    0);
  const spent = attr + skills + knowledge + amps + items;
  const warnings = [];
  const essence = String(s.essence ?? '').trim().replace(',', '.');
  if (essence && Number(essence) <= 0) warnings.push('Essence must be greater than 0.');
  if (s.items.filter(x => x.type === 'equipment' && !isFreeCommlink(x.name)).length > 4) warnings.push(
    'Maximum 4 equipment items; remove extras.');
  if (spent > level.budget) warnings.push('Budget exceeded by ' + money(spent - level.budget));
  ATTRIBUTES.forEach((a, i) => {
    const v = +s.attributes[a];
    if (v < 1 || v > LIMITS[s.metatype][i]) warnings.push(a + ' exceeds metatype range 1–' + LIMITS[s.metatype][i] +
      ' (override permitted)')
  });
  if (maxed(s) > level.max) warnings.push('Level allows ' + level.max + ' attribute(s) at metatype maximum; found ' +
    maxed(s));
  s.skills.forEach(x => {
    if (x.rating > level.skill) warnings.push(x.name + ' exceeds starting skill limit ' + level.skill);
    if (x.specialization && x.rating < 1) warnings.push(x.name + ' specialization requires rating 1+');
    if (x.rating > 8) warnings.push(x.name + ' exceeds general skill cap 8')
  });
  return {
    attr,
    skills,
    knowledge,
    amps,
    items,
    spent,
    remaining: level.budget - spent,
    warnings
  };
}

export {
  money,
  pick,
  blank,
  priceSkill,
  priceAmp,
  maxed
};
