import { AMP_PROFILES, ATTRIBUTES, EMERGED_AMP, LEVELS, LIMITS, SKILLS } from './data.js';
import { CATALOG } from './catalog.js';
import { calc, equipArmorAmp, maxed, pick } from './model.js';

const skillAttributes = new Map(SKILLS);
const conceptOnlyGroups = new Set(['Awakened', 'Cyberdeck', 'Rigger Command Console']);
const restrictedSkills = new Set(['Sorcery', 'Conjuring', 'Tasking']);
const purchaseThreshold = 20000;
const maxSkills = 11;
const maxAmps = 11;
const normalizeName = name => name.trim().toLowerCase();

function weaponSkill(group = '') {
  if (group.includes('melee')) return 'Close Combat';
  if (['Machine gun', 'Grenade launcher', 'Rocket launcher'].includes(group)) return 'Heavy Weapons';
  return 'Firearms';
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
  const next = Number(s.attributes[name]) + 1;
  if (next > maximum || (next === maximum && maxed(s) >= target.max)) return 0;
  return next === maximum ? 20000 : 10000;
}

export function upgradeGeneratedAttribute(s, target = LEVELS[s.level], linkedOnly = true) {
  const remaining = calc(s).remaining;
  if (remaining < purchaseThreshold) return false;
  const candidates = ATTRIBUTES.filter(name => {
    const cost = attributeCost(s, name, target);
    return cost && cost <= remaining && (!linkedOnly || s.skills.some(skill => skill.attribute === name));
  });
  if (!candidates.length) return false;
  const lowest = Math.min(...candidates.map(name => Number(s.attributes[name])));
  const chosen = pick(candidates.filter(name => Number(s.attributes[name]) === lowest));
  s.attributes[chosen]++;
  return true;
}

function addTraining(s, concept, target, [name, ...specializations], rating = 3, raiseExisting = false) {
  let skill = s.skills.find(row => row.name === name);
  if (!skill) {
    if (s.skills.length >= maxSkills) return false;
    const attribute = concept.skillAttributes?.[name] ?? skillAttributes.get(name);
    skill = { name, rating: 0, attribute, specialization: '', specializations: [] };
    s.skills.push(skill);
  }
  const newRating = skill.rating ? Math.min(skill.rating + Number(raiseExisting), target.skill) : rating;
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
  const canTrain = skill => !restrictedSkills.has(skill) || unlocked.has(skill);
  const startingAttribute = s.level === 'Prime Runner' ? 2 : 1;
  s.attributes = Object.fromEntries(ATTRIBUTES.map(name => [name, startingAttribute]));
  s.essence = '6';

  for (const skill of concept.skills) {
    const rating = 3 + Math.floor(Math.random() * (target.skill - 2));
    addTraining(s, concept, target, [skill, ...(concept.specializations?.[skill] ?? [])], rating);
  }

  for (const item of s.items) {
    if (item.type === 'weapon') addTraining(s, concept, target, [weaponSkill(item.description)]);
  }

  const claimed = new Set();
  const conceptEquipment = new Set((concept.equipment ?? []).map(normalizeName));
  function buyAmp(runner, name, { training, selected }) {
    for (const row of training) if (!addTraining(runner, concept, target, row)) return false;
    const profile = AMP_PROFILES[name];
    if (profile.weaponSkill && !addTraining(runner, concept, target, [profile.weaponSkill])) return false;
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
    // Track Amp bonuses separately from skill access.
    for (const skill of profile.unlocks ?? []) addTraining(s, concept, target, [skill]);
    const training = getAmpTraining(profile, canTrain);
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
        const training = getAmpTraining(profile, canTrain);
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
    const plan = getAmpTraining(profile, canTrain);
    if (!plan) return false;
    const duplicates = plan.training.map(([skill]) => skill).filter(skill => claimed.has(skill));
    if (duplicates.length) return buySkill(duplicates, true);
    if (!tryTraining(s, trial => buyAmp(trial, name, plan))) return false;
    reserveTraining(plan);
    return true;
  }

  function buySkill(names, existingOnly = false) {
    const candidates = [...new Set(names)].filter(name => {
      const skill = s.skills.find(row => row.name === name);
      return canTrain(name) && (skill ? skill.rating < target.skill : !existingOnly && s.skills.length < maxSkills);
    });
    while (candidates.length) {
      const name = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
      if (tryTraining(s, trial => addTraining(trial, concept, target, [name], 3, true))) return true;
    }
    return false;
  }

  let iterations = 0;
  let skillChance = 50;
  let upgradedAttribute = false;
  const buyAnySkill = () => {
    if (!buySkill([...skillAttributes.keys()])) return false;
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
