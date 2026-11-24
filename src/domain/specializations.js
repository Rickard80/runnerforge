import { normalizeName } from './names.js';

// Core skills and specializations, with the existing conversion-guide skill for technomancers.
export const SKILL = Object.freeze({
  Athletics: 'Athletics',
  Perception: 'Perception',
  Piloting: 'Piloting',
  Stealth: 'Stealth',
  Survival: 'Survival',
  CloseCombat: 'Close Combat',
  RangedWeapons: 'Ranged Weapons',
  Cracking: 'Cracking',
  Electronics: 'Electronics',
  Engineering: 'Engineering',
  Influence: 'Influence',
  Network: 'Network',
  Conjuring: 'Conjuring',
  Sorcery: 'Sorcery',
  Tasking: 'Tasking'
});

const CORE_SKILLS = {
  [SKILL.Athletics]: {
    uses: {
      Strength: 'Running, climbing, swimming, and other feats of muscle power.',
      Agility: 'Parkour, acrobatics, and ranged defense.'
    },
    specializations: { Climbing: 'S', Parkour: 'A', 'Ranged Defense': 'A', Running: 'S', Swimming: 'S' }
  },
  [SKILL.Perception]: {
    uses: { Logic: 'Noticing details, searching, reading intentions, and recalling information.' },
    specializations: ['Astral', 'Matrix', 'Physical', 'Social']
  },
  [SKILL.Piloting]: {
    uses: { Agility: 'Controlling vehicles and drones manually, remotely, or while jumped in.' },
    specializations: ['Bikes', 'Cars', 'Trucks', 'Water Vehicles', 'Flying Vehicles', 'Ground Drones', 'Water Drones', 'Flying Drones']
  },
  [SKILL.Stealth]: {
    uses: {
      Agility: 'Physical or astral sneaking, palming, and picking mechanical locks.',
      Logic: 'Matrix sneaking and bypassing electronic locks or maglocks.'
    },
    specializations: {
      'Astral Sneaking': 'A', 'Matrix Sneaking': 'L', 'Physical Sneaking': 'A', Palming: 'A', Lockpicking: 'A/L'
    }
  },
  [SKILL.Survival]: {
    uses: {
      Logic: 'First aid, navigation, and finding food, water, or shelter.',
      Charisma: 'Handling and training animals.',
      Willpower: 'Keeping your composure under pressure.'
    },
    specializations: { Animals: 'C', Composure: 'W', 'First Aid': 'L', Navigation: 'L', Wilderness: 'L' }
  },
  [SKILL.CloseCombat]: {
    uses: {
      Agility: 'Physical melee attacks with weapons or unarmed strikes, and melee defense.',
      Willpower: 'Astral combat.'
    },
    specializations: { Unarmed: 'A', Blades: 'A', Clubs: 'A', Defense: 'A', 'Astral Combat': 'W' }
  },
  [SKILL.RangedWeapons]: {
    uses: { Agility: 'Aiming and using thrown, handheld, or manually operated mounted weapons.' },
    specializations: [
      'Throwing Weapons', 'Archery', 'Pistols', 'Submachine Guns', 'Rifles',
      'Grenade Launchers', 'Heavy Weapons', 'Mounted Weapons'
    ]
  },
  [SKILL.Cracking]: {
    uses: {
      Logic: 'Gaining Matrix access through a backdoor or brute force.',
      Willpower: 'Fighting in Matrix cybercombat.'
    },
    specializations: { Backdoor: 'L', 'Brute Force': 'L', Cybercombat: 'W' }
  },
  [SKILL.Electronics]: {
    uses: { Logic: 'Searching and protecting the Matrix, or using and programming personal electronics.' },
    specializations: ['Matrix Protection', 'Matrix Search', 'Personal Electronics']
  },
  [SKILL.Engineering]: {
    uses: { Logic: 'Building and repairing devices, electronic warfare, demolitions, and remote-controlled weapons.' },
    specializations: [
      'Cybernetics B&R', 'Drones B&R', 'Electronics B&R', 'Mechanical B&R', 'Vehicles B&R',
      'Electronic Warfare', 'Demolitions', 'Remote-Controlled Weapons'
    ]
  },
  [SKILL.Influence]: {
    uses: { Charisma: 'Bluffing, fitting in, impersonating, intimidating, and negotiating.' },
    specializations: ['Bluff', 'Etiquette', 'Impersonation', 'Intimidation', 'Negotiation']
  },
  [SKILL.Network]: {
    uses: { Charisma: 'Calling on social circles for information, gear, or favors.' },
    specializations: ['Academic', 'Corporate', 'Criminal', 'Engineering', 'Government', 'Magic', 'Matrix', 'Media', 'Medical', 'Street']
  },
  [SKILL.Conjuring]: {
    uses: {
      Logic: 'Summoning or banishing spirits in the hermetic or UMT tradition.',
      Charisma: 'Summoning or banishing spirits in the shamanic tradition.'
    },
    specializations: [
      'Banishing', 'Spirits of Air', 'Spirits of Beasts', 'Spirits of Earth',
      'Spirits of Fire', 'Spirits of Kin', 'Spirits of Plants', 'Spirits of Water'
    ]
  },
  [SKILL.Sorcery]: {
    uses: { Willpower: 'Casting spells and countering magic.' },
    specializations: ['Counterspelling', 'Combat Spells', 'Detection Spells', 'Health Spells', 'Illusion Spells', 'Manipulation Spells']
  }
};

export const SKILLS = Object.keys(CORE_SKILLS);
export const TASKING = SKILL.Tasking;
const skillRules = {
  ...CORE_SKILLS,
  [TASKING]: {
    uses: { Logic: 'Threading complex forms and compiling or decompiling sprites as a technomancer.' },
    specializations: ['Compilation', 'Complex Forms', 'Decompilation']
  }
};

export function skillRule(nameStr) {
  return Object.hasOwn(skillRules, nameStr) ? skillRules[nameStr] : undefined;
}

export function linkedAttributes(skillObj) {
  const rule = skillRule(skillObj.name);
  return rule ? Object.keys(rule.uses) : [skillObj.attribute];
}

export function specializationOptions(nameStr) {
  const rule = skillRule(nameStr);
  if (!rule) return [];
  const { uses, specializations } = rule;
  if (!Array.isArray(specializations)) return Object.entries(specializations);
  const code = Object.keys(uses).map(attributeStr => attributeStr[0]).join('/');
  return specializations.map(valueStr => [valueStr, code]);
}

export function specializationCode(nameStr, specializationStr) {
  return specializationOptions(nameStr).find(([valueStr]) => valueStr.toLowerCase() === specializationStr.toLowerCase())?.[1];
}

export const getSpecializations = skillObj => Array.isArray(skillObj.specializations) ?
  skillObj.specializations.map(v => String(v || '').trim()) :
  String(skillObj.specialization || '').split(',').map(v => v.trim()).filter(Boolean);
export const abbreviatedAttribute = attributeStr => String(attributeStr ?? '').slice(0, 3).toUpperCase();
export const specializationAttribute = (skillObj, valueStr) => {
  const attributes = linkedAttributes(skillObj);
  const code = specializationCode(skillObj.name, valueStr);
  const allowed = code ? attributes.filter(attributeStr => code.split('/').includes(attributeStr[0])) : attributes;
  const selected = skillObj.specializationAttributes?.[normalizeName(valueStr)];
  if (allowed.includes(selected)) return selected;
  return allowed.includes(skillObj.attribute) ? skillObj.attribute : allowed[0];
};
