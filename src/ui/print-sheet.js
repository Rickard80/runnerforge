import { CATALOG } from '../domain/data/catalog.js';
import { ATTRIBUTES } from '../domain/data/rules.js';
import { calc, isFreeCommlink, money, woundArmor, woundThresholds } from '../domain/model.js';
import { normalizeName } from '../domain/names.js';
import { abbreviatedAttribute, getSpecializations, linkedAttributes, specializationAttribute } from '../domain/specializations.js';
import { escapeHTML } from './html.js';

const skillSheetRowLimit = 11;
export const sheetItemType = { weapon: 'Weapon', spell: 'Spell', 'complex form': 'Complex Form' };

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
export function printContentHTML(character) {
  const { first, continued } = sheetSkillPages(character);
  return sheetHTML(character, first) + sheetSkillsContinuedHTML(continued) + sheetNotesHTML(character.notes);
}
function sheetNotesHTML(notes) {
  const text = String(notes || '');
  if (!text.trim()) return '';
  return `<section class="sheet-notes"><div><h2>Background / notes</h2><p>${escapeHTML(text)}</p></div></section>`;
}
export function sheetSkillPages(character) {
  const first = [];
  const continued = [];
  character.skills.forEach(skill => {
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
        skill, attribute, attributeRating, specs,
        label: specs ? `${skill.name} (${specs})` : skill.name,
        attributeLabel: group.map(abbreviatedAttribute).join(', '),
        pool: ((+skill.rating || 0) + attributeRating) + (specs.length ? ' (+2)' : '')
      });
    });
  });
  return { first, continued };
}
function sheetSkillsContinuedHTML(rows) {
  if (!rows.length) return '';
  const entries = rows.map(({ skill, label, attributeLabel, pool }) =>
    `<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(skill.rating)}</td><td>${escapeHTML(attributeLabel)}</td><td>${pool}</td></tr>`);
  return '<section class="sheet-skills"><h2>Skills continued</h2><table>' +
    '<thead><tr><th scope="col">Skill</th><th scope="col">Rating</th><th scope="col">+ATT</th>' +
    '<th scope="col">Dice pool</th></tr></thead>' +
    `<tbody>${entries.join('')}</tbody></table></section>`;
}
function sheetHTML(s, skillRows) {
  const lines = (values, x, y, step, w, max, size = 1.04, transform) => values.slice(0, max)
    .map((v, i) => sheetOverlayHTML(v, x, y + i * step, w, 1.7, size, undefined, transform)).join('');
  let h = '<div class="sheet">';
  // Coordinates measured against correctedAlignment.webp (1571 × 2048), scaled as percentages.
  h += sheetOverlayHTML(s.name, 21, 4.0, 32, 3, 2.5, 'center');
  const attrX = [6.1, 15.3, 24.3, 33.1, 42.5, 51.4];
  [...ATTRIBUTES.map(a => s.attributes[a]), s.edge].forEach((value, i) => h += sheetOverlayHTML(value, attrX[i], 12.0, 6.1, 3.1, 2.0,
    'center'));
  skillRows.forEach(({ skill, label, attributeLabel, pool }, i) => {
    const y = 19.15 + i * 2.16;
    h += sheetOverlayHTML(label, 5.3, y, 24.8, 1.7, 1.2);
    h += sheetOverlayHTML(skill.rating, 31.3, y, 5, 1.7, 1.2, 'center');
    h += sheetOverlayHTML(attributeLabel, 38.25, y, 7.55, 1.7, 1.05, 'center');
    h += sheetOverlayHTML(pool, 46, y, 5, 1.7, 1.2, 'center');
  });
  h += lines(s.amps.map(v => v.name + ' (' + v.rating + ')' + (v.notes ? ' ' + v.notes : '')), 5.3, 46, 2.16, 57, 11,
    1.2);
  h += sheetOverlayHTML(s.knowledge.join(', '), 5.3, 72.6, 47, 1, 1.2);
  h += sheetOverlayHTML(s.essence, 51.6, 72.6, 7, 1, 1.2, 'center');
  const arms = s.items.filter(v => Object.hasOwn(sheetItemType, v.type));
  arms.slice(0, 4).forEach((v, i) => {
    const catalogType = CATALOG[v.type]?.find(x => normalizeName(x.name) === normalizeName(v.name))?.group;
    const description = catalogType || v.description;
    h += sheetOverlayHTML(v.name + ', ' + description, 5.3, 78 + i * 2.16, 43, 1.7, 1.2);
    h += sheetOverlayHTML(sheetItemType[v.type], 49.7, 78.2 + i * 2.16, 9, 1.7, 1, 'center')
  });
  const gear = s.items.filter(v => v.type === 'armor' || (v.type === 'equipment' && !isFreeCommlink(v.name)));
  h += lines(gear.map(v => v.name + ' ' + money(v.cost)), 5.3, 89.3, 1.76, 20, 4, 1);
  h += sheetOverlayHTML('Remaining: ' + money(calc(s).remaining), 7, 96.45, 22, 1.3, 1);
  h += sheetWoundsHTML(s);
  h += lines(s.keywords, 68.4, 38, 2.16, 26, 5, 1.2, 'rotateZ(-2deg)');
  h += lines(s.dispositions, 68.4, 54.6, 2.12, 27, 4, 1.2, 'rotateZ(2deg)');
  h += lines(s.cues, 68.4, 69.2, 2.84, 27, 5, 1.2, 'rotateZ(-1deg)');
  // Wounds are printed as filled condition markers; thresholds above are always present.
  const woundValues = [s.wounds || {}, s.mentalWounds || {}];
  woundValues.forEach((values, row) => {
    let index = 0;
    for (const key of ['light', 'serious', 'incapacitated']) {
      const count = Math.max(0, Math.min(5, +values[key] || 0));
      for (let i = 0; i < count; i++) {
        const x = 44.3 + index * 2.08;
        h += sheetWoundHTML(x, 89.88 + row * 1.2);
        index++
      }
    }
  });
  if (s.portrait) h += sheetPortraitHTML(s.portrait);
  return h + '</div>';
}

