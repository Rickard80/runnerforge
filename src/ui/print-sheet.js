import { catalogDescription, catalogProfile } from '../domain/data/catalog.js';
import { PERSONALITY_ENTRY_COUNT, PERSONALITY_ENTRY_LENGTH, PERSONALITY_LABELS } from '../domain/data/personality.js';
import { ATTRIBUTES, ENTRY_LIST, ITEM_TYPE, WOUND_SEVERITY, WOUND_TYPE } from '../domain/data/rules.js';
import { calc, money, woundArmor, woundThresholds } from '../domain/model.js';
import { riskReductionState } from '../domain/risk-reduction.js';
import { abbreviatedAttribute, getSpecializations, linkedAttributes, specializationAttribute } from '../domain/specializations.js';
import { escapeHTML, FIELD_KIND, FIELD_PATH, inlineInputHTML } from './html.js';
import { refreshSheetRiskReduction, sheetRiskReductionHTML } from './sheet-risk-reduction.js';

const skillSheetRowLimit = 11;
export const sheetItemType = { [ITEM_TYPE.Weapon]: 'Weapon', [ITEM_TYPE.Spell]: 'Spell', [ITEM_TYPE.ComplexForm]: 'Complex Form' };
let personalityTextMetrics;

export class RunnerPrintSheet extends HTMLElement {
  set character(characterObj) {
    this.innerHTML = printContentHTML(characterObj, true);
  }

  fitPersonalityEntry(inputObj) {
    inputObj.style.fontSize = `${personalityFontSize(inputObj.value, parseFloat(inputObj.style.width))}cqw`;
  }

  refreshRiskReduction(characterObj) {
    refreshSheetRiskReduction(this, riskReductionState(characterObj));
  }

  refreshRatings(characterObj, inputObj, remaining) {
    const path = inputObj.dataset.inlinePath;
    const pages = sheetSkillPages(characterObj);
    if (path.startsWith('attributes.')) this.refreshAttributeDependents(characterObj, pages);
    if (path.startsWith(ENTRY_LIST.Skills + '.')) this.refreshSkillRatings(inputObj, pages);
    this.querySelector('[data-sheet-balance]').textContent = 'Remaining: ' + money(remaining);
  }

  refreshAttributeDependents(characterObj, { first: firstArr, continued: continuedArr }) {
    const options = { isEditable: true, riskReductionObj: riskReductionState(characterObj) };
    this.querySelector('[data-sheet-skills]').innerHTML = sheetSkillRowsHTML(firstArr, options);
    this.querySelector('[data-sheet-continuation]').innerHTML = sheetSkillsContinuedHTML(continuedArr, options);
    this.querySelector('[data-sheet-thresholds]').innerHTML = sheetWoundThresholdsHTML(characterObj);
  }

  refreshSkillRatings(inputObj, { first: firstArr, continued: continuedArr }) {
    const rows = [...firstArr, ...continuedArr];
    this.querySelectorAll('[data-sheet-pool]').forEach((cellObj, index) => {
      cellObj.textContent = rows[index].pool;
    });
    for (const rating of this.querySelectorAll(`[data-inline-path="${inputObj.dataset.inlinePath}"]`)) {
      if (rating !== inputObj) rating.value = inputObj.valueAsNumber;
    }
  }
}

