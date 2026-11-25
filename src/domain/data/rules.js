export const ATTRIBUTE = Object.freeze({
  Strength: 'Strength',
  Agility: 'Agility',
  Willpower: 'Willpower',
  Logic: 'Logic',
  Charisma: 'Charisma'
});

export const METATYPE = Object.freeze({
  Elf: 'Elf',
  Dwarf: 'Dwarf',
  Human: 'Human',
  Ork: 'Ork',
  Troll: 'Troll'
});

export const LEVEL = Object.freeze({
  Ganger: 'Ganger',
  Runner: 'Runner',
  PrimeRunner: 'Prime Runner'
});

export const WOUND_TYPE = Object.freeze({
  Physical: 'Physical',
  Mental: 'Mental',
  Matrix: 'Matrix',
  Vehicle: 'Vehicle'
});

export const WOUND_SEVERITY = Object.freeze({
  Light: 'light',
  Serious: 'serious',
  Incapacitated: 'incapacitated'
});

export const ITEM_TYPE = Object.freeze({
  ComplexForm: 'complex form',
  Weapon: 'weapon',
  Spell: 'spell',
  Armor: 'armor',
  Equipment: 'equipment',
  Amp: 'amp'
});

export const ENTRY_LIST = Object.freeze({
  Skills: 'skills',
  Knowledge: 'knowledge',
  Amps: 'amps',
  Items: 'items'
});

export const KIT_KIND = Object.freeze({
  Cyberdeck: 'Cyberdeck',
  Rigger: 'Rigger'
});

export const ROLE = Object.freeze({
  Any: 'Any',
  Muscle: 'Muscle',
  Awakened: 'Awakened',
  Influence: 'Influence',
  Tech: 'Tech'
});

export const AMP_GROUP = Object.freeze({
  AdeptPower: 'Adept Power',
  ArmorAmp: 'Armor Amp',
  Awakened: 'Awakened',
  Bioware: 'Bioware',
  Contact: 'Contact',
  Cyberdeck: 'Cyberdeck',
  Cyberware: 'Cyberware',
  Drone: 'Drone',
  Equipment: 'Equipment',
  Focus: 'Focus',
  Quality: 'Quality',
  RiggerCommandConsole: 'Rigger Command Console',
  WeaponAmp: 'Weapon Amp',
  Vehicle: 'Vehicle'
});

export const RANDOM_CONCEPT = 'Random';
export const NO_WOUND_ATTRIBUTE = '---';

export const ATTRIBUTES = Object.values(ATTRIBUTE);
export const LIMITS = {
  [METATYPE.Elf]: [4, 4, 4, 4, 5, 3],
  [METATYPE.Dwarf]: [4, 4, 5, 4, 4, 3],
  [METATYPE.Human]: [4, 4, 4, 4, 4, 4],
  [METATYPE.Ork]: [5, 4, 4, 4, 4, 3],
  [METATYPE.Troll]: [6, 4, 4, 4, 4, 3]
};
export const LEVELS = {
  [LEVEL.Ganger]: {
    budget: 300000,
    skill: 4,
    max: 0,
    rr: 1
  },
  [LEVEL.Runner]: {
    budget: 375000,
    skill: 5,
    max: 1,
    rr: 1
  },
  [LEVEL.PrimeRunner]: {
    budget: 450000,
    skill: 6,
    max: 2,
    rr: 2
  }
};