export function sheetWoundsHTML(s) {
  const { attributes, woundSettings } = s;
  const { main, alternate } = woundArmor(s);
  const { alternateType, alternateAttribute, alternateArmorIncrease, vehicleBody } = woundSettings;
  const vehicle = alternateType === 'Vehicle';
  const attribute = attributes[alternateAttribute];
  const resistance = vehicle ? vehicleBody ?? attribute :
    alternateType === 'Matrix' ? attribute ?? alternateArmorIncrease : attribute;
  const protection = vehicle ? alternateArmorIncrease ?? 0 : alternate.protection;
  const rows = [
    [91, woundThresholds('Physical', attributes.Strength)],
    [92.7, woundThresholds('Physical', attributes.Strength, main.protection)],
    [96.3, woundThresholds('Mental', attributes.Willpower)]
  ];
  if (resistance != null) rows.push([94.5, woundThresholds(alternateType, resistance, protection)]);
  const columns = [44.6, 50.1, 54.6];
  let html = rows.map(([y, thresholds]) => thresholds.map((value, index) =>
    sheetOverlayHTML(value, columns[index], y, 4.4, 1.4, 1, 'center')).join('')).join('');
  html += sheetOverlayHTML(main.name, 32.3, 92.8, 11, 1.5, 1);
  html += sheetOverlayHTML(alternate.name, 34.8, 94.55, 9.2, 1.5, 1);
  return html;
}

function sheetOverlayHTML(value, x, y, w, h = 1.65, size = 1.04, align = 'left', transform) {
  const transformStyle = transform ? 'transform: ' + transform : '';
  return `<div class="overlay" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;font-size:${size}cqw;text-align:${align};${transformStyle}">${escapeHTML(value)}</div>`;
}

function sheetWoundHTML(x, y) {
  return `<span class="wound" style="left:${x}%;top:${y}%;width:1.28%;height:.97%"></span>`;
}

function sheetPortraitHTML(portrait) {
  const mask = escapeHTML(new URL('../../assets/images/avatar-mask.webp', import.meta.url).href);
  // Align the full square mask with the painted opening on the sheet.
  const placement = 'position:absolute;left:64.8%;top:8.8%;width:32.8%;aspect-ratio:1;object-fit:cover';
  return `<img class="portrait" src="${escapeHTML(portrait)}" alt="Character portrait" style="${placement};mask:url(&quot;${mask}&quot;) center / 100% 100% no-repeat;mask-mode:luminance">`;
}

export class RunnerPrintSheet extends HTMLElement {
  set character(character) {
    this.innerHTML = printContentHTML(character);
  }
}

customElements.define('runner-print-sheet', RunnerPrintSheet);
