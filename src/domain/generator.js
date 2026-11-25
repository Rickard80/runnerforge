import { AMP_PROFILES, EMERGED_AMP, makeAmp } from './data/amp-profiles.js';
import { CONCEPTS, conceptsForRole } from './data/concepts.js';
import { AMP_GROUP, ATTRIBUTES, ITEM_TYPE, KIT_KIND, LEVEL, LEVELS, LIMITS, METATYPE, RANDOM_CONCEPT, ROLE } from './data/rules.js';
import { CATALOG, catalogNames, catalogProfile, makeCatalogItem } from './data/catalog.js';
import { blank, calc, equipArmorAmp, maxed, pick, priceSkill } from './model.js';
import { SKILL, linkedAttributes, specializationCode, TASKING } from './specializations.js';

import { KNOWLEDGE_SKILLS } from './data/knowledge.js';
import { KEYWORDS, DISPOSITIONS, STREETWISE_CUES } from './data/personality.js';
import { compareNamedEntries, normalizeName as normalizeCatalogName } from './names.js';

const conceptOnlyGroups = new Set([AMP_GROUP.Awakened, AMP_GROUP.Cyberdeck, AMP_GROUP.RiggerCommandConsole]);
const restrictedSkills = new Set([SKILL.Sorcery, SKILL.Conjuring, TASKING]);
const purchaseThreshold = 10000;
const maxSkills = 7;
const maxAmps = 11;
const normalizeName = nameStr => nameStr.trim().toLowerCase();

export function generateCharacter(settingsObj) {
  const conceptObj = chooseConcept(settingsObj.role, settingsObj.concept);
  if (!conceptObj) return null;

  const characterObj = createGeneratedIdentity(settingsObj, conceptObj);
  if (characterObj.personality) generatePersonality(characterObj, conceptObj);
  const ampNamesArr = chooseStartingAmps(conceptObj);
  chooseStartingGear(characterObj, conceptObj, ampNamesArr);
  const knowledgeCount = 1 + Math.floor(Math.random() * 3) + Number(characterObj.level === LEVEL.PrimeRunner);
  characterObj.knowledge = pickUnique(KNOWLEDGE_SKILLS, knowledgeCount);
  const training = trainGeneratedRunner(characterObj, conceptObj, ampNamesArr);
  sortGeneratedEntries(characterObj);
  return { characterObj, conceptName: conceptObj.name, ...training };
}

export function trainGeneratedRunner(characterObj, conceptObj, ampNamesArr) {
  const trainingObj = createTrainingContext(characterObj, conceptObj, ampNamesArr);
  setStartingAttributes(characterObj, conceptObj);
  trainConceptSkills(trainingObj);
  buyRequiredAmps(trainingObj, ampNamesArr);
  buyStartingKit(trainingObj);
  const ampOptionsArr = optionalAmpNames(trainingObj, ampNamesArr);
  return spendTrainingBudget(trainingObj, ampOptionsArr);
}

function chooseConcept(roleStr, conceptNameStr) {
  const options = conceptsForRole(roleStr).filter(conceptObj => conceptNameStr === RANDOM_CONCEPT || conceptObj.name === conceptNameStr);
  if (!options.length) return null;
  return pick(options.flatMap(conceptObj => Array(conceptObj.weight).fill(conceptObj)));
}

function createGeneratedIdentity(settingsObj, conceptObj) {
  const { level, role, concept, personality } = settingsObj;
  const metatype = conceptObj.metatype ??
    pick([METATYPE.Dwarf, METATYPE.Elf, METATYPE.Human, METATYPE.Human, METATYPE.Ork, METATYPE.Troll]);
  return {
    ...blank(), level, role, concept, personality, metatype,
    edge: LIMITS[metatype][ATTRIBUTES.length],
    name: conceptObj.name + ' ' + Math.floor(Math.random() * 90 + 10)
  };
}

