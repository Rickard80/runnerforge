import {
  ATTRIBUTES,
  LIMITS,
  LEVELS,
  CONCEPTS,
  conceptsForRole,
  AMP_PROFILES,
  EMERGED_AMP,
  SHADOW_AMP_RULES_SOURCE
} from '../../domain/data/rules.js';
import {
  CATALOG
} from '../../domain/data/catalog.js';
import {
  KEYWORDS,
  DISPOSITIONS,
  STREETWISE_CUES
} from '../../domain/data/personality.js';
import { abbreviatedAttribute, getSpecializations, linkedAttributes, SKILLS, skillRule, specializationAttribute, specializationOptions, TASKING } from '../../domain/specializations.js';
import { KNOWLEDGE_SKILLS } from '../../domain/data/knowledge.js';
import { makeAmp, startingKitKind, trainGeneratedRunner } from '../../domain/generation.js';
import {
  money,
  pick,
  blank,
  calc,
  equipArmorAmp,
  isFreeCommlink,
  priceSkill,
  priceAmp,
  woundArmor,
  ALTERNATE_WOUND_PRESETS
} from '../../domain/model.js';
import { normalizeName } from '../../domain/names.js';
import { readSavedCharacters, restoreCharacter, writeSavedCharacters } from '../../infrastructure/character-storage.js';
import { escapeHTML, optionHTML } from '../html.js';
import { infoIcon } from '../components/info.js';
import '../components/entry-list.js';
import { specializationPickerHTML } from './specialization-picker.js';
import '../components/field.js';
import '../components/panel.js';
import './catalog-item.js';
import { catalogPanelHTML } from './catalog.js';
import { printCharacter, sheetItemType } from '../print-sheet.js';
import './budget.js';
import './portrait-editor.js';
const ampReviewNote = source => source
  ? `Review Amp components and rating, ${source}.`
  : `Review the general Shadow Amp rules, ${SHADOW_AMP_RULES_SOURCE}.`;
const gearCatalog = {};
for (const [type, items] of Object.entries(CATALOG)) {
  for (const item of items) {
    if (AMP_PROFILES[item.name]?.group === 'Weapon Amp') continue;
    const category = type === 'equipment' ? item.group : type[0].toUpperCase() + type.slice(1);
    const entry = type === 'vehicle' ? { ...item, type: 'amp', cost: priceAmp(item) } : { ...item, type };
    (gearCatalog[category] ??= []).push({ ...entry, category });
  }
}
const catalogs = {
  gear: Object.values(gearCatalog).flat(),
  magic: Object.entries(AMP_PROFILES).map(([name, profile]) => ({
    ...profile,
    name,
    type: 'amp',
    category: profile.group,
    cost: priceAmp(profile)
  }))
};
const alphabetical = (a, b) => String(a.name ?? a).localeCompare(String(b.name ?? b), undefined, {
  sensitivity: 'base'
});
const sortedSkills = skills => [...skills].sort((a, b) => (+b.rating || 0) - (+a.rating || 0) || alphabetical(a, b));
const sortedAmps = amps => [...amps].sort(alphabetical);
const rangedWeapon = item => {
  if (item.type !== 'weapon') return false;
  const record = CATALOG.weapon?.find(w => normalizeName(w.name) === normalizeName(item.name));
  const group = String(record?.group ?? '').toLowerCase();
  if (group.includes('melee')) return false;
  if (/(ranged|pistol|rifle|shotgun|smg|machine gun|launcher|bow|crossbow|throw)/.test(group)) return true;
  return /(pistol|rifle|shotgun|smg|machine gun|launcher|bow|crossbow|taser|revolver)/i.test(item.name);
};
const meleeWeapon = item => item.type === 'weapon' && !rangedWeapon(item);
const sortedItems = items => [...items].sort((a, b) => {
  const rank = item => rangedWeapon(item) ? 0 : meleeWeapon(item) ? 1 : item.type === 'armor' ? 2 :
    Object.hasOwn(sheetItemType, item.type) ? 3 : 4;
  return rank(a) - rank(b) || alphabetical(a, b);
});
const gearPool = (type, used) => (CATALOG[type] || []).filter(v => !used.has(normalizeName(v.name)) && !(type ===
  'equipment' && isFreeCommlink(v.name)));
const pickUnique = (pool, count) => {
  const copy = [...pool],
    out = [];
  while (copy.length && out.length < count) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};
// Avoid repeated template stems or endings within a character's generated personality.
const dispositionEndings = [
  ['even when the payout is tempting', 'despite the payout'],
  ['especially when everyone else is panicking', 'when others panic'],
  ['unless the facts prove otherwise', 'until proven wrong'],
  ['before the situation turns ugly', 'before trouble hits']
];
const personalityParts = text => {
  const value = String(text).trim();
  const cue = value.split(/\s+—\s*/);
  if (cue.length > 1) return [cue[0].trim(), cue.slice(1).join(' — ').trim()];
  const disposition = value.replace(/\.$/, '');
  for (const [original, shortened] of dispositionEndings) {
    const ending = [original, shortened].find(ending => disposition.endsWith(' ' + ending));
    if (ending) return [disposition.slice(0, -ending.length).trimEnd(), original];
  }
  return [value, ''];
};
const pickDistinctPersonality = (pool, count) => {
  const available = [...new Set(pool)];
  const selected = [],
    first = new Set(),
    second = new Set();
  while (selected.length < count) {
    const choices = available.filter(value => {
      const [a, b] = personalityParts(value);
      return !first.has(normalizeName(a)) && (!b || !second.has(normalizeName(b)))
    });
    if (!choices.length) break;
    const value = pick(choices),
      [a, b] = personalityParts(value);
    selected.push(value);
    first.add(normalizeName(a));
    if (b) second.add(normalizeName(b));
    available.splice(available.indexOf(value), 1);
  }
  return selected;
};


