import { CATALOG } from './catalog.js';
import { SPECIALIZATIONS } from './specializations.js';

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
  ['Tasking', 'Logic'],
  ['Engineering', 'Logic'],
  ['Biotech', 'Logic'],
  ['Tracking', 'Logic'],
  ['Conjuring', 'Willpower'],
  ['Sorcery', 'Willpower'],
  ['Influence', 'Charisma'],
  ['Network', 'Charisma'],
  ['Intimidation', 'Charisma']
];
const TECHNOMANCER_SOURCE = 'Anarchy 2.0 Conversion Guide, pp. 8–10';
const EMERGED_AMP = 'Emerged (Technomancy)';

const SHADOW_AMP_RULES_SOURCE = 'pp. 58–63';

const coreAmps = (group, source, examples, defaults = {}) =>
  Object.fromEntries(examples.map(([name, rating, effect, options]) =>
    [name, { group, source, rating, effect, ...defaults, ...options }]));

const trainingForSpecialization = name => [name, ...SPECIALIZATIONS[name]];
const physicalTrainingChoices = SKILLS.filter(([, attribute]) => attribute === 'Agility')
  .map(([name]) => trainingForSpecialization(name));

const AMP_PROFILES = {
  ...coreAmps('Adept Power', 'p. 89', [
    ['Vocal Control', 3, 'RR 1 on Influence (impersonation).', { training: [['Influence', 'Impersonation']] }],
    ['Empathic Sense', 5, 'RR 2 on Perception (social).', { training: [['Perception', 'Social']] }],
    ['Flashing Smile', 3, 'RR 1 on Influence (bluff).', { training: [['Influence', 'Bluff']] }],
    ['Concealment', 1, 'Blend into a crowd for a scene.']
  ]),
  ...coreAmps('Adept Power', 'p. 191', [
    ['Astral Armor', 2, '+1 Armor against spells and in astral space.'],
    ['Armor (Adept Power)', 2, '+1 physical Armor.'],
    ['Combat Sense', 8, 'RR 1 on Close Combat and Athletics (ranged defense).', { training: [['Close Combat'], ['Athletics', 'Ranged Defense']] }],
    ['Danger Sense', 1, 'Detect imminent danger without a Perception Test. Gives no details.'],
    ['Distance Strike', 3, 'Unarmed attacks can reach short range with Disadvantage.'],
    ['Elemental Strike', 2, '+1 unarmed DV. Choose an elemental effect.'],
    ['Elemental Weapon', 2, '+1 melee weapon DV. Choose an elemental effect.'],
    ['Empathic Sense', 7, 'RR 3 on Perception (social).', { training: [['Perception', 'Social']] }],
    ['Enhanced Perception', 3, 'RR 1 on Perception (physical). Extra sensory effects cost additional rating points.', { training: [['Perception', 'Physical']] }],
    ['Improved Ability', 6, 'RR 1 on a chosen skill.', { trainingChoices: SKILLS.map(([name]) => [name]) }],
    ['Improved Attribute', 11, 'RR 1 on Tests with a chosen attribute.'],
    ['Improved Reflexes', 6, '+1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Light-footed', 5, 'RR 2 on Stealth (physical sneaking).', { training: [['Stealth', 'Physical Sneaking']] }],
    ['Morphological and Vocal Control', 10, 'RR 1 on Influence and RR 2 on Influence (impersonation).', { training: [['Influence', 'Impersonation']] }],
    ['Mystic Armor', 3, '+1 Armor against astral and physical damage.'],
    ['Reflexes Boost', 3, '+1 Edge per action scene and unlimited extra actions.'],
    ['Vocal Control', 8, 'RR 1 on Influence and an additional RR 1 for impersonation.', { training: [['Influence', 'Impersonation']] }],
    ['Wall Running', 1, 'Move briefly along vertical surfaces.'],
    ['Killing Hands', 3, '+2 DV on unarmed attacks.'],
    ['Pain Resistance', 7, 'One additional serious wound box.']
  ]),
  ...coreAmps('Armor Amp', 'p. 149', [
    ['Actioneer Business Suit', 2, 'Armor 1. RR 1 on Influence (etiquette).', { armor: 1, training: [['Influence', 'Etiquette']] }],
    ['Armanté Suit or Dress', 7, 'Armor 1. RR 1 on Influence and an additional RR 1 for etiquette.', { armor: 1, training: [['Influence', 'Etiquette']] }],
    ['Chameleon Suit', 4, 'Armor 3. RR 2 on physical Stealth.', { armor: 3, replaces: ['Chameleon suit (3)'], training: [['Stealth', 'Physical Sneaking']] }],
    ['SecureTech Invisi-shield', 1, '+1 Armor.', { armor: 1 }]
  ]),
  ...coreAmps('Awakened', 'p. 170', [
    ['Awakened (Clairvoyant)', 2, 'Astral perception and projection.'],
    ['Awakened (Mystic Adept)', 4, 'Sorcery, Conjuring and adept powers.', { unlocks: ['Sorcery', 'Conjuring'], adeptPowers: true }],
    ['Awakened (Adept)', 1, 'Access to adept powers.', { adeptPowers: true }],
    ['Awakened (Conjurer)', 3, 'Astral perception and Conjuring.', { unlocks: ['Conjuring'] }],
    ['Awakened (Magician)', 5, 'Astral perception and projection, Sorcery and Conjuring.', { unlocks: ['Sorcery', 'Conjuring'] }],
    ['Awakened (Sorcerer)', 2, 'Astral perception and Sorcery.', { unlocks: ['Sorcery'] }]
  ]),
  ...coreAmps('Bioware', 'p. 159', [
    ['Bone Density Augmentation', 6, '+1 unarmed DV and one additional light wound box.'],
    ['Cerebral Booster', 12, 'RR 1 on Logic-based Tests.'],
    ['Muscle Augmentation', 12, 'RR 1 on Strength-based Tests.'],
    ['Muscle Toner', 12, 'RR 1 on Agility-based Tests.'],
    ['Orthoskin', 3, '+1 Armor.'],
    ['Synaptic Booster', 7, '+1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Wide-spectrum Pheromones', 12, 'RR 1 on Charisma-based Tests.'],
    ['Tracheal Filter and Toxin Extractor', 2, 'Immunity to inhaled or injected toxins.'],
    ['Reflex Recorder', 4, 'Choose a physical skill specialization. RR 1 on its Tests.', { trainingChoices: physicalTrainingChoices }],
    ['Universal Omnitech PrimeSkill Reflex Recorder', 6, 'Choose a physical skill specialization. RR 2 on its Tests.', { trainingChoices: physicalTrainingChoices }],
    ['Evo ReflexUltra Reflex Recorders', 8, 'Choose a physical skill specialization. RR 3 on its Tests.', { trainingChoices: physicalTrainingChoices }],
    ['Platelet Factories', 8, 'One additional serious wound box.'],
    ['Reflex Recorder (Rifles)', 4, 'RR 1 on Ranged Weapons (rifles) Tests, using the published specialization choice.', { training: [['Firearms', 'Rifles']] }],
    ['Tailored Pheromones', 7, 'RR 1 on Influence Tests.', { training: [['Influence']] }]
  ], { essenceLoss: 0.5 }),
  ...coreAmps('Contact', 'p. 164', [
    ['Corporate Executive', 2, 'RR 1 on Network (corporate).', { training: [['Network', 'Corporate']] }],
    ['Journalist', 2, 'RR 1 on Network (media).', { training: [['Network', 'Media']] }],
    ['Lawyer', 4, 'RR 2 on Network (government).', { training: [['Network', 'Government']] }],
    ['Mafia Consigliere', 4, 'RR 2 on Network (criminal).', { training: [['Network', 'Criminal']] }],
    ['Mr. Johnson', 6, 'RR 1 on Network (street, criminal and corporate).', { training: [['Network', 'Street', 'Criminal', 'Corporate']] }],
    ['Talismonger', 2, 'RR 1 on Network (magical).', { training: [['Network', 'Magical']] }],
    ['University Professor', 2, 'RR 1 on Network (academic).', { training: [['Network', 'Academic']] }],
    ['Bar Owner', 2, 'Contact. RR 1 on Network (street) Tests.', { training: [['Network', 'Street']] }],
    ['Data Haven', 4, 'Contact. RR 1 on Network (Matrix) and Electronics (Matrix search) Tests.', { training: [['Network', 'Matrix'], ['Electronics', 'Matrix Search']] }],
    ['Fixer', 5, 'Contact. RR 1 on Network Tests.', { training: [['Network']] }],
    ['Ganger', 2, 'Contact. RR 1 on Network (criminal) Tests.', { training: [['Network', 'Criminal']] }],
    ['Gunsmith', 4, 'Contact. RR 1 on Network (street and engineering) Tests.', { training: [['Network', 'Street', 'Engineering']] }],
    ['Mechanic', 2, 'Contact. RR 1 on Network (engineering) Tests.', { training: [['Network', 'Engineering']] }],
    ['Smuggler', 4, 'Contact. RR 1 on Network (street and engineering) Tests.', { training: [['Network', 'Street', 'Engineering']] }],
    ['Street Doc', 2, 'Contact. RR 1 on Network (medical) Tests.', { training: [['Network', 'Medical']] }],
    ['Undercover Cop', 2, 'Contact. RR 1 on Network (government) Tests.', { training: [['Network', 'Government']] }]
  ]),
  ...coreAmps('Cyberdeck', 'p. 95', [
    ['MCT 260', 12, 'Firewall 3, Attack 2. RR 1 on Cracking and an additional RR 1 for brute force.', { training: [['Hacking', 'Brute Force']] }]
  ], { replaces: ['Cyberdeck'] }),
  ...coreAmps('Cyberdeck', 'p. 107', [
    ['MCT 360', 12, 'Firewall 3, Attack 3. RR 1 on Cracking. Biofeedback program.', { training: [['Hacking']] }]
  ], { replaces: ['Cyberdeck'] }),
  ...coreAmps('Cyberdeck', 'p. 210', [
    ['MCT 360', 11, 'Firewall 3, Attack 3. RR 1 on Cracking.', { training: [['Hacking']] }],
    ['Renraku Kitsune', 14, 'Firewall 4, Attack 4. Biofeedback Filter and RR 1 on Cracking.', { training: [['Hacking']] }],
    ['Shiawase Cyber-6', 20, 'Firewall 5, Attack 4. Biofeedback and Biofeedback Filter. RR 1 on Cracking, plus RR 1 for brute force and backdoor.', { training: [['Hacking', 'Brute Force', 'Backdoor']] }],
    ['Fairlight Excalibur', 30, 'Firewall 5, Attack 5 and one additional light wound box. Biofeedback and Biofeedback Filter. RR 1 on Cracking, plus RR 2 for brute force and backdoor and RR 1 for cybercombat.', { training: [['Hacking', 'Brute Force', 'Backdoor', 'Cybercombat']] }],
    ['Erika MCD-6', 3, 'Cyberdeck. Firewall 2, Attack 1.'],
    ['Spinrad Falcon', 6, 'Cyberdeck. Firewall 2, Attack 2. RR 1 on Cracking (brute force) Tests.', { training: [['Hacking', 'Brute Force']] }]
  ], { replaces: ['Cyberdeck'] }),
  ...coreAmps('Cyberware', 'p. 83', [
    ['Smartlink', 6, 'Cyberware. RR 1 on Ranged Weapons Tests.', { essenceLoss: 1, training: [['Firearms']] }]
  ]),
  ...coreAmps('Cyberware', 'p. 155', [
    ['MCT Decker-Pro Cyberjack', 7, 'DNI and cold- or hot-sim VR. In VR gain +1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Implanted Commlink', 3, 'Commlink with DNI and cold-sim VR.'],
    ['Encephalon', 11, 'RR 1 on Logic Tests.'],
    ['Datajack', 2, 'Direct neural interface and cold-sim VR.', { replaces: ['Datajack'] }],
    ['Unlocked Datajack', 4, 'Direct neural interface and cold- and hot-sim VR.', { replaces: ['Datajack', 'Trodes'] }]
  ], { essenceLoss: 1 }),
  ...coreAmps('Cyberware', 'p. 156', [
    ['Standard Cybernetic Eyes', 1, 'Visual interface and camera.'],
    ['L’Oréal Fashion Top Cybernetic Eyes', 2, 'Visual interface, camera and customizable iris color.'],
    ['Universal Omnitech ProView Cybernetic Eyes', 4, 'Visual interface, camera and low-light vision. RR 1 on physical Perception.', { training: [['Perception', 'Physical']] }],
    ['Universal Omnitech AbsoluteView Cybernetic Eyes', 6, 'Visual interface, camera and thermographic vision. RR 2 on physical Perception.', { training: [['Perception', 'Physical']] }],
    ['Ares SharpShooter Cybernetic Eyes', 9, 'Visual interface, camera and zoom. RR 1 on Ranged Weapons and an additional RR 1 for rifles.', { training: [['Firearms', 'Rifles']] }],
    ['Evo EyeDrone Cybernetic Eyes', 5, 'Visual interface and camera. RR 1 on physical Perception. Ocular microdrone with Pilot 6, Body 0, Handling 10, Speed 0, Armor 0 and Advantage on physical Stealth. No weapon mount.', { training: [['Perception', 'Physical'], ['Stealth', 'Physical Sneaking']] }],
    ['Ares ProShooter Cybernetic Eyes', 5, 'Visual interface, camera and RR 2 on Ranged Weapons (pistols) Tests.', { training: [['Firearms', 'Pistols']] }]
  ], { essenceLoss: 1 }),
  ...coreAmps('Cyberware', 'p. 157', [
    ['Standard Cybernetic Ears', 1, 'Auditory interface and microphone. Choose appearance.'],
    ['Universal Omnitech ProSound Cybernetic Ears', 3, 'Auditory interface and microphone. RR 1 on physical Perception.', { training: [['Perception', 'Physical']] }],
    ['Universal Omnitech UltraSound Cybernetic Ears', 4, 'Auditory interface, microphone and expanded hearing range. RR 1 on physical Perception.', { training: [['Perception', 'Physical']] }]
  ], { essenceLoss: 1 }),
  ...coreAmps('Cyberware', 'p. 158', [
    ['Auto-injector', 1, 'Inject a loaded drug with a mental command.'],
    ['Auto-injector and Biomonitor', 3, 'Automatically inject a stim patch on a serious wound or a trauma patch on an incapacitating wound.'],
    ['Muscle Replacement', 6, 'RR 1 on Athletics.', { training: [['Athletics']] }],
    ['Plastic Bone Lacing', 4, 'One additional light wound box.'],
    ['Aluminum Bone Lacing', 5, '+1 unarmed DV and one additional light wound box.'],
    ['Titanium Bone Lacing', 8, '+1 unarmed DV and one additional serious wound box.'],
    ['Evo Wired Reflexes', 8, '+2 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Move-by-wire', 15, '+2 Edge per action scene, +1 action per narration and unlimited extra actions. RR 1 on Close Combat and Athletics (ranged defense).', { training: [['Close Combat'], ['Athletics', 'Ranged Defense']] }],
    ['Climbing Arms', 3, 'Retractable climbing claws. RR 1 on Athletics (climbing).', { training: [['Athletics', 'Climbing']] }],
    ['Climbing Arms with Grapple Hand', 6, 'Retractable claws and grapple launcher. RR 2 on Athletics (climbing).', { training: [['Athletics', 'Climbing']] }],
    ['Cyberlegs', 6, 'RR 1 on Athletics.', { training: [['Athletics']] }],
    ['Digitigrade Cyberlegs', 8, 'RR 1 on Athletics and an additional RR 1 for running.', { training: [['Athletics', 'Running']] }],
    ['Ares Wired Reflexes', 6, '+1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Dermal Plating', 2, '+1 Armor.'],
    ['Reaction Enhancer', 3, '+1 Edge per action scene and unlimited extra actions.']
  ], { essenceLoss: 1 }),
  ...coreAmps('Drone', 'p. 160', [
    ['CrashCart Essential Autonomous Medkit', 1, 'Stationary small drone. Pilot 6 for first aid. Spend Edge for Advantage as with a standard medkit.', { training: [['Survival', 'First Aid']] }],
    ['DocWagon Pro+ Autonomous Medkit', 4, 'Stationary small drone. Pilot 9 for first aid Tests. Spend Edge for Advantage as with a standard medkit.', { training: [['Survival', 'First Aid']] }]
  ], { stationary: true }),
  ...coreAmps('Drone', 'p. 240', [
    ['Microdrone', 1, 'Pilot 6, Body 0, Handling 10, Speed 0 (flying 1), Armor 0. Advantage on physical Stealth. No weapon mount.', { training: [['Stealth', 'Physical Sneaking']] }],
    ['Small Drone', 1, 'Pilot 6, Body 1, Handling 9, Speed 2 (flying 4), Armor 0. Mount for an SMG or smaller weapon.'],
    ['Medium Drone', 1, 'Pilot 6, Body 2, Handling 7, Speed 3 (flying 6), Armor 0. Mount for an assault rifle or smaller weapon.'],
    ['Large Drone', 1, 'Pilot 6, Body 4, Handling 4, Speed 4 (flying 8), Armor 0.'],
    ['Shiawase Kanmushi', 3, 'Pilot 8, Body 0, Handling 10, Speed 0, Armor 0. Advantage on physical Stealth. No weapon mount.', { training: [['Stealth', 'Physical Sneaking']] }],
    ['MCT Gnat', 4, 'Flying. Pilot 6, Body 0, Handling 10, Speed 1, Armor 0. RR 1 and Advantage on physical Stealth. No weapon mount.', { training: [['Stealth', 'Physical Sneaking']] }]
  ]),
  ...coreAmps('Drone', 'p. 241', [
    ['Lockheed Optic-X2', 6, 'Flying. Pilot 6, Body 1, Handling 9, Speed 4, Armor 0. Forward SMG mount. RR 1 on physical Stealth and Perception.', { training: [['Perception', 'Physical'], ['Stealth', 'Physical Sneaking']] }],
    ['Chrysler-Nissan Pursuit V', 4, 'Pilot 6, Body 1, Handling 9, Speed 5, Armor 0. Forward SMG mount.'],
    ['MCT-Nissan Roto-drone', 5, 'Flying. Pilot 6, Body 2, Handling 7, Speed 6, Armor 2. Two forward mounts for assault rifles or smaller weapons.', { replaces: ['Rotor drone'] }],
    ['Ares-DocWagon First Responder', 9, 'Pilot 10, Body 2, Handling 7, Speed 3, Armor 2. Arm and Valkyrie autonomous medkit.'],
    ['Steel Lynx', 7, 'Pilot 6, Body 4, Handling 4, Speed 3, Armor 4. Turret with two weapon mounts.'],
    ['Cyberspace Design Quadrotor', 4, 'Flying drone. Pilot 6, Body 1, Handling 9, Speed 4, Armor 0. Forward SMG mount. RR 1 on Perception (physical) Tests.', { replaces: ['Fly-Spy drone'], training: [['Perception', 'Physical']] }],
    ['GM-Nissan Doberman', 4, 'Pilot 6, Body 2, Handling 7, Speed 3, Armor 2. Turret mount for an assault rifle or smaller weapon.', { replaces: ['Doberman drone'] }]
  ]),
  ...coreAmps('Equipment', 'p. 136', [
    ['Climbing Gear', 4, 'Adhesive gloves, grappling hook and degradable ropes. RR 2 on Athletics (climbing) Tests.', { replaces: ['Climbing gear'], training: [['Athletics', 'Climbing']] }],
    ['Evo Night Hawk 500 Binoculars', 3, 'Zoom, night vision and RR 1 on Perception (physical) Tests.', { replaces: ['Binoculars'], training: [['Perception', 'Physical']] }],
    ['Infiltration Kit', 4, 'Autopicker, maglock passkey and card copier. RR 2 on Stealth (lockpicking) Tests.', { replaces: ['Lockpick set'], training: [['Stealth', 'Lockpicking']] }],
    ['Laser Microphone', 2, 'Listen through glass. RR 1 on Perception (physical) Tests.', { training: [['Perception', 'Physical']] }],
    ['Sensor Tags', 1, 'Reports location and transmits audio and video.'],
    ['Thermal Binoculars', 1, 'Zoom and thermographic vision.', { replaces: ['Binoculars'] }]
  ]),
  ...coreAmps('Equipment', 'p. 139', [
    ['Expert Linguasoft', 2, 'Adapts speech to the audience. RR 1 on Influence (etiquette).', { training: [['Influence', 'Etiquette']] }],
    ['Makeup Kit', 2, 'RR 1 on Influence (impersonation) Tests.', { replaces: ['Disguise kit'], training: [['Influence', 'Impersonation']] }],
    ['Nanopaste Makeup', 4, 'RR 2 on Influence (impersonation) Tests.', { replaces: ['Disguise kit'], training: [['Influence', 'Impersonation']] }],
    ['Well-Stocked Closet', 2, 'Appropriate clothing on hand. RR 1 on Influence (etiquette) Tests.', { training: [['Influence', 'Etiquette']] }]
  ]),
  ...coreAmps('Focus', 'p. 189', [
    ['Detection Focus, Minor', 2, 'RR 1 on Sorcery (detection spells).', { training: [['Sorcery', 'Detection Spells']] }],
    ['Manipulation Focus', 4, 'RR 2 on Sorcery (manipulation spells).', { training: [['Sorcery', 'Manipulation Spells']] }],
    ['Counterspelling Focus', 4, 'RR 2 on Sorcery (counterspelling).', { training: [['Sorcery', 'Counterspelling']] }],
    ['Sustaining Focus', 2, 'Sustain one additional spell without penalty.', { training: [['Sorcery']] }],
    ['Conjuring Focus', 5, 'RR 1 on Conjuring.', { training: [['Conjuring']] }],
    ['Air Focus, Minor', 2, 'RR 1 on Conjuring (spirits of air).', { training: [['Conjuring', 'Air Spirits']] }],
    ['Fire Focus, Major', 6, 'RR 3 on Conjuring (spirits of fire).', { training: [['Conjuring', 'Fire Spirits']] }],
    ['Banishing Focus', 4, 'RR 2 on Conjuring (banishing).', { training: [['Conjuring', 'Banishing']] }],
    ['Weapon Focus (Knife)', 1, 'Close range. DV Strength +1 in the physical realm or Charisma +1 in astral projection. Bypasses immunity to physical weapons.', { weaponSkill: 'Close Combat' }],
    ['Weapon Focus (Sword)', 5, 'Close range. DV Strength +2 in the physical realm or Charisma +2 in astral projection. RR 2 on Close Combat (blades). Bypasses immunity to physical weapons.', { weaponSkill: 'Close Combat', training: [['Close Combat', 'Blades']] }],
    ['Beast Focus', 4, 'RR 2 on Conjuring (spirits of beasts) Tests.', { training: [['Conjuring', 'Spirits of Beasts']] }],
    ['Control Focus', 3, 'Control up to two spirits at once.', { training: [['Conjuring']] }],
    ['Illusion Focus, Major', 6, 'RR 3 on Sorcery (illusion spells) Tests.', { training: [['Sorcery', 'Illusion Spells']] }],
    ['Sorcery Focus', 5, 'RR 1 on Sorcery Tests.', { training: [['Sorcery']] }]
  ]),
  ...coreAmps('Quality', 'p. 99', [
    ['Mystic Tattoo Focus', 13, 'RR 2 on astral Perception. RR 1 each on astral sneaking, astral combat and banishing.', { training: [['Perception', 'Astral'], ['Stealth', 'Astral Sneaking'], ['Close Combat', 'Astral Combat'], ['Conjuring', 'Banishing']] }],
    ['Quetzalcoatl Mentor Spirit', 2, 'RR 1 on Sorcery (detection spells). Disposition: Stubborn.', { training: [['Sorcery', 'Detection Spells']] }]
  ]),
  ...coreAmps('Quality', 'p. 111', [
    ['Capybara Mentor Spirit', 4, 'RR 1 on Survival (composure) and Stealth (physical sneaking). Disposition: Social.', { training: [['Survival', 'Composure'], ['Stealth', 'Physical Sneaking']] }]
  ]),
  ...coreAmps('Quality', 'p. 139', [
    ['Jet Setter', 1, '+1 social armor when using the extended social tests option. Rating assumes this is the first quality.']
  ]),
  ...coreAmps('Quality', 'p. 174', [
    ['Bear Mentor Spirit', 4, 'Choose two for RR 1: Survival (first aid), Close Combat (unarmed), or Sorcery (health spells). Disposition: Rage.', { trainingChoices: [['Survival', 'First Aid'], ['Close Combat', 'Unarmed Combat'], ['Sorcery', 'Health Spells']], chooseTraining: 2 }],
    ['Cat Mentor Spirit', 4, 'Choose two for RR 1: Athletics (parkour), Stealth (physical sneaking), or Sorcery (illusion spells). Disposition: Cruel.', { trainingChoices: [['Athletics', 'Parkour'], ['Stealth', 'Physical Sneaking'], ['Sorcery', 'Illusion Spells']], chooseTraining: 2 }],
    ['Coyote Mentor Spirit', 4, 'Choose two for RR 1: Influence (impersonation or etiquette) or Sorcery (manipulation spells). Disposition: Mischievous.', { trainingChoices: [['Influence', 'Impersonation', 'Etiquette'], ['Sorcery', 'Manipulation Spells']], chooseTraining: 2 }]
  ]),
  ...coreAmps('Quality', 'p. 175', [
    ['Dog Mentor Spirit', 4, 'Choose two for RR 1: Perception (physical), Survival (navigation), or Sorcery (detection spells). Disposition: Loyal.', { trainingChoices: [['Perception', 'Physical'], ['Survival', 'Navigation'], ['Sorcery', 'Detection Spells']], chooseTraining: 2 }],
    ['Dragonslayer Mentor Spirit', 4, 'Choose two for RR 1: Influence (intimidation), a Close Combat specialization, or Sorcery (combat spells). Disposition: Honor.', { trainingChoices: [['Influence', 'Intimidation'], trainingForSpecialization('Close Combat'), ['Sorcery', 'Combat Spells']], chooseTraining: 2 }],
    ['Thunderbird Mentor Spirit', 4, 'Choose two for RR 1: Influence (intimidation), Close Combat (unarmed), or Conjuring (spirits of air). Disposition: Uptight.', { trainingChoices: [['Influence', 'Intimidation'], ['Close Combat', 'Unarmed Combat'], ['Conjuring', 'Air Spirits']], chooseTraining: 2 }],
    ['Wolf Mentor Spirit', 4, 'Choose two for RR 1: Survival (navigation), Close Combat (unarmed or blades), or Sorcery (combat spells). Disposition: Fierce.', { trainingChoices: [['Survival', 'Navigation'], ['Close Combat', 'Unarmed Combat', 'Blades'], ['Sorcery', 'Combat Spells']], chooseTraining: 2 }],
    ['Raccoon Mentor Spirit', 4, 'RR 1 on Stealth (palming) and Sorcery (manipulation spells) Tests. Disposition: Curious.', { training: [['Stealth', 'Palming'], ['Sorcery', 'Manipulation Spells']] }]
  ]),
  ...coreAmps('Rigger Command Console', 'p. 158', [
    ['Ares FeelTheRide Vehicle Control Rig', 6, 'DNI and cold- or hot-sim VR. Jump into vehicles and drones.'],
    ['Dassault MilRig+ Vehicle Control Rig', 9, 'DNI and cold- or hot-sim VR. While jumped in, gain +1 Edge per scene, +1 action per narration and unlimited extra actions.'],
    ['Shiawase Neo-Rigger Vehicle Control Rig', 4, 'Direct neural interface and cold-sim VR. Allows jumping into vehicles and drones.', { essenceLoss: 1, replaces: ['Datajack', 'Trodes'] }],
  ]),
  ...coreAmps('Rigger Command Console', 'p. 232', [
    ['Horizon Overseer', 5, 'Firewall 1. Controls 3 vehicles in captain’s chair mode. RR on a chosen Piloting specialization.', { trainingChoices: [trainingForSpecialization('Piloting')] }],
    ['Proteus Poseidon', 8, 'Firewall 2. Controls 5 vehicles in captain’s chair mode. RR on a chosen Piloting specialization.', { trainingChoices: [trainingForSpecialization('Piloting')] }],
    ['Ares Red Dog Series', 12, 'Firewall 3. Controls 5 vehicles in captain’s chair mode. RR 1 on Piloting.', { training: [['Piloting']] }],
    ['Essy Motors DroneMaster', 3, 'Rigger command console. Firewall 1. Controls up to 3 drones in captain’s chair mode.']
  ]),
  ...coreAmps('Weapon Amp', 'p. 158', [
    ['Synthetic Cyberarm with Cyberspur', 4, 'Forearm blade. RR 1 on Close Combat (blades) Tests.', { essenceLoss: 1, training: [['Close Combat', 'Blades']] }],
    ['Synthetic Cyberarm with Heavy Pistol', 4, 'Forearm pistol. RR 1 on Ranged Weapons (pistols).', { training: [['Firearms', 'Pistols']] }],
  ]),
  ...coreAmps('Weapon Amp', 'p. 144', [
    ['Monofilament Whip', 1, 'DV 7 at close range. Use at least six risk dice, up to the full pool.', { weaponSkill: 'Close Combat' }],
    ['Yamaha Pulsar', 2, 'Taser. DV 5. Range OK / OK / Dis. / —.'],
    ['Tiffani Needler', 2, 'Hold-out pistol. DV 3. Range OK / OK / Dis. / —. RR 1 on physical Stealth.', { training: [['Stealth', 'Physical Sneaking']] }],
    ['Shiawase Arms Puzzler', 4, 'Light pistol. DV 4. Range OK / OK / Dis. / —. RR 2 on physical Stealth.', { training: [['Stealth', 'Physical Sneaking']] }],
    ['Ares Predator IV', 2, 'Heavy pistol. DV 5. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols).', { training: [['Firearms', 'Pistols']] }],
    ['Ares Predator V', 3, 'Heavy pistol. DV 5. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols). Burst fire.', { training: [['Firearms', 'Pistols']] }],
    ['Ares Predator VI', 5, 'Heavy pistol. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols). Burst fire. Select DV 5 gel or DV 6 explosive ammunition.', { training: [['Firearms', 'Pistols']] }],
    ['Ruger Super Warhawk', 1, 'Heavy pistol. DV 6. Range OK / OK / Dis. / —.'],
    ['Ingram Smartgun', 3, 'SMG. DV 5. Range Dis. / OK / OK / —. RR 1 on Ranged Weapons (SMGs). Silencer.', { training: [['Firearms', 'SMGs']] }],
    ['Ares Alpha Mk II', 5, 'Rifle DV 7, range Dis. / OK / OK / Dis. Underbarrel launcher DV 7, range — / Dis. / OK / OK. RR 1 with both.', { training: [['Firearms', 'Rifles'], ['Heavy Weapons', 'Grenade Launchers']] }],
    ['Barrett Model 122', 2, 'Sniper rifle. DV 12. Range — / Dis. / Dis. / OK.'],
    ['Ranger Arms SM-6', 4, 'Sniper rifle. DV 10. Range — / Dis. / Dis. / OK. RR 1 on Ranged Weapons (sniper rifles). Silenced and easy to disassemble.', { training: [['Firearms', 'Sniper Rifles']] }]
  ], { weaponSkill: 'Firearms' }),
  ...coreAmps('Awakened', TECHNOMANCER_SOURCE, [
    [EMERGED_AMP, 7, 'Living persona with AR and hot-sim VR. Firewall uses Willpower and Attack uses Charisma. Hacking represents Cracking. Tasking threads complex forms and compiles sprites. Matrix damage becomes biofeedback. Tasking can cause fading.', { unlocks: ['Tasking'], training: [['Hacking'], ['Tasking']] }]
  ]),
  ...Object.fromEntries(CATALOG.vehicle.map(({ name, rating, source, effect }) =>
    [name, {
      group: 'Vehicle', rating, source, effect,
      ...({
        'Eurocar Northstar 2.0': { training: [['Piloting', 'Cars']] },
        'Mitsubishi Nightsky': { training: [['Influence']] },
        'Artemis Industries Nightwing': { training: [['Stealth', 'Physical Sneaking']] }
      }[name] ?? {})
    }]))
};