function generatePersonality(characterObj, conceptObj) {
  characterObj.keywords = [characterObj.metatype, conceptObj.name, pick(KEYWORDS), pick([
    'Smog-choked Aubur', 'Gilded Bellevue', 'Neon Downtown', 'Salt-crusted Everett', 'Scorched Barrens',
    'Lawless Redmond', 'Striving Renton', 'Agri-corp Snohomish', 'Rain-slicked Tacoma'
  ])];
  characterObj.dispositions = pickUnique(DISPOSITIONS, 2);
  characterObj.cues = pickDistinctCues(2);
}

function chooseStartingAmps(conceptObj) {
  const ampNames = [...conceptObj.amps];
  if (conceptObj.vehicleGroup) {
    const vehicles = Object.entries(AMP_PROFILES).filter(([, { group, vehicleGroup }]) =>
      group === AMP_GROUP.Vehicle && (conceptObj.vehicleGroup === ROLE.Any || vehicleGroup === conceptObj.vehicleGroup));
    ampNames.push(pick(vehicles)[0]);
  }
  if (conceptObj.randomDrone) {
    const drones = Object.keys(AMP_PROFILES).filter(nameStr => {
      const { group, stationary } = AMP_PROFILES[nameStr];
      return group === AMP_GROUP.Drone && !stationary && !ampNames.includes(nameStr);
    });
    ampNames.push(pick(drones));
  }
  return ampNames;
}

function chooseStartingGear(characterObj, conceptObj, ampNamesArr) {
  const isAwakened = CONCEPTS[ROLE.Awakened].includes(conceptObj);
  const isEmerged = conceptObj.amps.includes(EMERGED_AMP);
  const usedNamesSet = new Set(ampNamesArr.flatMap(nameStr => AMP_PROFILES[nameStr].replaces ?? []).map(normalizeCatalogName));
  if (isEmerged) ['Cyberdeck', 'Datajack', 'Trodes'].forEach(nameStr => usedNamesSet.add(normalizeCatalogName(nameStr)));

  const addCatalogItem = nameStr => {
    if (!Object.hasOwn(CATALOG, nameStr) || usedNamesSet.has(normalizeCatalogName(nameStr))) return;
    usedNamesSet.add(normalizeCatalogName(nameStr));
    characterObj.items.push(makeCatalogItem(nameStr));
  };

  addCatalogItem(pick(catalogNames(ITEM_TYPE.Armor)));
  const hasRangedFocus = conceptObj.skills.includes(SKILL.RangedWeapons);
  const weaponCount = !isAwakened && hasRangedFocus ? 2 : 1;
  const possibleWeapons = gearPool(ITEM_TYPE.Weapon, usedNamesSet);
  const preferredWeapons = possibleWeapons.filter(nameStr =>
    rangedWeapon({ type: ITEM_TYPE.Weapon, name: nameStr }) === hasRangedFocus);
  const weapons = pickUnique(preferredWeapons, weaponCount);
  if (!weapons.length) weapons.push(...pickUnique(possibleWeapons, 1));
  weapons.forEach(addCatalogItem);

  const spellCount = conceptObj.spellCount ?? (isAwakened ? 2 : 0);
  const spells = gearPool(ITEM_TYPE.Spell, usedNamesSet).filter(nameStr => !conceptObj.spellGroup || CATALOG[nameStr].group === conceptObj.spellGroup);
  pickUnique(spells, spellCount).forEach(addCatalogItem);
  if (isEmerged) {
    pickUnique(gearPool(ITEM_TYPE.ComplexForm, usedNamesSet), 2).forEach(addCatalogItem);
  }
  addStartingEquipment({ conceptObj, usedNamesSet, addCatalogItem });
}

function addStartingEquipment({ conceptObj, usedNamesSet, addCatalogItem }) {
  const equipment = conceptObj.equipment ?? [];
  for (const name of equipment) {
    if (CATALOG[name]?.type === ITEM_TYPE.Equipment) addCatalogItem(name);
  }
  const equipmentPool = gearPool(ITEM_TYPE.Equipment, usedNamesSet).filter(nameStr => !startingKitKind(nameStr));
  const equipmentCount = Math.max(0, Math.floor(Math.random() * 4) + 1 - equipment.length);
  pickUnique(equipmentPool, equipmentCount).forEach(addCatalogItem);
}

