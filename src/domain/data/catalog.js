import { normalizeName } from '../names.js';
import { ITEM_TYPE } from './rules.js';

export const GEAR_RATING_PRICE = 2500;

const catalogGroup = ({ type, group, source, rating, names: namesArr }) =>
  Object.fromEntries(namesArr.map(nameStr => [nameStr, { type, group, source, rating }]));

export const CATALOG = {
  "Infusion of Firewall": { type: ITEM_TYPE.ComplexForm, group: "Sustained", rating: 2, source: "Anarchy 2.0 Conversion Guide, p. 9",
    description: "Protects against Matrix damage and biofeedback" },
  "Mirrored Persona": { type: ITEM_TYPE.ComplexForm, group: "Sustained", rating: 2, source: "Anarchy 2.0 Conversion Guide, p. 9",
    description: "Creates a virtual decoy" },

  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Short melee", rating: 1, source: "pp. 142–148", names: [
    "Survival knife",
    "Brass knuckles",
    "Cyber claws",
    "Cyber blades",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Long melee", rating: 1, source: "pp. 142–148", names: [
    "Sword",
    "Rapier",
    "Katana",
    "Combat axe",
    "Polearm",
    "Nightstick",
    "Extendable baton",
    "Baseball bat",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Advanced melee", rating: 1, source: "pp. 142–148", names: [
    "Stun baton",
    "Stun gloves",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Throwing", rating: 1, source: "pp. 142–148", names: [
    "Throwing knife",
    "Shuriken",
    "Chakram",
    "Tomahawk",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Bow / crossbow", rating: 1, source: "pp. 142–148", names: [
    "Bow",
    "Crossbow",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Taser", rating: 1, source: "pp. 142–148", names: [
    "Defiance Super Shock",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Taser", rating: 5, source: "pp. 142–148", names: [
    "Yamaha Pulsar",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Hold-out pistol", rating: 5, source: "pp. 142–148", names: [
    "Fichetti Tiffani Needler",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Hold-out pistol", rating: 1, source: "pp. 142–148", names: [
    "Streetline Special",
    "Walther Palm Pistol",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Light pistol", rating: 1, source: "pp. 142–148", names: [
    "Ares Light Fire",
    "Beretta 101T",
    "Colt America L36",
    "Fichetti Security 600",
    "Ruger Redhawk",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Machine pistol", rating: 1, source: "pp. 142–148", names: [
    "Ares Crusader II",
    "Ceska Black Scorpion",
    "Steyr TMP",
    "Ares Super Squirt",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Heavy pistol", rating: 1, source: "pp. 142–148", names: [
    "Ares Viper Slivergun",
    "Browning Ultra Power",
    "Colt Manhunter",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Heavy pistol", rating: 5, source: "pp. 142–148", names: [
    "Ares Predator IV",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Heavy pistol", rating: 7, source: "pp. 142–148", names: [
    "Ares Predator V",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Heavy pistol", rating: 11, source: "pp. 142–148", names: [
    "Ares Predator VI",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Heavy pistol", rating: 3, source: "pp. 142–148", names: [
    "Ruger Super Warhawk",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "SMG", rating: 1, source: "pp. 142–148", names: [
    "Colt Cobra",
    "HK-227",
    "FN P93 Praetor",
    "Uzi V",
    "Ingram Smartgun",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Assault rifle", rating: 1, source: "pp. 142–148", names: [
    "AK-97",
    "Colt M23",
    "FN HAR",
    "Parashield DART rifle",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Shotgun", rating: 1, source: "pp. 142–148", names: [
    "Defiance T-250",
    "Mossberg CMDT",
    "Remington Roomsweeper",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Sniper rifle", rating: 2, source: "pp. 142–148", names: [
    "Ares Desert Strike",
    "Remington 900",
    "Barrett Model 122",
    "Ranger Arms SM-6",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Machine gun", rating: 2, source: "pp. 142–148", names: [
    "Ingram Valiant",
    "Stoner-Ares M202",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Grenade", rating: 1, source: "pp. 142–148", names: [
    "Fragmentation grenade",
    "Flashbang grenade",
    "Gas grenade",
    "Smoke grenade",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Grenade launcher", rating: 2, source: "pp. 142–148", names: [
    "Ares Antioch II",
    "ArmTech MGL-6",
    "ArmTech MGL-12",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Weapon, group: "Rocket launcher", rating: 2, source: "pp. 142–148", names: [
    "Aztechnology Striker",
    "Onotari Interceptor",
  ] }),

  ...catalogGroup({ type: ITEM_TYPE.Spell, group: "Combat", rating: 2, source: "pp. 180–184", names: [
    "Manabolt",
    "Stunbolt",
    "Blast",
    "Flamestrike",
    "Lightning Bolt",
    "Fireball",
    "Powerbolt",
    "Stunball",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Spell, group: "Detection", rating: 2, source: "pp. 180–184", names: [
    "Analyze Magic",
    "Analyze Truth",
    "Mind Probe",
    "Borrow Senses",
    "Combat Sense",
    "Detect Enemies",
    "Detect Life",
    "Detect Magic",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Spell, group: "Health", rating: 2, source: "pp. 180–184", names: [
    "Heal",
    "Increase Reflexes",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Spell, group: "Illusion", rating: 2, source: "pp. 180–184", names: [
    "Chimera",
    "Confusion",
    "Invisibility",
    "Mask",
    "Silence",
    "Phantasm",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Spell, group: "Manipulation", rating: 2, source: "pp. 180–184", names: [
    "Control Thoughts",
    "Armor",
    "Astral Armor",
    "Mystic Armor",
    "Elemental Aura",
    "Levitate",
    "Physical Barrier",
    "Mana Barrier",
    "Dual Barrier",
    "Shaping",
    "Magic Fingers",
  ] }),

  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 1, source: "pp. 148–149", names: [
    "Armored clothing (1)",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 2, source: "pp. 148–149", names: [
    "Lined coat (2)",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 3, source: "pp. 148–149", names: [
    "Armor jacket (3)",
    "Chameleon suit (3)",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 4, source: "pp. 148–149", names: [
    "Full body armor (4)",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 5, source: "pp. 148–149", names: [
    "Military armor (5)",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Armor, group: "Armor", rating: 1, source: "pp. 148–149", names: [
    "SecureTech Invisi-shield (1)",
  ] }),

  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "Communication", rating: 1, source: "Reference/example — verify exact price", names: [
    "Binoculars",
    "Bug scanner",
    "Camera",
    "Directional microphone",
    "Jammer",
    "Low-light goggles",
    "Micro-transceiver",
    "Motion sensor",
    "RFID tags",
    "Thermographic goggles",
    "White-noise generator",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "Drones", rating: 1, source: "Reference/example — verify exact price", names: [
    "Doberman drone",
    "Fly-Spy drone",
    "Microdrone",
    "Rotor drone",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "General", rating: 1, source: "Reference/example — verify exact price", names: [
    "Backpack",
    "Climbing gear",
    "Disguise kit",
    "Electronics toolkit",
    "Flashlight",
    "Gas mask",
    "Grappling gear",
    "Hardware toolkit",
    "Lockpick set",
    "Maglock passkey",
    "Mechanic toolkit",
    "Respirator",
    "Rope",
    "Survival kit",
    "Tool kit",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "Magic", rating: 1, source: "Reference/example — verify exact price", names: [
    "Magical lodge materials",
    "Reagents",
    "Spell focus",
    "Spirit focus",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "Matrix", rating: 1, source: "Reference/example — verify exact price", names: [
    "AR glasses",
    "Cyberdeck",
    "Datajack",
    "Electronics kit",
    "Trodes",
  ] }),
  ...catalogGroup({ type: ITEM_TYPE.Equipment, group: "Medical", rating: 1, source: "Reference/example — verify exact price", names: [
    "Antidote kit",
    "Biotech kit",
    "DocWagon contract",
    "First aid supplies",
    "Medkit",
    "Trauma patch",
  ] }),
};

const namesByType = new Map();
const namesByNormalizedName = new Map();
for (const [name, { type }] of Object.entries(CATALOG)) {
  if (!namesByType.has(type)) namesByType.set(type, []);
  namesByType.get(type).push(name);
  namesByNormalizedName.set(normalizeName(name), name);
}

export const catalogNames = typeStr => namesByType.get(typeStr) ?? [];

export function catalogProfile(typeStr, nameStr) {
  const profile = CATALOG[namesByNormalizedName.get(normalizeName(nameStr))];
  return profile?.type === typeStr ? profile : undefined;
}

export const catalogDescription = profileObj => profileObj?.description || profileObj?.group || '';
export const priceGearRating = rating => Math.round(rating * GEAR_RATING_PRICE);

export function makeCatalogItem(nameStr) {
  const profile = CATALOG[nameStr];
  return { name: nameStr, type: profile.type, cost: priceGearRating(profile.rating), description: catalogDescription(profile) };
}
