import { AMP_PROFILES } from './data/amp-profiles.js';
import { ATTRIBUTES } from './data/rules.js';
import { normalizeName } from './names.js';
import { SKILL, getSpecializations, SKILLS, specializationOptions, TASKING } from './specializations.js';

export const RR_SCOPE = Object.freeze({ Attribute: 'attribute', Skill: 'skill', Specialization: 'specialization' });

// Training also includes non-RR benefits on some profiles and omits broader RR on others.
const extraSkillRR = {
  'Vocal Control': SKILL.Influence,
  'Morphological and Vocal Control': SKILL.Influence,
  'Armanté Suit or Dress': SKILL.Influence,
  'MCT 260': SKILL.Cracking,
  'Shiawase Cyber-6': SKILL.Cracking,
  'Fairlight Excalibur': SKILL.Cracking,
  'Ares SharpShooter Cybernetic Eyes': SKILL.RangedWeapons,
  'Digitigrade Cyberlegs': SKILL.Athletics
};
const hasRiskReduction = /\b(?:RR|risk reduction)\b/i;

export function riskReductionState(characterObj) {
  const manualKeysSet = new Set(Array.isArray(characterObj.riskReduction) ? characterObj.riskReduction : []);
  const ampGrantsMap = new Map();
  for (const ampObj of characterObj.amps) {
    for (const targetObj of ampTargets(ampObj, characterObj.skills)) {
      if (!ampGrantsMap.has(targetObj.key)) {
        ampGrantsMap.set(targetObj.key, { target: targetObj, sources: new Set() });
      }
      ampGrantsMap.get(targetObj.key).sources.add(ampObj.name);
    }
  }
  return { manualKeysSet, ampGrantsMap };
}

export function toggleRiskReduction(characterObj, keysArr) {
  const { manualKeysSet, ampGrantsMap } = riskReductionState(characterObj);
  if (!keysArr.length || keysArr.some(keyStr => ampGrantsMap.has(keyStr))) return;
  const activeKey = keysArr.find(keyStr => manualKeysSet.has(keyStr));
  if (activeKey) manualKeysSet.delete(activeKey);
  else manualKeysSet.add(keysArr[0]);
  characterObj.riskReduction = [...manualKeysSet];
}

export function riskReductionTarget(scopeStr, nameStr, specializationStr) {
  const label = specializationStr ? `${nameStr} (${specializationStr})` : nameStr;
  const key = JSON.stringify([scopeStr, normalizeName(nameStr), normalizeName(specializationStr)]);
  return { key, scope: scopeStr, name: nameStr, specialization: specializationStr, label };
}

function ampTargets(ampObj, skillsArr) {
  const profile = Object.hasOwn(AMP_PROFILES, ampObj.name) ? AMP_PROFILES[ampObj.name] : null;
  const effect = String(ampObj.notes ?? ampObj.effect ?? profile?.effect ?? '');
  if (!hasRiskReduction.test(effect)) return [];
  if (!profile || !hasRiskReduction.test(profile.effect) || !effect.startsWith(profile.effect)) {
    return explicitTargets(effect, skillsArr);
  }

  const training = ampObj.name === 'Evo EyeDrone Cybernetic Eyes' ? [[SKILL.Perception, 'Physical']] : profile.training ?? [];
  const targets = training.flatMap(trainingTargets);
  if (Object.hasOwn(extraSkillRR, ampObj.name)) {
    targets.push(riskReductionTarget(RR_SCOPE.Skill, extraSkillRR[ampObj.name]));
  }
  const selections = effect.match(/\bSelected:\s*(.+?)\.?$/i)?.[1];
  if (selections) targets.push(...selectedTargets(profile, selections));
  const additionalEffects = training.length || profile.trainingChoices ? effect.slice(profile.effect.length) : effect;
  targets.push(...explicitTargets(additionalEffects, skillsArr));
  return targets;
}

function trainingTargets([skillNameStr, ...specializationsArr]) {
  return specializationsArr.length
    ? specializationsArr.map(specializationStr => riskReductionTarget(RR_SCOPE.Specialization, skillNameStr, specializationStr))
    : [riskReductionTarget(RR_SCOPE.Skill, skillNameStr)];
}

function selectedTargets(profileObj, selectedStr) {
  const options = profileObj.trainingChoices?.flatMap(trainingTargets) ?? [];
  if (/chosen attribute/i.test(profileObj.effect)) {
    options.push(...ATTRIBUTES.map(attributeStr => riskReductionTarget(RR_SCOPE.Attribute, attributeStr)));
  }
  const selected = new Set(selectedStr.split(',').map(normalizeName));
  return options.filter(targetObj => selected.has(normalizeName(targetObj.label))).slice(0, profileObj.chooseTraining ?? 1);
}

function explicitTargets(effectStr, skillsArr) {
  const grants = [...effectStr.matchAll(/\b(?:RR|risk reduction)\s+(?:[1-9]\d*\s+)?(?:on|for)\s+([^.;\n]+)/gi)];
  const skillNames = new Set([...SKILLS, TASKING, ...skillsArr.map(skillObj => skillObj.name)]);
  return grants.flatMap(([, descriptionStr]) => {
    const target = normalizeName(descriptionStr).replace(/-based\b/g, '').replace(/\s+tests?\b.*$/, '');
    const attribute = ATTRIBUTES.find(nameStr => normalizeName(nameStr) === target);
    if (attribute) return [riskReductionTarget(RR_SCOPE.Attribute, attribute)];
    for (const name of skillNames) {
      const skillName = normalizeName(name);
      if (target === skillName) return [riskReductionTarget(RR_SCOPE.Skill, name)];
      if (!target.startsWith(skillName + ' (') || !target.endsWith(')')) continue;
      const specName = target.slice(skillName.length + 2, -1);
      const learned = skillsArr.find(skillObj => normalizeName(skillObj.name) === skillName);
      const options = [...specializationOptions(name).map(([valueStr]) => valueStr), ...(learned ? getSpecializations(learned) : [])];
      const specialization = options.find(valueStr => normalizeName(valueStr) === specName) ?? specName;
      if (specialization) return [riskReductionTarget(RR_SCOPE.Specialization, name, specialization)];
    }
    return [];
  });
}