function weaponSkill(groupStr = '') {
  return groupStr.toLowerCase().includes('melee') ? SKILL.CloseCombat : SKILL.RangedWeapons;
}

export function startingKitKind(nameStr, profileObj) {
  if (profileObj?.group === AMP_GROUP.Cyberdeck || profileObj?.replaces?.includes('Cyberdeck') || /\bcyberdeck\b/i.test(nameStr) ||
      /\b(?:includes|with|built-in|integrated) (?:a )?cyberdeck\b/i.test(profileObj?.effect ?? '')) {
    return KIT_KIND.Cyberdeck;
  }
  if (profileObj?.group === AMP_GROUP.RiggerCommandConsole || /\b(?:vehicle control rig|rigger command console)\b/i.test(nameStr)) {
    return KIT_KIND.Rigger;
  }
}

function attributeCost(characterObj, nameStr, levelObj) {
  const maximum = LIMITS[characterObj.metatype][ATTRIBUTES.indexOf(nameStr)];
  if (maximum === undefined) return 0;
  const next = Number(characterObj.attributes[nameStr]) + 1;
  if (next > maximum || (next === maximum && maxed(characterObj) >= levelObj.max)) return 0;
  return next === maximum ? 20000 : 10000;
}

export function upgradeGeneratedAttribute(characterObj, levelObj = LEVELS[characterObj.level], isLinkedOnly = true) {
  const remaining = calc(characterObj).remaining;
  if (remaining < purchaseThreshold) return false;
  const candidates = ATTRIBUTES.filter(nameStr => {
    const cost = attributeCost(characterObj, nameStr, levelObj);
    return cost && cost <= remaining && (!isLinkedOnly || characterObj.skills.some(skillObj => linkedAttributes(skillObj).includes(nameStr)));
  });
  if (!candidates.length) return false;
  const chosen = pick(candidates);
  characterObj.attributes[chosen]++;
  return true;
}

function addTraining(characterObj, { conceptObj, levelObj, trainingArr }) {
  const [name, ...specializations] = trainingArr;
  let skill = characterObj.skills.find(rowObj => rowObj.name === name);
  if (!skill) {
    if (characterObj.skills.length >= maxSkills) return false;
    const attributes = linkedAttributes({ name });
    const code = specializations.map(specializationStr => specializationCode(name, specializationStr)).find(Boolean);
    const matching = code ? attributes.filter(attributeStr => code.split('/').includes(attributeStr[0])) : attributes;
    const attribute = conceptObj.skillAttributes?.[name] ??
      (matching.includes(conceptObj.attribute) ? conceptObj.attribute : matching[0]);
    skill = { name, rating: 0, attribute, specialization: '', specializations: [] };
    characterObj.skills.push(skill);
  }
  const newRating = skill.rating
    ? Math.min(skill.rating + 1, levelObj.skill)
    : 3 + Math.floor(Math.random() * (levelObj.skill - 2));
  if (newRating > skill.rating && attributeCost(characterObj, skill.attribute, levelObj)) characterObj.attributes[skill.attribute]++;
  skill.rating = newRating;
  const owned = new Set(skill.specializations.map(normalizeName));
  skill.specializations.push(...specializations.filter(specializationStr => !owned.has(normalizeName(specializationStr))));
  return true;
}

function tryTraining(characterObj, applyTraining) {
  const trial = {
    ...characterObj,
    attributes: { ...characterObj.attributes },
    skills: characterObj.skills.map(skillObj => ({ ...skillObj, specializations: [...skillObj.specializations] })),
    amps: [...characterObj.amps]
  };
  if (!applyTraining(trial) || calc(trial).remaining < 0) return false;
  Object.assign(characterObj, {
    attributes: trial.attributes, skills: trial.skills, amps: trial.amps, items: trial.items, essence: trial.essence
  });
  return true;
}

