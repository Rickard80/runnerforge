import { AMP_GROUP } from './rules.js';
import { CATALOG } from './catalog.js';
import { SKILL, SKILLS, TASKING, specializationOptions } from '../specializations.js';

export const TECHNOMANCER_SOURCE = 'Anarchy 2.0 Conversion Guide, pp. 8–10';
export const EMERGED_AMP = 'Emerged (Technomancy)';

export const SHADOW_AMP_RULES_SOURCE = 'pp. 58–63';

const coreAmps = ({ groupStr, sourceStr, examplesArr, defaultsObj = {} }) =>
  Object.fromEntries(examplesArr.map(([nameStr, rating, effectStr, optionsObj]) =>
    [nameStr, { group: groupStr, source: sourceStr, rating, effect: effectStr, ...defaultsObj, ...optionsObj }]));

const trainingForSpecialization = nameStr => [nameStr, ...specializationOptions(nameStr).map(([valueStr]) => valueStr)];
const physicalTrainingChoices = SKILLS.map(nameStr => [
  nameStr,
  ...specializationOptions(nameStr)
    .filter(([, codeStr]) => codeStr.split('/').some(attributeStr => attributeStr === 'S' || attributeStr === 'A'))
    .map(([valueStr]) => valueStr)
]).filter(([, ...specializationsArr]) => specializationsArr.length);

