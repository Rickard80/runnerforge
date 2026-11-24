import { normalizeName } from '../domain/names.js';
import { riskReductionTarget, RR_SCOPE } from '../domain/risk-reduction.js';
import { getSpecializations, specializationAttribute, specializationCode } from '../domain/specializations.js';
import { escapeHTML } from './html.js';

const columnCenters = [53.04, 55.41, 57.78];

export function sheetRiskReductionHTML(rowObj, optionsObj, top) {
  return rowTargets(rowObj, optionsObj.riskReductionObj).map(({ scope: scopeStr, targets: targetsArr }, index) => {
    const position = top === undefined ? null : { left: columnCenters[index], top };
    return markHTML({ skillName: rowObj.skill.name, scope: scopeStr, targets: targetsArr, position }, optionsObj);
  }).join('');
}

export function refreshSheetRiskReduction(sheetObj, riskReductionObj) {
  for (const control of sheetObj.querySelectorAll('button[data-rr-keys]')) {
    const keys = JSON.parse(control.dataset.rrKeys);
    const isActive = keys.some(keyStr => riskReductionObj.manualKeysSet.has(keyStr) || riskReductionObj.ampGrantsMap.has(keyStr));
    control.setAttribute('aria-pressed', String(isActive));
  }
}

function rowTargets(rowObj, { ampGrantsMap }) {
  const { skill, attributeGroup, specializations } = rowObj;
  const attributes = attributeGroup.filter(Boolean).map(nameStr => riskReductionTarget(RR_SCOPE.Attribute, nameStr));
  const skills = skill.name ? [riskReductionTarget(RR_SCOPE.Skill, skill.name)] : [];
  const specializationTargets = new Map(specializations.map(({ value: valueStr }) => {
    const target = riskReductionTarget(RR_SCOPE.Specialization, skill.name, valueStr);
    return [target.key, target];
  }));
  for (const { target } of ampGrantsMap.values()) {
    if (isSpecializationForRow(rowObj, target)) specializationTargets.set(target.key, target);
  }
  return [
    { scope: RR_SCOPE.Attribute, targets: attributes },
    { scope: RR_SCOPE.Skill, targets: skills },
    { scope: RR_SCOPE.Specialization, targets: [...specializationTargets.values()] }
  ];
}

function isSpecializationForRow({ skill: skillObj, attributeGroup: attributesArr }, targetObj) {
  if (targetObj.scope !== RR_SCOPE.Specialization || normalizeName(targetObj.name) !== normalizeName(skillObj.name)) return false;
  const spec = targetObj.specialization;
  if (getSpecializations(skillObj).some(valueStr => normalizeName(valueStr) === normalizeName(spec))) {
    return attributesArr.includes(specializationAttribute(skillObj, spec));
  }
  const attributeCodes = specializationCode(skillObj.name, spec)?.split('/');
  return attributeCodes
    ? attributesArr.some(attributeStr => attributeCodes.includes(attributeStr?.[0]))
    : attributesArr.includes(specializationAttribute(skillObj, spec));
}

function markHTML({ skillName: skillNameStr, scope: scopeStr, targets: targetsArr, position: positionObj }, { isEditable, riskReductionObj }) {
  const { manualKeysSet, ampGrantsMap } = riskReductionObj;
  const keys = targetsArr.map(targetObj => targetObj.key);
  const grants = keys.flatMap(keyStr => ampGrantsMap.has(keyStr) ? [ampGrantsMap.get(keyStr)] : []);
  const isActive = grants.length > 0 || keys.some(keyStr => manualKeysSet.has(keyStr));
  if (!isEditable && positionObj && !isActive) return '';

  const classes = 'sheet-rr' + (positionObj ? ' sheet-rr-positioned' : '');
  const style = positionObj ? ` style="left:${positionObj.left}%;top:${positionObj.top}%"` : '';
  const label = `Risk Reduction for ${skillNameStr} · ${scopeStr}` +
    (targetsArr.length ? ` (${targetsArr.map(targetObj => targetObj.label).join(', ')})` : '');
  if (!isEditable) {
    return `<span class="${classes}${isActive ? ' sheet-rr-marked' : ''}"${style} role="img" aria-label="${escapeHTML(label)} ${isActive ? 'marked' : 'unmarked'}"></span>`;
  }

  const title = grants.length
    ? grants.map(({ target: targetObj, sources: sourcesSet }) => `${targetObj.label}: ${[...sourcesSet].join(', ')}`).join(' · ')
    : keys.length ? label : 'Add a specialization to mark Risk Reduction for it.';
  const locked = grants.length || !keys.length ? ' aria-disabled="true"' : '';
  return `<button class="${classes}"${style} type="button" data-rr-keys="${escapeHTML(JSON.stringify(keys))}" aria-label="${escapeHTML(label)}" aria-pressed="${isActive}" title="${escapeHTML(title)}"${locked}></button>`;
}
