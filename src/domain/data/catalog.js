import { ITEM_TYPE } from './rules.js';
const equipmentByCategory = {
  Communication: [
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
  ],
  Drones: [
    "Doberman drone",
    "Fly-Spy drone",
    "Microdrone",
    "Rotor drone",
  ],
  General: [
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
  ],
  Magic: [
    "Magical lodge materials",
    "Reagents",
    "Spell focus",
    "Spirit focus",
  ],
  Matrix: [
    "AR glasses",
    "Cyberdeck",
    "Datajack",
    "Electronics kit",
    "Trodes",
  ],
  Medical: [
    "Antidote kit",
    "Biotech kit",
    "DocWagon contract",
    "First aid supplies",
    "Medkit",
    "Trauma patch",
  ],
};

export const CATALOG = {
  [ITEM_TYPE.Vehicle]: [
    { name: 'Racing Bike', group: 'Motorcycle', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 4, Handling 2, Speed 6, Armor 0.' },
    { name: 'Off-road Bike', group: 'Motorcycle', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 4, Handling 3, Speed 5, Armor 0.' },
    { name: 'Combat Bike / Chopper', group: 'Motorcycle', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 2, Speed 5, Armor 0.' },
    { name: 'Sports Car', group: 'Car', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 2, Speed 5, Armor 0.' },
    { name: 'Sedan', group: 'Car', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 6, Handling 2, Speed 4, Armor 0.' },
    { name: 'SUV / Pick-up', group: 'Car', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 7, Handling 1, Speed 4, Armor 0.' },
    { name: 'Van', group: 'Van', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 8, Handling 1, Speed 3, Armor 0.' },
    { name: 'Bus / Semi-trailer', group: 'Heavy vehicle', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 10, Handling 0, Speed 2, Armor 0.' },
    { name: 'Jet-ski', group: 'Watercraft', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 5, Speed 2, Armor 0.' },
    { name: 'Rigid Inflatable Boat', group: 'Watercraft', rating: 1, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 4, Speed 3, Armor 0.' },
    { name: 'Horizon-Doble Revolution Bike', group: 'Motorcycle', rating: 2, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 2, Speed 6, Armor 0.' },
    { name: 'Harley-Davidson Centaur', group: 'Motorcycle', rating: 4, source: 'p. 238',
      effect: 'Pilot 6, Body 5, Handling 2, Speed 5, Armor 3.' },
    { name: 'Mitsubishi Nightsky', group: 'Car', rating: 9, source: 'p. 238',
      effect: 'Pilot 6, Body 7, Handling 2, Speed 4, Armor 5. RR 1 on Influence Tests when present.' },
    { name: 'Artemis Industries Nightwing', group: 'Aircraft', rating: 4, source: 'p. 238',
      effect: 'Pilot 6, Body 3, Handling 7, Speed 4, Armor 0. Flying. RR 1 on Stealth (physical) Tests.' },
    { name: 'Reinforced Ford Americar', group: 'Car', rating: 2, source: 'p. 91 (Wild Jane)',
      effect: 'Sedan. Pilot 6, Body 6, Handling 2, Speed 4, Armor 1. Forward weapon mount.' },
    { name: 'Eurocar Northstar 2.0', group: 'Car', rating: 6, source: 'p. 97 (Charon)',
      effect: 'SUV. Pilot 6, Body 7, Handling 1, Speed 4, Armor 1. RR 1 on Piloting (cars). Smuggling compartment and concealed forward weapon mount.' }
  ],
  [ITEM_TYPE.ComplexForm]: [
    {
      "name": "Infusion of Firewall",
      "cost": 5000,
      "group": "Sustained · protects against Matrix damage and biofeedback",
      "source": "Anarchy 2.0 Conversion Guide, p. 9"
    },
    {
      "name": "Mirrored Persona",
      "cost": 5000,
      "group": "Sustained · creates a virtual decoy",
      "source": "Anarchy 2.0 Conversion Guide, p. 9"
    }
  ],
  [ITEM_TYPE.Weapon]: [
    {
      "name": "Survival knife",
      "cost": 2500,
      "group": "Short melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Brass knuckles",
      "cost": 2500,
      "group": "Short melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Cyber claws",
      "cost": 2500,
      "group": "Short melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Cyber blades",
      "cost": 2500,
      "group": "Short melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Sword",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Rapier",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Katana",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Combat axe",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Polearm",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Nightstick",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Extendable baton",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Baseball bat",
      "cost": 2500,
      "group": "Long melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Stun baton",
      "cost": 2500,
      "group": "Advanced melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Stun gloves",
      "cost": 2500,
      "group": "Advanced melee",
      "source": "pp. 142–148"
    },
    {
      "name": "Throwing knife",
      "cost": 2500,
      "group": "Throwing",
      "source": "pp. 142–148"
    },
    {
      "name": "Shuriken",
      "cost": 2500,
      "group": "Throwing",
      "source": "pp. 142–148"
    },
    {
      "name": "Chakram",
      "cost": 2500,
      "group": "Throwing",
      "source": "pp. 142–148"
    },
    {
      "name": "Tomahawk",
      "cost": 2500,
      "group": "Throwing",
      "source": "pp. 142–148"
    },
    {
      "name": "Bow",
      "cost": 2500,
      "group": "Bow / crossbow",
      "source": "pp. 142–148"
    },
    {
      "name": "Crossbow",
      "cost": 2500,
      "group": "Bow / crossbow",
      "source": "pp. 142–148"
    },
    {
      "name": "Defiance Super Shock",
      "cost": 2500,
      "group": "Taser",
      "source": "pp. 142–148"
    },
    {
      "name": "Yamaha Pulsar",
      "cost": 12500,
      "group": "Taser",
      "source": "pp. 142–148"
    },
    {
      "name": "Fichetti Tiffani Needler",
      "cost": 12500,
      "group": "Hold-out pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Streetline Special",
      "cost": 2500,
      "group": "Hold-out pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Walther Palm Pistol",
      "cost": 2500,
      "group": "Hold-out pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Light Fire",
      "cost": 2500,
      "group": "Light pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Beretta 101T",
      "cost": 2500,
      "group": "Light pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Colt America L36",
      "cost": 2500,
      "group": "Light pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Fichetti Security 600",
      "cost": 2500,
      "group": "Light pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ruger Redhawk",
      "cost": 2500,
      "group": "Light pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Crusader II",
      "cost": 2500,
      "group": "Machine pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ceska Black Scorpion",
      "cost": 2500,
      "group": "Machine pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Steyr TMP",
      "cost": 2500,
      "group": "Machine pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Super Squirt",
      "cost": 2500,
      "group": "Machine pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Viper Slivergun",
      "cost": 2500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Browning Ultra Power",
      "cost": 2500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Colt Manhunter",
      "cost": 2500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Predator IV",
      "cost": 12500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Predator V",
      "cost": 17500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Predator VI",
      "cost": 27500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Ruger Super Warhawk",
      "cost": 7500,
      "group": "Heavy pistol",
      "source": "pp. 142–148"
    },
    {
      "name": "Colt Cobra",
      "cost": 2500,
      "group": "SMG",
      "source": "pp. 142–148"
    },
    {
      "name": "HK-227",
      "cost": 2500,
      "group": "SMG",
      "source": "pp. 142–148"
    },
    {
      "name": "FN P93 Praetor",
      "cost": 2500,
      "group": "SMG",
      "source": "pp. 142–148"
    },
    {
      "name": "Uzi V",
      "cost": 2500,
      "group": "SMG",
      "source": "pp. 142–148"
    },
    {
      "name": "Ingram Smartgun",
      "cost": 2500,
      "group": "SMG",
      "source": "pp. 142–148"
    },
    {
      "name": "AK-97",
      "cost": 2500,
      "group": "Assault rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Colt M23",
      "cost": 2500,
      "group": "Assault rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "FN HAR",
      "cost": 2500,
      "group": "Assault rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Parashield DART rifle",
      "cost": 2500,
      "group": "Assault rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Defiance T-250",
      "cost": 2500,
      "group": "Shotgun",
      "source": "pp. 142–148"
    },
    {
      "name": "Mossberg CMDT",
      "cost": 2500,
      "group": "Shotgun",
      "source": "pp. 142–148"
    },
    {
      "name": "Remington Roomsweeper",
      "cost": 2500,
      "group": "Shotgun",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Desert Strike",
      "cost": 5000,
      "group": "Sniper rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Remington 900",
      "cost": 5000,
      "group": "Sniper rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Barrett Model 122",
      "cost": 5000,
      "group": "Sniper rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Ranger Arms SM-6",
      "cost": 5000,
      "group": "Sniper rifle",
      "source": "pp. 142–148"
    },
    {
      "name": "Ingram Valiant",
      "cost": 5000,
      "group": "Machine gun",
      "source": "pp. 142–148"
    },
    {
      "name": "Stoner-Ares M202",
      "cost": 5000,
      "group": "Machine gun",
      "source": "pp. 142–148"
    },
    {
      "name": "Fragmentation grenade",
      "cost": 2500,
      "group": "Grenade",
      "source": "pp. 142–148"
    },
    {
      "name": "Flashbang grenade",
      "cost": 2500,
      "group": "Grenade",
      "source": "pp. 142–148"
    },
    {
      "name": "Gas grenade",
      "cost": 2500,
      "group": "Grenade",
      "source": "pp. 142–148"
    },
    {
      "name": "Smoke grenade",
      "cost": 2500,
      "group": "Grenade",
      "source": "pp. 142–148"
    },
    {
      "name": "Ares Antioch II",
      "cost": 5000,
      "group": "Grenade launcher",
      "source": "pp. 142–148"
    },
    {
      "name": "ArmTech MGL-6",
      "cost": 5000,
      "group": "Grenade launcher",
      "source": "pp. 142–148"
    },
    {
      "name": "ArmTech MGL-12",
      "cost": 5000,
      "group": "Grenade launcher",
      "source": "pp. 142–148"
    },
    {
      "name": "Aztechnology Striker",
      "cost": 5000,
      "group": "Rocket launcher",
      "source": "pp. 142–148"
    },
    {
      "name": "Onotari Interceptor",
      "cost": 5000,
      "group": "Rocket launcher",
      "source": "pp. 142–148"
    }
  ],
  [ITEM_TYPE.Spell]: [
    {
      "name": "Manabolt",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Stunbolt",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Blast",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Flamestrike",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Lightning Bolt",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Fireball",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Powerbolt",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Stunball",
      "cost": 5000,
      "group": "Combat",
      "source": "pp. 180–184"
    },
    {
      "name": "Analyze Magic",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Analyze Truth",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Mind Probe",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Borrow Senses",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Combat Sense",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Detect Enemies",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Detect Life",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Detect Magic",
      "cost": 5000,
      "group": "Detection",
      "source": "pp. 180–184"
    },
    {
      "name": "Heal",
      "cost": 5000,
      "group": "Health",
      "source": "pp. 180–184"
    },
    {
      "name": "Increase Reflexes",
      "cost": 5000,
      "group": "Health",
      "source": "pp. 180–184"
    },
    {
      "name": "Chimera",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Confusion",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Invisibility",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Mask",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Silence",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Phantasm",
      "cost": 5000,
      "group": "Illusion",
      "source": "pp. 180–184"
    },
    {
      "name": "Control Thoughts",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Armor",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Astral Armor",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Mystic Armor",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Elemental Aura",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Levitate",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Physical Barrier",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Mana Barrier",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Dual Barrier",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Shaping",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    },
    {
      "name": "Magic Fingers",
      "cost": 5000,
      "group": "Manipulation",
      "source": "pp. 180–184"
    }
  ],
  [ITEM_TYPE.Armor]: [
    {
      "name": "Armored clothing (1)",
      "cost": 2500,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "Lined coat (2)",
      "cost": 5000,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "Armor jacket (3)",
      "cost": 7500,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "Chameleon suit (3)",
      "cost": 7500,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "Full body armor (4)",
      "cost": 10000,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "Military armor (5)",
      "cost": 12500,
      "group": "Armor",
      "source": "pp. 148–149"
    },
    {
      "name": "SecureTech Invisi-shield (1)",
      "cost": 2500,
      "group": "Armor",
      "source": "pp. 148–149"
    }
  ],
  [ITEM_TYPE.Equipment]: Object.entries(equipmentByCategory).flatMap(([groupStr, namesArr]) =>
    namesArr.map(nameStr => ({ name: nameStr, group: groupStr, cost: 2500, source: 'Reference/example — verify exact price' }))
  )
};