function getAmpTraining(profileObj, canTrain) {
  const training = profileObj.training ?? [];
  if (!training.every(([skillNameStr]) => canTrain(skillNameStr))) return null;
  if (!profileObj.trainingChoices) return { training };

  const count = profileObj.chooseTraining ?? 1;
  const options = profileObj.trainingChoices.filter(([skillNameStr]) => canTrain(skillNameStr));
  if (options.length < count) return null;
  const selected = [];
  while (selected.length < count) {
    const [skill, ...specializations] = options.splice(Math.floor(Math.random() * options.length), 1)[0];
    const specialization = pick(specializations);
    selected.push(specialization ? [skill, specialization] : [skill]);
  }
  return { training: [...training, ...selected], selected };
}

function createTrainingContext(characterObj, conceptObj, ampNamesArr) {
  const target = LEVELS[characterObj.level];
  const requiredProfiles = ampNamesArr.map(nameStr => AMP_PROFILES[nameStr]);
  const magical = ampNamesArr.some(nameStr => nameStr !== EMERGED_AMP && AMP_PROFILES[nameStr].group === AMP_GROUP.Awakened);
  const emerged = ampNamesArr.includes(EMERGED_AMP);
  const hasAdeptPowers = requiredProfiles.some(profileObj => profileObj.adeptPowers);
  const unlocked = new Set(requiredProfiles.flatMap(profileObj => profileObj.unlocks ?? []));
  const canTrain = skillNameStr => {
    if (skillNameStr === SKILL.Cracking) {
      return emerged || [...characterObj.amps, ...characterObj.items].some(({ name: nameStr }) => startingKitKind(nameStr, AMP_PROFILES[nameStr]) === KIT_KIND.Cyberdeck);
    }
    return !restrictedSkills.has(skillNameStr) || unlocked.has(skillNameStr);
  };
  return {
    characterObj, conceptObj, target, isMagical: magical, isEmerged: emerged, hasAdeptPowers, canTrain,
    claimedSkillsSet: new Set(),
    conceptEquipmentSet: new Set((conceptObj.equipment ?? []).map(normalizeName))
  };
}

function setStartingAttributes(characterObj, conceptObj) {
  const startingAttribute = characterObj.level === LEVEL.PrimeRunner ? 2 : 1;
  characterObj.attributes = Object.fromEntries(ATTRIBUTES.map(nameStr => [nameStr, startingAttribute]));
  if (characterObj.metatype === METATYPE.Dwarf) {
    characterObj.attributes.Strength++;
    characterObj.attributes.Willpower++;
  }
  if (CONCEPTS[ROLE.Muscle].includes(conceptObj)) characterObj.attributes.Strength = 3;
  if ([METATYPE.Ork, METATYPE.Troll].includes(characterObj.metatype)) characterObj.attributes.Strength++;
  if (CONCEPTS[ROLE.Awakened].includes(conceptObj)) characterObj.attributes.Willpower++;
  characterObj.essence = '6';
}

function trainConceptSkills({ characterObj, conceptObj, target }) {
  for (const skill of conceptObj.skills) {
    addTraining(characterObj, { conceptObj, levelObj: target, trainingArr: [skill, ...(conceptObj.specializations?.[skill] ?? [])] });
  }

  for (const item of characterObj.items) {
    if (item.type === ITEM_TYPE.Weapon) addTraining(characterObj, { conceptObj, levelObj: target, trainingArr: [weaponSkill(item.description)] });
  }
}

