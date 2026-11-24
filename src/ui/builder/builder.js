import { AMP_PROFILES, EMERGED_AMP, SHADOW_AMP_RULES_SOURCE, makeAmp } from '../../domain/data/amp-profiles.js';
import { CONCEPTS, conceptsForRole } from '../../domain/data/concepts.js';
import { AMP_GROUP, ATTRIBUTES, ENTRY_LIST, ITEM_TYPE, LEVELS, LIMITS, NO_WOUND_ATTRIBUTE, RANDOM_CONCEPT, ROLE, WOUND_TYPE } from '../../domain/data/rules.js';
import { CATALOG } from '../../domain/data/catalog.js';
import {
  PERSONALITY_ENTRY_COUNT,
  PERSONALITY_ENTRY_LENGTH,
  PERSONALITY_LABELS
} from '../../domain/data/personality.js';
import { abbreviatedAttribute, getSpecializations, linkedAttributes, SKILLS, skillRule, specializationAttribute, specializationOptions, TASKING } from '../../domain/specializations.js';
import { generateCharacter } from '../../domain/generator.js';
import {
  money,
  blank,
  calc,
  equipArmorAmp,
  isFreeCommlink,
  priceSkill,
  priceAmp,
  woundArmor,
  ALTERNATE_WOUND_PRESETS
} from '../../domain/model.js';
import { compareNamedEntries, compareNames, normalizeName } from '../../domain/names.js';
import { toggleRiskReduction } from '../../domain/risk-reduction.js';
import { readSavedCharacters, restoreCharacter, writeSavedCharacters } from '../../infrastructure/character-storage.js';
import { escapeHTML, FIELD_KIND, FIELD_PATH, inlineInputHTML, optionHTML } from '../html.js';
import { infoIcon } from '../components/info.js';
import '../components/entry-list.js';
import { specializationPickerHTML } from './specialization-picker.js';
import '../components/field.js';
import '../components/panel.js';
import './catalog-item.js';
import { CATALOG_FILTER, catalogPanelHTML } from './catalog.js';
import { printCharacter } from '../print-sheet.js';
import './budget.js';
import './portrait-editor.js';

const TAB = Object.freeze({
  Identity: 'identity',
  Attributes: 'attributes',
  Skills: 'skills',
  ShadowAmps: 'magic',
  Gear: 'gear',
  Personality: 'personality',
  Print: 'print'
});

const ACTION = Object.freeze({
  Generate: 'generate',
  Reset: 'reset',
  Save: 'save',
  DeleteSaved: 'delete',
  ExportJSON: 'json',
  PrintPDF: 'pdf',
  Print: 'print',
  AddSkill: 'addskill',
  AddKnowledge: 'addknowledge',
  AddAmp: 'addamp',
  AddItem: 'additem',
  EditPortrait: 'editportrait',
  ClearPortrait: 'clearportrait'
});

const ampReviewNote = sourceStr => sourceStr
  ? `Review Amp components and rating, ${sourceStr}.`
  : `Review the general Shadow Amp rules, ${SHADOW_AMP_RULES_SOURCE}.`;
const gearCatalog = {};
for (const [type, items] of Object.entries(CATALOG)) {
  for (const item of items) {
    if (AMP_PROFILES[item.name]?.group === AMP_GROUP.WeaponAmp) continue;
    const category = type === ITEM_TYPE.Equipment ? item.group : type[0].toUpperCase() + type.slice(1);
    const entry = type === ITEM_TYPE.Vehicle ? { ...item, type: ITEM_TYPE.Amp, cost: priceAmp(item) } : { ...item, type };
    (gearCatalog[category] ??= []).push({ ...entry, category });
  }
}
const catalogs = {
  [TAB.Gear]: Object.values(gearCatalog).flat(),
  [TAB.ShadowAmps]: Object.entries(AMP_PROFILES).map(([nameStr, profileObj]) => ({
    ...profileObj,
    name: nameStr,
    type: ITEM_TYPE.Amp,
    category: profileObj.group,
    cost: priceAmp(profileObj)
  }))
};
export { upgradeGeneratedAttribute } from '../../domain/generator.js';

export class AnarchyBuilder extends HTMLElement {
  constructor() {
    super();
    this.s = blank();
    this.tab = TAB.Print;
    this.skillAttributesVisible = false;
    this.notice = '';
    this.catalogFilters = {
      [TAB.Gear]: { [CATALOG_FILTER.Search]: '', [CATALOG_FILTER.Category]: '' },
      [TAB.ShadowAmps]: { [CATALOG_FILTER.Search]: '', [CATALOG_FILTER.Category]: '' }
    };
    this.loadedName = null;
  }
  connectedCallback() {
    this.render();
  }
  render() {
    const drafts = this.readSpecializationDrafts();
    this.innerHTML = this.layoutHTML(Object.keys(this.saves).sort(), this.tabContentHTML());
    this.updateBudget();
    this.bind();
    this.restoreSpecializationDrafts(drafts);
    this.mountPrintSheet();
  }

  readSpecializationDrafts() {
    if (this.tab !== TAB.Skills) return [];
    return Array.from(this.querySelectorAll('runner-specialization-picker'), pickerObj => pickerObj.draft).filter(Boolean);
  }

  restoreSpecializationDrafts(draftsArr) {
    for (const draftObj of draftsArr) {
      const index = this.s.skills.findIndex(skillObj => skillObj.name === draftObj.skill);
      this.querySelector(`runner-specialization-picker[index="${index}"]`)?.restoreDraft(draftObj);
    }
  }

  mountPrintSheet() {
    const sheet = this.querySelector('#sheetMount');
    if (sheet) sheet.character = this.s;
    this.bindInlineFields(sheet);
  }

  get saves() {
    return readSavedCharacters();
  }
  set saves(savesObj) {
    writeSavedCharacters(savesObj);
  }
  update() {
    this.render();
  }
  add(keyStr, entryObj) {
    const warning = this.entryWarning(keyStr, entryObj);
    if (warning) return this.notify(warning);
    if (keyStr === ENTRY_LIST.Amps) this.equipAmp(entryObj);
    this.s[keyStr].push(entryObj);
    this.update();
  }

