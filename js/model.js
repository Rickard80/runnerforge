import {
  ATTRIBUTES,
  LIMITS,
  LEVELS
} from './data.js';
const $ = s => document.querySelector(s),
  money = n => new Intl.NumberFormat('en-US').format(Math.round(n)) + '¥';
const uid = () => Math.random().toString(36).slice(2, 10);
const pick = a => a[Math.floor(Math.random() * a.length)];
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
const maxed = s => ATTRIBUTES.filter((a, i) => +s.attributes[a] >= LIMITS[s.metatype][i]).length;
export function calc(s) {
  const level = LEVELS[s.level];
  let attr = 0;
  ATTRIBUTES.forEach((a, i) => {
    const n = +s.attributes[a] || 0;
    for (let k = 1; k <= n; k++) attr += k === LIMITS[s.metatype][i] ? 20000 : 10000
  });
  const skills = s.skills.reduce((n, x) => n + priceSkill(x.rating) + ((Array.isArray(x.specializations) ? x
    .specializations.filter(v => String(v).trim()).length : String(x.specialization || '').split(',').filter(v =>
      v.trim()).length) * 2500), 0);
  const knowledge = s.knowledge.filter(x => x.trim()).length * 2500;
  const amps = s.amps.reduce((total, amp) => total + priceAmp(amp), 0);
  const items = s.items.reduce((n, x) => n + (x.type === 'equipment' && /commlink/i.test(x.name) ? 0 : (+x.cost || 0)),
    0);
  const spent = attr + skills + knowledge + amps + items;
  const warnings = [];
  if (s.items.filter(x => x.type === 'equipment' && !/commlink/i.test(x.name)).length > 4) warnings.push(
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