export const AMP_PROFILES = {
  ...coreAmps({ groupStr: AMP_GROUP.AdeptPower, sourceStr: 'p. 89', examplesArr: [
    ['Vocal Control', 3, 'RR 1 on Influence (impersonation).', { training: [[SKILL.Influence, 'Impersonation']] }],
    ['Empathic Sense', 5, 'RR 2 on Perception (social).', { training: [[SKILL.Perception, 'Social']] }],
    ['Flashing Smile', 3, 'RR 1 on Influence (bluff).', { training: [[SKILL.Influence, 'Bluff']] }],
    ['Concealment', 1, 'Blend into a crowd for a scene.']
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.AdeptPower, sourceStr: 'p. 191', examplesArr: [
    ['Astral Armor', 2, '+1 Armor against spells and in astral space.'],
    ['Armor (Adept Power)', 2, '+1 physical Armor.'],
    ['Combat Sense', 8, 'RR 1 on Close Combat and Athletics (ranged defense).', { training: [[SKILL.CloseCombat], [SKILL.Athletics, 'Ranged Defense']] }],
    ['Danger Sense', 1, 'Detect imminent danger without a Perception Test. Gives no details.'],
    ['Distance Strike', 3, 'Unarmed attacks can reach short range with Disadvantage.'],
    ['Elemental Strike', 2, '+1 unarmed DV. Choose an elemental effect.'],
    ['Elemental Weapon', 2, '+1 melee weapon DV. Choose an elemental effect.'],
    ['Empathic Sense', 7, 'RR 3 on Perception (social).', { training: [[SKILL.Perception, 'Social']] }],
    ['Enhanced Perception', 3, 'RR 1 on Perception (physical). Extra sensory effects cost additional rating points.', { training: [[SKILL.Perception, 'Physical']] }],
    ['Improved Ability', 6, 'RR 1 on a chosen skill.', { trainingChoices: SKILLS.map(nameStr => [nameStr]) }],
    ['Improved Attribute', 11, 'RR 1 on Tests with a chosen attribute.'],
    ['Improved Reflexes', 6, '+1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Light-footed', 5, 'RR 2 on Stealth (physical sneaking).', { training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['Morphological and Vocal Control', 10, 'RR 1 on Influence and RR 2 on Influence (impersonation).', { training: [[SKILL.Influence, 'Impersonation']] }],
    ['Mystic Armor', 3, '+1 Armor against astral and physical damage.'],
    ['Reflexes Boost', 3, '+1 Edge per action scene and unlimited extra actions.'],
    ['Vocal Control', 8, 'RR 1 on Influence and an additional RR 1 for impersonation.', { training: [[SKILL.Influence, 'Impersonation']] }],
    ['Wall Running', 1, 'Move briefly along vertical surfaces.'],
    ['Killing Hands', 3, '+2 DV on unarmed attacks.'],
    ['Pain Resistance', 7, 'One additional serious wound box.']
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.ArmorAmp, sourceStr: 'p. 149', examplesArr: [
    ['Actioneer Business Suit', 2, 'Armor 1. RR 1 on Influence (etiquette).', { armor: 1, training: [[SKILL.Influence, 'Etiquette']] }],
    ['Armanté Suit or Dress', 7, 'Armor 1. RR 1 on Influence and an additional RR 1 for etiquette.', { armor: 1, training: [[SKILL.Influence, 'Etiquette']] }],
    ['Chameleon Suit', 4, 'Armor 3. RR 2 on physical Stealth.', { armor: 3, replaces: ['Chameleon suit (3)'], training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['SecureTech Invisi-shield', 1, '+1 Armor.', { armor: 1 }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Awakened, sourceStr: 'p. 170', examplesArr: [
    ['Awakened (Clairvoyant)', 2, 'Astral perception and projection.'],
    ['Awakened (Mystic Adept)', 4, 'Sorcery, Conjuring and adept powers.', { unlocks: [SKILL.Sorcery, 'Conjuring'], adeptPowers: true }],
    ['Awakened (Adept)', 1, 'Access to adept powers.', { adeptPowers: true }],
    ['Awakened (Conjurer)', 3, 'Astral perception and Conjuring.', { unlocks: [SKILL.Conjuring] }],
    ['Awakened (Magician)', 5, 'Astral perception and projection, Sorcery and Conjuring.', { unlocks: [SKILL.Sorcery, 'Conjuring'] }],
    ['Awakened (Sorcerer)', 2, 'Astral perception and Sorcery.', { unlocks: [SKILL.Sorcery] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Bioware, sourceStr: 'p. 159', examplesArr: [
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
    ['Reflex Recorder (Rifles)', 4, 'RR 1 on Ranged Weapons (rifles) Tests, using the published specialization choice.', { training: [[SKILL.RangedWeapons, 'Rifles']] }],
    ['Tailored Pheromones', 7, 'RR 1 on Influence Tests.', { training: [[SKILL.Influence]] }]
  ], defaultsObj: { essenceLoss: 0.5 } }),
  ...coreAmps({ groupStr: AMP_GROUP.Contact, sourceStr: 'p. 164', examplesArr: [
    ['Corporate Executive', 2, 'RR 1 on Network (corporate).', { training: [[SKILL.Network, 'Corporate']] }],
    ['Journalist', 2, 'RR 1 on Network (media).', { training: [[SKILL.Network, 'Media']] }],
    ['Lawyer', 4, 'RR 2 on Network (government).', { training: [[SKILL.Network, 'Government']] }],
    ['Mafia Consigliere', 4, 'RR 2 on Network (criminal).', { training: [[SKILL.Network, 'Criminal']] }],
    ['Mr. Johnson', 6, 'RR 1 on Network (street, criminal and corporate).', { training: [[SKILL.Network, 'Street', 'Criminal', 'Corporate']] }],
    ['Talismonger', 2, 'RR 1 on Network (magic).', { training: [[SKILL.Network, 'Magic']] }],
    ['University Professor', 2, 'RR 1 on Network (academic).', { training: [[SKILL.Network, 'Academic']] }],
    ['Bar Owner', 2, 'Contact. RR 1 on Network (street) Tests.', { training: [[SKILL.Network, 'Street']] }],
    ['Data Haven', 4, 'Contact. RR 1 on Network (Matrix) and Electronics (Matrix search) Tests.', { training: [[SKILL.Network, 'Matrix'], [SKILL.Electronics, 'Matrix Search']] }],
    ['Fixer', 5, 'Contact. RR 1 on Network Tests.', { training: [[SKILL.Network]] }],
    ['Ganger', 2, 'Contact. RR 1 on Network (criminal) Tests.', { training: [[SKILL.Network, 'Criminal']] }],
    ['Gunsmith', 4, 'Contact. RR 1 on Network (street and engineering) Tests.', { training: [[SKILL.Network, 'Street', 'Engineering']] }],
    ['Mechanic', 2, 'Contact. RR 1 on Network (engineering) Tests.', { training: [[SKILL.Network, 'Engineering']] }],
    ['Smuggler', 4, 'Contact. RR 1 on Network (street and engineering) Tests.', { training: [[SKILL.Network, 'Street', 'Engineering']] }],
    ['Street Doc', 2, 'Contact. RR 1 on Network (medical) Tests.', { training: [[SKILL.Network, 'Medical']] }],
    ['Undercover Cop', 2, 'Contact. RR 1 on Network (government) Tests.', { training: [[SKILL.Network, 'Government']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberdeck, sourceStr: 'p. 95', examplesArr: [
    ['MCT 260', 12, 'Firewall 3, Attack 2. RR 1 on Cracking and an additional RR 1 for brute force.', { training: [[SKILL.Cracking, 'Brute Force']] }]
  ], defaultsObj: { replaces: ['Cyberdeck'] } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberdeck, sourceStr: 'p. 107', examplesArr: [
    ['MCT 360', 12, 'Firewall 3, Attack 3. RR 1 on Cracking. Biofeedback program.', { training: [[SKILL.Cracking]] }]
  ], defaultsObj: { replaces: ['Cyberdeck'] } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberdeck, sourceStr: 'p. 210', examplesArr: [
    ['MCT 360', 11, 'Firewall 3, Attack 3. RR 1 on Cracking.', { training: [[SKILL.Cracking]] }],
    ['Renraku Kitsune', 14, 'Firewall 4, Attack 4. Biofeedback Filter and RR 1 on Cracking.', { training: [[SKILL.Cracking]] }],
    ['Shiawase Cyber-6', 20, 'Firewall 5, Attack 4. Biofeedback and Biofeedback Filter. RR 1 on Cracking, plus RR 1 for brute force and backdoor.', { training: [[SKILL.Cracking, 'Brute Force', 'Backdoor']] }],
    ['Fairlight Excalibur', 30, 'Firewall 5, Attack 5 and one additional light wound box. Biofeedback and Biofeedback Filter. RR 1 on Cracking, plus RR 2 for brute force and backdoor and RR 1 for cybercombat.', { training: [[SKILL.Cracking, 'Brute Force', 'Backdoor', 'Cybercombat']] }],
    ['Erika MCD-6', 3, 'Cyberdeck. Firewall 2, Attack 1.'],
    ['Spinrad Falcon', 6, 'Cyberdeck. Firewall 2, Attack 2. RR 1 on Cracking (brute force) Tests.', { training: [[SKILL.Cracking, 'Brute Force']] }]
  ], defaultsObj: { replaces: ['Cyberdeck'] } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberware, sourceStr: 'p. 83', examplesArr: [
    ['Smartlink', 6, 'Cyberware. RR 1 on Ranged Weapons Tests.', { essenceLoss: 1, training: [[SKILL.RangedWeapons]] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberware, sourceStr: 'p. 155', examplesArr: [
    ['MCT Decker-Pro Cyberjack', 7, 'DNI and cold- or hot-sim VR. In VR gain +1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Implanted Commlink', 3, 'Commlink with DNI and cold-sim VR.'],
    ['Encephalon', 11, 'RR 1 on Logic Tests.'],
    ['Datajack', 2, 'Direct neural interface and cold-sim VR.', { replaces: ['Datajack'] }],
    ['Unlocked Datajack', 4, 'Direct neural interface and cold- and hot-sim VR.', { replaces: ['Datajack', 'Trodes'] }]
  ], defaultsObj: { essenceLoss: 1 } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberware, sourceStr: 'p. 156', examplesArr: [
    ['Standard Cybernetic Eyes', 1, 'Visual interface and camera.'],
    ['L’Oréal Fashion Top Cybernetic Eyes', 2, 'Visual interface, camera and customizable iris color.'],
    ['Universal Omnitech ProView Cybernetic Eyes', 4, 'Visual interface, camera and low-light vision. RR 1 on physical Perception.', { training: [[SKILL.Perception, 'Physical']] }],
    ['Universal Omnitech AbsoluteView Cybernetic Eyes', 6, 'Visual interface, camera and thermographic vision. RR 2 on physical Perception.', { training: [[SKILL.Perception, 'Physical']] }],
    ['Ares SharpShooter Cybernetic Eyes', 9, 'Visual interface, camera and zoom. RR 1 on Ranged Weapons and an additional RR 1 for rifles.', { training: [[SKILL.RangedWeapons, 'Rifles']] }],
    ['Evo EyeDrone Cybernetic Eyes', 5, 'Visual interface and camera. RR 1 on physical Perception. Ocular microdrone with Pilot 6, Body 0, Handling 10, Speed 0, Armor 0 and Advantage on physical Stealth. No weapon mount.', { training: [[SKILL.Perception, 'Physical'], [SKILL.Stealth, 'Physical Sneaking']] }],
    ['Ares ProShooter Cybernetic Eyes', 5, 'Visual interface, camera and RR 2 on Ranged Weapons (pistols) Tests.', { training: [[SKILL.RangedWeapons, 'Pistols']] }]
  ], defaultsObj: { essenceLoss: 1 } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberware, sourceStr: 'p. 157', examplesArr: [
    ['Standard Cybernetic Ears', 1, 'Auditory interface and microphone. Choose appearance.'],
    ['Universal Omnitech ProSound Cybernetic Ears', 3, 'Auditory interface and microphone. RR 1 on physical Perception.', { training: [[SKILL.Perception, 'Physical']] }],
    ['Universal Omnitech UltraSound Cybernetic Ears', 4, 'Auditory interface, microphone and expanded hearing range. RR 1 on physical Perception.', { training: [[SKILL.Perception, 'Physical']] }]
  ], defaultsObj: { essenceLoss: 1 } }),
  ...coreAmps({ groupStr: AMP_GROUP.Cyberware, sourceStr: 'p. 158', examplesArr: [
    ['Auto-injector', 1, 'Inject a loaded drug with a mental command.'],
    ['Auto-injector and Biomonitor', 3, 'Automatically inject a stim patch on a serious wound or a trauma patch on an incapacitating wound.'],
    ['Muscle Replacement', 6, 'RR 1 on Athletics.', { training: [[SKILL.Athletics]] }],
    ['Plastic Bone Lacing', 4, 'One additional light wound box.'],
    ['Aluminum Bone Lacing', 5, '+1 unarmed DV and one additional light wound box.'],
    ['Titanium Bone Lacing', 8, '+1 unarmed DV and one additional serious wound box.'],
    ['Evo Wired Reflexes', 8, '+2 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Move-by-wire', 15, '+2 Edge per action scene, +1 action per narration and unlimited extra actions. RR 1 on Close Combat and Athletics (ranged defense).', { training: [[SKILL.CloseCombat], [SKILL.Athletics, 'Ranged Defense']] }],
    ['Climbing Arms', 3, 'Retractable climbing claws. RR 1 on Athletics (climbing).', { training: [[SKILL.Athletics, 'Climbing']] }],
    ['Climbing Arms with Grapple Hand', 6, 'Retractable claws and grapple launcher. RR 2 on Athletics (climbing).', { training: [[SKILL.Athletics, 'Climbing']] }],
    ['Cyberlegs', 6, 'RR 1 on Athletics.', { training: [[SKILL.Athletics]] }],
    ['Digitigrade Cyberlegs', 8, 'RR 1 on Athletics and an additional RR 1 for running.', { training: [[SKILL.Athletics, 'Running']] }],
    ['Ares Wired Reflexes', 6, '+1 Edge per action scene, +1 action per narration and unlimited extra actions.'],
    ['Dermal Plating', 2, '+1 Armor.'],
    ['Reaction Enhancer', 3, '+1 Edge per action scene and unlimited extra actions.']
  ], defaultsObj: { essenceLoss: 1 } }),
  ...coreAmps({ groupStr: AMP_GROUP.Drone, sourceStr: 'p. 160', examplesArr: [
    ['CrashCart Essential Autonomous Medkit', 1, 'Stationary small drone. Pilot 6 for first aid. Spend Edge for Advantage as with a standard medkit.', { training: [[SKILL.Survival, 'First Aid']] }],
    ['DocWagon Pro+ Autonomous Medkit', 4, 'Stationary small drone. Pilot 9 for first aid Tests. Spend Edge for Advantage as with a standard medkit.', { training: [[SKILL.Survival, 'First Aid']] }]
  ], defaultsObj: { stationary: true } }),
  ...coreAmps({ groupStr: AMP_GROUP.Drone, sourceStr: 'p. 240', examplesArr: [
    ['Microdrone', 1, 'Pilot 6, Body 0, Handling 10, Speed 0 (flying 1), Armor 0. Advantage on physical Stealth. No weapon mount.', { training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['Small Drone', 1, 'Pilot 6, Body 1, Handling 9, Speed 2 (flying 4), Armor 0. Mount for an SMG or smaller weapon.'],
    ['Medium Drone', 1, 'Pilot 6, Body 2, Handling 7, Speed 3 (flying 6), Armor 0. Mount for an assault rifle or smaller weapon.'],
    ['Large Drone', 1, 'Pilot 6, Body 4, Handling 4, Speed 4 (flying 8), Armor 0.'],
    ['Shiawase Kanmushi', 3, 'Pilot 8, Body 0, Handling 10, Speed 0, Armor 0. Advantage on physical Stealth. No weapon mount.', { training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['MCT Gnat', 4, 'Flying. Pilot 6, Body 0, Handling 10, Speed 1, Armor 0. RR 1 and Advantage on physical Stealth. No weapon mount.', { training: [[SKILL.Stealth, 'Physical Sneaking']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Drone, sourceStr: 'p. 241', examplesArr: [
    ['Lockheed Optic-X2', 6, 'Flying. Pilot 6, Body 1, Handling 9, Speed 4, Armor 0. Forward SMG mount. RR 1 on physical Stealth and Perception.', { training: [[SKILL.Perception, 'Physical'], [SKILL.Stealth, 'Physical Sneaking']] }],
    ['Chrysler-Nissan Pursuit V', 4, 'Pilot 6, Body 1, Handling 9, Speed 5, Armor 0. Forward SMG mount.'],
    ['MCT-Nissan Roto-drone', 5, 'Flying. Pilot 6, Body 2, Handling 7, Speed 6, Armor 2. Two forward mounts for assault rifles or smaller weapons.', { replaces: ['Rotor drone'] }],
    ['Ares-DocWagon First Responder', 9, 'Pilot 10, Body 2, Handling 7, Speed 3, Armor 2. Arm and Valkyrie autonomous medkit.'],
    ['Steel Lynx', 7, 'Pilot 6, Body 4, Handling 4, Speed 3, Armor 4. Turret with two weapon mounts.'],
    ['Cyberspace Design Quadrotor', 4, 'Flying drone. Pilot 6, Body 1, Handling 9, Speed 4, Armor 0. Forward SMG mount. RR 1 on Perception (physical) Tests.', { replaces: ['Fly-Spy drone'], training: [[SKILL.Perception, 'Physical']] }],
    ['GM-Nissan Doberman', 4, 'Pilot 6, Body 2, Handling 7, Speed 3, Armor 2. Turret mount for an assault rifle or smaller weapon.', { replaces: ['Doberman drone'] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Equipment, sourceStr: 'p. 136', examplesArr: [
    ['Climbing Gear', 4, 'Adhesive gloves, grappling hook and degradable ropes. RR 2 on Athletics (climbing) Tests.', { replaces: ['Climbing gear'], training: [[SKILL.Athletics, 'Climbing']] }],
    ['Evo Night Hawk 500 Binoculars', 3, 'Zoom, night vision and RR 1 on Perception (physical) Tests.', { replaces: ['Binoculars'], training: [[SKILL.Perception, 'Physical']] }],
    ['Infiltration Kit', 4, 'Autopicker, maglock passkey and card copier. RR 2 on Stealth (lockpicking) Tests.', { replaces: ['Lockpick set'], training: [[SKILL.Stealth, 'Lockpicking']] }],
    ['Laser Microphone', 2, 'Listen through glass. RR 1 on Perception (physical) Tests.', { training: [[SKILL.Perception, 'Physical']] }],
    ['Sensor Tags', 1, 'Reports location and transmits audio and video.'],
    ['Thermal Binoculars', 1, 'Zoom and thermographic vision.', { replaces: ['Binoculars'] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Equipment, sourceStr: 'p. 139', examplesArr: [
    ['Expert Linguasoft', 2, 'Adapts speech to the audience. RR 1 on Influence (etiquette).', { training: [[SKILL.Influence, 'Etiquette']] }],
    ['Makeup Kit', 2, 'RR 1 on Influence (impersonation) Tests.', { replaces: ['Disguise kit'], training: [[SKILL.Influence, 'Impersonation']] }],
    ['Nanopaste Makeup', 4, 'RR 2 on Influence (impersonation) Tests.', { replaces: ['Disguise kit'], training: [[SKILL.Influence, 'Impersonation']] }],
    ['Well-Stocked Closet', 2, 'Appropriate clothing on hand. RR 1 on Influence (etiquette) Tests.', { training: [[SKILL.Influence, 'Etiquette']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Focus, sourceStr: 'p. 189', examplesArr: [
    ['Detection Focus, Minor', 2, 'RR 1 on Sorcery (detection spells).', { training: [[SKILL.Sorcery, 'Detection Spells']] }],
    ['Manipulation Focus', 4, 'RR 2 on Sorcery (manipulation spells).', { training: [[SKILL.Sorcery, 'Manipulation Spells']] }],
    ['Counterspelling Focus', 4, 'RR 2 on Sorcery (counterspelling).', { training: [[SKILL.Sorcery, 'Counterspelling']] }],
    ['Sustaining Focus', 2, 'Sustain one additional spell without penalty.', { training: [[SKILL.Sorcery]] }],
    ['Conjuring Focus', 5, 'RR 1 on Conjuring.', { training: [[SKILL.Conjuring]] }],
    ['Air Focus, Minor', 2, 'RR 1 on Conjuring (spirits of air).', { training: [[SKILL.Conjuring, 'Spirits of Air']] }],
    ['Fire Focus, Major', 6, 'RR 3 on Conjuring (spirits of fire).', { training: [[SKILL.Conjuring, 'Spirits of Fire']] }],
    ['Banishing Focus', 4, 'RR 2 on Conjuring (banishing).', { training: [[SKILL.Conjuring, 'Banishing']] }],
    ['Weapon Focus (Knife)', 1, 'Close range. DV Strength +1 in the physical realm or Charisma +1 in astral projection. Bypasses immunity to physical weapons.', { weaponSkill: 'Close Combat' }],
    ['Weapon Focus (Sword)', 5, 'Close range. DV Strength +2 in the physical realm or Charisma +2 in astral projection. RR 2 on Close Combat (blades). Bypasses immunity to physical weapons.', { weaponSkill: 'Close Combat', training: [[SKILL.CloseCombat, 'Blades']] }],
    ['Beast Focus', 4, 'RR 2 on Conjuring (spirits of beasts) Tests.', { training: [[SKILL.Conjuring, 'Spirits of Beasts']] }],
    ['Control Focus', 3, 'Control up to two spirits at once.', { training: [[SKILL.Conjuring]] }],
    ['Illusion Focus, Major', 6, 'RR 3 on Sorcery (illusion spells) Tests.', { training: [[SKILL.Sorcery, 'Illusion Spells']] }],
    ['Sorcery Focus', 5, 'RR 1 on Sorcery Tests.', { training: [[SKILL.Sorcery]] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Quality, sourceStr: 'p. 99', examplesArr: [
    ['Mystic Tattoo Focus', 13, 'RR 2 on astral Perception. RR 1 each on astral sneaking, astral combat and banishing.', { training: [[SKILL.Perception, 'Astral'], [SKILL.Stealth, 'Astral Sneaking'], [SKILL.CloseCombat, 'Astral Combat'], [SKILL.Conjuring, 'Banishing']] }],
    ['Quetzalcoatl Mentor Spirit', 2, 'RR 1 on Sorcery (detection spells). Disposition: Stubborn.', { training: [[SKILL.Sorcery, 'Detection Spells']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Quality, sourceStr: 'p. 111', examplesArr: [
    ['Capybara Mentor Spirit', 4, 'RR 1 on Survival (composure) and Stealth (physical sneaking). Disposition: Social.', { training: [[SKILL.Survival, 'Composure'], [SKILL.Stealth, 'Physical Sneaking']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Quality, sourceStr: 'p. 139', examplesArr: [
    ['Jet Setter', 1, '+1 social armor when using the extended social tests option. Rating assumes this is the first quality.']
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Quality, sourceStr: 'p. 174', examplesArr: [
    ['Bear Mentor Spirit', 4, 'Choose two for RR 1: Survival (first aid), Close Combat (unarmed), or Sorcery (health spells). Disposition: Rage.', { trainingChoices: [[SKILL.Survival, 'First Aid'], [SKILL.CloseCombat, 'Unarmed'], [SKILL.Sorcery, 'Health Spells']], chooseTraining: 2 }],
    ['Cat Mentor Spirit', 4, 'Choose two for RR 1: Athletics (parkour), Stealth (physical sneaking), or Sorcery (illusion spells). Disposition: Cruel.', { trainingChoices: [[SKILL.Athletics, 'Parkour'], [SKILL.Stealth, 'Physical Sneaking'], [SKILL.Sorcery, 'Illusion Spells']], chooseTraining: 2 }],
    ['Coyote Mentor Spirit', 4, 'Choose two for RR 1: Influence (impersonation or etiquette) or Sorcery (manipulation spells). Disposition: Mischievous.', { trainingChoices: [[SKILL.Influence, 'Impersonation', 'Etiquette'], [SKILL.Sorcery, 'Manipulation Spells']], chooseTraining: 2 }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.Quality, sourceStr: 'p. 175', examplesArr: [
    ['Dog Mentor Spirit', 4, 'Choose two for RR 1: Perception (physical), Survival (navigation), or Sorcery (detection spells). Disposition: Loyal.', { trainingChoices: [[SKILL.Perception, 'Physical'], [SKILL.Survival, 'Navigation'], [SKILL.Sorcery, 'Detection Spells']], chooseTraining: 2 }],
    ['Dragonslayer Mentor Spirit', 4, 'Choose two for RR 1: Influence (intimidation), a Close Combat specialization, or Sorcery (combat spells). Disposition: Honor.', { trainingChoices: [[SKILL.Influence, 'Intimidation'], trainingForSpecialization(SKILL.CloseCombat), [SKILL.Sorcery, 'Combat Spells']], chooseTraining: 2 }],
    ['Thunderbird Mentor Spirit', 4, 'Choose two for RR 1: Influence (intimidation), Close Combat (unarmed), or Conjuring (spirits of air). Disposition: Uptight.', { trainingChoices: [[SKILL.Influence, 'Intimidation'], [SKILL.CloseCombat, 'Unarmed'], [SKILL.Conjuring, 'Spirits of Air']], chooseTraining: 2 }],
    ['Wolf Mentor Spirit', 4, 'Choose two for RR 1: Survival (navigation), Close Combat (unarmed or blades), or Sorcery (combat spells). Disposition: Fierce.', { trainingChoices: [[SKILL.Survival, 'Navigation'], [SKILL.CloseCombat, 'Unarmed', 'Blades'], [SKILL.Sorcery, 'Combat Spells']], chooseTraining: 2 }],
    ['Raccoon Mentor Spirit', 4, 'RR 1 on Stealth (palming) and Sorcery (manipulation spells) Tests. Disposition: Curious.', { training: [[SKILL.Stealth, 'Palming'], [SKILL.Sorcery, 'Manipulation Spells']] }]
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.RiggerCommandConsole, sourceStr: 'p. 158', examplesArr: [
    ['Ares FeelTheRide Vehicle Control Rig', 6, 'DNI and cold- or hot-sim VR. Jump into vehicles and drones.'],
    ['Dassault MilRig+ Vehicle Control Rig', 9, 'DNI and cold- or hot-sim VR. While jumped in, gain +1 Edge per scene, +1 action per narration and unlimited extra actions.'],
    ['Shiawase Neo-Rigger Vehicle Control Rig', 4, 'Direct neural interface and cold-sim VR. Allows jumping into vehicles and drones.', { essenceLoss: 1, replaces: ['Datajack', 'Trodes'] }],
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.RiggerCommandConsole, sourceStr: 'p. 232', examplesArr: [
    ['Horizon Overseer', 5, 'Firewall 1. Controls 3 vehicles in captain’s chair mode. RR on a chosen Piloting specialization.', { trainingChoices: [trainingForSpecialization(SKILL.Piloting)] }],
    ['Proteus Poseidon', 8, 'Firewall 2. Controls 5 vehicles in captain’s chair mode. RR on a chosen Piloting specialization.', { trainingChoices: [trainingForSpecialization(SKILL.Piloting)] }],
    ['Ares Red Dog Series', 12, 'Firewall 3. Controls 5 vehicles in captain’s chair mode. RR 1 on Piloting.', { training: [[SKILL.Piloting]] }],
    ['Essy Motors DroneMaster', 3, 'Rigger command console. Firewall 1. Controls up to 3 drones in captain’s chair mode.']
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.WeaponAmp, sourceStr: 'p. 158', examplesArr: [
    ['Synthetic Cyberarm with Cyberspur', 4, 'Forearm blade. RR 1 on Close Combat (blades) Tests.', { essenceLoss: 1, training: [[SKILL.CloseCombat, 'Blades']] }],
    ['Synthetic Cyberarm with Heavy Pistol', 4, 'Forearm pistol. RR 1 on Ranged Weapons (pistols).', { training: [[SKILL.RangedWeapons, 'Pistols']] }],
  ] }),
  ...coreAmps({ groupStr: AMP_GROUP.WeaponAmp, sourceStr: 'p. 144', examplesArr: [
    ['Monofilament Whip', 1, 'DV 7 at close range. Use at least six risk dice, up to the full pool.', { weaponSkill: 'Close Combat' }],
    ['Yamaha Pulsar', 2, 'Taser. DV 5. Range OK / OK / Dis. / —.'],
    ['Tiffani Needler', 2, 'Hold-out pistol. DV 3. Range OK / OK / Dis. / —. RR 1 on physical Stealth.', { training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['Shiawase Arms Puzzler', 4, 'Light pistol. DV 4. Range OK / OK / Dis. / —. RR 2 on physical Stealth.', { training: [[SKILL.Stealth, 'Physical Sneaking']] }],
    ['Ares Predator IV', 2, 'Heavy pistol. DV 5. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols).', { training: [[SKILL.RangedWeapons, 'Pistols']] }],
    ['Ares Predator V', 3, 'Heavy pistol. DV 5. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols). Burst fire.', { training: [[SKILL.RangedWeapons, 'Pistols']] }],
    ['Ares Predator VI', 5, 'Heavy pistol. Range OK / OK / Dis. / —. RR 1 on Ranged Weapons (pistols). Burst fire. Select DV 5 gel or DV 6 explosive ammunition.', { training: [[SKILL.RangedWeapons, 'Pistols']] }],
    ['Ruger Super Warhawk', 1, 'Heavy pistol. DV 6. Range OK / OK / Dis. / —.'],
    ['Ingram Smartgun', 3, 'SMG. DV 5. Range Dis. / OK / OK / —. RR 1 on Ranged Weapons (submachine guns). Silencer.', { training: [[SKILL.RangedWeapons, 'Submachine Guns']] }],
    ['Ares Alpha Mk II', 5, 'Rifle DV 7, range Dis. / OK / OK / Dis. Underbarrel launcher DV 7, range — / Dis. / OK / OK. RR 1 with both.', { training: [[SKILL.RangedWeapons, 'Rifles', 'Grenade Launchers']] }],
    ['Barrett Model 122', 2, 'Sniper rifle. DV 12. Range — / Dis. / Dis. / OK.'],
    ['Ranger Arms SM-6', 4, 'Sniper rifle. DV 10. Range — / Dis. / Dis. / OK. RR 1 on Ranged Weapons (rifles). Silenced and easy to disassemble.', { training: [[SKILL.RangedWeapons, 'Rifles']] }]
  ], defaultsObj: { weaponSkill: 'Ranged Weapons' } }),
  ...coreAmps({ groupStr: AMP_GROUP.Awakened, sourceStr: TECHNOMANCER_SOURCE, examplesArr: [
    [EMERGED_AMP, 7, 'Living persona with AR and hot-sim VR. Firewall uses Willpower and Attack uses Charisma. Use Cracking with the living persona. Tasking threads complex forms and compiles sprites. Matrix damage becomes biofeedback. Tasking can cause fading.', { unlocks: [TASKING], training: [[SKILL.Cracking], [TASKING]] }]
  ] }),
  ...Object.fromEntries(CATALOG.vehicle.map(({ name: nameStr, rating, source: sourceStr, effect: effectStr }) =>
    [nameStr, {
      group: AMP_GROUP.Vehicle, rating, source: sourceStr, effect: effectStr,
      ...({
        'Eurocar Northstar 2.0': { training: [[SKILL.Piloting, 'Cars']] },
        'Mitsubishi Nightsky': { training: [[SKILL.Influence]] },
        'Artemis Industries Nightwing': { training: [[SKILL.Stealth, 'Physical Sneaking']] }
      }[nameStr] ?? {})
    }]))
};

export function makeAmp(nameStr) {
  const { rating, source, effect, essenceLoss, armor } = AMP_PROFILES[nameStr];
  return { name: nameStr, rating, source, notes: effect, ...(essenceLoss ? { essenceLoss } : {}), ...(armor !== undefined ? { armor } : {}) };
}