function buyRequiredAmps(trainingObj, ampNamesArr) {
  const { characterObj, conceptObj, canTrain, claimedSkillsSet } = trainingObj;
  for (const name of ampNamesArr) {
    const profile = AMP_PROFILES[name];
    const selected = conceptObj.ampTrainingSelections?.[name];
    const training = selected
      ? { training: [...(profile.training ?? []), ...selected], selected }
      : getAmpTraining(profile, skillNameStr => canTrain(skillNameStr) ||
        (skillNameStr === SKILL.Cracking && startingKitKind(name, profile) === KIT_KIND.Cyberdeck));
    buyAmp({ runnerObj: characterObj, nameStr: name, planObj: training, trainingObj });
    reserveTraining(claimedSkillsSet, training);
  }
}

function buyStartingKit(trainingObj) {
  const { characterObj, conceptObj, canTrain, claimedSkillsSet } = trainingObj;
  const kitKind = conceptObj.startingKit;
  if (!kitKind) return;

  const ampKits = Object.entries(AMP_PROFILES)
    .filter(([nameStr, profileObj]) => startingKitKind(nameStr, profileObj) === kitKind)
    .map(([nameStr]) => ({ name: nameStr }));
  const itemKits = catalogNames(ITEM_TYPE.Equipment).filter(nameStr => startingKitKind(nameStr) === kitKind).map(makeCatalogItem);
  const candidates = [...ampKits, ...itemKits];
  while (candidates.length) {
    const kit = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    if (kit.cost !== undefined) {
      if (tryTraining(characterObj, trialObj => addEquipmentKit(trialObj, kit, conceptObj))) return;
      continue;
    }

    const profile = AMP_PROFILES[kit.name];
    const plan = getAmpTraining(profile, skillNameStr => canTrain(skillNameStr) ||
      (skillNameStr === SKILL.Cracking && kitKind === KIT_KIND.Cyberdeck));
    if (!plan || !tryTraining(characterObj, trialObj => {
      const replacedNamesSet = new Set((profile.replaces ?? []).map(normalizeName));
      trialObj.items = trialObj.items.filter(itemObj =>
        itemObj.type !== ITEM_TYPE.Equipment || !replacedNamesSet.has(normalizeName(itemObj.name)));
      return buyAmp({ runnerObj: trialObj, nameStr: kit.name, planObj: plan, trainingObj });
    })) continue;
    reserveTraining(claimedSkillsSet, plan);
    return;
  }
}

function addEquipmentKit(characterObj, kitObj, conceptObj) {
  const equipment = characterObj.items.filter(itemObj => itemObj.type === ITEM_TYPE.Equipment);
  const replaced = equipment.length >= 4
    ? equipment.findLast(itemObj => !conceptObj.equipment?.includes(itemObj.name))
    : undefined;
  if (equipment.length >= 4 && !replaced) return false;
  characterObj.items = [...characterObj.items.filter(itemObj => itemObj !== replaced), kitObj];
  return true;
}

function optionalAmpNames({ characterObj, isMagical, hasAdeptPowers }, ampNamesArr) {
  const gear = new Set(characterObj.items.map(itemObj => normalizeName(itemObj.name)));
  const hasRiggerKit = [...characterObj.amps, ...characterObj.items].some(({ name: nameStr }) => startingKitKind(nameStr, AMP_PROFILES[nameStr]) === KIT_KIND.Rigger);
  return Object.keys(AMP_PROFILES).filter(nameStr => {
    const { group, replaces = [] } = AMP_PROFILES[nameStr];
    if (ampNamesArr.includes(nameStr) || conceptOnlyGroups.has(group) || startingKitKind(nameStr, AMP_PROFILES[nameStr])) return false;
    if (group === AMP_GROUP.Drone && !hasRiggerKit) return false;
    if ((group === AMP_GROUP.Focus || nameStr.includes('Mentor Spirit') || nameStr === 'Mystic Tattoo Focus') && !isMagical) return false;
    if (group === AMP_GROUP.AdeptPower && !hasAdeptPowers) return false;
    return group === AMP_GROUP.WeaponAmp || group === AMP_GROUP.ArmorAmp || ![nameStr, ...replaces].some(itemObj => gear.has(normalizeName(itemObj)));
  });
}

