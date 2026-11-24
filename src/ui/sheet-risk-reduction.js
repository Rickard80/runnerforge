import { normalizeName } from '../domain/names.js';
import { riskReductionTarget, RR_SCOPE } from '../domain/risk-reduction.js';
import { getSpecializations, specializationAttribute, specializationCode } from '../domain/specializations.js';
import { escapeHTML } from './html.js';

const columnCenters = [53.04, 55.41, 57.78];

export function sheetRiskReductionHTML(rowObj, optionsObj, top) {
  return rowTargets(rowObj, optionsObj.riskReductionObj).map(({ scope, targets }, index) => {
    const position = top === undefined ? null : { left: columnCenters[index], top };
    return markHTML({ skillName: rowObj.skill.name, scope, targets, position }, optionsObj);
  }).join('');
}

export function refreshSheetRiskReduction(sheetObj, riskReductionObj) {
  for (const control of sheetObj.querySelectorAll('button[data-rr-keys]')) {
    const keys = JSON.parse(control.dataset.rrKeys);
    const isActive = keys.some(key => riskReductionObj.manualKeysSet.has(key) || riskReductionObj.ampGrantsMap.has(key));
    control.setAttribute('aria-pressed', String(isActive));
  }
}

function rowTargets(rowObj, { ampGrantsMap }) {
  const { skill, attributeGroup, specializations } = rowObj;
  const attributes = attributeGroup.filter(Boolean).map(name => riskReductionTarget(RR_SCOPE.Attribute, name));
  const skills = skill.name ? [riskReductionTarget(RR_SCOPE.Skill, skill.name)] : [];
  const specializationTargets = new Map(specializations.map(({ value }) => {
    const target = riskReductionTarget(RR_SCOPE.Specialization, skill.name, value);
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

function isSpecializationForRow({ skill, attributeGroup }, targetObj) {
  if (targetObj.scope !== RR_SCOPE.Specialization || normalizeName(targetObj.name) !== normalizeName(skill.name)) return false;
  const spec = targetObj.specialization;
  if (getSpecializations(skill).some(value => normalizeName(value) === normalizeName(spec))) {
    return attributeGroup.includes(specializationAttribute(skill, spec));
  }
  const attributeCodes = specializationCode(skill.name, spec)?.split('/');
  return attributeCodes
    ? attributeGroup.some(attribute => attributeCodes.includes(attribute?.[0]))
    : attributeGroup.includes(specializationAttribute(skill, spec));
}

function markHTML({ skillName, scope, targets, position }, { isEditable, riskReductionObj }) {
  const { manualKeysSet, ampGrantsMap } = riskReductionObj;
  const keys = targets.map(target => target.key);
  const grants = keys.flatMap(key => ampGrantsMap.has(key) ? [ampGrantsMap.get(key)] : []);
  const isActive = grants.length > 0 || keys.some(key => manualKeysSet.has(key));
  if (!isEditable && position && !isActive) return '';

  const classes = 'sheet-rr' + (position ? ' sheet-rr-positioned' : '');
  const style = position ? ` style="left:${position.left}%;top:${position.top}%"` : '';
  const label = `Risk Reduction for ${skillName} · ${scope}` +
    (targets.length ? ` (${targets.map(target => target.label).join(', ')})` : '');
  if (!isEditable) {
    return `<span class="${classes}${isActive ? ' sheet-rr-marked' : ''}"${style} role="img" aria-label="${escapeHTML(label)} ${isActive ? 'marked' : 'unmarked'}"></span>`;
  }

  const title = grants.length
    ? grants.map(({ target, sources }) => `${target.label}: ${[...sources].join(', ')}`).join(' · ')
    : keys.length ? label : 'Add a specialization to mark Risk Reduction for it.';
  const locked = grants.length || !keys.length ? ' aria-disabled="true"' : '';
  return `<button class="${classes}"${style} type="button" data-rr-keys="${escapeHTML(JSON.stringify(keys))}" aria-label="${escapeHTML(label)}" aria-pressed="${isActive}" title="${escapeHTML(title)}"${locked}></button>`;
}
