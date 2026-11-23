import { AMP_PROFILES, ATTRIBUTES, CONCEPTS, EMERGED_AMP, LEVELS, LIMITS } from './data.js';
import { CATALOG } from './catalog.js';
import { calc, equipArmorAmp, maxed, pick, priceSkill } from './model.js';
import { linkedAttributes, SKILLS, specializationCode, TASKING } from './specializations.js';

const conceptOnlyGroups = new Set(['Awakened', 'Cyberdeck', 'Rigger Command Console']);
const restrictedSkills = new Set(['Sorcery', 'Conjuring', TASKING]);
const purchaseThreshold = 20000;
const maxSkills = 8;
const maxAmps = 11;
const normalizeName = name => name.trim().toLowerCase();

function weaponSkill(group = '') {
  return group.toLowerCase().includes('melee') ? 'Close Combat' : 'Ranged Weapons';
}

export function startingKitKind(name, profile) {
  if (profile?.group === 'Cyberdeck' || profile?.replaces?.includes('Cyberdeck') || /\bcyberdeck\b/i.test(name) ||
      /\b(?:includes|with|built-in|integrated) (?:a )?cyberdeck\b/i.test(profile?.effect ?? '')) {
    return 'Cyberdeck';
  }
  if (profile?.group === 'Rigger Command Console' || /\b(?:vehicle control rig|rigger command console)\b/i.test(name)) {
    return 'Rigger';
  }
}

export function makeAmp(name) {
  const { rating, source, effect, essenceLoss, armor } = AMP_PROFILES[name];
  return { name, rating, source, notes: effect, ...(essenceLoss ? { essenceLoss } : {}), ...(armor !== undefined ? { armor } : {}) };
}

function attributeCost(s, name, target) {
  const maximum = LIMITS[s.metatype][ATTRIBUTES.indexOf(name)];
  if (maximum === undefined) return 0;
  const next = Number(s.attributes[name]) + 1;
  if (next > maximum || (next === maximum && maxed(s) >= target.max)) return 0;
  return next === maximum ? 20000 : 10000;
}

export function upgradeGeneratedAttribute(s, target = LEVELS[s.level], linkedOnly = true) {
  const remaining = calc(s).remaining;
  if (remaining < purchaseThreshold) return false;
  const candidates = ATTRIBUTES.filter(name => {
    const cost = attributeCost(s, name, target);
    return cost && cost <= remaining && (!linkedOnly || s.skills.some(skill => linkedAttributes(skill).includes(name)));
  });
  if (!candidates.length) return false;
  const chosen = pick(candidates);
  s.attributes[chosen]++;
  return true;
}

function addTraining(s, concept, target, [name, ...specializations]) {
  let skill = s.skills.find(row => row.name === name);
  if (!skill) {
    if (s.skills.length >= maxSkills) return false;
    const attributes = linkedAttributes({ name });
    const code = specializations.map(spec => specializationCode(name, spec)).find(Boolean);
    const matching = code ? attributes.filter(attribute => code.split('/').includes(attribute[0])) : attributes;
    const attribute = concept.skillAttributes?.[name] ??
      (matching.includes(concept.attribute) ? concept.attribute : matching[0]);
    skill = { name, rating: 0, attribute, specialization: '', specializations: [] };
    s.skills.push(skill);
  }
  const newRating = skill.rating
    ? Math.min(skill.rating + 1, target.skill)
    : 3 + Math.floor(Math.random() * (target.skill - 2));
  if (newRating > skill.rating && attributeCost(s, skill.attribute, target)) s.attributes[skill.attribute]++;
  skill.rating = newRating;
  const owned = new Set(skill.specializations.map(normalizeName));
  skill.specializations.push(...specializations.filter(spec => !owned.has(normalizeName(spec))));
  return true;
}

function tryTraining(s, action) {
  const trial = {
    ...s,
    attributes: { ...s.attributes },
    skills: s.skills.map(skill => ({ ...skill, specializations: [...skill.specializations] })),
    amps: [...s.amps]
  };
  if (!action(trial) || calc(trial).remaining < 0) return false;
  Object.assign(s, {
    attributes: trial.attributes, skills: trial.skills, amps: trial.amps, items: trial.items, essence: trial.essence
  });
  return true;
}

