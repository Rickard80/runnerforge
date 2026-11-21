const ATTRIBUTES = ['Strength', 'Agility', 'Willpower', 'Logic', 'Charisma'];
const LIMITS = {
  Human: [4, 4, 4, 4, 4, 4],
  Elf: [4, 4, 4, 4, 5, 3],
  Dwarf: [4, 4, 5, 4, 4, 3],
  Ork: [5, 4, 4, 4, 4, 3],
  Troll: [6, 4, 4, 4, 4, 3]
};
const LEVELS = {
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
const SKILLS = [
  ['Athletics', 'Agility'],
  ['Close Combat', 'Agility'],
  ['Firearms', 'Agility'],
  ['Heavy Weapons', 'Agility'],
  ['Stealth', 'Agility'],
  ['Piloting', 'Agility'],
  ['Survival', 'Willpower'],
  ['Perception', 'Logic'],
  ['Electronics', 'Logic'],
  ['Hacking', 'Logic'],
  ['Engineering', 'Logic'],
  ['Biotech', 'Logic'],
  ['Tracking', 'Logic'],
  ['Conjuring', 'Willpower'],
  ['Sorcery', 'Willpower'],
  ['Influence', 'Charisma'],
  ['Network', 'Charisma'],
  ['Intimidation', 'Charisma']
];
const SHADOW_AMP_RULES_SOURCE = 'pp. 58–62';

const DEFAULT_AMPS = ['Enhanced Senses', 'Contacts', 'Counterspelling Focus', 'Smartlink', 'Reaction Enhancer'];

const AMP_SOURCES = {
  'Enhanced Senses': 'p. 257',
  Contacts: 'pp. 60, 164',
  'Counterspelling Focus': 'p. 189',
  Smartlink: 'pp. 83, 157',
  'Reaction Enhancer': 'p. 158',
  Cyberware: 'pp. 153–158',
  'Wired Reflexes': 'p. 158',
  'Critical Strike': 'p. 191',
  'Dermal Plating': 'p. 158',
  'Enhanced Reflexes': 'p. 191',
  'Tool Kit': 'p. 136',
  Cyberdeck: 'pp. 209–210',
  'Control Rig': 'p. 155',
  'Drone Control': 'p. 232',
  'Spirit Affinity': 'p. 185',
  'Spell Focus': 'p. 189',
  'Illusion Focus': 'p. 189',
  'Mentor Spirit': 'pp. 174–175',
  'Healing Focus': 'pp. 184, 189',
  'Tailored Pheromones': 'p. 159',
  Disguise: 'p. 139',
  'Cerebral Booster': 'p. 159',
  'Black Market Contacts': 'p. 164',
  'Street Contacts': 'pp. 85, 164'
};

const CONCEPTS = [
  { name: 'Street Samurai', role: 'Fighter', attribute: 'Agility', skills: ['Close Combat', 'Firearms', 'Athletics'],
    amps: ['Cyberware', 'Smartlink'], weight: 3, source: 'pp. 90–91 (Wild Jane)' },
  { name: 'Razorgirl', role: 'Fighter', attribute: 'Agility', skills: ['Close Combat', 'Stealth', 'Athletics'],
    amps: ['Wired Reflexes'], weight: 3, source: 'pp. 90–91 (Wild Jane)' },
  { name: 'Combat Adept', role: 'Fighter', attribute: 'Agility', skills: ['Close Combat', 'Athletics', 'Perception'],
    amps: ['Critical Strike'], weight: 2, source: 'pp. 108–109 (Mictlan)' },
  { name: 'Mercenary', role: 'Fighter', attribute: 'Agility', skills: ['Firearms', 'Heavy Weapons', 'Survival'],
    amps: ['Smartlink'], weight: 2, source: 'p. 252 (Soldier profile)' },
  { name: 'Bodyguard', role: 'Fighter', attribute: 'Strength', skills: ['Close Combat', 'Firearms', 'Perception'],
    amps: ['Dermal Plating'], weight: 2, source: 'p. 250 (Elite Security profile)' },
  { name: 'Infiltrator', role: 'Specialist', attribute: 'Agility', skills: ['Stealth', 'Athletics', 'Electronics'],
    amps: ['Enhanced Reflexes'], weight: 3, source: 'pp. 102–103 (Echo)' },
  { name: 'Burglar', role: 'Specialist', attribute: 'Agility', skills: ['Stealth', 'Electronics', 'Athletics'],
    amps: ['Tool Kit'], weight: 2, source: 'p. 136 (Infiltration Gear Selection)' },
  { name: 'Decker', role: 'Technologist', attribute: 'Logic', skills: ['Hacking', 'Electronics', 'Perception'],
    amps: ['Cyberdeck'], weight: 4, source: 'pp. 94–95 (Gambit)' },
  { name: 'Combat Decker', role: 'Technologist', attribute: 'Logic', skills: ['Hacking', 'Firearms', 'Athletics'],
    amps: ['Cyberdeck'], weight: 2, source: 'pp. 106–107 (White_Rabbit)' },
  { name: 'Rigger', role: 'Technologist', attribute: 'Logic', skills: ['Engineering', 'Piloting', 'Electronics'],
    amps: ['Control Rig'], weight: 4, source: 'pp. 96–97 (Charon)' },
  { name: 'Drone Specialist', role: 'Technologist', attribute: 'Logic', skills: ['Piloting', 'Engineering', 'Perception'],
    amps: ['Drone Control'], weight: 2, source: 'pp. 100–101 (Casper)' },
  { name: 'Technomancer', role: 'Technologist', attribute: 'Logic', skills: ['Hacking', 'Electronics', 'Influence'],
    amps: ['Resonance'], weight: 1, source: null },
  { name: 'Street Shaman', role: 'Magician', attribute: 'Willpower', skills: ['Conjuring', 'Sorcery', 'Influence'],
    amps: ['Spirit Affinity'], weight: 4, source: 'pp. 92–93 (Trash)' },
  { name: 'Combat Mage', role: 'Magician', attribute: 'Willpower', skills: ['Sorcery', 'Perception', 'Athletics'],
    amps: ['Spell Focus'], weight: 3, source: 'p. 251 (Elite Security Mage profile)' },
  { name: 'Illusionist', role: 'Magician', attribute: 'Willpower', skills: ['Sorcery', 'Stealth', 'Influence'],
    amps: ['Illusion Focus'], weight: 3, source: 'p. 184 (Illusion Spells)' },
  { name: 'Spirit Whisperer', role: 'Magician', attribute: 'Willpower', skills: ['Conjuring', 'Perception', 'Influence'],
    amps: ['Mentor Spirit'], weight: 2, source: 'p. 185 (Summoning)' },
  { name: 'Street Doc', role: 'Specialist', attribute: 'Logic', skills: ['Biotech', 'Influence', 'Perception'],
    amps: ['Healing Focus'], weight: 3, source: 'p. 250 (Combat Medic profile)' },
  { name: 'Face', role: 'Social', attribute: 'Charisma', skills: ['Influence', 'Network', 'Perception'],
    amps: ['Tailored Pheromones'], weight: 4, source: 'pp. 88–89 (Hercules)' },
  { name: 'Fixer', role: 'Social', attribute: 'Charisma', skills: ['Network', 'Influence', 'Intimidation'],
    amps: ['Contacts'], weight: 2, source: 'p. 164 (Fixer contact example)' },
  { name: 'Con Artist', role: 'Social', attribute: 'Charisma', skills: ['Influence', 'Stealth', 'Network'],
    amps: ['Disguise'], weight: 2, source: 'p. 139 (Con Artist’s Equipment Selection)' },
  { name: 'Investigator', role: 'Specialist', attribute: 'Logic', skills: ['Perception', 'Tracking', 'Influence'],
    amps: ['Enhanced Senses'], weight: 2, source: 'p. 254 (Investigator profile)' },
  { name: 'Journalist', role: 'Social', attribute: 'Charisma', skills: ['Influence', 'Perception', 'Stealth'],
    amps: ['Contacts'], weight: 2, source: 'p. 164 (Journalist contact example)' },
  { name: 'Archaeologist', role: 'Specialist', attribute: 'Logic', skills: ['Survival', 'Tracking', 'Perception'],
    amps: ['Cerebral Booster'], weight: 1, source: null },
  { name: 'Arms Dealer', role: 'Social', attribute: 'Charisma', skills: ['Influence', 'Firearms', 'Network'],
    amps: ['Black Market Contacts'], weight: 2, source: 'p. 164 (Gunsmith and Smuggler contact examples)' },
  { name: 'Gang Leader', role: 'Social', attribute: 'Charisma', skills: ['Intimidation', 'Network', 'Firearms'],
    amps: ['Street Contacts'], weight: 2, source: 'p. 244 (Ganger profile)' },
  { name: 'Courier', role: 'Specialist', attribute: 'Agility', skills: ['Athletics', 'Piloting', 'Stealth'],
    amps: ['SynthaCardium'], weight: 2, source: null },
  { name: 'Security Expert', role: 'Technologist', attribute: 'Logic', skills: ['Electronics', 'Engineering', 'Firearms'],
    amps: ['Security Rig'], weight: 2, source: 'p. 253 (Elite Security Rigger profile)' },
  { name: 'Smuggler', role: 'Specialist', attribute: 'Agility', skills: ['Piloting', 'Stealth', 'Network'],
    amps: ['Hidden Compartments'], weight: 2, source: 'p. 255 (Coyote / Smuggler profile)' },
  { name: 'Tank', role: 'Fighter', attribute: 'Strength', skills: ['Close Combat', 'Firearms', 'Survival'],
    amps: ['Dermal Plating'], weight: 2, source: 'pp. 104–105 (Drakk)' },
  { name: 'Scout', role: 'Specialist', attribute: 'Agility', skills: ['Tracking', 'Survival', 'Perception'],
    amps: ['Enhanced Senses'], weight: 2, source: null }
];
export {
  ATTRIBUTES,
  LIMITS,
  LEVELS,
  SKILLS,
  CONCEPTS,
  DEFAULT_AMPS,
  AMP_SOURCES,
  SHADOW_AMP_RULES_SOURCE
};
