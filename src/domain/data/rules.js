export const ATTRIBUTES = ['Strength', 'Agility', 'Willpower', 'Logic', 'Charisma'];
export const LIMITS = {
  Human: [4, 4, 4, 4, 4, 4],
  Elf: [4, 4, 4, 4, 5, 3],
  Dwarf: [4, 4, 5, 4, 4, 3],
  Ork: [5, 4, 4, 4, 4, 3],
  Troll: [6, 4, 4, 4, 4, 3]
};
export const LEVELS = {
  Ganger: {
    budget: 300000,
    skill: 4,
    max: 0,
    rr: 1
  },
  Runner: {
    budget: 375000,
    skill: 5,
    max: 1,
    rr: 1
  },
  'Prime Runner': {
    budget: 450000,
    skill: 6,
    max: 2,
    rr: 2
  }
};
