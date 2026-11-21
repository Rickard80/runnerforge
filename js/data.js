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
const CONCEPTS = [
  ['Street Samurai', 'Fighter', 'Agility', ['Close Combat', 'Firearms', 'Athletics'],
    ['Cyberware', 'Smartlink'], 3
  ],
  ['Razorgirl', 'Fighter', 'Agility', ['Close Combat', 'Stealth', 'Athletics'],
    ['Wired Reflexes'], 3
  ],
  ['Combat Adept', 'Fighter', 'Agility', ['Close Combat', 'Athletics', 'Perception'],
    ['Critical Strike'], 2
  ],
  ['Mercenary', 'Fighter', 'Agility', ['Firearms', 'Heavy Weapons', 'Survival'],
    ['Smartlink'], 2
  ],
  ['Bodyguard', 'Fighter', 'Strength', ['Close Combat', 'Firearms', 'Perception'],
    ['Dermal Plating'], 2
  ],
  ['Infiltrator', 'Specialist', 'Agility', ['Stealth', 'Athletics', 'Electronics'],
    ['Enhanced Reflexes'], 3
  ],
  ['Burglar', 'Specialist', 'Agility', ['Stealth', 'Electronics', 'Athletics'],
    ['Tool Kit'], 2
  ],
  ['Decker', 'Technologist', 'Logic', ['Hacking', 'Electronics', 'Perception'],
    ['Cyberdeck'], 4
  ],
  ['Combat Decker', 'Technologist', 'Logic', ['Hacking', 'Firearms', 'Athletics'],
    ['Cyberdeck'], 2
  ],
  ['Rigger', 'Technologist', 'Logic', ['Engineering', 'Piloting', 'Electronics'],
    ['Control Rig'], 4
  ],
  ['Drone Specialist', 'Technologist', 'Logic', ['Piloting', 'Engineering', 'Perception'],
    ['Drone Control'], 2
  ],
  ['Technomancer', 'Technologist', 'Logic', ['Hacking', 'Electronics', 'Influence'],
    ['Resonance'], 1
  ],
  ['Street Shaman', 'Magician', 'Willpower', ['Conjuring', 'Sorcery', 'Influence'],
    ['Spirit Affinity'], 4
  ],
  ['Combat Mage', 'Magician', 'Willpower', ['Sorcery', 'Perception', 'Athletics'],
    ['Spell Focus'], 3
  ],
  ['Illusionist', 'Magician', 'Willpower', ['Sorcery', 'Stealth', 'Influence'],
    ['Illusion Focus'], 3
  ],
  ['Spirit Whisperer', 'Magician', 'Willpower', ['Conjuring', 'Perception', 'Influence'],
    ['Mentor Spirit'], 2
  ],
  ['Street Doc', 'Specialist', 'Logic', ['Biotech', 'Influence', 'Perception'],
    ['Healing Focus'], 3
  ],
  ['Face', 'Social', 'Charisma', ['Influence', 'Network', 'Perception'],
    ['Tailored Pheromones'], 4
  ],
  ['Fixer', 'Social', 'Charisma', ['Network', 'Influence', 'Intimidation'],
    ['Contacts'], 2
  ],
  ['Con Artist', 'Social', 'Charisma', ['Influence', 'Stealth', 'Network'],
    ['Disguise'], 2
  ],
  ['Investigator', 'Specialist', 'Logic', ['Perception', 'Tracking', 'Influence'],
    ['Enhanced Senses'], 2
  ],
  ['Journalist', 'Social', 'Charisma', ['Influence', 'Perception', 'Stealth'],
    ['Contacts'], 2
  ],
  ['Archaeologist', 'Specialist', 'Logic', ['Survival', 'Tracking', 'Perception'],
    ['Cerebral Booster'], 1
  ],
  ['Arms Dealer', 'Social', 'Charisma', ['Influence', 'Firearms', 'Network'],
    ['Black Market Contacts'], 2
  ],
  ['Gang Leader', 'Social', 'Charisma', ['Intimidation', 'Network', 'Firearms'],
    ['Street Contacts'], 2
  ],
  ['Courier', 'Specialist', 'Agility', ['Athletics', 'Piloting', 'Stealth'],
    ['SynthaCardium'], 2
  ],
  ['Security Expert', 'Technologist', 'Logic', ['Electronics', 'Engineering', 'Firearms'],
    ['Security Rig'], 2
  ],
  ['Smuggler', 'Specialist', 'Agility', ['Piloting', 'Stealth', 'Network'],
    ['Hidden Compartments'], 2
  ],
  ['Tank', 'Fighter', 'Strength', ['Close Combat', 'Firearms', 'Survival'],
    ['Dermal Plating'], 2
  ],
  ['Scout', 'Specialist', 'Agility', ['Tracking', 'Survival', 'Perception'],
    ['Enhanced Senses'], 2
  ]
];
export {
  ATTRIBUTES,
  LIMITS,
  LEVELS,
  SKILLS,
  CONCEPTS
};