function getAmpTraining(profile, canTrain) {
  const training = profile.training ?? [];
  if (!training.every(([skill]) => canTrain(skill))) return null;
  if (!profile.trainingChoices) return { training };

  const count = profile.chooseTraining ?? 1;
  const options = profile.trainingChoices.filter(([skill]) => canTrain(skill));
  if (options.length < count) return null;
  const selected = [];
  while (selected.length < count) {
    const [skill, ...specializations] = options.splice(Math.floor(Math.random() * options.length), 1)[0];
    const specialization = pick(specializations);
    selected.push(specialization ? [skill, specialization] : [skill]);
  }
  return { training: [...training, ...selected], selected };
}

export function trainGeneratedRunner(s, concept, ampNames) {
  const target = LEVELS[s.level];
  const requiredProfiles = ampNames.map(name => AMP_PROFILES[name]);
  const magical = ampNames.some(name => name !== EMERGED_AMP && AMP_PROFILES[name].group === 'Awakened');
  const emerged = ampNames.includes(EMERGED_AMP);
  const hasAdeptPowers = requiredProfiles.some(profile => profile.adeptPowers);
  const unlocked = new Set(requiredProfiles.flatMap(profile => profile.unlocks ?? []));
  const canTrain = skill => {
    if (skill === 'Cracking') {
      return emerged || [...s.amps, ...s.items].some(({ name }) => startingKitKind(name, AMP_PROFILES[name]) === 'Cyberdeck');
    }
    return !restrictedSkills.has(skill) || unlocked.has(skill);
  };
  const startingAttribute = s.level === 'Prime Runner' ? 2 : 1;
  s.attributes = Object.fromEntries(ATTRIBUTES.map(name => [name, startingAttribute]));
  if (CONCEPTS.Muscle.includes(concept)) s.attributes.Strength = 3;
  if (CONCEPTS.Awakened.includes(concept)) s.attributes.Willpower++;
  s.essence = '6';

  for (const skill of concept.skills) {
    addTraining(s, concept, target, [skill, ...(concept.specializations?.[skill] ?? [])]);
  }

  for (const item of s.items) {
    if (item.type === 'weapon') addTraining(s, concept, target, [weaponSkill(item.description)]);
  }

  const claimed = new Set();
  const conceptEquipment = new Set((concept.equipment ?? []).map(normalizeName));
  function buyAmp(runner, name, { training, selected }) {
    const profile = AMP_PROFILES[name];
    const requiredSkill = profile.group === 'Vehicle' ? 'Piloting' : profile.weaponSkill;
    const ampSkills = new Map(training.map(([skill, ...specs]) => [skill, specs]));
    for (const skill of [...(profile.unlocks ?? []), requiredSkill]) {
      if (skill && !ampSkills.has(skill)) ampSkills.set(skill, []);
    }
    for (const row of ampSkills) {
      const [skill, specs] = row;
      if (!addTraining(runner, concept, target, [skill, ...specs])) return false;
    }
    if (profile.group === 'Weapon Amp') {
      const weapons = runner.items.filter(item => item.type === 'weapon' && !conceptEquipment.has(normalizeName(item.name)));
      const matchingNames = new Set([name, ...(profile.replaces ?? [])].map(normalizeName));
      const replaced = weapons.find(item => matchingNames.has(normalizeName(item.name))) ?? weapons[0];
      if (replaced) runner.items = runner.items.filter(item => item !== replaced);
    }
    const amp = makeAmp(name);
    if (selected) {
      const benefits = selected.map(([skill, spec]) => spec ? `${skill} (${spec})` : skill);
      amp.notes += ` Selected: ${benefits.join(', ')}.`;
    }
    equipArmorAmp(runner, amp);
    runner.amps.push(amp);
    runner.essence = String(Number(runner.essence) - (amp.essenceLoss ?? 0));
    return true;
  }

  function reserveTraining({ training }) {
    for (const [skill] of training) claimed.add(skill);
  }

  for (const name of ampNames) {
    const profile = AMP_PROFILES[name];
    const training = getAmpTraining(profile, skill => canTrain(skill) ||
      (skill === 'Cracking' && startingKitKind(name, profile) === 'Cyberdeck'));
    buyAmp(s, name, training);
    reserveTraining(training);
  }

  if (concept.startingKit) {
    const ampKits = Object.entries(AMP_PROFILES)
      .filter(([name, profile]) => startingKitKind(name, profile) === concept.startingKit)
      .map(([name]) => ({ name }));
    const itemKits = CATALOG.equipment.filter(item => startingKitKind(item.name) === concept.startingKit);
    const candidates = [...ampKits, ...itemKits];
    while (candidates.length) {
      const kit = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
      if (kit.cost !== undefined) {
        if (tryTraining(s, trial => {
          const equipment = trial.items.filter(item => item.type === 'equipment');
          const replaced = equipment.length >= 4
            ? equipment.findLast(item => !concept.equipment?.includes(item.name))
            : undefined;
          if (equipment.length >= 4 && !replaced) return false;
          trial.items = [...trial.items.filter(item => item !== replaced), {
            name: kit.name, type: 'equipment', cost: kit.cost, description: kit.group || ''
          }];
          return true;
        })) break;
      } else {
        const profile = AMP_PROFILES[kit.name];
        const training = getAmpTraining(profile, skill => canTrain(skill) ||
          (skill === 'Cracking' && concept.startingKit === 'Cyberdeck'));
        if (!training || !tryTraining(s, trial => {
          const replaced = new Set((profile.replaces ?? []).map(normalizeName));
          trial.items = trial.items.filter(item => item.type !== 'equipment' || !replaced.has(normalizeName(item.name)));
          return buyAmp(trial, kit.name, training);
        })) continue;
        reserveTraining(training);
        break;
      }
    }
  }

  const gear = new Set(s.items.map(item => normalizeName(item.name)));
  const hasRiggerKit = [...s.amps, ...s.items].some(({ name }) => startingKitKind(name, AMP_PROFILES[name]) === 'Rigger');
  const ampOptions = Object.keys(AMP_PROFILES).filter(name => {
    const { group, replaces = [] } = AMP_PROFILES[name];
    if (ampNames.includes(name) || conceptOnlyGroups.has(group) || startingKitKind(name, AMP_PROFILES[name])) return false;
    if (group === 'Drone' && !hasRiggerKit) return false;
    if ((group === 'Focus' || name.includes('Mentor Spirit') || name === 'Mystic Tattoo Focus') && !magical) return false;
    if (group === 'Adept Power' && !hasAdeptPowers) return false;
    return group === 'Weapon Amp' || group === 'Armor Amp' || ![name, ...replaces].some(item => gear.has(normalizeName(item)));
  });

  function buyOptionalAmp() {
    if (!ampOptions.length || s.amps.length >= maxAmps) return false;
    const name = ampOptions.splice(Math.floor(Math.random() * ampOptions.length), 1)[0];
    const profile = AMP_PROFILES[name];
    const loss = profile.essenceLoss ?? 0;
    const essence = Number(s.essence);
    if (loss && (essence - loss <= 0 || ((magical || emerged) && (loss > 0.5 || essence <= 5.5)))) return false;
    const plan = getAmpTraining(profile, skill => canTrain(skill) &&
      (s.skills.length < maxSkills || s.skills.some(row => row.name === skill)));
    if (!plan) return false;
    const duplicates = plan.training.map(([skill]) => skill).filter(skill => claimed.has(skill));
    if (duplicates.length) return buySkill(duplicates, true);
    if (!tryTraining(s, trial => buyAmp(trial, name, plan))) return false;
    reserveTraining(plan);
    return true;
  }

  function buySkill(names, existingOnly = false) {
    const remaining = calc(s).remaining;
    const candidates = [...new Set(names)].filter(name => {
      if (!canTrain(name)) return false;
      const skill = s.skills.find(row => row.name === name);
      if (!skill) return !existingOnly && s.skills.length < maxSkills;
      if (skill.rating >= target.skill) return false;
      const cost = priceSkill(skill.rating + 1) - priceSkill(skill.rating) + attributeCost(s, skill.attribute, target);
      return cost <= remaining;
    });
    while (candidates.length) {
      const name = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
      if (tryTraining(s, trial => addTraining(trial, concept, target, [name]))) return true;
    }
    return false;
  }

  let iterations = 0;
  let skillChance = 50;
  let upgradedAttribute = false;
  const buyAnySkill = () => {
    if (!buySkill(emerged ? [...SKILLS, TASKING] : SKILLS)) return false;
    skillChance = Math.max(10, skillChance - 10);
    return true;
  };
  const buyAttribute = () => {
    if (!upgradeGeneratedAttribute(s, target, false)) return false;
    skillChance = Math.min(90, skillChance + 10);
    upgradedAttribute = true;
    return true;
  };
  while (calc(s).remaining >= purchaseThreshold) {
    iterations++;
    const boughtAmp = buyOptionalAmp();
    if (calc(s).remaining < purchaseThreshold) break;

    const boughtTraining = Math.random() * 100 < skillChance
      ? buyAnySkill() || buyAttribute()
      : buyAttribute() || buyAnySkill();
    if (!boughtAmp && !boughtTraining && (!ampOptions.length || s.amps.length >= maxAmps)) break;
  }
  return { iterations, upgradedAttribute };
}