  entryWarning(keyStr, entryObj) {
    if (keyStr === ENTRY_LIST.Skills && this.s.skills.length >= 11) return 'Maximum 11 skills.';
    if (keyStr === ENTRY_LIST.Amps && this.s.amps.length >= 11) return 'Maximum 11 Shadow Amps.';
    if (keyStr === ENTRY_LIST.Skills && this.s.skills.some(x => normalizeName(x.name) === normalizeName(entryObj.name))) return 'Skill already selected.';
    if (keyStr === ENTRY_LIST.Amps && this.s.amps.some(x => normalizeName(x.name) === normalizeName(entryObj.name))) return 'Shadow Amp already selected.';
    if (keyStr === ENTRY_LIST.Items && entryObj.type === ITEM_TYPE.Equipment && this.s.items.filter(x => x.type === ITEM_TYPE.Equipment).length >= 4)
      return 'Maximum 4 equipment items.';
    if (keyStr === ENTRY_LIST.Items && entryObj.type === ITEM_TYPE.Equipment && isFreeCommlink(entryObj.name)) return 'Commlinks are included for free and cannot be purchased.';
    if (keyStr === ENTRY_LIST.Items && entryObj.type === ITEM_TYPE.Weapon && this.s.items.filter(x => x.type === ITEM_TYPE.Weapon).length >= 4)
          return 'Maximum 4 weapons.';
  }

  equipAmp(ampObj) {
    if (ampObj.essenceLoss) this.changeEssence(-ampObj.essenceLoss);
    equipArmorAmp(this.s, ampObj);
  }