function spendTrainingBudget(trainingObj, ampOptionsArr) {
  const { characterObj, target } = trainingObj;
  let iterations = 0;
  let upgradedAttribute = false;
  while (calc(characterObj).remaining >= purchaseThreshold) {
    iterations++;
    const boughtAmp = buyOptionalAmp(trainingObj, ampOptionsArr);
    if (calc(characterObj).remaining < purchaseThreshold) break;
    const raisedAttribute = upgradeGeneratedAttribute(characterObj, target);
    upgradedAttribute ||= raisedAttribute;
    if (!boughtAmp && !raisedAttribute && (!ampOptionsArr.length || characterObj.amps.length >= maxAmps)) break;
  }
  return { iterations, upgradedAttribute };
}

function buyOptionalAmp(trainingObj, ampOptionsArr) {
  const { characterObj, isMagical, isEmerged, canTrain, claimedSkillsSet } = trainingObj;
  if (!ampOptionsArr.length || characterObj.amps.length >= maxAmps) return false;
  const name = ampOptionsArr.splice(Math.floor(Math.random() * ampOptionsArr.length), 1)[0];
  const profile = AMP_PROFILES[name];
  const loss = profile.essenceLoss ?? 0;
  const essence = Number(characterObj.essence);
  if (loss && (essence - loss <= 0 || ((isMagical || isEmerged) && (loss > 0.5 || essence <= 5.5)))) return false;
  const plan = getAmpTraining(profile, skillNameStr => canTrain(skillNameStr) &&
    (characterObj.skills.length < maxSkills || characterObj.skills.some(rowObj => rowObj.name === skillNameStr)));
  if (!plan) return false;
  const duplicates = plan.training.map(([skillNameStr]) => skillNameStr).filter(skillNameStr => claimedSkillsSet.has(skillNameStr));
  if (duplicates.length) return buySkill(trainingObj, duplicates);
  if (!tryTraining(characterObj, trialObj => buyAmp({ runnerObj: trialObj, nameStr: name, planObj: plan, trainingObj }))) return false;
  reserveTraining(claimedSkillsSet, plan);
  return true;
}

function buySkill({ characterObj, conceptObj, target, canTrain }, namesArr) {
  const remaining = calc(characterObj).remaining;
  const candidates = [...new Set(namesArr)].filter(nameStr => {
    if (!canTrain(nameStr)) return false;
    const skill = characterObj.skills.find(rowObj => rowObj.name === nameStr);
    if (!skill) return false;
    if (skill.rating >= target.skill) return false;
    const cost = priceSkill(skill.rating + 1) - priceSkill(skill.rating) + attributeCost(characterObj, skill.attribute, target);
    return cost <= remaining;
  });
  while (candidates.length) {
    const name = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    if (tryTraining(characterObj, trialObj => addTraining(trialObj, { conceptObj, levelObj: target, trainingArr: [name] }))) return true;
  }
  return false;
}

function buyAmp({ runnerObj, nameStr, planObj, trainingObj }) {
  const { training, selected } = planObj;
  const { conceptObj, target, conceptEquipmentSet } = trainingObj;
  const profile = AMP_PROFILES[nameStr];
  const requiredSkill = profile.group === AMP_GROUP.Vehicle ? SKILL.Piloting : profile.weaponSkill;
  const ampSkills = new Map(training.map(([skillNameStr, ...specializationsArr]) => [skillNameStr, specializationsArr]));
  for (const skill of [...(profile.unlocks ?? []), requiredSkill]) {
    if (skill && !ampSkills.has(skill)) ampSkills.set(skill, []);
  }
  for (const row of ampSkills) {
    const [skill, specs] = row;
    if (!addTraining(runnerObj, { conceptObj, levelObj: target, trainingArr: [skill, ...specs] })) return false;
  }
  if (profile.group === AMP_GROUP.WeaponAmp) {
    const weapons = runnerObj.items.filter(itemObj => itemObj.type === ITEM_TYPE.Weapon && !conceptEquipmentSet.has(normalizeName(itemObj.name)));
    const matchingNames = new Set([nameStr, ...(profile.replaces ?? [])].map(normalizeName));
    const replaced = weapons.find(itemObj => matchingNames.has(normalizeName(itemObj.name))) ?? weapons[0];
    if (replaced) runnerObj.items = runnerObj.items.filter(itemObj => itemObj !== replaced);
  }
  const amp = makeAmp(nameStr);
  if (selected) {
    const benefits = selected.map(([skillNameStr, specializationStr]) => specializationStr ? `${skillNameStr} (${specializationStr})` : skillNameStr);
    amp.notes += ` Selected: ${benefits.join(', ')}.`;
  }
  equipArmorAmp(runnerObj, amp);
  runnerObj.amps.push(amp);
  runnerObj.essence = String(Number(runnerObj.essence) - (amp.essenceLoss ?? 0));
  return true;
}

