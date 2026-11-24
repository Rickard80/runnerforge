import { CATALOG } from '../domain/data/catalog.js';
import { PERSONALITY_ENTRY_COUNT, PERSONALITY_ENTRY_LENGTH, PERSONALITY_LABELS } from '../domain/data/personality.js';
import { ATTRIBUTES } from '../domain/data/rules.js';
import { calc, isFreeCommlink, money, woundArmor, woundThresholds } from '../domain/model.js';
import { normalizeName } from '../domain/names.js';
import { abbreviatedAttribute, getSpecializations, linkedAttributes, specializationAttribute } from '../domain/specializations.js';
import { escapeHTML, inlineInputHTML } from './html.js';

const skillSheetRowLimit = 11;
export const sheetItemType = { weapon: 'Weapon', spell: 'Spell', 'complex form': 'Complex Form' };
let personalityTextMetrics;

export function printCharacter(character) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write('<!doctype html><html><head><title>' + escapeHTML(character.name || 'Runner') +
    '</title><style>body{margin:0} .sheet{width:210mm;height:273.5mm;position:relative;background-image:url("' +
    new URL('../../assets/images/clean-sheet.webp', import.meta.url).href +
    '");background-size:100% 100%;container-type:inline-size} .overlay{position:absolute;font-family:Arial,sans-serif;font-size:9px;color:#29140d;white-space:nowrap;overflow:hidden} .wound{position:absolute;border-radius:50%;background:#5d2e20}' +
    '.sheet-notes{box-sizing:border-box;height:273.5mm;padding:14mm;overflow:hidden;font:11pt/1.5 Arial,sans-serif}' +
    '.sheet-notes h2,.sheet-skills h2{margin:0 0 .5em} .sheet-notes p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.sheet-skills{padding:14mm;font:11pt/1.4 Arial,sans-serif;color:#29140d}.sheet-skills table{width:100%;border-collapse:collapse}' +
    '.sheet-skills :is(th,td){padding:2mm;border-bottom:1px solid #c5b1a3;text-align:left}.sheet-skills tr{break-inside:avoid}' +
    '@page{size:210mm 273.85mm;margin:0}' +
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact} .sheet-notes,.sheet-skills{break-before:page}}</style></head><body>' +
    printContentHTML(character) + '</body></html>');
  w.onbeforeprint = () => fitPrintedNotes(w.document);
  w.onload = () => setTimeout(() => w.print(), 350);
  w.document.close();
  return true;
}
function fitPrintedNotes(doc) {
  const page = doc.querySelector('.sheet-notes');
  if (!page) return;
  const content = page.firstElementChild;
  content.style.zoom = '';
  const style = doc.defaultView.getComputedStyle(page);
  const availableHeight = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const contentHeight = content.getBoundingClientRect().height;
  if (contentHeight > availableHeight) {
    content.style.zoom = (availableHeight - 1) / contentHeight;
  }
}
export function printContentHTML(character, editable = false) {
  const { first, continued } = sheetSkillPages(character);
  const continuation = sheetSkillsContinuedHTML(continued, editable);
  return sheetHTML(character, first, editable) +
    (editable ? `<div data-sheet-continuation>${continuation}</div>` : continuation) + sheetNotesHTML(character.notes);
}
function sheetPosition({ left, top, width, height = 1.65, fontSize = 1.04, textAlign = 'left', transform }) {
  const transformStyle = transform ? 'transform: ' + transform : '';
  return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;font-size:${fontSize}cqw;text-align:${textAlign};${transformStyle}`;
}

function sheetOverlayHTML(value, { attributes = '', ...position }) {
  return `<div class="overlay" style="${sheetPosition(position)}"${attributes}>${escapeHTML(value)}</div>`;
}

function sheetFieldHTML(value, field, position) {
  if (!field) return sheetOverlayHTML(value, position);
  return inlineInputHTML(value, field, ` class="overlay sheet-input" style="${sheetPosition(position)}"`);
}
function sheetWoundHTML({ left, top }) {
  return `<span class="wound" style="left:${left}%;top:${top}%;width:1.28%;height:.97%"></span>`;
}
function sheetPortraitHTML(portrait) {
  const mask = escapeHTML(new URL('../../assets/images/avatar-mask.webp', import.meta.url).href);
  // Align the full square mask with the painted opening on the sheet.
  const placement = 'position:absolute;left:64.8%;top:8.8%;width:32.8%;aspect-ratio:1;object-fit:cover';
  return `<img class="portrait" src="${escapeHTML(portrait)}" alt="Character portrait" style="${placement};mask:url(&quot;${mask}&quot;) center / 100% 100% no-repeat;mask-mode:luminance">`;
}
function sheetNotesHTML(notes) {
  const text = String(notes || '');
  if (!text.trim()) return '';
  return `<section class="sheet-notes"><div><h2>Background / notes</h2><p>${escapeHTML(text)}</p></div></section>`;
}
export function sheetSkillPages(character) {
  const first = [];
  const continued = [];
  character.skills.forEach((skill, skillIndex) => {
    const attributes = linkedAttributes(skill);
    const specializations = getSpecializations(skill).filter(Boolean).map(value => ({
      value, attribute: specializationAttribute(skill, value)
    }));
    const ratings = attributes.map(attribute => +character.attributes[attribute] || 0);
    const groups = ratings.every(rating => rating === ratings[0]) ? [attributes] : attributes.map(attribute => [attribute]);
    const page = continued.length || first.length + groups.length > skillSheetRowLimit ? continued : first;
    groups.forEach(group => {
      const [attribute] = group;
      const attributeRating = +character.attributes[attribute] || 0;
      const specs = specializations.filter(spec => group.includes(spec.attribute))
        .map(spec => group.length > 1 ? `${spec.value} [${abbreviatedAttribute(spec.attribute)}]` : spec.value).join(', ');
      page.push({
        skill, skillIndex, attribute, attributeRating, specs,
        label: specs ? `${skill.name} (${specs})` : skill.name,
        attributeLabel: group.map(abbreviatedAttribute).join(', '),
        pool: ((+skill.rating || 0) + attributeRating) + (specs.length ? ' (+2)' : '')
      });
    });
  });
  return { first, continued };
}
function skillRatingField({ skillIndex, label, attributeLabel }) {
  return { path: `skills.${skillIndex}.rating`, label: `${label} rating (${attributeLabel})`, type: 'number' };
}

function sheetSkillsContinuedHTML(rows, editable) {
  if (!rows.length) return '';
  const entries = rows.map(row => {
    const { skill, label, attributeLabel, pool } = row;
    const rating = editable ? inlineInputHTML(skill.rating, skillRatingField(row), ' class="sheet-rating"') : escapeHTML(skill.rating);
    return `<tr><th scope="row">${escapeHTML(label)}</th><td>${rating}</td><td>${escapeHTML(attributeLabel)}</td><td${editable ? ' data-sheet-pool' : ''}>${pool}</td></tr>`;
  });
  return '<section class="sheet-skills"><h2>Skills continued</h2><table>' +
    '<thead><tr><th scope="col">Skill</th><th scope="col">Rating</th><th scope="col">+ATT</th>' +
    '<th scope="col">Dice pool</th></tr></thead>' +
    `<tbody>${entries.join('')}</tbody></table></section>`;
}
function sheetSkillsHTML(rows, editable) {
  const skills = sheetSkillRowsHTML(rows, editable);
  return editable ? `<div data-sheet-skills>${skills}</div>` : skills;
}

function sheetSkillRowsHTML(rows, editable) {
  return rows.map((row, index) => {
    const { skill, label, attributeLabel, pool } = row;
    const top = 18.75 + index * 2.16;
    const ratingField = editable ? skillRatingField(row) : null;
    return sheetOverlayHTML(label, { left: 5.3, top, width: 24.8, height: 1.7, fontSize: 1.2 }) +
      sheetFieldHTML(skill.rating, ratingField, {
        left: 31.2, top, width: 5.9, height: 1.7, fontSize: 1.2, textAlign: 'center'
      }) +
      sheetOverlayHTML(attributeLabel, { left: 38.25, top, width: 7.55, height: 1.7, fontSize: 1.05, textAlign: 'center' }) +
      sheetOverlayHTML(pool, {
        left: 46, top, width: 5, height: 1.7, fontSize: 1.2, textAlign: 'center',
        attributes: editable ? ' data-sheet-pool' : ''
      });
  }).join('');
}

function personalityFontSize(value, width) {
  const standardSize = 1.2;
  if (!value || value.length > PERSONALITY_ENTRY_LENGTH || typeof document === 'undefined') return standardSize;
  personalityTextMetrics ??= document.createElement('canvas').getContext('2d');
  if (!personalityTextMetrics) return standardSize;
  personalityTextMetrics.font = '100px Arial, sans-serif';
  const textWidth = personalityTextMetrics.measureText(value).width / 100;
  return Math.min(standardSize, (width - .25) / textWidth);
}

function sheetPersonalityEntriesHTML(s, key, editable, { top, left, rowSpacing, width, maxLines, transform }) {
  const values = s[key];
  const count = Math.min(maxLines, editable ? Math.max(values.length, PERSONALITY_ENTRY_COUNT) : values.length);
  return Array.from({ length: count }, (_, index) => {
    const field = editable ? {
      path: `${key}.${index}`, label: `${PERSONALITY_LABELS[key]} ${index + 1}`, maxLength: PERSONALITY_ENTRY_LENGTH
    } : null;
    const value = values[index];
    return sheetFieldHTML(value, field, {
      left, top: top + index * rowSpacing, width, height: 1.7, fontSize: personalityFontSize(value, width), transform
    });
  }).join('');
}

// Coordinates measured against correctedAlignment.webp (1571 × 2048), scaled as percentages.
function sheetHTML(character, skillRows, editable) {
  let html = '<div class="sheet">';
  html += sheetNameHTML(character.name, editable);
  html += sheetAttributesHTML(character, editable);
  html += sheetSkillsHTML(skillRows, editable);
  html += sheetAmpsHTML(character.amps);
  html += sheetKnowledgeAndEssenceHTML(character);
  html += sheetWeaponsAndSpellsHTML(character.items);
  html += sheetGearHTML(character.items);
  html += sheetBalanceHTML(character, editable);
  html += sheetWoundsHTML(character, editable);
  html += sheetPersonalityHTML(character, editable);
  html += sheetWoundMarkersHTML(character);
  if (character.portrait) html += sheetPortraitHTML(character.portrait);
  return html + '</div>';
}

function sheetLinesHTML(values, { left, top, rowSpacing, width, maxLines, fontSize }) {
  return values.slice(0, maxLines).map((value, index) => sheetOverlayHTML(value, {
    left, top: top + index * rowSpacing, width, height: 1.7, fontSize
  })).join('');
}

function sheetNameHTML(nameStr, isEditable) {
  const field = isEditable ? { path: 'name', label: 'Street name' } : null;
  return sheetFieldHTML(nameStr, field, { left: 21, top: 4, width: 32, height: 3, fontSize: 2.5, textAlign: 'center' });
}

function sheetAttributesHTML({ attributes, edge }, editable) {
  const attributePositions = [6.1, 15.3, 24.3, 33.1, 42.5, 51.4];
  return [...ATTRIBUTES, 'Edge'].map((label, index) => {
    const isEdge = label === 'Edge';
    const field = editable ? { path: isEdge ? 'edge' : `attributes.${label}`, label, type: 'number' } : null;
    return sheetFieldHTML(isEdge ? edge : attributes[label], field, {
      left: attributePositions[index], top: editable ? 10.6 : 12, width: 6.1, height: 4.5, fontSize: 2, textAlign: 'center'
    });
  }).join('');
}

function sheetAmpsHTML(amps) {
  const labels = amps.map(({ name, rating, notes }) => `${name} (${rating})${notes ? ' ' + notes : ''}`);
  return sheetLinesHTML(labels, {
    left: 5.3, top: 45.5, rowSpacing: 2.17, width: 57, maxLines: 11, fontSize: 1.2
  });
}

function sheetKnowledgeAndEssenceHTML({ knowledge, essence }) {
  const knowledgeHTML = sheetOverlayHTML(knowledge.join(', '), {
    left: 5.3, top: 72.2, width: 47, height: 2, fontSize: 1.2
  });
  const essenceHTML = sheetOverlayHTML(essence, {
    left: 51.6, top: 72.2, width: 7, height: 2, fontSize: 1.2, textAlign: 'center'
  });
  return knowledgeHTML + essenceHTML;
}

function sheetWeaponsAndSpellsHTML(items) {
  const entries = items.filter(item => Object.hasOwn(sheetItemType, item.type));
  return entries.slice(0, 4).map(({ name, type, description }, index) => {
    const catalogGroup = CATALOG[type]?.find(entry => normalizeName(entry.name) === normalizeName(name))?.group;
    const nameHTML = sheetOverlayHTML(name + ', ' + (catalogGroup || description), {
      left: 5.3, top: 77.5 + index * 2.16, width: 43, height: 1.7, fontSize: 1.2
    });
    const typeHTML = sheetOverlayHTML(sheetItemType[type], {
      left: 49.7, top: 77.7 + index * 2.16, width: 9, height: 1.7, fontSize: 1, textAlign: 'center'
    });
    return nameHTML + typeHTML;
  }).join('');
}

function sheetGearHTML(items) {
  const gear = items.filter(({ type, name }) => type === 'armor' || (type === 'equipment' && !isFreeCommlink(name)));
  const labels = gear.map(({ name, cost }) => name + ' ' + money(cost));
  return sheetLinesHTML(labels, {
    left: 5.3, top: 88.9, rowSpacing: 1.76, width: 20, maxLines: 4, fontSize: 1
  });
}

function sheetBalanceHTML(character, editable) {
  const { remaining } = calc(character);
  return sheetOverlayHTML('Remaining: ' + money(remaining), {
    left: 7, top: 96.05, width: 22, height: 1.3, fontSize: 1,
    attributes: editable ? ' data-sheet-balance' : ''
  });
}

function sheetPersonalityHTML(character, editable) {
  const keywords = sheetPersonalityEntriesHTML(character, 'keywords', editable, {
    top: 37.75, left: 68.4, rowSpacing: 2.16, width: 26, maxLines: 5, transform: 'rotateZ(-1.1deg)'
  });
  const dispositions = sheetPersonalityEntriesHTML(character, 'dispositions', editable, {
    top: 54.15, left: 68.1, rowSpacing: 2.12, width: 27, maxLines: 4, transform: 'rotateZ(2deg)'
  });
  const cues = sheetPersonalityEntriesHTML(character, 'cues', editable, {
    top: 68.8, left: 68.3, rowSpacing: 2.84, width: 27, maxLines: 5, transform: 'rotateZ(-1deg)'
  });
  return keywords + dispositions + cues;
}

function sheetWoundMarkersHTML(character) {
  let html = '';
  const woundTracks = [character.wounds || {}, character.mentalWounds || {}];
  woundTracks.forEach((values, row) => {
    let index = 0;
    for (const key of ['light', 'serious', 'incapacitated']) {
      const count = Math.max(0, Math.min(5, +values[key] || 0));
      for (let i = 0; i < count; i++) {
        html += sheetWoundHTML({ left: 44.3 + index * 2.08, top: 89.88 + row * 1.2 });
        index++;
      }
    }
  });
  return html;
}

function sheetWoundThresholdsHTML(s) {
  const { attributes, woundSettings } = s;
  const { main, alternate } = woundArmor(s);
  const { alternateType, alternateAttribute, alternateArmorIncrease, vehicleBody } = woundSettings;
  const vehicle = alternateType === 'Vehicle';
  const attribute = attributes[alternateAttribute];
  const resistance = vehicle ? vehicleBody ?? attribute :
    alternateType === 'Matrix' ? attribute ?? alternateArmorIncrease : attribute;
  const protection = vehicle ? alternateArmorIncrease ?? 0 : alternate.protection;
  const rows = [
    [90.5, woundThresholds('Physical', attributes.Strength)],
    [92.2, woundThresholds('Physical', attributes.Strength, main.protection)],
    [95.8, woundThresholds('Mental', attributes.Willpower)]
  ];
  if (resistance != null) rows.push([94, woundThresholds(alternateType, resistance, protection)]);
  const columns = [44.6, 50.1, 54.6];
  return rows.map(([top, thresholds]) => thresholds.map((value, index) =>
    sheetOverlayHTML(value, { left: columns[index], top, width: 4.4, height: 1.4, fontSize: 1, textAlign: 'center' })
  ).join('')).join('');
}

export function sheetWoundsHTML(s, editable = false) {
  const { main, alternate } = woundArmor(s);
  const thresholds = sheetWoundThresholdsHTML(s);
  const mainField = editable ? { path: 'woundSettings.mainArmorName', label: 'Main armor name' } : null;
  const alternateField = editable ? { path: 'woundSettings.alternateArmorName', label: 'Alternate armor name' } : null;
  let html = editable ? `<div data-sheet-thresholds>${thresholds}</div>` : thresholds;
  html += sheetFieldHTML(main.name, mainField, { left: 31.2, top: 92.3, width: 12.6, height: 1.5, fontSize: 1 });
  html += sheetFieldHTML(alternate.name, alternateField, { left: 33.7, top: 94.15, width: 10.1, height: 1.5, fontSize: 1 });
  return html;
}

export class RunnerPrintSheet extends HTMLElement {
  set character(character) {
    this.innerHTML = printContentHTML(character, true);
  }

  fitPersonalityEntry(input) {
    input.style.fontSize = `${personalityFontSize(input.value, parseFloat(input.style.width))}cqw`;
  }

  refreshRatings(character, input, remaining) {
    const path = input.dataset.inlinePath;
    const { first, continued } = sheetSkillPages(character);
    if (path.startsWith('attributes.')) {
      this.querySelector('[data-sheet-skills]').innerHTML = sheetSkillRowsHTML(first, true);
      this.querySelector('[data-sheet-continuation]').innerHTML = sheetSkillsContinuedHTML(continued, true);
      this.querySelector('[data-sheet-thresholds]').innerHTML = sheetWoundThresholdsHTML(character);
    } else if (path.startsWith('skills.')) {
      const rows = [...first, ...continued];
      this.querySelectorAll('[data-sheet-pool]').forEach((cell, index) => {
        cell.textContent = rows[index].pool;
      });
      for (const rating of this.querySelectorAll(`[data-inline-path="${path}"]`)) {
        if (rating !== input) rating.value = input.valueAsNumber;
      }
    }
    this.querySelector('[data-sheet-balance]').textContent = 'Remaining: ' + money(remaining);
  }
}

customElements.define('runner-print-sheet', RunnerPrintSheet);