  remove(keyStr, index) {
    if (keyStr === ENTRY_LIST.Amps && this.s.amps[index]?.essenceLoss) this.changeEssence(this.s.amps[index].essenceLoss);
    this.s[keyStr].splice(index, 1);
    this.update()
  }
  changeEssence(amount) {
    const essence = Number(String(this.s.essence || 6).replace(',', '.'));
    if (Number.isFinite(essence)) this.s.essence = String(Math.min(6, essence + amount));
  }
  moveEntry(keyStr, from, to) {
    const entries = this.s[keyStr];
    if (from === to || from < 0 || to < 0 || from >= entries.length || to >= entries.length) return;
    const [entry] = entries.splice(from, 1);
    entries.splice(to, 0, entry);
    this.update();
    this.querySelector(`[data-reorder-list="${keyStr}"] [data-entry-index="${to}"] .reorder-handle`)?.focus();
  }
  notify(messageStr) {
    this.notice = messageStr;
    this.update()
  }
  deleteLoaded() {
    if (!this.loadedName) return;
    const name = this.loadedName;
    if (!confirm('Delete saved character ' + name + '? This cannot be undone.')) return;
    const all = this.saves;
    delete all[name];
    this.saves = all;
    this.loadedName = null;
    this.notify('Deleted saved character ' + name)
  }
  save() {
    if (!this.s.name.trim()) return this.notify('Enter a street name before saving.');
    try {
      let all = this.saves;
      all[this.s.name.trim()] = structuredClone(this.s);
      this.saves = all;
      this.loadedName = this.s.name.trim();
      this.notify('Saved locally: ' + this.s.name)
    } catch (e) {
      this.notify('Save failed: browser storage may be full. Export JSON to preserve this character.')
    }
  }
  load(nameStr) {
    if (!nameStr) return;
    const saved = this.saves[nameStr];
    if (!saved) return;
    this.s = restoreCharacter(structuredClone(saved));
    this.loadedName = nameStr;
    this.notify('Loaded ' + nameStr)
  }
  exportJSON() {
    this.download(new Blob([JSON.stringify(this.s, null, 2)], {
      type: 'application/json'
    }), (this.s.name || 'runner') + '.json')
  }
  download(blobObj, nameStr) {
    const u = URL.createObjectURL(blobObj),
      a = document.createElement('a');
    a.href = u;
    a.download = nameStr;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1500)
  }
  async importJSON(fileObj) {
    if (!fileObj) return;
    try {
      const v = JSON.parse(await fileObj.text());
      if (!v.attributes || !Array.isArray(v.skills)) throw Error('Not a character file');
      this.s = restoreCharacter(v);
      this.loadedName = null;
      this.notify('Imported ' + (v.name || 'unnamed character'))
    } catch (e) {
      this.notify('Import failed: ' + e.message)
    }
  }
  editPortrait(portraitSource) {
    if (!portraitSource) return;
    const editor = document.createElement('runner-portrait-editor');
    editor.addEventListener('portrait-ready', eventObj => {
      this.s.portrait = eventObj.detail;
      this.update();
      const trigger = typeof portraitSource === 'string' ? `[data-action="${ACTION.EditPortrait}"]` : '#portrait';
      this.querySelector(trigger)?.focus();
    }, { once: true });
    document.body.append(editor);
    editor.open(portraitSource);
  }
  randomize() {
    const generated = generateCharacter(this.s);
    if (!generated) return this.notify('No concept matches that role family.');
    const { characterObj, conceptName, iterations, upgradedAttribute } = generated;
    this.loadedName = null;
    this.lastGeneratedAttributeUpgrade = upgradedAttribute;
    this.s = characterObj;
    //console.log('Character generation spending iterations:', iterations);
    this.notify('Generated ' + conceptName + ' · ' + characterObj.metatype + ' · ' + characterObj.level +
      '; review rule warnings and Amp effects.');
  }

  addSpecialization(index, valueStr, attributeStr) {
    const chosen = String(valueStr || '').trim();
    if (!chosen) return;
    const row = this.s.skills[index];
    const existing = getSpecializations(row).filter(Boolean);
    if (existing.some(specializationStr => normalizeName(specializationStr) === normalizeName(chosen))) return this.notify('Specialization already selected.');
    row.specializations = [...existing, chosen];
    if (attributeStr) row.specializationAttributes = { ...row.specializationAttributes, [normalizeName(chosen)]: attributeStr };
    row.specialization = '';
    this.update();
  }
  removeSpecialization(skillIndex, index) {
    const row = this.s.skills[skillIndex];
    const specializations = getSpecializations(row);
    row.specializations = specializations.filter((_, j) => j !== index);
    if (row.specializationAttributes) delete row.specializationAttributes[normalizeName(specializations[index])];
    row.specialization = '';
    this.update();
  }
  specializationPicker(skillObj, index) {
    const occupied = new Set(getSpecializations(skillObj).map(normalizeName));
    const options = specializationOptions(skillObj.name)
      .filter(([value]) => !occupied.has(normalizeName(value)))
      .sort(([firstNameStr], [secondNameStr]) => firstNameStr.localeCompare(secondNameStr))
      .flatMap(([value, codeStr]) => {
        const codes = codeStr.split('/');
        return codes.map(initialStr => {
          const attribute = ATTRIBUTES.find(nameStr => nameStr[0] === initialStr);
          return `<option value="${escapeHTML(value)}" data-attribute="${attribute}">${escapeHTML(value)} (${abbreviatedAttribute(attribute)})</option>`;
        });
      })
      .join('');
    const attributes = linkedAttributes(skillObj);
    const preferred = specializationAttribute(skillObj, '');

    return specializationPickerHTML({ index, skillName: skillObj.name, options, attributes, preferred });
  }

  specializationBadges(skillObj, index) {
    const badges = getSpecializations(skillObj)
      .map((value, badgeIndex) => value ? this.specializationBadgeHTML({ skillObj, valueStr: value, skillIndex: index, badgeIndex }) : '')
      .join('');
    return badges ? `<div class="specialization-badges">${badges}</div>` : '';
  }

  specializationBadgeHTML({ skillObj, valueStr, skillIndex, badgeIndex }) {
    const label = escapeHTML(valueStr);
    const code = abbreviatedAttribute(specializationAttribute(skillObj, valueStr));
    return [
      `<span class="specialization-badge">${label}${code ? ` <span class="specialization-attribute">${code}</span>` : ''}`,
        `<button type="button" aria-label="Remove ${label}" title="Remove specialization" data-remove-specialization="${skillIndex}:${badgeIndex}">×</button>`,
      '</span>'
    ].join('');
  }

  field(labelStr, pathStr, { type: typeStr = FIELD_KIND.Text, options: optionsArr, value, className: classNameStr, rows } = {}) {
    const fieldValue = value ?? pathStr.split('.').reduce((recordObj, keyStr) => recordObj[keyStr], this.s);
    const optionAttribute = optionsArr ? this.fieldOptionsAttribute(optionsArr) : '';
    const classAttribute = classNameStr ? ` class="${classNameStr}"` : '';
    const rowsAttribute = rows ? ` rows="${rows}"` : '';
    return `<runner-field label="${escapeHTML(labelStr)}" path="${escapeHTML(pathStr)}" value="${escapeHTML(fieldValue)}" kind="${typeStr}" ${optionAttribute}${classAttribute}${rowsAttribute}></runner-field>`;
  }

  fieldOptionsAttribute(optionsArr) {
    const serialized = JSON.stringify(optionsArr).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll("'", '&#39;');
    return `options='${serialized}'`;
  }

  section(titleStr, contentStr, attributesStr = '') {
    return `<runner-panel heading="${escapeHTML(titleStr)}"${attributesStr}>${contentStr}</runner-panel>`;
  }

  updateBudget(budgetObj = calc(this.s)) {
    const { level, metatype } = this.s;
    this.querySelector('runner-budget').summary = { budget: budgetObj, limit: LEVELS[level].budget, level, metatype };
  }

  tabContentHTML() {
    switch (this.tab) {
      case TAB.Identity:
        return this.section('Identity & generation', this.identityHTML()) + this.section('Portrait', this.portraitHTML());
      case TAB.Attributes:
        return this.section('Attributes', this.attributesHTML(), ' class="panel-with-control"') +
          this.section('Skill attributes', this.skillAttributesHTML(),
            ` id="skill-attributes-panel" class="panel-with-control"${this.skillAttributesVisible ? '' : ' hidden'}`) +
          this.section('Wounds', this.woundsHTML());
      case TAB.Skills:
        return this.section('Skills', this.skillsHTML());
      case TAB.ShadowAmps:
        return this.section('Shadow Amps', this.ampsHTML(), ' class="amps-panel"');
      case TAB.Gear:
        return this.section('Weapons, spells, armor & equipment', this.gearHTML());
      case TAB.Personality:
        return this.section('Personality & background', this.personalityHTML());
      case TAB.Print:
        return this.section('Exact-template print preview', this.printPreviewHTML(), ' class="print-panel"');
      default:
        return '';
    }
  }

  identityHTML() {
    const { role, concept, personality } = this.s;
    const availableConcepts = [...conceptsForRole(role)].sort(compareNamedEntries);
    const concepts = [RANDOM_CONCEPT, ...availableConcepts.map(conceptObj => conceptObj.name)];
    const source = availableConcepts.find(conceptObj => conceptObj.name === concept)?.source;

    return [
      '<div class="formgrid">',
        this.field('Street name', FIELD_PATH.Name),
        this.field('Metatype', 'metatype', { options: Object.keys(LIMITS) }),
        this.field('Level of play', 'level', { options: Object.keys(LEVELS) }),
        this.field('Role family', FIELD_PATH.Role, { options: [ROLE.Any, ...Object.keys(CONCEPTS)] }),
        this.field('Concept', 'concept', { options: concepts }),
      '</div>',
      source ? `<p class="muted">Concept reference · ${escapeHTML(source)}</p>` : '',
      `<label class="check"><input type="checkbox" data-check="personality" ${personality ? 'checked' : ''}> Generate personality</label>`,
      '<div class="actions">',
        `<button data-action="${ACTION.Generate}" class="primary">Generate character</button>`,
        `<button data-action="${ACTION.Reset}">New blank character</button>`,
      '</div>',
      '<p class="muted">The selected role and concept constrain the generator. New skills begin at rating 3.</p>'
    ].join('');
  }

  portraitHTML() {
    const { portrait } = this.s;
    return [
      '<input type="file" id="portrait" accept="image/*" aria-label="Upload character portrait">',
      '<p class="muted">Uploaded image is stored inside character JSON and placed on the print sheet.</p>',
      portrait ? this.portraitControlsHTML(portrait) : ''
    ].join('');
  }

  portraitControlsHTML(portraitStr) {
    return [
      `<img class="portrait-preview" src="${escapeHTML(portraitStr)}" alt="Portrait">`,
      `<button data-action="${ACTION.EditPortrait}">Adjust portrait</button>`,
      `<button data-action="${ACTION.ClearPortrait}">Remove portrait</button>`
    ].join('');
  }

  attributesHTML() {
    const limits = LIMITS[this.s.metatype];
    const fields = ATTRIBUTES.map((attributeStr, index) =>
      this.field(`${attributeStr} (max ${limits[index]})`, `attributes.${attributeStr}`, { type: FIELD_KIND.Number }));

    return [
      `<button type="button" class="panel-control" id="skill-attributes-toggle" aria-label="Skill attributes" aria-controls="skill-attributes-panel" aria-expanded="${this.skillAttributesVisible}">${infoIcon}</button>`,
      '<div class="formgrid">',
        ...fields,
        this.field(`Edge (metatype baseline ${limits[5]})`, FIELD_PATH.Edge, { type: FIELD_KIND.Number }),
        this.field('Essence', 'essence'),
      '</div>',
      '<p class="muted">The final point at the metatype maximum costs 20,000¥. Metatype and level restrictions warn but never block edits.</p>'
    ].join('');
  }

  woundsHTML() {
    const { main, alternate } = woundArmor(this.s);
    const { alternateType, alternateAttribute, alternateArmorIncrease, vehicleBody } = this.s.woundSettings;
    const attributes = alternateType === WOUND_TYPE.Mental ? ATTRIBUTES : [NO_WOUND_ATTRIBUTE, ...ATTRIBUTES];
    const vehicle = alternateType === WOUND_TYPE.Vehicle;
    const matrix = alternateType === WOUND_TYPE.Matrix;
    const alternateFields = vehicle ? [
      this.field('Body', FIELD_PATH.VehicleBody, {
        type: FIELD_KIND.Number, value: vehicleBody ?? this.s.attributes[alternateAttribute] ?? ''
      }),
      this.field('Armor', FIELD_PATH.AlternateArmorIncrease, { type: FIELD_KIND.Number, value: alternateArmorIncrease ?? 0 })
    ] : [
      this.field('Name', FIELD_PATH.AlternateArmorName, { value: alternate.name }),
      matrix && alternateAttribute !== NO_WOUND_ATTRIBUTE ? '' :
        this.field(matrix ? 'Firewall rating' : 'Armor increase', FIELD_PATH.AlternateArmorIncrease, {
          type: FIELD_KIND.Number, value: matrix ? alternateArmorIncrease ?? '' : alternate.protection
        })
    ];
    return [
      '<div class="formgrid wound-settings">',
        '<fieldset><legend>Main armor, physical</legend>',
          this.field('Name', FIELD_PATH.MainArmorName, { value: main.name }),
          this.field('Armor increase', FIELD_PATH.MainArmorIncrease, { type: FIELD_KIND.Number, value: main.protection }),
        '</fieldset>',
        '<fieldset><legend>Alternate wounds</legend>',
          this.field('Type', FIELD_PATH.AlternateType, { options: Object.keys(ALTERNATE_WOUND_PRESETS) }),
          this.field('Attribute', FIELD_PATH.AlternateAttribute, { options: attributes }),
        '</fieldset>',
        '<fieldset><legend>Alternate armor</legend>',
          ...alternateFields,
        '</fieldset>',
      '</div>',
      '<p class="muted">A selected attribute supplies Firewall for Matrix wounds or the default Body for Vehicle damage.</p>'
    ].join('');
  }

  skillAttributesHTML() {
    const skills = new Map(this.s.skills.map(skillObj => [skillObj.name, skillObj]));
    for (const name of this.availableSkills()) {
      if (!skills.has(name)) skills.set(name, { name });
    }
    const entries = [...skills.values()].sort(compareNamedEntries).map((skillObj, index) => {
      const uses = Object.entries(skillRule(skillObj.name)?.uses ?? {});
      const description = uses.length
        ? uses.map(([attributeStr, descriptionStr]) => `${attributeStr} — ${descriptionStr}`).join('\n')
        : `This saved skill uses ${skillObj.attribute || 'the linked attribute selected in the Skills tab'}.`;
      return [
        '<li>',
          `<div><strong>${escapeHTML(skillObj.name)}</strong><span class="muted">${escapeHTML(linkedAttributes(skillObj).join(', '))}</span></div>`,
          this.infoHTML(`About ${skillObj.name}`, description, `skill-info-${index}`),
        '</li>'
      ].join('');
    });
    return '<button type="button" class="panel-control" id="skill-attributes-close" aria-label="Hide skill attributes">×</button>' +
      `<ul class="skill-attributes">${entries.join('')}</ul>`;
  }

  skillsHTML() {
    const { skills, knowledge } = this.s;
    return [
      '<div class="actions">',
        `<button data-action="${ACTION.AddSkill}">+ Add skill</button>`,
        `<button data-action="${ACTION.AddKnowledge}">+ Knowledge skill</button>`,
      '</div>',
      knowledge.length ? `<runner-entry-list class="knowledge-grid" data-reorder-list="${ENTRY_LIST.Knowledge}">${knowledge.map((nameStr, index) =>
        this.knowledgeRowHTML(nameStr, index)).join('')}</runner-entry-list>` : '',
      `<runner-entry-list data-reorder-list="${ENTRY_LIST.Skills}">`,
        ...skills.map((skillObj, index) => this.skillRowHTML(skillObj, index)),
      '</runner-entry-list>',
      '<p class="muted">Specializations cost 2,500¥ and grant +2 when applicable. Knowledge skills cost 2,500¥ each.</p>'
    ].join('');
  }

  skillRowHTML(skillObj, index) {
    const used = new Set(this.s.skills.filter((_, i) => i !== index).map(otherSkillObj => normalizeName(otherSkillObj.name)));
    const options = [skillObj.name, ...this.availableSkills().filter(nameStr =>
      normalizeName(nameStr) !== normalizeName(skillObj.name) && !used.has(normalizeName(nameStr)))]
      .sort(compareNames)
      .map(nameStr => optionHTML(nameStr, { selected: nameStr === skillObj.name }))
      .join('');
    const cost = priceSkill(skillObj.rating) + getSpecializations(skillObj).filter(Boolean).length * 2500;
    const pools = linkedAttributes(skillObj).map(attributeStr => {
      const rating = (+skillObj.rating || 0) + (+this.s.attributes[attributeStr] || 0);
      return `· ${escapeHTML(attributeStr).toLocaleLowerCase()} ${rating}`;
    }).join(' ');

    return [
      `<div class="entry skill-entry" data-entry-index="${index}">`,
        '<div class="skill-main">',
        this.reorderHandleHTML(ENTRY_LIST.Skills, index, skillObj.name || 'skill'),
        `<label class="field skill-name"><span>Skill ${pools}</span><select data-path="skills.${index}.name">${options}</select></label>`,
        this.field('Rating', `skills.${index}.rating`, { type: FIELD_KIND.Number, className: 'rating-field' }),
        skillRule(skillObj.name) ? '' : this.field('Linked attribute', `skills.${index}.attribute`, { options: ATTRIBUTES }),
        this.specializationPicker(skillObj, index),
        `<span class="cost">${money(cost)}</span>`,
        this.removeButtonHTML(ENTRY_LIST.Skills, index, skillObj.name),
      '</div>',
        this.specializationBadges(skillObj, index),
      '</div>'
    ].join('');
  }

  availableSkills() {
    return this.s.amps.some(ampObj => ampObj.name === EMERGED_AMP) ? [...SKILLS, TASKING] : SKILLS;
  }

  infoHTML(labelStr, descriptionStr, idStr) {
    return `<runner-info label="${escapeHTML(labelStr)}" description="${escapeHTML(descriptionStr)}" description-id="${idStr}"></runner-info>`;
  }

  knowledgeRowHTML(nameStr, index) {
    return this.entryRowHTML({ keyStr: ENTRY_LIST.Knowledge, index, nameStr: nameStr || 'knowledge skill', fieldsArr: [
      this.field('Knowledge skill', `knowledge.${index}`),
      `<span class="cost">${money(2500)}</span>`
    ] });
  }

  ampsHTML() {
    return [
      this.catalogPanelHTML(TAB.ShadowAmps, 'Search Shadow Amps'),
      `<div class="actions"><button data-action="${ACTION.AddAmp}">+ Custom Shadow Amp</button>${this.field('Essence', 'essence')}</div>`,
      `<p class="muted">Each Amp rating point costs 5,000¥. See ${SHADOW_AMP_RULES_SOURCE} for the general Amp rules.</p>`,
      `<runner-entry-list data-reorder-list="${ENTRY_LIST.Amps}">`,
        ...this.s.amps.map((ampObj, index) => this.ampRowHTML(ampObj, index)),
      '</runner-entry-list>'
    ].join('');
  }

  ampRowHTML(ampObj, index) {
    const path = `amps.${index}`;
    const source = ampObj.source || 'Custom shadow amp';
    return this.entryRowHTML({ keyStr: ENTRY_LIST.Amps, index, nameStr: ampObj.name || 'Shadow Amp', fieldsArr: [
      this.field('Amp name', `${path}.name`),
      this.field('Rating', `${path}.rating`, { type: FIELD_KIND.Number, className: 'rating-field' }),
      this.field('Effect / components', `${path}.notes`, { type: FIELD_KIND.Textarea, className: 'amp-notes', rows: 1 }),
      `<span class="cost">${money(priceAmp(ampObj))}</span>`,
      this.infoHTML(`Source for ${ampObj.name || 'Shadow Amp'}`, source, `amp-source-${index}`)
    ] });
  }

  gearHTML() {
    return [
      this.catalogPanelHTML(TAB.Gear, 'Search rulebook catalog'),
      `<div class="actions"><button data-action="${ACTION.AddItem}">+ Custom entry</button></div>`,
      `<runner-entry-list data-reorder-list="${ENTRY_LIST.Items}">`,
        ...this.s.items.map((_, index) => this.itemRowHTML(index)),
      '</runner-entry-list>',
      '<p class="muted">Standard equipment and weapons cost 2,500¥. Expert weapons, spells and complex forms cost 5,000¥. Armor costs 2,500¥ per point.</p>'
    ].join('');
  }

  catalogPanelHTML(tabStr, searchLabelStr) {
    const filters = this.catalogFilters[tabStr];
    const categories = (tabStr === TAB.Gear ? Object.keys(gearCatalog) : [...new Set(catalogs[tabStr].map(itemObj => itemObj.category))]).sort(compareNames);
    return catalogPanelHTML({ searchLabel: searchLabelStr, filters, categories, results: this.catalogHTML(tabStr) });
  }

  itemRowHTML(index) {
    const path = `items.${index}`;
    return this.entryRowHTML({ keyStr: ENTRY_LIST.Items, index, nameStr: this.s.items[index].name || 'item', fieldsArr: [
      this.field('Name', `${path}.name`),
      this.field('Description / type', `${path}.description`, { className: 'item-description' }),
      this.field('Cost (¥)', `${path}.cost`, { type: FIELD_KIND.Number })
    ] });
  }

  entryRowHTML({ keyStr, index, nameStr, fieldsArr }) {
    return [
      `<div class="entry" data-entry-index="${index}">`,
        this.reorderHandleHTML(keyStr, index, nameStr),
        ...fieldsArr,
        this.removeButtonHTML(keyStr, index, nameStr),
      '</div>'
    ].join('');
  }

  removeButtonHTML(keyStr, index, nameStr) {
    return `<button type="button" data-remove="${keyStr}.${index}" aria-label="Remove ${escapeHTML(nameStr)}">×</button>`;
  }

  reorderHandleHTML(keyStr, index, nameStr) {
    const count = this.s[keyStr].length;
    if (count < 2) return '';
    return [
      '<details class="entry-reorder">',
        `<summary class="reorder-handle" aria-label="Reorder ${escapeHTML(nameStr)}, row ${index + 1} of ${count}" title="Drag to reorder or open move options"></summary>`,
        '<div class="reorder-options">',
          `<button type="button" data-move="-1" ${index === 0 ? 'disabled' : ''}>Move up</button>`,
          `<button type="button" data-move="1" ${index === count - 1 ? 'disabled' : ''}>Move down</button>`,
        '</div>',
      '</details>'
    ].join('');
  }

  personalityHTML() {
    const groups = Object.entries(PERSONALITY_LABELS).map(([keyStr, labelStr]) => {
      const values = this.s[keyStr];
      const inputs = Array.from({ length: Math.max(PERSONALITY_ENTRY_COUNT, values.length) }, (_, index) =>
        inlineInputHTML(values[index], {
          path: `${keyStr}.${index}`, label: `${labelStr} ${index + 1}`, maxLength: PERSONALITY_ENTRY_LENGTH
        }));
      return `<fieldset><legend>${labelStr}s</legend>${inputs.join('')}</fieldset>`;
    });
    return [
      '<div class="formgrid personality-fields">',
        ...groups,
      '</div>',
      '<div class="background-wide">',
        this.field('Background / notes', FIELD_PATH.Notes, { type: FIELD_KIND.Textarea }),
      '</div>',
      '<p class="muted">Background and notes are printed on the backside of the character sheet.</p>'
    ].join('');
  }

  printPreviewHTML() {
    return [
      '<div class="actions">',
        `<button class="primary" data-action="${ACTION.Print}">Print / Save as PDF</button>`,
        `<button data-action="${ACTION.ExportJSON}">Export JSON</button>`,
        `<button data-action="${ACTION.Generate}">Generate character</button>`,
      '</div>',
      '<p class="muted">You can edit some fields on the character sheet. To save a PDF, choose “Save to PDF” in your browser’s print dialog.</p>',
      '<div class="preview-frame" role="region" aria-label="Character sheet preview" tabindex="0"><runner-print-sheet id="sheetMount"></runner-print-sheet></div>'
    ].join('');
  }

  layoutHTML(namesArr, bodyStr) {
    return [
      '<div class="app">',
        this.headerHTML(namesArr),
        '<div class="layout">',
          '<aside aria-label="Character budget"><runner-budget></runner-budget></aside>',
          '<main><nav aria-label="Character builder">',
            ...Object.values(TAB).map(tabStr => this.tabButtonHTML(tabStr)),
          '</nav>',
            bodyStr,
          '</main>',
        '</div>',
        this.notice ? this.toastHTML(this.notice) : '',
      '</div>'
    ].join('');
  }

  headerHTML(namesArr) {
    return [
      '<header><div>',
        '<div class="eyebrow">SHADOWRUN ANARCHY 2.0 · GENERATOR</div>',
        '<h1>Runner Forge</h1>',
        '<p>Build, generate, save, and print a shadowrunner.</p>',
      '</div><div class="topactions">',
        '<select id="saved" aria-label="Load saved character">',
          '<option value="">Load saved character…</option>',
          ...namesArr.map(nameStr => optionHTML(nameStr)),
        '</select>',
        `<button data-action="${ACTION.Save}">Save</button>`,
        this.loadedName ? this.deleteSavedButtonHTML(this.loadedName) : '',
        '<button type="button" id="import-button">Import JSON</button>',
        '<input type="file" id="import" accept=".json,application/json" hidden>',
        `<button data-action="${ACTION.ExportJSON}">Export JSON</button>`,
        `<button data-action="${ACTION.PrintPDF}">Print / PDF</button>`,
      '</div></header>'
    ].join('');
  }

  deleteSavedButtonHTML(nameStr) {
    return `<button class="danger" data-action="${ACTION.DeleteSaved}" title="Delete ${escapeHTML(nameStr)} from local storage">Delete saved</button>`;
  }

  tabButtonHTML(tabStr) {
    const label = tabStr === TAB.ShadowAmps ? 'Shadow Amps' : tabStr === TAB.Gear ? 'Gear & Spells' : tabStr[0].toUpperCase() + tabStr.slice(1);
    const current = this.tab === tabStr ? ' aria-current="true"' : '';
    return `<button type="button" data-tab="${tabStr}"${current}>${label}</button>`;
  }

  toastHTML(noticeStr) {
    return `<div class="toast" role="status">${escapeHTML(noticeStr)}</div>`;
  }

  catalogHTML(tabStr = this.tab) {
    const { [CATALOG_FILTER.Search]: search, [CATALOG_FILTER.Category]: category } = this.catalogFilters[tabStr];
    const query = normalizeName(search);
    const chosen = new Set(this.s.items.map(itemObj => itemObj.type + '|' + itemObj.name));
    const itemNames = new Set(this.s.items.map(itemObj => normalizeName(itemObj.name)));
    const ampNames = new Set(this.s.amps.map(ampObj => normalizeName(ampObj.name)));
    const ampGear = new Set(this.s.amps.flatMap(ampObj =>
      [ampObj.name, ...(AMP_PROFILES[ampObj.name]?.replaces ?? [])]).map(normalizeName));
    const available = catalogs[tabStr].filter(itemObj => {
      if (category && itemObj.category !== category) return false;
      if (!normalizeName([itemObj.name, itemObj.group, itemObj.category].join(' ')).includes(query)) return false;
      if (itemObj.type === ITEM_TYPE.Amp) {
        return !ampNames.has(normalizeName(itemObj.name)) &&
          ![itemObj.name, ...(itemObj.replaces ?? [])].some(nameStr => itemNames.has(normalizeName(nameStr)));
      }
      return !chosen.has(itemObj.type + '|' + itemObj.name) && !ampGear.has(normalizeName(itemObj.name)) &&
        !(itemObj.type === ITEM_TYPE.Equipment && isFreeCommlink(itemObj.name));
    });
    return available.sort(compareNamedEntries).map(itemObj => this.catalogItemHTML(itemObj)).join('') ||
      '<p>No available matches.</p>';
  }

  catalogItemHTML(itemObj) {
    const price = itemObj.cost;
    const key = `${escapeHTML(itemObj.type)}|${escapeHTML(itemObj.name)}|${price}`;
    const label = escapeHTML(itemObj.name);
    const cost = `${money(price)} · ${escapeHTML(itemObj.group)}`;
    return `<runner-catalog-item data-catalog="${key}" label="${label}" cost="${cost}"></runner-catalog-item>`;
  }
  bind() {
    this.bindEntryLists();
    this.bindNavigation();
    this.bindFieldActions();
    this.bindSkillAttributes();
    this.bindSpecializations();
    this.bindCharacterFiles();
    this.bindCatalog();
  }

  bindEntryLists() {
    this.querySelectorAll('runner-entry-list').forEach(listObj => {
      listObj.addEventListener('entry-move', ({ detail: { key: keyStr, from, to } }) => this.moveEntry(keyStr, from, to));
    });
    this.querySelectorAll('[data-remove]').forEach(buttonObj => buttonObj.onclick = () => {
      const [k, i] = buttonObj.dataset.remove.split('.');
      this.remove(k, +i)
    });
  }

  bindNavigation() {
    this.querySelectorAll('[data-tab]').forEach(buttonObj => buttonObj.onclick = () => {
      this.notice = '';
      this.tab = buttonObj.dataset.tab;
      this.update();
      this.querySelector(`[data-tab="${this.tab}"]`).focus();
    });
  }

  bindFieldActions() {
    this.querySelectorAll('[data-path]').forEach(controlObj => {
      controlObj.onchange = () => this.changeField(controlObj);
    });
    this.querySelectorAll('[data-action]').forEach(buttonObj => {
      buttonObj.onclick = () => this.handleAction(buttonObj.dataset.action);
    });
  }

  bindSkillAttributes() {
    const skillAttributesToggle = this.querySelector('#skill-attributes-toggle');
    if (skillAttributesToggle) {
      const panel = this.querySelector('#skill-attributes-panel');
      const setVisible = isVisible => {
        this.skillAttributesVisible = isVisible;
        skillAttributesToggle.setAttribute('aria-expanded', String(isVisible));
        panel.hidden = !isVisible;
      };
      skillAttributesToggle.onclick = () => setVisible(!this.skillAttributesVisible);
      this.querySelector('#skill-attributes-close').onclick = () => {
        setVisible(false);
        skillAttributesToggle.focus();
      };
    }
  }

  bindSpecializations() {
    this.querySelectorAll('runner-specialization-picker').forEach(pickerObj => {
      pickerObj.addEventListener('specialization-add', ({ detail: { index, name: nameStr, attribute: attributeStr } }) =>
        this.addSpecialization(index, nameStr, attributeStr));
    });
    this.querySelectorAll('[data-remove-specialization]').forEach(buttonObj => buttonObj.onclick = () => {
      const [i, j] = buttonObj.dataset.removeSpecialization.split(':').map(Number);
      this.removeSpecialization(i, j)
    });
  }

  bindCharacterFiles() {
    this.querySelector('#saved').onchange = eventObj => this.load(eventObj.target.value);
    const importInput = this.querySelector('#import');
    const importButton = this.querySelector('#import-button');
    if (importButton) importButton.onclick = () => importInput.click();
    importInput.onchange = () => {
      const file = importInput.files[0];
      importInput.value = '';
      this.importJSON(file);
    };
    const portraitInput = this.querySelector('#portrait');
    if (portraitInput) portraitInput.onchange = () => {
      const file = portraitInput.files[0];
      portraitInput.value = '';
      this.editPortrait(file);
    };
    const check = this.querySelector('[data-check]');
    if (check) check.onchange = () => {
      this.s.personality = check.checked;
    };
  }

  bindCatalog() {
    const catalog = this.querySelector('runner-catalog');
    if (catalog) {
      catalog.addEventListener('catalog-filter', ({ detail: { key: keyStr, value } }) => {
        this.catalogFilters[this.tab][keyStr] = value;
        catalog.results = this.catalogHTML();
      });
      catalog.addEventListener('catalog-pick', ({ detail: detailObj }) => this.addCatalogItem(detailObj));
    }
  }

  changeField(controlObj) {
    const path = controlObj.dataset.path;
    const partsArr = path.split('.');
    const fieldValue = readFieldValue(controlObj, path);
    const recordObj = partsArr.slice(0, -1).reduce((recordObj, keyStr) => recordObj[keyStr], this.s);
    const key = partsArr.at(-1);

    if (!this.prepareFieldChange({ partsArr, recordObj, fieldValue })) return;
    recordObj[key] = fieldValue;
    this.applyFieldDependencies(path, fieldValue);

    // These fields have no dependent controls in their builder views.
    if (path === FIELD_PATH.Name || path === FIELD_PATH.Notes) return;
    this.update();
    if (path === FIELD_PATH.AlternateType || path === FIELD_PATH.AlternateAttribute) {
      this.querySelector(`[data-path="${path}"]`)?.focus();
    }
  }

  prepareFieldChange({ partsArr, recordObj, fieldValue }) {
    const [listKey, rowIndex, fieldName] = partsArr;
    if (fieldName !== FIELD_PATH.Name || (listKey !== ENTRY_LIST.Skills && listKey !== ENTRY_LIST.Amps)) return true;

    const isDuplicate = this.s[listKey].some((entryObj, index) => index !== Number(rowIndex) &&
      normalizeName(entryObj.name) === normalizeName(fieldValue));
    if (isDuplicate) {
      this.notify(listKey === ENTRY_LIST.Skills ? 'Skill already selected.' : 'Shadow Amp already selected.');
      return false;
    }
    if (listKey === ENTRY_LIST.Skills && recordObj.name !== fieldValue) resetSkillSpecializations(recordObj, fieldValue);
    if (listKey === ENTRY_LIST.Amps) updateAmpSource(recordObj, fieldValue);
    return true;
  }

  applyFieldDependencies(pathStr, fieldValue) {
    if (pathStr === FIELD_PATH.Role && !conceptsForRole(fieldValue).some(conceptObj => conceptObj.name === this.s.concept)) {
      this.s.concept = RANDOM_CONCEPT;
    }
    if (pathStr === FIELD_PATH.AlternateType) {
      const preset = ALTERNATE_WOUND_PRESETS[fieldValue];
      this.s.woundSettings.alternateAttribute = preset.attribute;
      this.s.woundSettings.alternateArmorName = preset.armorName ?? '';
    }
  }

  handleAction(actionStr) {
    switch (actionStr) {
      case ACTION.Generate: return this.randomize();
      case ACTION.Reset: return this.resetCharacter();
      case ACTION.Save: return this.save();
      case ACTION.DeleteSaved: return this.deleteLoaded();
      case ACTION.ExportJSON: return this.exportJSON();
      case ACTION.PrintPDF:
      case ACTION.Print: return this.print();
      case ACTION.AddSkill: return this.addNextSkill();
      case ACTION.AddKnowledge: return this.addKnowledge();
      case ACTION.AddAmp: return this.addCustomAmp();
      case ACTION.AddItem: return this.addCustomItem();
      case ACTION.EditPortrait: return this.editPortrait(this.s.portrait);
      case ACTION.ClearPortrait: return this.clearPortrait();
    }
  }

  resetCharacter() {
    if (!confirm('Start a new blank character? Unsaved changes will be lost.')) return;
    this.s = blank();
    this.loadedName = null;
    this.update();
  }

  addNextSkill() {
    const usedNamesSet = new Set(this.s.skills.map(skillObj => normalizeName(skillObj.name)));
    const name = this.availableSkills().find(skillNameStr => !usedNamesSet.has(normalizeName(skillNameStr)));
    if (!name) return this.notify('All skills are already selected.');
    this.add(ENTRY_LIST.Skills, {
      name,
      rating: 3,
      attribute: linkedAttributes({ name })[0],
      specialization: ''
    });
  }

  addKnowledge() {
    this.s.knowledge.push('');
    this.update();
  }

  addCustomAmp() {
    let name = 'New Amp';
    let number = 2;
    const usedNamesSet = new Set(this.s.amps.map(ampObj => normalizeName(ampObj.name)));
    while (usedNamesSet.has(normalizeName(name))) name = 'New Amp ' + number++;
    this.add(ENTRY_LIST.Amps, { name, rating: 1, notes: '' });
  }

  addCustomItem() {
    this.add(ENTRY_LIST.Items, { name: 'Custom item', type: ITEM_TYPE.Equipment, cost: 2500, description: '' });
  }

  clearPortrait() {
    this.s.portrait = '';
    this.update();
  }

  bindInlineFields(sheetObj) {
    const editor = sheetObj ?? this.querySelector('.personality-fields');
    if (!editor) return;
    editor.addEventListener('input', eventObj => this.editInlineField(eventObj, sheetObj));
    editor.addEventListener('focusout', eventObj => this.editInlineField(eventObj, sheetObj));
    sheetObj?.addEventListener('click', eventObj => this.toggleSheetRiskReduction(eventObj, sheetObj));
  }

  toggleSheetRiskReduction(eventObj, sheetObj) {
    const control = eventObj.target.closest('button[data-rr-keys]');
    if (!control || control.getAttribute('aria-disabled') === 'true') return;
    toggleRiskReduction(this.s, JSON.parse(control.dataset.rrKeys));
    sheetObj.refreshRiskReduction(this.s);
  }

  editInlineField(eventObj, sheetObj) {
    const inputObj = eventObj.target;
    const path = inputObj.dataset.inlinePath;
    if (!path) return;
    const partsArr = path.split('.');
    const key = partsArr.pop();
    const recordObj = partsArr.reduce((recordObj, partStr) => recordObj[partStr], this.s);
    const isArmorName = partsArr[0] === FIELD_PATH.WoundSettings;

    if (eventObj.type === 'focusout') {
      this.restoreInlineDisplay({ inputObj, sheetObj, path, recordObj, key, isArmorName });
    } else if (isArmorName) {
      recordObj[key] = inputObj.value.trim();
    } else if (Array.isArray(recordObj)) {
      setPersonalityEntry(recordObj, Number(key), inputObj.value);
    } else if (inputObj.type === FIELD_KIND.Text) {
      recordObj[key] = inputObj.value;
    } else {
      this.updateInlineRating({ inputObj, sheetObj, recordObj, key });
    }
  }

  restoreInlineDisplay({ inputObj, sheetObj, path: pathStr, recordObj, key: keyStr, isArmorName }) {
    if (isArmorName) {
      const { main, alternate } = woundArmor(this.s);
      inputObj.value = pathStr === FIELD_PATH.MainArmorName ? main.name : alternate.name;
      return;
    }
    inputObj.value = recordObj[keyStr] ?? '';
    if (Array.isArray(recordObj)) sheetObj?.fitPersonalityEntry(inputObj);
  }

  updateInlineRating({ inputObj, sheetObj, recordObj, key: keyStr }) {
    const rating = inputObj.valueAsNumber;
    if (!Number.isSafeInteger(rating) || rating === recordObj[keyStr]) return;
    recordObj[keyStr] = rating;
    if (keyStr === FIELD_PATH.Edge) return;
    const budgetObj = calc(this.s);
    this.updateBudget(budgetObj);
    sheetObj.refreshRatings(this.s, inputObj, budgetObj.remaining);
  }

  addCatalogItem({ type: typeStr, name: nameStr, cost }) {
    if (typeStr === ITEM_TYPE.Amp) {
      if (Object.hasOwn(AMP_PROFILES, nameStr)) this.add(ENTRY_LIST.Amps, makeAmp(nameStr));
      return;
    }
    if (this.s.items.some(itemObj => itemObj.type === typeStr && itemObj.name === nameStr)) return;
    this.add(ENTRY_LIST.Items, {
      type: typeStr,
      name: nameStr,
      cost,
      description: CATALOG[typeStr]?.find(itemObj => itemObj.name === nameStr)?.group || ''
    });
  }
  print() {
    if (!printCharacter(this.s)) this.notify('Allow popups to print or save PDF.');
  }

}
function readFieldValue(controlObj, pathStr) {
  if (controlObj.type !== FIELD_KIND.Number) return controlObj.value;
  const isUnsetWoundRating = controlObj.value === '' && pathStr.startsWith(FIELD_PATH.WoundSettings + '.');
  return isUnsetWoundRating ? null : Number(controlObj.value);
}