function reserveTraining(claimedSkillsSet, { training: trainingArr }) {
  for (const [skill] of trainingArr) claimedSkillsSet.add(skill);
}

function sortGeneratedEntries(characterObj) {
  characterObj.skills.sort((firstSkillObj, secondSkillObj) =>
    (+secondSkillObj.rating || 0) - (+firstSkillObj.rating || 0) || compareNamedEntries(firstSkillObj, secondSkillObj));
  characterObj.amps.sort(compareNamedEntries);
  characterObj.items.sort((firstItemObj, secondItemObj) =>
    itemSortRank(firstItemObj) - itemSortRank(secondItemObj) || compareNamedEntries(firstItemObj, secondItemObj));
}

function itemSortRank(itemObj) {
  if (rangedWeapon(itemObj)) return 0;
  if (itemObj.type === ITEM_TYPE.Weapon) return 1;
  if (itemObj.type === ITEM_TYPE.Armor) return 2;
  return [ITEM_TYPE.Spell, ITEM_TYPE.ComplexForm].includes(itemObj.type) ? 3 : 4;
}
const rangedWeapon = itemObj => {
  if (itemObj.type !== ITEM_TYPE.Weapon) return false;
  const record = catalogProfile(ITEM_TYPE.Weapon, itemObj.name);
  const group = String(record?.group ?? '').toLowerCase();
  if (group.includes('melee')) return false;
  if (/(ranged|pistol|rifle|shotgun|smg|machine gun|launcher|bow|crossbow|throw)/.test(group)) return true;
  return /(pistol|rifle|shotgun|smg|machine gun|launcher|bow|crossbow|taser|revolver)/i.test(itemObj.name);
};
const gearPool = (typeStr, usedNamesSet) => catalogNames(typeStr).filter(nameStr =>
  !usedNamesSet.has(normalizeCatalogName(nameStr)));
const pickUnique = (poolArr, count) => {
  const copy = [...poolArr],
    out = [];
  while (copy.length && out.length < count) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};
// Avoid repeated openings or endings in generated cues.
const cueParts = textStr => {
  const value = String(textStr).trim();
  const cue = value.split(/\s+—\s*/);
  if (cue.length > 1) return [cue[0].trim(), cue.slice(1).join(' — ').trim()];
  return [value, ''];
};
const pickDistinctCues = count => {
  const available = [...new Set(STREETWISE_CUES)];
  const selected = [],
    first = new Set(),
    second = new Set();
  while (selected.length < count) {
    const choices = available.filter(cueStr => {
      const [a, b] = cueParts(cueStr);
      return !first.has(normalizeCatalogName(a)) && (!b || !second.has(normalizeCatalogName(b)))
    });
    if (!choices.length) break;
    const value = pick(choices),
      [a, b] = cueParts(value);
    selected.push(value);
    first.add(normalizeCatalogName(a));
    if (b) second.add(normalizeCatalogName(b));
    available.splice(available.indexOf(value), 1);
  }
  return selected;
};