export function printCharacter(characterObj) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  const stylesheets = ['print-sheet.css', 'risk-reduction.css', 'print-sheet-paper.css'].map(fileNameStr => {
    const url = new URL(`../../assets/styles/components/${fileNameStr}`, import.meta.url);
    return `<link rel="stylesheet" href="${escapeHTML(url.href)}">`;
  }).join('');
  printWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <title>${escapeHTML(characterObj.name || 'Runner')}</title>${stylesheets}</head>
    <body>${printContentHTML(characterObj)}</body></html>`);
  printWindow.onbeforeprint = () => fitPrintedSupplement(printWindow.document);
  printWindow.onload = () => setTimeout(() => printWindow.print(), 350);
  printWindow.document.close();
  return true;
}
function fitPrintedSupplement(documentObj) {
  const page = documentObj.querySelector('.sheet-supplement');
  if (!page) return;
  const content = page.firstElementChild;
  content.style.zoom = '';
  const style = documentObj.defaultView.getComputedStyle(page);
  const availableHeight = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  let contentHeight = content.getBoundingClientRect().height;
  let zoom = 1;
  while (contentHeight > availableHeight) {
    zoom *= (availableHeight - 1) / contentHeight;
    content.style.zoom = zoom;
    contentHeight = content.getBoundingClientRect().height;
  }
}
export function printContentHTML(characterObj, isEditable = false) {
  const { first, continued } = sheetSkillPages(characterObj);
  const options = { isEditable, riskReductionObj: riskReductionState(characterObj) };
  const continuation = sheetSkillsContinuedHTML(continued, options);
  const notes = sheetNotesHTML(characterObj.notes);
  const sheet = sheetHTML(characterObj, first, options);
  if (isEditable) return sheet + `<div data-sheet-continuation>${continuation}</div>` + notes;
  const supplement = continuation + notes;
  return supplement ? sheet + `<div class="sheet-supplement"><div>${supplement}</div></div>` : sheet;
}
function sheetPosition({ left, top, width, height, fontSize = 1.04, textAlign: textAlignStr = 'left', transform: transformStr }) {
  const heightStyle = height === undefined ? '' : `height:${height}%;`;
  const transformStyle = transformStr ? 'transform: ' + transformStr : '';
  return `left:${left}%;top:${top}%;width:${width}%;${heightStyle}font-size:${fontSize}cqw;text-align:${textAlignStr};${transformStyle}`;
}

function sheetOverlayHTML(value, { className: classNameStr, attributes: attributesStr = '', ...positionObj }) {
  return `<div class="overlay ${classNameStr}" style="${sheetPosition(positionObj)}"${attributesStr}>${escapeHTML(value)}</div>`;
}

function sheetFieldHTML(value, fieldObj, { className: classNameStr, ...positionObj }) {
  if (!fieldObj) return sheetOverlayHTML(value, { className: classNameStr, ...positionObj });
  return inlineInputHTML(value, fieldObj, ` class="overlay ${classNameStr} sheet-input" style="${sheetPosition(positionObj)}"`);
}
function sheetWoundHTML({ left, top }) {
  return `<span class="wound" style="left:${left}%;top:${top}%"></span>`;
}
function sheetPortraitHTML(portraitStr, isEditable) {
  if (!portraitStr) {
    return isEditable ? '<button type="button" class="portrait" id="sheet-portrait" data-pick-portrait aria-label="Choose character portrait"></button>' : '';
  }
  const src = escapeHTML(portraitStr);
  if (isEditable) {
    return `<button type="button" class="portrait" id="sheet-portrait" data-edit-portrait aria-label="Adjust character portrait"><img src="${src}" alt=""></button>`;
  }
  return `<img class="portrait" src="${src}" alt="Character portrait">`;
}
function sheetNotesHTML(notesStr) {
  const text = String(notesStr || '');
  if (!text.trim()) return '';
  return `<section class="sheet-notes"><h2>Background / notes</h2><p>${escapeHTML(text)}</p></section>`;
}
export function sheetSkillPages(characterObj) {
  const first = [];
  const continued = [];
  characterObj.skills.forEach((skillObj, skillIndex) => {
    const rowsArr = rowsForSkill(characterObj.attributes, skillObj, skillIndex);
    const page = continued.length || first.length + rowsArr.length > skillSheetRowLimit ? continued : first;
    page.push(...rowsArr);
  });
  return { first, continued };
}

function rowsForSkill(attributesObj, skillObj, skillIndex) {
  const attributesArr = linkedAttributes(skillObj);
  const specializationsArr = getSpecializations(skillObj).filter(Boolean).map(valueStr => ({
    value: valueStr, attribute: specializationAttribute(skillObj, valueStr)
  }));
  const ratingsArr = attributesArr.map(attributeStr => +attributesObj[attributeStr] || 0);
  const hasEqualRatings = ratingsArr.every(rating => rating === ratingsArr[0]);
  const groups = hasEqualRatings ? [attributesArr] : attributesArr.map(attributeStr => [attributeStr]);
  return groups.map((groupArr, index) => skillSheetRow({
    skillObj, skillIndex, groupArr, specializationsArr, attributeRating: ratingsArr[index]
  }));
}

function skillSheetRow({ skillObj, skillIndex, groupArr, specializationsArr, attributeRating }) {
  const [attribute] = groupArr;
  const rowSpecializations = specializationsArr.filter(specObj => groupArr.includes(specObj.attribute));
  const specs = rowSpecializations
    .map(specObj => groupArr.length > 1 ? `${specObj.value} [${abbreviatedAttribute(specObj.attribute)}]` : specObj.value)
    .join(', ');
  return {
    skill: skillObj, skillIndex, attribute, attributeRating, specs, attributeGroup: groupArr, specializations: rowSpecializations,
    label: specs ? `${skillObj.name} (${specs})` : skillObj.name,
    attributeLabel: groupArr.map(abbreviatedAttribute).join(', '),
    pool: ((+skillObj.rating || 0) + attributeRating) + (specs.length ? ' (+2)' : '')
  };
}

function skillRatingField({ skillIndex, label: labelStr, attributeLabel: attributeLabelStr }) {
  return { path: `${ENTRY_LIST.Skills}.${skillIndex}.rating`, label: `${labelStr} rating (${attributeLabelStr})`, type: FIELD_KIND.Number };
}

function sheetSkillsContinuedHTML(rowsArr, optionsObj) {
  if (!rowsArr.length) return '';
  const { isEditable } = optionsObj;
  const entries = rowsArr.map(rowObj => {
    const { skill, label, attributeLabel, pool } = rowObj;
    const rating = isEditable ? inlineInputHTML(skill.rating, skillRatingField(rowObj), ' class="sheet-rating"') : escapeHTML(skill.rating);
    const riskReduction = sheetRiskReductionHTML(rowObj, optionsObj);
    return `<tr><th scope="row">${escapeHTML(label)}</th><td>${rating}</td><td>${escapeHTML(attributeLabel)}</td><td${isEditable ? ' data-sheet-pool' : ''}>${pool}</td><td><div class="sheet-rr-group">${riskReduction}</div></td></tr>`;
  });
  return '<section class="sheet-skills"><h2>Skills continued</h2><table>' +
    '<thead><tr><th scope="col">Skill</th><th scope="col">Rating</th><th scope="col">+ATT</th>' +
    '<th scope="col">Dice pool</th><th scope="col" title="Risk Reduction: attribute, skill, specialization">RR</th></tr></thead>' +
    `<tbody>${entries.join('')}</tbody></table></section>`;
}
function sheetSkillsHTML(rowsArr, optionsObj) {
  const skills = sheetSkillRowsHTML(rowsArr, optionsObj);
  return optionsObj.isEditable ? `<div data-sheet-skills>${skills}</div>` : skills;
}

function sheetSkillRowsHTML(rowsArr, optionsObj) {
  const { isEditable } = optionsObj;
  return rowsArr.map((rowObj, index) => {
    const { skill, label, attributeLabel, pool } = rowObj;
    const top = 18.75 + index * 2.16;
    const ratingField = isEditable ? skillRatingField(rowObj) : null;
    return sheetOverlayHTML(label, {
      className: 'overlay-skills overlay-skill-label', left: 5.3, top, width: 24.8, height: 1.7, fontSize: 1.2
    }) +
      sheetFieldHTML(skill.rating, ratingField, {
        className: 'overlay-skills overlay-skill-rating',
        left: 31.2, top, width: 5.9, height: 1.7, fontSize: 1.2, textAlign: 'center'
      }) +
      sheetOverlayHTML(attributeLabel, {
        className: 'overlay-skills overlay-skill-attribute',
        left: 38.25, top, width: 7.55, height: 1.7, fontSize: 1.05, textAlign: 'center'
      }) +
      sheetOverlayHTML(pool, {
        className: 'overlay-skills overlay-skill-pool',
        left: 46, top, width: 5, height: 1.7, fontSize: 1.2, textAlign: 'center',
        attributes: isEditable ? ' data-sheet-pool' : ''
      }) +
      sheetRiskReductionHTML(rowObj, optionsObj, 19.78 + index * 2.16);
  }).join('');
}

function personalityFontSize(valueStr, width) {
  const standardSize = 1.2;
  if (!valueStr || valueStr.length > PERSONALITY_ENTRY_LENGTH || typeof document === 'undefined') return standardSize;
  personalityTextMetrics ??= document.createElement('canvas').getContext('2d');
  if (!personalityTextMetrics) return standardSize;
  personalityTextMetrics.font = '100px Arial, sans-serif';
  const textWidth = personalityTextMetrics.measureText(valueStr).width / 100;
  return Math.min(standardSize, (width - .25) / textWidth);
}

function sheetPersonalityEntriesHTML({ characterObj, keyStr, isEditable, positionObj }) {
  const { top, left, rowSpacing, width, maxLines, transform } = positionObj;
  const values = characterObj[keyStr];
  const count = Math.min(maxLines, isEditable ? Math.max(values.length, PERSONALITY_ENTRY_COUNT) : values.length);
  return Array.from({ length: count }, (_, index) => {
    const field = isEditable ? {
      path: `${keyStr}.${index}`, label: `${PERSONALITY_LABELS[keyStr]} ${index + 1}`, maxLength: PERSONALITY_ENTRY_LENGTH
    } : null;
    const value = values[index];
    return sheetFieldHTML(value, field, {
      className: `overlay-${keyStr}`,
      left, top: top + index * rowSpacing, width, height: 1.7, fontSize: personalityFontSize(value, width), transform
    });
  }).join('');
}

// Coordinates measured against correctedAlignment.webp (1571 × 2048), scaled as percentages.
function sheetHTML(characterObj, skillRowsArr, optionsObj) {
  const { isEditable } = optionsObj;
  let html = '<div class="sheet">';
  html += sheetNameHTML(characterObj.name, isEditable);
  html += sheetAttributesHTML(characterObj, isEditable);
  html += sheetSkillsHTML(skillRowsArr, optionsObj);
  html += sheetAmpsHTML(characterObj.amps);
  html += sheetKnowledgeAndEssenceHTML(characterObj);
  html += sheetWeaponsAndSpellsHTML(characterObj.items);
  html += sheetGearHTML(characterObj.items);
  html += sheetBalanceHTML(characterObj, isEditable);
  html += sheetWoundsHTML(characterObj, isEditable);
  html += sheetPersonalityHTML(characterObj, isEditable);
  html += sheetWoundMarkersHTML(characterObj);
  html += sheetPortraitHTML(characterObj.portrait, isEditable);
  return html + '</div>';
}

function sheetLinesHTML(valuesArr, { className: classNameStr, left, top, rowSpacing, width, maxLines, fontSize }) {
  return valuesArr.slice(0, maxLines).map((value, index) => sheetOverlayHTML(value, {
    className: classNameStr, left, top: top + index * rowSpacing, width, height: 1.7, fontSize
  })).join('');
}

function sheetNameHTML(nameStr, isEditable) {
  const field = isEditable ? { path: FIELD_PATH.Name, label: 'Street name' } : null;
  return sheetFieldHTML(nameStr, field, {
    className: 'overlay-name', left: 21, top: 4, width: 32, height: 3, fontSize: 2.5, textAlign: 'center'
  });
}

function sheetAttributesHTML({ attributes: attributesObj, edge }, isEditable) {
  const attributePositions = [6.1, 15.3, 24.3, 33.1, 42.5, 51.4];
  return [...ATTRIBUTES, 'Edge'].map((labelStr, index) => {
    const isEdge = labelStr === 'Edge';
    const field = isEditable ? { path: isEdge ? FIELD_PATH.Edge : `attributes.${labelStr}`, label: labelStr, type: FIELD_KIND.Number } : null;
    return sheetFieldHTML(isEdge ? edge : attributesObj[labelStr], field, {
      className: isEdge ? 'overlay-edge' : 'overlay-attributes',
      left: attributePositions[index], top: isEditable ? 10.6 : 12, width: 6.1, height: 4.5, fontSize: 2, textAlign: 'center'
    });
  }).join('');
}

function sheetAmpsHTML(ampsArr) {
  const labels = ampsArr.map(({ name: nameStr, rating, notes: notesStr }) => `${nameStr} (${rating})${notesStr ? ' ' + notesStr : ''}`);
  return sheetLinesHTML(labels, {
    className: 'overlay-shadow-amps',
    left: 5.3, top: 45.5, rowSpacing: 2.17, width: 57, maxLines: 11, fontSize: 1.2
  });
}

function sheetKnowledgeAndEssenceHTML({ knowledge: knowledgeArr, essence: essenceStr }) {
  const knowledgeHTML = sheetOverlayHTML(knowledgeArr.join(', '), {
    className: 'overlay-knowledge', left: 5.3, top: 72.2, width: 47, fontSize: 1.2
  });
  const essenceHTML = sheetOverlayHTML(essenceStr, {
    className: 'overlay-essence', left: 51.6, top: 72.2, width: 7, height: 2, fontSize: 1.2, textAlign: 'center'
  });
  return knowledgeHTML + essenceHTML;
}

function sheetWeaponsAndSpellsHTML(itemsArr) {
  const entries = itemsArr.filter(itemObj => Object.hasOwn(sheetItemType, itemObj.type));
  return entries.slice(0, 4).map(({ name: nameStr, type: typeStr, description: descriptionStr }, index) => {
    const description = descriptionStr ?? catalogDescription(catalogProfile(typeStr, nameStr));
    const nameHTML = sheetOverlayHTML([nameStr, description].filter(Boolean).join(', '), {
      className: 'overlay-weapons-and-spells overlay-item-name',
      left: 5.3, top: 77.5 + index * 2.16, width: 43, height: 1.7, fontSize: 1.2
    });
    const typeHTML = sheetOverlayHTML(sheetItemType[typeStr], {
      className: 'overlay-weapons-and-spells overlay-item-type',
      left: 49.7, top: 77.7 + index * 2.16, width: 9, height: 1.7, fontSize: 1, textAlign: 'center'
    });
    return nameHTML + typeHTML;
  }).join('');
}

function sheetGearHTML(itemsArr) {
  const gear = itemsArr.filter(({ type: typeStr }) => typeStr === ITEM_TYPE.Armor || typeStr === ITEM_TYPE.Equipment);
  const labels = gear.map(({ name: nameStr, cost }) => nameStr + ' ' + money(cost));
  return sheetLinesHTML(labels, {
    className: 'overlay-gear',
    left: 5.3, top: 88.9, rowSpacing: 1.76, width: 20, maxLines: 4, fontSize: 1
  });
}

function sheetBalanceHTML(characterObj, isEditable) {
  const { remaining } = calc(characterObj);
  return sheetOverlayHTML('Remaining: ' + money(remaining), {
    className: 'overlay-balance',
    left: 7, top: 96.05, width: 22, height: 1.3, fontSize: 1,
    attributes: isEditable ? ' data-sheet-balance' : ''
  });
}

function sheetPersonalityHTML(characterObj, isEditable) {
  const keywords = sheetPersonalityEntriesHTML({ characterObj, keyStr: 'keywords', isEditable, positionObj: {
    top: 37.75, left: 67.4, rowSpacing: 2.16, width: 28.5, maxLines: 5, transform: 'rotateZ(-1.1deg)'
  } });
  const dispositions = sheetPersonalityEntriesHTML({ characterObj, keyStr: 'dispositions', isEditable, positionObj: {
    top: 54.15, left: 67.6, rowSpacing: 2.12, width: 28.5, maxLines: 4, transform: 'rotateZ(2deg)'
  } });
  const cues = sheetPersonalityEntriesHTML({ characterObj, keyStr: 'cues', isEditable, positionObj: {
    top: 68.8, left: 67.2, rowSpacing: 2.84, width: 28.5, maxLines: 5, transform: 'rotateZ(-1deg)'
  } });
  return keywords + dispositions + cues;
}

function sheetWoundMarkersHTML(characterObj) {
  let html = '';
  const woundTracks = [characterObj.wounds || {}, characterObj.mentalWounds || {}];
  woundTracks.forEach((woundsObj, rowObj) => {
    let index = 0;
    for (const key of [WOUND_SEVERITY.Light, WOUND_SEVERITY.Serious, WOUND_SEVERITY.Incapacitated]) {
      const count = Math.max(0, Math.min(5, +woundsObj[key] || 0));
      for (let i = 0; i < count; i++) {
        html += sheetWoundHTML({ left: 44.3 + index * 2.08, top: 89.88 + rowObj * 1.2 });
        index++;
      }
    }
  });
  return html;
}

function sheetWoundThresholdsHTML(characterObj) {
  const { attributes, woundSettings } = characterObj;
  const { main, alternate } = woundArmor(characterObj);
  const { alternateType, alternateAttribute, alternateArmorIncrease, vehicleBody } = woundSettings;
  const vehicle = alternateType === WOUND_TYPE.Vehicle;
  const attribute = attributes[alternateAttribute];
  const resistance = vehicle ? vehicleBody ?? attribute :
    alternateType === WOUND_TYPE.Matrix ? attribute ?? alternateArmorIncrease : attribute;
  const protection = vehicle ? alternateArmorIncrease ?? 0 : alternate.protection;
  const rows = [
    [90.5, woundThresholds(WOUND_TYPE.Physical, attributes.Strength)],
    [92.2, woundThresholds(WOUND_TYPE.Physical, attributes.Strength, main.protection)],
    [95.8, woundThresholds(WOUND_TYPE.Mental, attributes.Willpower)]
  ];
  if (resistance != null) rows.push([94, woundThresholds(alternateType, resistance, protection)]);
  const columns = [44.6, 50.1, 54.6];
  return rows.map(([top, thresholdsArr]) => thresholdsArr.map((value, index) =>
    sheetOverlayHTML(value, {
      className: 'overlay-wound-threshold', left: columns[index], top, width: 4.4, height: 1.4, fontSize: 1, textAlign: 'center'
    })
  ).join('')).join('');
}

export function sheetWoundsHTML(characterObj, isEditable = false) {
  const { main, alternate } = woundArmor(characterObj);
  const thresholds = sheetWoundThresholdsHTML(characterObj);
  const mainField = isEditable ? { path: FIELD_PATH.MainArmorName, label: 'Main armor name' } : null;
  const alternateField = isEditable ? { path: FIELD_PATH.AlternateArmorName, label: 'Alternate armor name' } : null;
  let html = isEditable ? `<div data-sheet-thresholds>${thresholds}</div>` : thresholds;
  html += sheetFieldHTML(main.name, mainField, {
    className: 'overlay-armor overlay-main-armor', left: 31.2, top: 92.3, width: 12.6, height: 1.5, fontSize: 1
  });
  html += sheetFieldHTML(alternate.name, alternateField, {
    className: 'overlay-armor overlay-alternate-armor', left: 33.7, top: 94.15, width: 10.1, height: 1.5, fontSize: 1
  });
  return html;
}

customElements.define('runner-print-sheet', RunnerPrintSheet);