export { upgradeGeneratedAttribute } from '../../domain/generation.js';

export class AnarchyBuilder extends HTMLElement {
  constructor() {
    super();
    this.s = blank();
    this.tab = 'identity';
    this.skillAttributesVisible = false;
    this.notice = '';
    this.catalogFilters = {
      gear: { search: '', category: '' },
      magic: { search: '', category: '' }
    };
    this.loadedName = null;
  }
  connectedCallback() {
    this.render();
  }
  get saves() {
    return readSavedCharacters();
  }
  set saves(v) {
    writeSavedCharacters(v);
  }
  update() {
    this.render();
  }
  add(key, obj) {
    if (key === 'skills' && this.s.skills.length >= 11) return this.notify('Maximum 11 skills.');
    if (key === 'amps' && this.s.amps.length >= 11) return this.notify('Maximum 11 Shadow Amps.');
    if (key === 'skills' && this.s.skills.some(x => normalizeName(x.name) === normalizeName(obj.name))) return this
      .notify('Skill already selected.');
    if (key === 'amps' && this.s.amps.some(x => normalizeName(x.name) === normalizeName(obj.name))) return this
      .notify('Shadow Amp already selected.');
    if (key === 'items' && obj.type === 'equipment' && this.s.items.filter(x => x.type === 'equipment').length >= 4)
      return this.notify('Maximum 4 equipment items.');
    if (key === 'items' && obj.type === 'equipment' && isFreeCommlink(obj.name)) return this.notify(
      'Commlinks are included for free and cannot be purchased.');
    if (key === 'items' && obj.type === 'weapon' && this.s.items.filter(x => x.type === 'weapon').length >= 4)
    return this.notify('Maximum 4 weapons.');
    if (key === 'amps') {
      if (obj.essenceLoss) this.changeEssence(-obj.essenceLoss);
      equipArmorAmp(this.s, obj);
    }
    this.s[key].push(obj);
    this.update()
  }
  remove(key, i) {
    if (key === 'amps' && this.s.amps[i]?.essenceLoss) this.changeEssence(this.s.amps[i].essenceLoss);
    this.s[key].splice(i, 1);
    this.update()
  }
  changeEssence(amount) {
    const essence = Number(String(this.s.essence || 6).replace(',', '.'));
    if (Number.isFinite(essence)) this.s.essence = String(Math.min(6, essence + amount));
  }
  moveEntry(key, from, to) {
    const entries = this.s[key];
    if (from === to || from < 0 || to < 0 || from >= entries.length || to >= entries.length) return;
    const [entry] = entries.splice(from, 1);
    entries.splice(to, 0, entry);
    this.update();
    this.querySelector(`[data-reorder-list="${key}"] [data-entry-index="${to}"] .reorder-handle`)?.focus();
  }
  notify(msg) {
    this.notice = msg;
    this.update()
  }
  clearNotice() {
    if (!this.notice) return;
    this.notice = '';
    const toast = this.querySelector('.toast');
    if (toast) {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove(), {
        once: true
      })
    }
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
  load(name) {
    if (!name) return;
    const saved = this.saves[name];
    if (!saved) return;
    this.s = restoreCharacter(structuredClone(saved));
    this.loadedName = name;
    this.notify('Loaded ' + name)
  }
  exportJSON() {
    this.download(new Blob([JSON.stringify(this.s, null, 2)], {
      type: 'application/json'
    }), (this.s.name || 'runner') + '.json')
  }
  download(blob, name) {
    const u = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1500)
  }
  async importJSON(file) {
    if (!file) return;
    try {
      const v = JSON.parse(await file.text());
      if (!v.attributes || !Array.isArray(v.skills)) throw Error('Not a character file');
      this.s = restoreCharacter(v);
      this.loadedName = null;
      this.notify('Imported ' + (v.name || 'unnamed character'))
    } catch (e) {
      this.notify('Import failed: ' + e.message)
    }
  }
  editPortrait(source) {
    if (!source) return;
    const editor = document.createElement('runner-portrait-editor');
    editor.addEventListener('portrait-ready', event => {
      this.s.portrait = event.detail;
      this.update()
    });
    document.body.append(editor);
    editor.open(source);
  }
  randomize() {
    const s = blank();
    const options = conceptsForRole(this.s.role).filter(c => this.s.concept === 'Random' || c.name === this.s.concept);
    if (!options.length) return this.notify('No concept matches that role family.');
    this.loadedName = null;
    const bag = options.flatMap(c => Array(c.weight).fill(c));
    const c = pick(bag);
    s.level = this.s.level;
    s.role = this.s.role;
    s.concept = this.s.concept;
    s.personality = this.s.personality;
    s.metatype = c.metatype ?? pick(['Human', 'Human', 'Elf', 'Dwarf', 'Ork', 'Troll']);
    s.edge = LIMITS[s.metatype][5];
    s.name = c.name + ' ' + Math.floor(Math.random() * 90 + 10);
    if (s.personality) {
      s.keywords = [s.metatype, c.name, pick(KEYWORDS), pick(
        ['Smog-choked Aubur', 'Gilded Bellevue', 'Neon Downtown', 'Salt-crusted Everett', 'Scorched Barrens', 'Lawless Redmond', 'Striving Renton', 'Agri-corp Snohomish', 'Rain-slicked Tacoma'])];
      s.dispositions = pickDistinctPersonality(DISPOSITIONS, 2);
      s.cues = pickDistinctPersonality(STREETWISE_CUES, 2)
    }
    const awakened = CONCEPTS.Awakened.includes(c);
    const spellCount = c.spellCount ?? (awakened ? 2 : 0);
    const emerged = c.amps.includes(EMERGED_AMP);
    const ampNames = [...c.amps];
    if (c.vehicleGroup) {
      const vehicles = c.vehicleGroup === 'Any' ? CATALOG.vehicle :
        CATALOG.vehicle.filter(vehicle => vehicle.group === c.vehicleGroup);
      ampNames.push(pick(vehicles).name);
    }
    if (c.randomDrone) {
      const drones = Object.keys(AMP_PROFILES).filter(name => {
        const { group, stationary } = AMP_PROFILES[name];
        return group === 'Drone' && !stationary && !ampNames.includes(name);
      });
      ampNames.push(pick(drones));
    }
    const used = new Set(ampNames.flatMap(name => AMP_PROFILES[name].replaces ?? []).map(normalizeName));
    if (emerged) ['Cyberdeck', 'Datajack', 'Trodes'].forEach(name => used.add(normalizeName(name)));
    const addCatalog = (type, entry) => {
      if (!entry || used.has(normalizeName(entry.name))) return;
      used.add(normalizeName(entry.name));
      s.items.push({
        name: entry.name,
        type,
        cost: entry.cost,
        description: entry.group || ''
      })
    };
    const armorChoices = CATALOG.armor || [];
    addCatalog('armor', pick(armorChoices));
    const ranged = gearPool('weapon', used).filter(v => rangedWeapon({
      type: 'weapon',
      name: v.name
    }));
    const melee = gearPool('weapon', used).filter(v => !rangedWeapon({
      type: 'weapon',
      name: v.name
    }));
    const rangedFocus = c.skills.includes('Ranged Weapons');
    const weaponCount = !awakened && rangedFocus ? 2 : 1;
    const chosenWeapons = pickUnique(rangedFocus ? ranged : melee, weaponCount);
    if (!chosenWeapons.length) chosenWeapons.push(...pickUnique(gearPool('weapon', used), 1));
    chosenWeapons.forEach(v => addCatalog('weapon', v));
    const spells = gearPool('spell', used).filter(item => !c.spellGroup || item.group === c.spellGroup);
    pickUnique(spells, spellCount).forEach(v => addCatalog('spell', v));
    if (emerged) pickUnique(gearPool('complex form', used), 2).forEach(v => addCatalog('complex form', v));
    const equipment = c.equipment ?? [];
    equipment.forEach(name => addCatalog('equipment', CATALOG.equipment.find(item => item.name === name)));
    const equipmentPool = gearPool('equipment', used).filter(item => !startingKitKind(item.name));
    const equipmentCount = Math.max(0, Math.floor(Math.random() * 4) + 1 - equipment.length);
    pickUnique(equipmentPool, equipmentCount).forEach(v => addCatalog('equipment', v));
    const knowledgeCount = 1 + Math.floor(Math.random() * 3) + Number(s.level === 'Prime Runner');
    s.knowledge = pickUnique(KNOWLEDGE_SKILLS, knowledgeCount);
    const { iterations, upgradedAttribute } = trainGeneratedRunner(s, c, ampNames);
    this.lastGeneratedAttributeUpgrade = upgradedAttribute;
    s.skills = sortedSkills(s.skills);
    s.amps = sortedAmps(s.amps);
    s.items = sortedItems(s.items);
    this.s = s;
    console.log('Character generation spending iterations:', iterations);
    this.notify('Generated ' + c.name + ' · ' + s.metatype + ' · ' + s.level +
      '; review rule warnings and Amp effects.');
  }

  addSpecialization(i, value, attribute) {
    const chosen = String(value || '').trim();
    if (!chosen) return;
    const row = this.s.skills[i];
    const existing = getSpecializations(row).filter(Boolean);
    if (existing.some(v => normalizeName(v) === normalizeName(chosen))) return this.notify('Specialization already selected.');
    row.specializations = [...existing, chosen];
    if (attribute) row.specializationAttributes = { ...row.specializationAttributes, [normalizeName(chosen)]: attribute };
    row.specialization = '';
    this.update();
  }
  removeSpecialization(i, index) {
    const row = this.s.skills[i];
    const specializations = getSpecializations(row);
    row.specializations = specializations.filter((_, j) => j !== index);
    if (row.specializationAttributes) delete row.specializationAttributes[normalizeName(specializations[index])];
    row.specialization = '';
    this.update();
  }
  specializationPicker(skill, index) {
    const occupied = new Set(getSpecializations(skill).map(normalizeName));
    const options = specializationOptions(skill.name)
      .filter(([value]) => !occupied.has(normalizeName(value)))
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([value, code]) => {
        const codes = code.split('/');
        return codes.map(initial => {
          const attribute = ATTRIBUTES.find(name => name[0] === initial);
          return `<option value="${escapeHTML(value)}" data-attribute="${attribute}">${escapeHTML(value)} (${abbreviatedAttribute(attribute)})</option>`;
        });
      })
      .join('');
    const attributes = linkedAttributes(skill);
    const preferred = specializationAttribute(skill, '');

    return specializationPickerHTML({ index, skillName: skill.name, options, attributes, preferred });
  }

  specializationBadges(skill, index) {
    const badges = getSpecializations(skill)
      .map((value, badgeIndex) => value ? this.specializationBadgeHTML(skill, value, index, badgeIndex) : '')
      .join('');
    return badges ? `<div class="specialization-badges">${badges}</div>` : '';
  }

  specializationBadgeHTML(skill, value, skillIndex, badgeIndex) {
    const label = escapeHTML(value);
    const code = abbreviatedAttribute(specializationAttribute(skill, value));
    return [
      `<span class="specialization-badge">${label}${code ? ` <span class="specialization-attribute">${code}</span>` : ''}`,
        `<button type="button" aria-label="Remove ${label}" title="Remove specialization" data-remove-specialization="${skillIndex}:${badgeIndex}">×</button>`,
      '</span>'
    ].join('');
  }

  field(label, path, type = 'text', options = null, value) {
    const bits = path.split('.');
    const v = value ?? bits.reduce((record, key) => record[key], this.s);
    const optionAttribute = options ? this.fieldOptionsAttribute(options) : '';
    return `<runner-field label="${escapeHTML(label)}" path="${escapeHTML(path)}" value="${escapeHTML(v ?? '')}" kind="${type}" ${optionAttribute}></runner-field>`;
  }

  fieldOptionsAttribute(options) {
    const serialized = JSON.stringify(options).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll("'", '&#39;');
    return `options='${serialized}'`;
  }

  section(title, content, attributes = '') {
    return `<runner-panel heading="${escapeHTML(title)}"${attributes}>${content}</runner-panel>`;
  }

  render() {
    const drafts = this.tab === 'skills'
      ? Array.from(this.querySelectorAll('runner-specialization-picker'), picker => picker.draft).filter(Boolean)
      : [];
    const budget = calc(this.s);
    const tabs = ['identity', 'attributes', 'skills', 'magic', 'gear', 'personality', 'print'];
    const names = Object.keys(this.saves).sort();
    const body = this.tabContentHTML();

    this.innerHTML = this.layoutHTML(names, tabs, body);
    const { level, metatype } = this.s;
    this.querySelector('runner-budget').summary = { budget, limit: LEVELS[level].budget, level, metatype };
    this.bind();
    for (const draft of drafts) {
      const index = this.s.skills.findIndex(skill => skill.name === draft.skill);
      this.querySelector(`runner-specialization-picker[index="${index}"]`)?.restoreDraft(draft);
    }
    if (this.tab === 'print') this.querySelector('#sheetMount').character = this.s;
  }

  tabContentHTML() {
    switch (this.tab) {
      case 'identity':
        return this.section('Identity & generation', this.identityHTML()) + this.section('Portrait', this.portraitHTML());
      case 'attributes':
        return this.section('Attributes', this.attributesHTML(), ' class="panel-with-control"') +
          this.section('Skill attributes', this.skillAttributesHTML(),
            ` id="skill-attributes-panel" class="panel-with-control"${this.skillAttributesVisible ? '' : ' hidden'}`) +
          this.section('Wounds', this.woundsHTML());
      case 'skills':
        return this.section('Skills', this.skillsHTML());
      case 'magic':
        return this.section('Shadow Amps', this.ampsHTML(), ' class="amps-panel"');
      case 'gear':
        return this.section('Weapons, spells, armor & equipment', this.gearHTML());
      case 'personality':
        return this.section('Personality & background', this.personalityHTML());
      case 'print':
        return this.section('Exact-template print preview', this.printPreviewHTML(), ' class="print-panel"');
      default:
        return '';
    }
  }

  identityHTML() {
    const { role, concept, personality } = this.s;
    const availableConcepts = [...conceptsForRole(role)].sort(alphabetical);
    const concepts = ['Random', ...availableConcepts.map(c => c.name)];
    const source = availableConcepts.find(c => c.name === concept)?.source;

    return [
      '<div class="formgrid">',
        this.field('Street name', 'name'),
        this.field('Metatype', 'metatype', 'text', Object.keys(LIMITS)),
        this.field('Level of play', 'level', 'text', Object.keys(LEVELS)),
        this.field('Role family', 'role', 'text', ['Any', ...Object.keys(CONCEPTS)]),
        this.field('Concept', 'concept', 'text', concepts),
      '</div>',
      source ? `<p class="muted">Concept reference · ${escapeHTML(source)}</p>` : '',
      `<label class="check"><input type="checkbox" data-check="personality" ${personality ? 'checked' : ''}> Generate personality</label>`,
      '<div class="actions">',
        '<button data-action="generate" class="primary">Generate character</button>',
        '<button data-action="reset">New blank character</button>',
      '</div>',
      '<p class="muted">The selected role and concept constrain the generator. New skills begin at rating 3.</p>'
    ].join('');
  }

  portraitHTML() {
    const { portrait } = this.s;
    return [
      '<input type="file" id="portrait" accept="image/*">',
      '<p class="muted">Uploaded image is stored inside character JSON and placed on the print sheet.</p>',
      portrait ? this.portraitControlsHTML(portrait) : ''
    ].join('');
  }

  portraitControlsHTML(portrait) {
    return [
      `<img class="portrait-preview" src="${portrait}" alt="Portrait">`,
      '<button data-action="editportrait">Adjust portrait</button>',
      '<button data-action="clearportrait">Remove portrait</button>'
    ].join('');
  }

  attributesHTML() {
    const limits = LIMITS[this.s.metatype];
    const fields = ATTRIBUTES.map((attribute, index) =>
      this.field(`${attribute} (max ${limits[index]})`, `attributes.${attribute}`, 'number'));

    return [
      `<button type="button" class="panel-control" id="skill-attributes-toggle" aria-label="Skill attributes" aria-controls="skill-attributes-panel" aria-expanded="${this.skillAttributesVisible}">${infoIcon}</button>`,
      '<div class="formgrid">',
        ...fields,
        this.field(`Edge (metatype baseline ${limits[5]})`, 'edge', 'number'),
        this.field('Essence (optional)', 'essence'),
      '</div>',
      '<p class="muted">The final point at the metatype maximum costs 20,000¥. Metatype and level restrictions warn but never block edits.</p>'
    ].join('');
  }

  woundsHTML() {
    const { main, alternate } = woundArmor(this.s);
    const { alternateType, alternateAttribute, alternateArmorIncrease, vehicleBody } = this.s.woundSettings;
    const attributes = alternateType === 'Mental' ? ATTRIBUTES : ['---', ...ATTRIBUTES];
    const vehicle = alternateType === 'Vehicle';
    const matrix = alternateType === 'Matrix';
    const alternateFields = vehicle ? [
      this.field('Body', 'woundSettings.vehicleBody', 'number', null, vehicleBody ?? this.s.attributes[alternateAttribute] ?? ''),
      this.field('Armor', 'woundSettings.alternateArmorIncrease', 'number', null, alternateArmorIncrease ?? 0)
    ] : [
      this.field('Name', 'woundSettings.alternateArmorName', 'text', null, alternate.name),
      matrix && alternateAttribute !== '---' ? '' :
        this.field(matrix ? 'Firewall rating' : 'Armor increase', 'woundSettings.alternateArmorIncrease', 'number',
          null, matrix ? alternateArmorIncrease ?? '' : alternate.protection)
    ];
    return [
      '<div class="formgrid wound-settings">',
        '<fieldset><legend>Main armor, physical</legend>',
          this.field('Name', 'woundSettings.mainArmorName', 'text', null, main.name),
          this.field('Armor increase', 'woundSettings.mainArmorIncrease', 'number', null, main.protection),
        '</fieldset>',
        '<fieldset><legend>Alternate wounds</legend>',
          this.field('Type', 'woundSettings.alternateType', 'text', Object.keys(ALTERNATE_WOUND_PRESETS)),
          this.field('Attribute', 'woundSettings.alternateAttribute', 'text', attributes),
        '</fieldset>',
        '<fieldset><legend>Alternate armor</legend>',
          ...alternateFields,
        '</fieldset>',
      '</div>',
      '<p class="muted">A selected attribute supplies Firewall for Matrix wounds or the default Body for Vehicle wounds.</p>'
    ].join('');
  }

  skillAttributesHTML() {
    const skills = new Map(this.s.skills.map(skill => [skill.name, skill]));
    for (const name of this.availableSkills()) {
      if (!skills.has(name)) skills.set(name, { name });
    }
    const entries = [...skills.values()].sort(alphabetical).map((skill, index) => {
      const uses = Object.entries(skillRule(skill.name)?.uses ?? {});
      const description = uses.length
        ? uses.map(([attribute, text]) => `${attribute} — ${text}`).join('\n')
        : `This saved skill uses ${skill.attribute || 'the linked attribute selected in the Skills tab'}.`;
      return [
        '<li>',
          `<div><strong>${escapeHTML(skill.name)}</strong><span class="muted">${escapeHTML(linkedAttributes(skill).join(', '))}</span></div>`,
          this.infoHTML(`About ${skill.name}`, description, `skill-info-${index}`),
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
        '<button data-action="addskill">+ Add skill</button>',
        '<button data-action="addknowledge">+ Knowledge skill</button>',
      '</div>',
      knowledge.length ? `<runner-entry-list class="stack knowledge-grid" data-reorder-list="knowledge">${knowledge.map((name, index) =>
        this.knowledgeRowHTML(name, index)).join('')}</runner-entry-list>` : '',
      '<runner-entry-list class="stack" data-reorder-list="skills">',
        ...skills.map((skill, index) => this.skillRowHTML(skill, index)),
      '</runner-entry-list>',
      '<p class="muted">Specializations cost 2,500¥ and grant +2 when applicable. Knowledge skills cost 2,500¥ each.</p>'
    ].join('');
  }

  skillRowHTML(skill, index) {
    const used = new Set(this.s.skills.filter((_, i) => i !== index).map(other => normalizeName(other.name)));
    const options = [skill.name, ...this.availableSkills().filter(name =>
      normalizeName(name) !== normalizeName(skill.name) && !used.has(normalizeName(name)))]
      .sort(alphabetical)
      .map(name => optionHTML(name, { selected: name === skill.name }))
      .join('');
    const cost = priceSkill(skill.rating) + getSpecializations(skill).filter(Boolean).length * 2500;
    const pools = linkedAttributes(skill).map(attribute => {
      const rating = (+skill.rating || 0) + (+this.s.attributes[attribute] || 0);
      return `· ${escapeHTML(attribute).toLocaleLowerCase()} ${rating}`;
    }).join(' ');

    return [
      `<div class="entry skill-entry" data-entry-index="${index}">`,
        '<div class="skill-main">',
        this.reorderHandleHTML('skills', index, skill.name || 'skill'),
        `<label class="field skill-name"><span>Skill ${pools}</span><select data-path="skills.${index}.name">${options}</select></label>`,
        this.field('Rating', `skills.${index}.rating`, 'number'),
        skillRule(skill.name) ? '' : this.field('Linked attribute', `skills.${index}.attribute`, 'text', ATTRIBUTES),
        this.specializationPicker(skill, index),
        `<span class="cost">${money(cost)}</span>`,
        this.removeButtonHTML('skills', index, skill.name),
      '</div>',
        this.specializationBadges(skill, index),
      '</div>'
    ].join('');
  }

  availableSkills() {
    return this.s.amps.some(amp => amp.name === EMERGED_AMP) ? [...SKILLS, TASKING] : SKILLS;
  }

  infoHTML(label, description, id) {
    return `<runner-info label="${escapeHTML(label)}" description="${escapeHTML(description)}" description-id="${id}"></runner-info>`;
  }

  knowledgeRowHTML(name, index) {
    return this.entryRowHTML('knowledge', index, name || 'knowledge skill', [
      this.field('Knowledge skill', `knowledge.${index}`),
      `<span class="cost">${money(2500)}</span>`
    ]);
  }

  ampsHTML() {
    return [
      this.catalogPanelHTML('magic', 'Search Shadow Amps'),
      `<div class="actions"><button data-action="addamp">+ Custom Shadow Amp</button>${this.field('Essence', 'essence')}</div>`,
      `<p class="muted">Each Amp rating point costs 5,000¥. See ${SHADOW_AMP_RULES_SOURCE} for the general Amp rules.</p>`,
      '<runner-entry-list class="stack" data-reorder-list="amps">',
        ...this.s.amps.map((amp, index) => this.ampRowHTML(amp, index)),
      '</runner-entry-list>'
    ].join('');
  }

  ampRowHTML(amp, index) {
    const path = `amps.${index}`;
    const source = amp.source || 'Custom shadow amp';
    return this.entryRowHTML('amps', index, amp.name || 'Shadow Amp', [
      this.field('Amp name', `${path}.name`),
      this.field('Rating', `${path}.rating`, 'number'),
      this.field('Effect / components', `${path}.notes`, 'textarea'),
      `<span class="cost">${money(priceAmp(amp))}</span>`,
      this.infoHTML(`Source for ${amp.name || 'Shadow Amp'}`, source, `amp-source-${index}`)
    ]);
  }

  gearHTML() {
    return [
      this.catalogPanelHTML('gear', 'Search rulebook catalog'),
      '<div class="actions"><button data-action="additem">+ Custom entry</button></div>',
      '<runner-entry-list class="stack" data-reorder-list="items">',
        ...this.s.items.map((_, index) => this.itemRowHTML(index)),
      '</runner-entry-list>',
      '<p class="muted">Standard equipment and weapons cost 2,500¥. Expert weapons, spells and complex forms cost 5,000¥. Armor costs 2,500¥ per point.</p>'
    ].join('');
  }

  catalogPanelHTML(tab, searchLabel) {
    const filters = this.catalogFilters[tab];
    const categories = (tab === 'gear' ? Object.keys(gearCatalog) : [...new Set(catalogs[tab].map(item => item.category))]).sort(alphabetical);
    return catalogPanelHTML({ searchLabel, filters, categories, results: this.catalogHTML(tab) });
  }

  itemRowHTML(index) {
    const path = `items.${index}`;
    return this.entryRowHTML('items', index, this.s.items[index].name || 'item', [
      this.field('Name', `${path}.name`),
      this.field('Description / type', `${path}.description`),
      this.field('Cost (¥)', `${path}.cost`, 'number')
    ]);
  }

  entryRowHTML(key, index, name, fields) {
    return [
      `<div class="entry" data-entry-index="${index}">`,
        this.reorderHandleHTML(key, index, name),
        ...fields,
        this.removeButtonHTML(key, index, name),
      '</div>'
    ].join('');
  }

  removeButtonHTML(key, index, name) {
    return `<button type="button" data-remove="${key}.${index}" class="small" aria-label="Remove ${escapeHTML(name)}">×</button>`;
  }

  reorderHandleHTML(key, index, name) {
    const count = this.s[key].length;
    if (count < 2) return '';
    return [
      '<details class="entry-reorder">',
        `<summary class="reorder-handle" aria-label="Reorder ${escapeHTML(name)}, row ${index + 1} of ${count}" title="Drag to reorder or open move options"></summary>`,
        '<div class="reorder-options">',
          `<button type="button" data-move="-1" ${index === 0 ? 'disabled' : ''}>Move up</button>`,
          `<button type="button" data-move="1" ${index === count - 1 ? 'disabled' : ''}>Move down</button>`,
        '</div>',
      '</details>'
    ].join('');
  }

  personalityHTML() {
    return [
      '<div class="formgrid">',
        this.field('Keywords (one per line)', 'keywordsText', 'textarea'),
        this.field('Dispositions (one per line)', 'dispositionsText', 'textarea'),
        this.field('Cues (one per line)', 'cuesText', 'textarea'),
      '</div>',
      '<div class="background-wide">',
        this.field('Background / notes', 'notes', 'textarea'),
      '</div>',
      '<p class="muted">Background and notes are printed on the backside of the character sheet.</p>'
    ].join('');
  }

  printPreviewHTML() {
    return [
      '<div class="actions">',
        '<button class="primary" data-action="print">Print / Save as PDF</button>',
        '<button data-action="json">Export JSON</button>',
        '<button data-action="generate">Generate character</button>',
      '</div>',
      '<p class="muted">To save a PDF, choose “Save to PDF” in your browser’s print dialog.</p>',
      '<div class="preview-frame"><runner-print-sheet id="sheetMount"></runner-print-sheet></div>'
    ].join('');
  }

  layoutHTML(names, tabs, body) {
    return [
      '<div class="app">',
        this.headerHTML(names),
        '<div class="layout">',
          '<aside aria-label="Character budget"><runner-budget></runner-budget></aside>',
          '<main><nav>',
            ...tabs.map(tab => this.tabButtonHTML(tab)),
          '</nav>',
            body,
          '</main>',
        '</div>',
        this.notice ? this.toastHTML(this.notice) : '',
      '</div>'
    ].join('');
  }

  headerHTML(names) {
    return [
      '<header><div>',
        '<div class="eyebrow">SHADOWRUN ANARCHY 2.0 · GENERATOR</div>',
        '<h1>Runner Forge</h1>',
        '<p>Build, generate, save, and print a shadowrunner.</p>',
      '</div><div class="topactions">',
        '<select id="saved">',
          '<option value="">Load saved character…</option>',
          ...names.map(name => optionHTML(name)),
        '</select>',
        '<button data-action="save">Save</button>',
        this.loadedName ? this.deleteSavedButtonHTML(this.loadedName) : '',
        '<label class="import">Import JSON<input type="file" id="import" accept=".json,application/json" hidden></label>',
        '<button data-action="json">Export JSON</button>',
        '<button data-action="pdf">Print / PDF</button>',
      '</div></header>'
    ].join('');
  }

  deleteSavedButtonHTML(name) {
    return `<button class="danger" data-action="delete" title="Delete ${escapeHTML(name)} from local storage">Delete saved</button>`;
  }

  tabButtonHTML(tab) {
    const label = tab === 'magic' ? 'Shadow Amps' : tab === 'gear' ? 'Gear & Spells' : tab[0].toUpperCase() + tab.slice(1);
    const active = this.tab === tab ? 'active' : '';
    return `<button data-tab="${tab}" class="${active}">${label}</button>`;
  }

  toastHTML(notice) {
    return `<div class="toast" role="status">${escapeHTML(notice)}</div>`;
  }

  catalogHTML(tab = this.tab) {
    const { search, category } = this.catalogFilters[tab];
    const query = normalizeName(search);
    const chosen = new Set(this.s.items.map(item => item.type + '|' + item.name));
    const itemNames = new Set(this.s.items.map(item => normalizeName(item.name)));
    const ampNames = new Set(this.s.amps.map(amp => normalizeName(amp.name)));
    const ampGear = new Set(this.s.amps.flatMap(amp =>
      [amp.name, ...(AMP_PROFILES[amp.name]?.replaces ?? [])]).map(normalizeName));
    const available = catalogs[tab].filter(item => {
      if (category && item.category !== category) return false;
      if (!normalizeName([item.name, item.group, item.category].join(' ')).includes(query)) return false;
      if (item.type === 'amp') {
        return !ampNames.has(normalizeName(item.name)) &&
          ![item.name, ...(item.replaces ?? [])].some(name => itemNames.has(normalizeName(name)));
      }
      return !chosen.has(item.type + '|' + item.name) && !ampGear.has(normalizeName(item.name)) &&
        !(item.type === 'equipment' && isFreeCommlink(item.name));
    });
    return available.sort(alphabetical).map(item => this.catalogItemHTML(item)).join('') ||
      '<p>No available matches.</p>';
  }

  catalogItemHTML(item) {
    const price = item.cost;
    const key = `${escapeHTML(item.type)}|${escapeHTML(item.name)}|${price}`;
    const label = escapeHTML(item.name);
    const cost = `${money(price)} · ${escapeHTML(item.group)}`;
    return `<runner-catalog-item data-catalog="${key}" label="${label}" cost="${cost}"></runner-catalog-item>`;
  }
  bind() {
    this.querySelectorAll('runner-entry-list').forEach(list => {
      list.addEventListener('entry-move', ({ detail: { key, from, to } }) => this.moveEntry(key, from, to));
    });
    const skillAttributesToggle = this.querySelector('#skill-attributes-toggle');
    if (skillAttributesToggle) {
      const panel = this.querySelector('#skill-attributes-panel');
      const setVisible = visible => {
        this.skillAttributesVisible = visible;
        skillAttributesToggle.setAttribute('aria-expanded', String(visible));
        panel.hidden = !visible;
      };
      skillAttributesToggle.onclick = () => setVisible(!this.skillAttributesVisible);
      this.querySelector('#skill-attributes-close').onclick = () => {
        setVisible(false);
        skillAttributesToggle.focus();
      };
    }
    this.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
      this.clearNotice();
      this.tab = b.dataset.tab;
      this.update()
    });
    this.querySelectorAll('[data-path]').forEach(e => e.onchange = () => {
      const path = e.dataset.path;
      const clearWoundRating = e.type === 'number' && e.value === '' && path.startsWith('woundSettings.');
      const val = clearWoundRating ? null : e.type === 'number' ? Number(e.value) : e.value;
      if (/^skills\.\d+\.name$/.test(path) && this.s.skills.some((skill, i) => i !== Number(path.split('.')[1]) &&
          normalizeName(skill.name) === normalizeName(val))) {
        this.notify('Skill already selected.');
        return
      }
      if (/^amps\.\d+\.name$/.test(path) && this.s.amps.some((amp, i) => i !== Number(path.split('.')[1]) &&
          normalizeName(amp.name) === normalizeName(val))) {
        this.notify('Shadow Amp already selected.');
        return
      }
      const parts = path.split('.');
      const skillChange = /^skills\.\d+\.name$/.test(path) && this.s.skills[+parts[1]].name !== val;
      if (/^amps\.\d+\.name$/.test(path)) {
        const amp = this.s.amps[+parts[1]];
        if (Object.hasOwn(amp, 'source') && normalizeName(amp.name) !== normalizeName(val)) {
          const ampName = Object.keys(AMP_PROFILES).find(name => normalizeName(name) === normalizeName(val));
          const profile = AMP_PROFILES[ampName];
          if (amp.notes === AMP_PROFILES[amp.name]?.effect || amp.notes === ampReviewNote(amp.source)) {
            amp.notes = profile?.effect ?? ampReviewNote(null);
          }
          amp.source = profile?.source ?? null;
        }
      }
      const record = parts.slice(0, -1).reduce((object, key) => object[key], this.s);
      record[parts.at(-1)] = val;
      if (path === 'role' && !conceptsForRole(val).some(c => c.name === this.s.concept)) this.s.concept = 'Random';
      if (path === 'woundSettings.alternateType') {
        this.s.woundSettings.alternateAttribute = ALTERNATE_WOUND_PRESETS[val].attribute;
        this.s.woundSettings.alternateArmorName = ALTERNATE_WOUND_PRESETS[val].armorName ?? '';
      }
      if (skillChange) {
        const skillIndex = parts[1];
        this.s.skills[skillIndex].specialization = '';
        this.s.skills[skillIndex].specializations = [];
        delete this.s.skills[skillIndex].specializationAttributes;
        [this.s.skills[skillIndex].attribute] = linkedAttributes({ name: val });
      }
      this.update();
      if (path === 'woundSettings.alternateType' || path === 'woundSettings.alternateAttribute') {
        this.querySelector(`[data-path="${path}"]`)?.focus();
      }
    });
    this.querySelectorAll('runner-specialization-picker').forEach(picker => {
      picker.addEventListener('specialization-add', ({ detail: { index, name, attribute } }) =>
        this.addSpecialization(index, name, attribute));
    });
    this.querySelectorAll('[data-remove-specialization]').forEach(el => el.onclick = () => {
      const [i, j] = el.dataset.removeSpecialization.split(':').map(Number);
      this.removeSpecialization(i, j)
    });
    this.querySelectorAll('[data-knowledge]').forEach(e => e.onchange = () => {
      this.s.knowledge[+e.dataset.knowledge] = e.value;
      this.update()
    });
    this.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
      const [k, i] = b.dataset.remove.split('.');
      this.remove(k, +i)
    });
    this.querySelectorAll('[data-action]').forEach(b => b.onclick = () => {
      switch (b.dataset.action) {
        case 'generate':
          this.randomize();
          break;
        case 'reset':
          if (confirm('Start a new blank character? Unsaved changes will be lost.')) {
            this.s = blank();
            this.loadedName = null;
            this.update()
          }
          break;
        case 'save':
          this.save();
          break;
        case 'delete':
          this.deleteLoaded();
          break;
        case 'json':
          this.exportJSON();
          break;
        case 'pdf':
        case 'print':
          this.print();
          break;
        case 'addskill': {
          const next = this.availableSkills().find(name => !this.s.skills.some(skill => normalizeName(skill.name) ===
            normalizeName(name)));
          if (!next) {
            this.notify('All skills are already selected.');
            break
          }
          this.add('skills', {
            name: next,
            rating: 3,
            attribute: linkedAttributes({ name: next })[0],
            specialization: ''
          });
          break;
        }
        case 'addknowledge':
          this.s.knowledge.push('');
          this.update();
          break;
        case 'addamp': {
          let name = 'New Amp',
            i = 2;
          while (this.s.amps.some(a => normalizeName(a.name) === normalizeName(name))) name = 'New Amp ' + i++;
          this.add('amps', {
            name,
            rating: 1,
            notes: ''
          });
          break;
        }
        case 'additem':
          this.add('items', {
            name: 'Custom item',
            type: 'equipment',
            cost: 2500,
            description: ''
          });
          break;
        case 'editportrait':
          this.editPortrait(this.s.portrait);
          break;
        case 'clearportrait':
          this.s.portrait = '';
          this.update()
      }
    });
    this.querySelector('#saved').onchange = e => this.load(e.target.value);
    const imp = this.querySelector('#import');
    imp.onchange = e => this.importJSON(e.target.files[0]);
    const port = this.querySelector('#portrait');
    if (port) port.onchange = e => this.editPortrait(e.target.files[0]);
    const check = this.querySelector('[data-check]');
    if (check) check.onchange = e => {
      this.s.personality = e.target.checked
    };
    const catalog = this.querySelector('runner-catalog');
    if (catalog) {
      catalog.addEventListener('catalog-filter', ({ detail: { key, value } }) => {
        this.catalogFilters[this.tab][key] = value;
        catalog.results = this.catalogHTML();
      });
      catalog.addEventListener('catalog-pick', ({ detail }) => this.addCatalogItem(detail));
    }
    for (const [field, key] of [
        ['keywordsText', 'keywords'],
        ['dispositionsText', 'dispositions'],
        ['cuesText', 'cues']
      ]) {
      const el = this.querySelector(`[data-path="${field}"]`);
      if (el) {
        el.value = this.s[key].join('\n');
        el.onchange = () => {
          this.s[key] = el.value.split('\n').map(x => x.trim()).filter(Boolean);
          this.update()
        }
      }
    }
  }
  addCatalogItem({ type, name, cost }) {
    if (type === 'amp') {
      if (Object.hasOwn(AMP_PROFILES, name)) this.add('amps', makeAmp(name));
      return;
    }
    if (this.s.items.some(item => item.type === type && item.name === name)) return;
    this.add('items', {
      type,
      name,
      cost,
      description: CATALOG[type]?.find(item => item.name === name)?.group || ''
    });
  }
  print() {
    if (!printCharacter(this.s)) this.notify('Allow popups to print or save PDF.');
  }

}
customElements.define('anarchy-builder', AnarchyBuilder);