const CONCEPTS = {
  Muscle: [
    { name: 'Bodyguard', attribute: 'Strength', skills: ['Close Combat', 'Firearms', 'Perception'],
      amps: ['Dermal Plating', 'Reaction Enhancer'], weight: 2, source: 'p. 250' },
    { name: 'Combat Adept', attribute: 'Agility', skills: ['Close Combat', 'Athletics', 'Perception'],
      amps: ['Awakened (Adept)', 'Killing Hands'], weight: 2, source: 'pp. 108–109' },
    { name: 'Mercenary', attribute: 'Agility', skills: ['Firearms', 'Heavy Weapons', 'Survival'],
      amps: ['Smartlink', 'Reaction Enhancer'], weight: 2, source: 'p. 252' },
    { name: 'Razorgirl', attribute: 'Agility', skills: ['Close Combat', 'Stealth', 'Athletics'],
      amps: ['Ares Wired Reflexes', 'Synthetic Cyberarm with Cyberspur'], weight: 3, source: 'pp. 90–91' },
    { name: 'Sprawl Ganger', attribute: 'Agility', skills: ['Close Combat', 'Firearms', 'Piloting'],
      specializations: { Piloting: ['Motorcycles'] },
      amps: ['Ganger'], vehicleGroup: 'Motorcycle', weight: 2, source: 'pp. 164, 238, 244' },
    { name: 'Street Samurai', attribute: 'Agility', skills: ['Close Combat', 'Firearms', 'Athletics'],
      amps: ['Ares Wired Reflexes', 'Smartlink'], weight: 3, source: 'pp. 90–91' },
    { name: 'Tank', attribute: 'Strength', skills: ['Close Combat', 'Firearms', 'Survival'],
      amps: ['Dermal Plating', 'Platelet Factories'], weight: 2, source: 'pp. 104–105 (Drakk)' },
    { name: 'Weapons Specialist', attribute: 'Agility', skills: ['Firearms', 'Heavy Weapons', 'Engineering'],
      specializations: { Engineering: ['Armorer'], Firearms: ['Rifles'] }, equipment: ['Tool kit'],
      amps: ['Reflex Recorder (Rifles)', 'Gunsmith'], weight: 2, source: 'pp. 159, 164 (Reflex Recorder and Gunsmith contact)' }
  ],
  Awakened: [
    { name: 'Beast Summoner', attribute: 'Charisma', skills: ['Conjuring', 'Survival', 'Tracking'],
      skillAttributes: { Conjuring: 'Charisma' }, specializations: { Conjuring: ['Spirits of Beasts'] }, spellCount: 0,
      amps: ['Awakened (Conjurer)', 'Beast Focus'], weight: 2, source: 'pp. 170, 185, 189' },
    { name: 'Combat Mage', attribute: 'Willpower', skills: ['Sorcery', 'Perception', 'Athletics'],
      spellGroup: 'Combat',
      amps: ['Awakened (Magician)', 'Sorcery Focus'], weight: 3, source: 'p. 251' },
    { name: 'Illusionist', attribute: 'Willpower', skills: ['Sorcery', 'Stealth', 'Influence'],
      spellGroup: 'Illusion',
      amps: ['Awakened (Sorcerer)', 'Illusion Focus, Major'], weight: 3, source: 'p. 184' },
    { name: 'Spirit Whisperer', attribute: 'Charisma', skills: ['Conjuring', 'Perception', 'Influence'],
      skillAttributes: { Conjuring: 'Charisma' }, spellCount: 0,
      amps: ['Awakened (Conjurer)', 'Control Focus'], weight: 2, source: 'p. 185' },
    { name: 'Street Shaman', attribute: 'Willpower', skills: ['Conjuring', 'Sorcery', 'Influence'],
      skillAttributes: { Conjuring: 'Charisma' }, spellGroup: 'Manipulation',
      amps: ['Awakened (Magician)', 'Raccoon Mentor Spirit'], weight: 4, source: 'pp. 92–93 (Trash)' },
    { name: 'Technomancer', attribute: 'Logic', skills: ['Tasking', 'Hacking', 'Electronics'],
      specializations: { Tasking: ['Complex Forms', 'Compilation'] },
      amps: [EMERGED_AMP, 'Data Haven'], weight: 2, source: TECHNOMANCER_SOURCE }
  ],
  Tech: [
    { name: 'Combat Decker', attribute: 'Logic', skills: ['Hacking', 'Firearms', 'Athletics'],
      amps: ['Datajack', 'Ares ProShooter Cybernetic Eyes'], startingKit: 'Cyberdeck', weight: 2, source: 'pp. 106–107' },
    { name: 'Decker', attribute: 'Logic', skills: ['Hacking', 'Electronics', 'Perception'],
      amps: ['Unlocked Datajack', 'Data Haven'], startingKit: 'Cyberdeck', weight: 4, source: 'pp. 94–95' },
    { name: 'Drone Specialist', attribute: 'Logic', skills: ['Piloting', 'Engineering', 'Perception'],
      amps: ['Unlocked Datajack', 'Cyberspace Design Quadrotor'], startingKit: 'Rigger', weight: 2, source: 'pp. 100–101' },
    { name: 'Rigger', attribute: 'Logic', skills: ['Engineering', 'Piloting', 'Electronics'],
      amps: ['Mechanic'], startingKit: 'Rigger', vehicleGroup: 'Any', randomDrone: true, weight: 4, source: 'pp. 96–97' },
    { name: 'Security Expert', attribute: 'Logic', skills: ['Electronics', 'Engineering', 'Firearms'],
      amps: ['Datajack', 'GM-Nissan Doberman'], startingKit: 'Rigger', weight: 2, source: 'p. 253' },
  ],
  Specialist: [
    { name: 'Bounty Hunter', attribute: 'Logic', skills: ['Tracking', 'Perception', 'Firearms'],
      specializations: { Tracking: ['People'] },
      amps: ['Evo Night Hawk 500 Binoculars', 'Sensor Tags'], vehicleGroup: 'Car', weight: 2, source: 'p. 136' },
    { name: 'Burglar', attribute: 'Agility', skills: ['Stealth', 'Electronics', 'Athletics'],
      amps: ['Infiltration Kit', 'Climbing Gear'], weight: 2, source: 'p. 136' },
    { name: 'Courier', attribute: 'Agility', skills: ['Athletics', 'Piloting', 'Stealth'],
      amps: ['Climbing Gear'], vehicleGroup: 'Motorcycle', weight: 2, source: null },
    { name: 'Covert Ops Specialist', attribute: 'Agility', skills: ['Stealth', 'Influence', 'Electronics'],
      specializations: { Influence: ['Impersonation'] }, equipment: ['Disguise kit'],
      amps: ['Nanopaste Makeup', 'Infiltration Kit'], weight: 2, source: 'pp. 136, 139' },
    { name: 'Infiltrator', attribute: 'Agility', skills: ['Stealth', 'Athletics', 'Electronics'],
      amps: ['Climbing Gear', 'Laser Microphone'], weight: 3, source: 'pp. 102–103' },
    { name: 'Investigator', attribute: 'Logic', skills: ['Perception', 'Tracking', 'Influence'],
      amps: ['Evo Night Hawk 500 Binoculars', 'Undercover Cop'], weight: 2, source: 'p. 254' },
    { name: 'Scout', attribute: 'Agility', skills: ['Tracking', 'Survival', 'Perception'],
      amps: ['Thermal Binoculars', 'Sensor Tags', 'Microdrone'], weight: 2, source: null },
    { name: 'Smuggler', attribute: 'Agility', skills: ['Piloting', 'Stealth', 'Network'],
      amps: ['Smuggler'], vehicleGroup: 'Car', weight: 2, source: 'p. 255' },
    { name: 'Street Doc', attribute: 'Logic', skills: ['Survival', 'Biotech', 'Perception'],
      skillAttributes: { Survival: 'Logic' }, specializations: { Survival: ['First Aid'] }, equipment: ['Medkit'],
      amps: ['DocWagon Pro+ Autonomous Medkit', 'Street Doc'], weight: 3, source: 'p. 250' },
    { name: 'Wheeler', attribute: 'Agility', skills: ['Piloting', 'Perception', 'Survival'],
      skillAttributes: { Survival: 'Logic' }, specializations: { Piloting: ['Cars'], Survival: ['First Aid'] }, equipment: ['Medkit'],
      amps: ['Mechanic'], vehicleGroup: 'Car', weight: 2, source: 'p. 238 (Vehicle selection)' }
  ],
  Influence: [
    { name: 'Arms Dealer', attribute: 'Charisma', skills: ['Influence', 'Firearms', 'Network'],
      amps: ['Gunsmith', 'Fixer'], weight: 2, source: 'p. 164' },
    { name: 'Con Artist', attribute: 'Charisma', skills: ['Influence', 'Stealth', 'Network'],
      amps: ['Makeup Kit', 'Well-Stocked Closet'], weight: 2, source: 'p. 139' },
    { name: 'Face', attribute: 'Charisma', skills: ['Influence', 'Network', 'Perception'],
      amps: ['Tailored Pheromones', 'Well-Stocked Closet'], weight: 4, source: 'pp. 88–89' },
    { name: 'Fixer', attribute: 'Charisma', skills: ['Network', 'Influence', 'Intimidation'],
      amps: ['Fixer', 'Bar Owner'], weight: 2, source: 'p. 164' },
    { name: 'Gang Leader', attribute: 'Charisma', skills: ['Intimidation', 'Network', 'Firearms'],
      amps: ['Ganger', 'Bar Owner'], weight: 2, source: 'p. 244' },
    { name: 'Rocker', attribute: 'Charisma', skills: ['Influence', 'Network', 'Perception'],
      specializations: { Influence: ['Performance'], Network: ['Music Scene'] },
      amps: ['Bar Owner', 'Well-Stocked Closet'], weight: 2, source: 'pp. 139, 164' }
  ]
};
export {
  ATTRIBUTES,
  LIMITS,
  LEVELS,
  SKILLS,
  CONCEPTS,
  TECHNOMANCER_SOURCE,
  AMP_PROFILES,
  EMERGED_AMP,
  SHADOW_AMP_RULES_SOURCE
};
