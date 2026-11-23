// Core skills and specializations, with the existing conversion-guide skill for technomancers.
const CORE_SKILLS = {
  Athletics: {
    uses: {
      Strength: 'Running, climbing, swimming, and other feats of muscle power.',
      Agility: 'Parkour, acrobatics, and ranged defense.'
    },
    specializations: { Climbing: 'S', Parkour: 'A', 'Ranged Defense': 'A', Running: 'S', Swimming: 'S' }
  },
  Perception: {
    uses: { Logic: 'Noticing details, searching, reading intentions, and recalling information.' },
    specializations: ['Astral', 'Matrix', 'Physical', 'Social']
  },
  Piloting: {
    uses: { Agility: 'Controlling vehicles and drones manually, remotely, or while jumped in.' },
    specializations: ['Bikes', 'Cars', 'Trucks', 'Water Vehicles', 'Flying Vehicles', 'Ground Drones', 'Water Drones', 'Flying Drones']
  },
  Stealth: {
    uses: {
      Agility: 'Physical or astral sneaking, palming, and picking mechanical locks.',
      Logic: 'Matrix sneaking and bypassing electronic locks or maglocks.'
    },
    specializations: {
      'Astral Sneaking': 'A', 'Matrix Sneaking': 'L', 'Physical Sneaking': 'A', Palming: 'A', Lockpicking: 'A/L'
    }
  },
  Survival: {
    uses: {
      Logic: 'First aid, navigation, and finding food, water, or shelter.',
      Charisma: 'Handling and training animals.',
      Willpower: 'Keeping your composure under pressure.'
    },
    specializations: { Animals: 'C', Composure: 'W', 'First Aid': 'L', Navigation: 'L', Wilderness: 'L' }
  },
  'Close Combat': {
    uses: {
      Agility: 'Physical melee attacks with weapons or unarmed strikes, and melee defense.',
      Willpower: 'Astral combat.'
    },
    specializations: { Unarmed: 'A', Blades: 'A', Clubs: 'A', Defense: 'A', 'Astral Combat': 'W' }
  },
  'Ranged Weapons': {
    uses: { Agility: 'Aiming and using thrown, handheld, or manually operated mounted weapons.' },
    specializations: [
      'Throwing Weapons', 'Archery', 'Pistols', 'Submachine Guns', 'Rifles',
      'Grenade Launchers', 'Heavy Weapons', 'Mounted Weapons'
    ]
  },
  Cracking: {
    uses: {
      Logic: 'Gaining Matrix access through a backdoor or brute force.',
      Willpower: 'Fighting in Matrix cybercombat.'
    },
    specializations: { Backdoor: 'L', 'Brute Force': 'L', Cybercombat: 'W' }
  },
  Electronics: {
    uses: { Logic: 'Searching and protecting the Matrix, or using and programming personal electronics.' },
    specializations: ['Matrix Protection', 'Matrix Search', 'Personal Electronics']
  },
  Engineering: {
    uses: { Logic: 'Building and repairing devices, electronic warfare, demolitions, and remote-controlled weapons.' },
    specializations: [
      'Cybernetics B&R', 'Drones B&R', 'Electronics B&R', 'Mechanical B&R', 'Vehicles B&R',
      'Electronic Warfare', 'Demolitions', 'Remote-Controlled Weapons'
    ]
  },
  Influence: {
    uses: { Charisma: 'Bluffing, fitting in, impersonating, intimidating, and negotiating.' },
    specializations: ['Bluff', 'Etiquette', 'Impersonation', 'Intimidation', 'Negotiation']
  },
  Network: {
    uses: { Charisma: 'Calling on social circles for information, gear, or favors.' },
    specializations: ['Academic', 'Corporate', 'Criminal', 'Engineering', 'Government', 'Magic', 'Matrix', 'Media', 'Medical', 'Street']
  },
  Conjuring: {
    uses: {
      Logic: 'Summoning or banishing spirits in the hermetic or UMT tradition.',
      Charisma: 'Summoning or banishing spirits in the shamanic tradition.'
    },
    specializations: [
      'Banishing', 'Spirits of Air', 'Spirits of Beasts', 'Spirits of Earth',
      'Spirits of Fire', 'Spirits of Kin', 'Spirits of Plants', 'Spirits of Water'
    ]
  },
  Sorcery: {
    uses: { Willpower: 'Casting spells and countering magic.' },
    specializations: ['Counterspelling', 'Combat Spells', 'Detection Spells', 'Health Spells', 'Illusion Spells', 'Manipulation Spells']
  }
};

export const SKILLS = Object.keys(CORE_SKILLS);
export const TASKING = 'Tasking';
const skillRules = {
  ...CORE_SKILLS,
  [TASKING]: {
    uses: { Logic: 'Threading complex forms and compiling or decompiling sprites as a technomancer.' },
    specializations: ['Compilation', 'Complex Forms', 'Decompilation']
  }
};

export function skillRule(name) {
  return Object.hasOwn(skillRules, name) ? skillRules[name] : undefined;
}

export function linkedAttributes(skill) {
  const rule = skillRule(skill.name);
  return rule ? Object.keys(rule.uses) : [skill.attribute];
}

export function specializationOptions(name) {
  const rule = skillRule(name);
  if (!rule) return [];
  const { uses, specializations } = rule;
  if (!Array.isArray(specializations)) return Object.entries(specializations);
  const code = Object.keys(uses).map(attribute => attribute[0]).join('/');
  return specializations.map(value => [value, code]);
}

export function specializationCode(name, specialization) {
  return specializationOptions(name).find(([value]) => value.toLowerCase() === specialization.toLowerCase())?.[1];
}