function resetSkillSpecializations(skillObj, nameStr) {
  skillObj.specialization = '';
  skillObj.specializations = [];
  delete skillObj.specializationAttributes;
  [skillObj.attribute] = linkedAttributes({ name: nameStr });
}

function updateAmpSource(ampObj, nameStr) {
  if (!Object.hasOwn(ampObj, 'source') || normalizeName(ampObj.name) === normalizeName(nameStr)) return;
  const profileName = Object.keys(AMP_PROFILES).find(profileNameStr => normalizeName(profileNameStr) === normalizeName(nameStr));
  const profile = AMP_PROFILES[profileName];
  if (ampObj.notes === AMP_PROFILES[ampObj.name]?.effect || ampObj.notes === ampReviewNote(ampObj.source)) {
    ampObj.notes = profile?.effect ?? ampReviewNote(null);
  }
  ampObj.source = profile?.source ?? null;
}

function setPersonalityEntry(entriesArr, index, valueStr) {
  const value = valueStr.slice(0, PERSONALITY_ENTRY_LENGTH).trim();
  if (value === (entriesArr[index] ?? '')) return;
  while (entriesArr.length < index) entriesArr.push('');
  entriesArr[index] = value;
  while (entriesArr.at(-1) === '') entriesArr.pop();
}

customElements.define('anarchy-builder', AnarchyBuilder);
