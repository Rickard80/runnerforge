import {
  ATTRIBUTES,
  LIMITS,
  LEVELS,
  SKILLS,
  CONCEPTS,
  AMP_PROFILES,
  EMERGED_AMP,
  SHADOW_AMP_RULES_SOURCE
} from './data.js';
import {
  CATALOG
} from './catalog.js';
import {
  KEYWORDS,
  DISPOSITIONS,
  STREETWISE_CUES
} from './personality.js';
import { SPECIALIZATIONS } from './specializations.js';
import { KNOWLEDGE_SKILLS } from './knowledge.js';
import { makeAmp, startingKitKind, trainGeneratedRunner } from './generation.js';
import {
  money,
  pick,
  blank,
  calc,
  equipArmorAmp,
  mainArmor,
  priceSkill,
  priceAmp
} from './model.js';
import './components/field.js';
import './components/panel.js';
import './components/catalog-item.js';
import './components/print-sheet.js';
import './components/budget.js';
import './components/portrait-editor.js';
const STORE = 'anarchy2.characters.v1';
const ampReviewNote = source => source
  ? `Review Amp components and rating, ${source}.`
  : `Review the general Shadow Amp rules, ${SHADOW_AMP_RULES_SOURCE}.`;
const catalogs = {
  gear: Object.entries(CATALOG).filter(([type]) => type !== 'vehicle').flatMap(([type, items]) =>
    items.filter(item => AMP_PROFILES[item.name]?.group !== 'Weapon Amp')
      .map(item => ({ ...item, type, category: type[0].toUpperCase() + type.slice(1) }))),
  magic: Object.entries(AMP_PROFILES).map(([name, profile]) => ({
    ...profile,
    name,
    type: 'amp',
    category: profile.group,
    cost: priceAmp(profile)
  }))
};
const legacyRoles = new Map([
  ['Fighter', 'Muscle'], ['Magician', 'Awakened'], ['Technologist', 'Tech'], ['Social', 'Influence']
]);
const conceptsForRole = role => {
  if (role === 'Any') return Object.values(CONCEPTS).flat();
  return Object.hasOwn(CONCEPTS, role) ? CONCEPTS[role] : [];
};
const restoreCharacter = saved => {
  const s = { ...blank(), ...saved };
  s.role = legacyRoles.get(s.role) ?? s.role;
  if (s.role !== 'Any' && !Object.hasOwn(CONCEPTS, s.role)) s.role = 'Any';
  if (!conceptsForRole(s.role).some(c => c.name === s.concept)) s.concept = 'Random';
  s.amps = s.amps.map(amp => amp.name === 'Emerged' && amp.source === AMP_PROFILES[EMERGED_AMP].source
    ? { ...amp, name: EMERGED_AMP }
    : amp);
  return s;
};
const normalizeName = value => String(value ?? '').trim().toLocaleLowerCase();
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
const sheetItemType = { weapon: 'Weapon', spell: 'Spell', 'complex form': 'Complex Form' };
const sortedItems = items => [...items].sort((a, b) => {
  const rank = item => rangedWeapon(item) ? 0 : meleeWeapon(item) ? 1 : item.type === 'armor' ? 2 :
    Object.hasOwn(sheetItemType, item.type) ? 3 : 4;
  return rank(a) - rank(b) || alphabetical(a, b);
});
const getSpecializations = skill => Array.isArray(skill.specializations) ?
  skill.specializations.map(v => String(v || '').trim()) :
  String(skill.specialization || '').split(',').map(v => v.trim()).filter(Boolean);
const specializationLabel = skill => getSpecializations(skill).filter(Boolean).join(', ');
const isFreeCommlink = name => /commlink/i.test(name);
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


export { upgradeGeneratedAttribute } from './generation.js';

export class AnarchyBuilder extends HTMLElement {
  constructor() {
    super();
    this.s = blank();
    this.tab = 'identity';
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
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}')
    } catch {
      return {}
    }
  }
  set saves(v) {
    localStorage.setItem(STORE, JSON.stringify(v))
  }
  update() {
    this.render();
  }
  set(path, value) {
    const [key, index, field] = path.split('.');
    if (index !== undefined) {
      this.s[key][+index][field] = value
    } else this.s[key] = value;
    this.update()
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
  portrait(file) {
    if (!file) return;
    const editor = document.createElement('runner-portrait-editor');
    editor.addEventListener('portrait-ready', event => {
      this.s.portrait = event.detail;
      this.update()
    });
    document.body.append(editor);
    editor.open(file)
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
    // Prefer concept-relevant weapons but never force Heavy pistol.
    const firearmFocus = c.skills.includes('Firearms') || c.skills.includes('Heavy Weapons');
    const weaponCount = !awakened && firearmFocus ? 2 : 1;
    const chosenWeapons = pickUnique(firearmFocus ? ranged : melee, weaponCount);
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
    //console.log('Character generation spending iterations:', iterations);
    this.notify('Generated ' + c.name + ' · ' + s.metatype + ' · ' + s.level +
      '; review rule warnings and Amp effects.');
  }


  addSpecialization(i, value) {
    const chosen = String(value || '').trim();
    if (!chosen) return;
    const occupied = this.s.skills.flatMap(getSpecializations).some(v => normalizeName(v) === normalizeName(chosen));
    if (occupied) return this.notify('Specialization already selected.');
    const row = this.s.skills[i];
    row.specializations = [...getSpecializations(row).filter(Boolean), chosen];
    row.specialization = '';
    this.update();
  }
  removeSpecialization(i, index) {
    const row = this.s.skills[i];
    row.specializations = getSpecializations(row).filter((_, j) => j !== index);
    row.specialization = '';
    this.update();
  }
  specializationPicker(skill, index) {
    const occupied = new Set(this.s.skills.flatMap(getSpecializations).map(normalizeName));
    const options = (SPECIALIZATIONS[skill.name] || [])
      .filter(value => !occupied.has(normalizeName(value)))
      .sort((a, b) => a.localeCompare(b))
      .map(value => this.specializationOptionHTML(value))
      .join('');

    return [
      '<div class="specialization-picker">',
        '<label class="field"><span>Specialization</span>',
          `<select data-add-specialization="${index}">`,
            '<option value="">Add…</option>',
            options,
            '<option value="__custom__">Custom…</option>',
          '</select>',
        '</label>',
        `<input class="specialization-custom" data-custom-for="${index}" placeholder="Custom specialization" aria-label="Custom specialization" hidden>`,
        `<button type="button" class="small" data-confirm-custom="${index}" hidden>Add</button>`,
      '</div>'
    ].join('');
  }

  specializationOptionHTML(value) {
    const label = this.esc(value);
    return `<option value="${label}">${label}</option>`;
  }

  specializationBadges(skill, index) {
    const badges = getSpecializations(skill).filter(Boolean)
      .map((value, badgeIndex) => this.specializationBadgeHTML(value, index, badgeIndex))
      .join('');
    return badges ? `<div class="specialization-badges">${badges}</div>` : '';
  }

  specializationBadgeHTML(value, skillIndex, badgeIndex) {
    const label = this.esc(value);
    return [
      `<span class="specialization-badge">${label}`,
        `<button type="button" aria-label="Remove ${label}" title="Remove specialization" data-remove-specialization="${skillIndex}:${badgeIndex}">×</button>`,
      '</span>'
    ].join('');
  }

  field(label, path, type = 'text', options = null) {
    const bits = path.split('.');
    const v = bits.length === 3 ? this.s[bits[0]][+bits[1]][bits[2]] : bits.length === 2 ? this.s[bits[0]][bits[1]] :
      this.s[path];
    const optionAttribute = options ? this.fieldOptionsAttribute(options) : '';
    return `<runner-field label="${this.esc(label)}" path="${this.esc(path)}" value="${this.esc(v ?? '')}" kind="${type}" ${optionAttribute}></runner-field>`;
  }

  fieldOptionsAttribute(options) {
    const serialized = JSON.stringify(options).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll("'", '&#39;');
    return `options='${serialized}'`;
  }

  esc(v) {
    return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"',
      '&quot;')
  }

  section(title, content) {
    return `<runner-panel heading="${this.esc(title)}">${content}</runner-panel>`;
  }

  render() {
    const budget = calc(this.s);
    const tabs = ['identity', 'attributes', 'skills', 'magic', 'gear', 'personality', 'print'];
    const names = Object.keys(this.saves).sort();
    const body = this.tabContentHTML();

    this.innerHTML = this.layoutHTML(names, tabs, budget, body);
    this.bind();
    if (this.tab === 'print') this.drawSheet();
  }

  tabContentHTML() {
    switch (this.tab) {
      case 'identity':
        return this.section('Identity & generation', this.identityHTML()) + this.section('Portrait', this.portraitHTML());
      case 'attributes':
        return this.section('Attributes', this.attributesHTML());
      case 'skills':
        return this.section('Skills', this.skillsHTML());
      case 'magic':
        return this.section('Shadow Amps', this.ampsHTML());
      case 'gear':
        return this.section('Weapons, spells, armor & equipment', this.gearHTML());
      case 'personality':
        return this.section('Personality & background', this.personalityHTML());
      case 'print':
        return this.section('Exact-template print preview', this.printPreviewHTML());
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
      source ? `<p class="muted">Concept reference · ${this.esc(source)}</p>` : '',
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
      '<div class="formgrid">',
        ...fields,
        this.field(`Edge (metatype baseline ${limits[5]})`, 'edge', 'number'),
        this.field('Essence (optional)', 'essence'),
      '</div>',
      '<p class="muted">The final point at the metatype maximum costs 20,000¥. Metatype and level restrictions warn but never block edits.</p>'
    ].join('');
  }

  skillsHTML() {
    const { skills, knowledge } = this.s;
    return [
      '<div class="actions">',
        '<button data-action="addskill">+ Add skill</button>',
        '<button data-action="addknowledge">+ Knowledge skill</button>',
      '</div>',
      knowledge.length ? '<h3>Knowledge skills</h3>' : '',
      knowledge.length ? `<div class="stack" data-reorder-list="knowledge">${knowledge.map((name, index) =>
        this.knowledgeRowHTML(name, index)).join('')}</div>` : '',
      '<div class="stack" data-reorder-list="skills">',
        ...skills.map((skill, index) => this.skillRowHTML(skill, index)),
      '</div>',
      '<p class="muted">Specializations cost 2,500¥ and grant +2 when applicable. Knowledge skills cost 2,500¥ each.</p>'
    ].join('');
  }

  skillRowHTML(skill, index) {
    const used = new Set(this.s.skills.filter((_, i) => i !== index).map(other => normalizeName(other.name)));
    const options = [skill.name, ...SKILLS.map(([name]) => name).filter(name => !used.has(normalizeName(name)))]
      .filter((name, i, names) => names.findIndex(other => normalizeName(other) === normalizeName(name)) === i)
      .sort(alphabetical)
      .map(name => this.skillOptionHTML(name, name === skill.name))
      .join('');
    const cost = priceSkill(skill.rating) + getSpecializations(skill).filter(Boolean).length * 2500;
    const dicePool = (+skill.rating || 0) + (+this.s.attributes[skill.attribute] || 0);

    return [
      `<div class="entry skill-entry" data-entry-index="${index}"><div class="skill-main">`,
        this.reorderHandleHTML('skills', index, skill.name || 'skill'),
        `<label>Skill<select data-path="skills.${index}.name">${options} </select></label > `,
        this.field('Rating', `skills.${index}.rating`, 'number'),
        '\n  ',
        this.field('Linked attribute', `skills.${index}.attribute`, 'text', ATTRIBUTES),
        '\n  ',
        this.specializationPicker(skill, index),
        ` <span class = "cost"> ${money(cost)} · DP ${dicePool} </span>`,
        `<button data-remove="skills.${index}" class="small">×</button > </div>`,
        this.specializationBadges(skill, index),
      '</div >\n  '
    ].join('');
  }

  skillOptionHTML(name, selected) {
    return `<option ${selected ? 'selected' : ''}>${this.esc(name)}</option>`;
  }

  knowledgeRowHTML(name, index) {
    return [
      `<div class="entry" data-entry-index="${index}">`,
        this.reorderHandleHTML('knowledge', index, name || 'knowledge skill'),
        `<input data-knowledge="${index}" value="${this.esc(name)}">`,
        '<span class="cost">2,500¥</span>',
        `<button data-remove="knowledge.${index}" class="small">×</button>`,
      '</div>'
    ].join('');
  }

  ampsHTML() {
    return [
      this.catalogPanelHTML('magic', 'Search Shadow Amps'),
      `<div class="actions"><button data-action="addamp">+ Custom Shadow Amp</button>${this.field('Essence', 'essence')}</div>`,
      `<p class="muted">Each Amp rating point costs 5,000¥. See ${SHADOW_AMP_RULES_SOURCE} for the general Amp rules.</p>`,
      '<div class="stack" data-reorder-list="amps">',
        ...this.s.amps.map((amp, index) => this.ampRowHTML(amp, index)),
      '</div>'
    ].join('');
  }

  ampRowHTML(amp, index) {
    const path = `amps.${index}`;
    const source = amp.source || 'Custom shadow amp';
    return [
      `<div class="entry" data-entry-index="${index}">`,
        this.reorderHandleHTML('amps', index, amp.name || 'Shadow Amp'),
        this.field('Amp name', `${path}.name`),
        this.field('Rating', `${path}.rating`, 'number'),
        this.field('Effect / components', `${path}.notes`, 'textarea'),
        `<span class="cost">${money(priceAmp(amp))}</span>`,
        '<details class="amp-source">',
          `<summary aria-label="Source for ${this.esc(amp.name || 'Shadow Amp')}" aria-describedby="amp-source-${index}">`,
            '<span aria-hidden="true">ⓘ</span>',
            `<span class="amp-source-text" id="amp-source-${index}">${this.esc(source)}</span>`,
          '</summary>',
        '</details>',
        `<button data-remove="${path}" class="small">×</button>`,
      '</div>'
    ].join('');
  }

  gearHTML() {
    return [
      this.catalogPanelHTML('gear', 'Search rulebook catalog'),
      '<div class="actions"><button data-action="additem">+ Custom entry</button></div>',
      '<div class="stack" data-reorder-list="items">',
        ...this.s.items.map((_, index) => this.itemRowHTML(index)),
      '</div>',
      '<p class="muted">Standard equipment and weapons cost 2,500¥. Expert weapons, spells and complex forms cost 5,000¥. Armor costs 2,500¥ per point.</p>'
    ].join('');
  }

  catalogPanelHTML(tab, searchLabel) {
    const filters = this.catalogFilters[tab];
    const categories = [...new Set(catalogs[tab].map(item => item.category))].sort(alphabetical);
    return [
      '<div class="formgrid">',
        `<label class="field"><span>${this.esc(searchLabel)}</span>`,
          `<input id="catalogSearch" placeholder="Search names or type" value="${this.esc(filters.search)}">`,
        '</label>',
        '<label class="field"><span>Category</span><select id="catalogType">',
          '<option value="">All categories</option>',
          ...categories.map(category => `<option value="${this.esc(category)}" ${filters.category === category ? 'selected' : ''}>${this.esc(category)}</option>`),
        '</select></label>',
      '</div>',
      `<div class="catalog" id="catalog">${this.catalogHTML(tab)}</div>`
    ].join('');
  }

  itemRowHTML(index) {
    const path = `items.${index}`;
    return [
      `<div class="entry" data-entry-index="${index}">`,
        this.reorderHandleHTML('items', index, this.s.items[index].name || 'item'),
        this.field('Name', `${path}.name`),
        this.field('Type', `${path}.type`, 'text', ['Weapon', 'Armor', 'Spell', 'Complex form', 'Equipment']),
        this.field('Description / type', `${path}.description`),
        this.field('Cost (¥)', `${path}.cost`, 'number'),
        `<button data-remove="${path}" class="small">×</button>`,
      '</div>'
    ].join('');
  }

  reorderHandleHTML(key, index, name) {
    const count = this.s[key].length;
    if (count < 2) return '';
    return [
      '<details class="entry-reorder">',
        `<summary class="reorder-handle" aria-label="Reorder ${this.esc(name)}, row ${index + 1} of ${count}" title="Drag to reorder or open move options"></summary>`,
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

  layoutHTML(names, tabs, budget, body) {
    return [
      '<div class="app">',
        this.headerHTML(names),
        '<div class="layout">',
          this.sidebarHTML(budget),
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
          ...names.map(name => this.savedOptionHTML(name)),
        '</select>',
        '<button data-action="save">Save</button>',
        this.loadedName ? this.deleteSavedButtonHTML(this.loadedName) : '',
        '<label class="import">Import JSON<input type="file" id="import" accept=".json,application/json" hidden></label>',
        '<button data-action="json">Export JSON</button>',
        '<button data-action="pdf">Print / PDF</button>',
      '</div></header>'
    ].join('');
  }

  savedOptionHTML(name) {
    return `<option>${this.esc(name)}</option>`;
  }

  deleteSavedButtonHTML(name) {
    return `<button class="danger" data-action="delete" title="Delete ${this.esc(name)} from local storage">Delete saved</button>`;
  }

  sidebarHTML(budget) {
    const { level, metatype } = this.s;
    const { remaining, spent, warnings } = budget;
    const limit = LEVELS[level].budget;
    const percentSpent = Math.min(100, spent / limit * 100);
    const warningItems = warnings.length
      ? warnings.map(warning => this.warningItemHTML(warning)).join('')
      : '<li>No budget or basic limit warnings.</li>';

    return [
      '<aside><div class="balance">',
        `<div class="eyebrow">${this.esc(level)} · ${this.esc(metatype)}</div>`,
        '<div class="balance-title">Nuyen remaining</div>',
        `<div class="big ${remaining < 0 ? 'negative' : ''}">${money(remaining)}</div>`,
        `<div class="meter"><div style="width:${percentSpent}%"></div></div>`,
        this.budgetRowHTML('Budget', limit),
        this.budgetRowHTML('Spent', spent),
      '</div><div class="breakdown">',
        this.budgetRowHTML('Attributes', budget.attr),
        this.budgetRowHTML('Skills', budget.skills),
        this.budgetRowHTML('Knowledge', budget.knowledge),
        this.budgetRowHTML('Shadow Amps', budget.amps),
        this.budgetRowHTML('Gear & spells', budget.items),
      '</div><div class="warnings">',
        `<h3>Rule checks · ${warnings.length}</h3><ul>${warningItems}</ul>`,
      '</div></aside>'
    ].join('');
  }

  budgetRowHTML(label, amount) {
    return `<div class="rowline"><span>${label}</span><b>${money(amount)}</b></div>`;
  }

  warningItemHTML(warning) {
    return `<li>${this.esc(warning)}</li>`;
  }

  tabButtonHTML(tab) {
    const label = tab === 'magic' ? 'Shadow Amps' : tab === 'gear' ? 'Gear & Spells' : tab[0].toUpperCase() + tab.slice(1);
    const active = this.tab === tab ? 'active' : '';
    return `<button data-tab="${tab}" class="${active}">${label}</button>`;
  }

  toastHTML(notice) {
    return `<div class="toast" role="status">${this.esc(notice)}</div>`;
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
    const key = `${this.esc(item.type)}|${this.esc(item.name)}|${price}`;
    const label = this.esc(item.name);
    const cost = `${money(price)} · ${this.esc(item.group)}`;
    return `<runner-catalog-item data-catalog="${key}" label="${label}" cost="${cost}"></runner-catalog-item>`;
  }

bind() {
  this.querySelectorAll('[data-reorder-list]').forEach(list => this.bindEntryReordering(list));
  this.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    this.clearNotice();
    this.tab = b.dataset.tab;
    this.update()
  });
  this.querySelectorAll('[data-path]').forEach(e => e.onchange = () => {
    const path = e.dataset.path;
    const val = e.type === 'number' ? Number(e.value) : e.value;
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
    if (/^items\.\d+\.type$/.test(path) && val === 'equipment' && this.s.items.filter(x => x.type === 'equipment')
      .length >= 4 && this.s.items[Number(path.split('.')[1])].type !== 'equipment') {
      this.notify('Maximum 4 equipment items.');
      return
    }

    const parts = path.split('.');
    const skillChange = path.match(/^skills\.\d+\.name$/);
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
    if (parts.length === 1) {
      this.s[parts[0]] = val;
    } else if (parts.length === 2) {
      this.s[parts[0]][parts[1]] = val;
    } else {
      this.s[parts[0]][+parts[1]][parts[2]] = val;
    }
    if (path === 'role' && !conceptsForRole(val).some(c => c.name === this.s.concept)) this.s.concept = 'Random';
    if (skillChange) {
      const skillIndex = parts[1];
      this.s.skills[skillIndex].specialization = '';
      this.s.skills[skillIndex].specializations = [];
      const newSkill = SKILLS.find(([name]) => name === val);
      this.s.skills[skillIndex].attribute = newSkill[1];
    }
    this.update()
  });
  this.querySelectorAll('[data-add-specialization]').forEach(el => el.onchange = () => {
    const i = +el.dataset.addSpecialization;
    if (el.value === '__custom__') {
      const area = el.closest('.skill-entry');
      const input = area.querySelector('[data-custom-for]');
      const button = area.querySelector('[data-confirm-custom]');
      input.hidden = false;
      button.hidden = false;
      input.focus();
    } else if (el.value) this.addSpecialization(i, el.value);
  });
  this.querySelectorAll('[data-confirm-custom]').forEach(el => el.onclick = () => this.addSpecialization(+el.dataset
    .confirmCustom, this.querySelector(`[data-custom-for="${el.dataset.confirmCustom}"]`).value));
  this.querySelectorAll('[data-custom-for]').forEach(el => el.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addSpecialization(+el.dataset.customFor, el.value)
    }
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
        const next = SKILLS.find(([name]) => !this.s.skills.some(skill => normalizeName(skill.name) ===
          normalizeName(name)));
        if (!next) {
          this.notify('All skills are already selected.');
          break
        }
        this.add('skills', {
          name: next[0],
          rating: 3,
          attribute: next[1],
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
      case 'editportrait': {
        const editor = document.createElement('runner-portrait-editor');
        editor.addEventListener('portrait-ready', event => {
          this.s.portrait = event.detail;
          this.update()
        });
        document.body.append(editor);
        editor.open(this.s.portrait);
        break
      }
      case 'clearportrait':
        this.s.portrait = '';
        this.update()
    }
  });
  this.querySelector('#saved').onchange = e => this.load(e.target.value);
  const imp = this.querySelector('#import');
  imp.onchange = e => this.importJSON(e.target.files[0]);
  const port = this.querySelector('#portrait');
  if (port) port.onchange = e => this.portrait(e.target.files[0]);
  const check = this.querySelector('[data-check]');
  if (check) check.onchange = e => {
    this.s.personality = e.target.checked
  };
  const search = this.querySelector('#catalogSearch');
  if (search) search.oninput = e => {
    this.catalogFilters[this.tab].search = e.target.value;
    this.querySelector('#catalog').innerHTML = this.catalogHTML();
    this.bindCatalog()
  };
  const category = this.querySelector('#catalogType');
  if (category) category.onchange = e => {
    this.catalogFilters[this.tab].category = e.target.value;
    this.querySelector('#catalog').innerHTML = this.catalogHTML();
    this.bindCatalog()
  };
  this.bindCatalog();
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
bindEntryReordering(list) {
  const key = list.dataset.reorderList;
  const rows = Array.from(list.children);
  if (rows.length < 2) return;

  let drag;
  let marker;
  let frame;
  let suppressClick = false;

  const updateTarget = () => {
    // Each row midpoint divides the insertion slots above and below it.
    const next = rows.findIndex(row => {
      const { top, height } = row.getBoundingClientRect();
      return drag.y < top + height / 2;
    });
    const slot = next < 0 ? rows.length : next;
    const { left, right } = list.getBoundingClientRect();
    const withinList = drag.x >= left && drag.x <= right;
    drag.to = withinList ? slot - Number(slot > drag.from) : drag.from;
    const target = drag.to === drag.from ? null : rows[Math.min(slot, rows.length - 1)];
    const position = next < 0 ? 'after' : 'before';
    if (target === marker && (!marker || marker.dataset.dropPosition === position)) return;
    marker?.removeAttribute('data-drop-position');
    marker = target;
    if (marker) marker.dataset.dropPosition = position;
  };

  const finish = () => {
    cancelAnimationFrame(frame);
    frame = undefined;
    marker?.removeAttribute('data-drop-position');
    marker = null;
    rows[drag.from].classList.remove('entry-dragging');
    drag = null;
  };

  const scroll = () => {
    frame = undefined;
    if (!list.isConnected) return finish();
    const edge = 60;
    const bottomEdge = window.innerHeight - edge;
    const { left, right, top, bottom } = list.getBoundingClientRect();
    if (drag.x < left || drag.x > right) return;
    let distance = 0;
    if (drag.y < edge && top < edge) distance = drag.y - edge;
    if (drag.y > bottomEdge && bottom > bottomEdge) distance = drag.y - bottomEdge;
    if (!distance) return;
    const previousScroll = window.scrollY;
    window.scrollBy(0, Math.max(-18, Math.min(18, distance / 3)));
    if (window.scrollY === previousScroll) return;
    updateTarget();
    frame = requestAnimationFrame(scroll);
  };

  list.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.reorder-handle');
    if (!handle || !event.isPrimary || event.button !== 0 || drag) return;
    const from = Number(handle.closest('[data-entry-index]').dataset.entryIndex);
    drag = { id: event.pointerId, from, to: from, startX: event.clientX, startY: event.clientY };
    suppressClick = false;
    handle.setPointerCapture(event.pointerId);
  });
  list.addEventListener('pointermove', event => {
    if (event.pointerId !== drag?.id) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!suppressClick) {
      if (Math.hypot(event.clientX - drag.startX, drag.y - drag.startY) < 6) return;
      suppressClick = true;
      rows[drag.from].querySelector('details').open = false;
      rows[drag.from].classList.add('entry-dragging');
    }
    updateTarget();
    frame ??= requestAnimationFrame(scroll);
  });
  list.addEventListener('pointerup', event => {
    if (event.pointerId !== drag?.id) return;
    if (suppressClick) {
      drag.x = event.clientX;
      drag.y = event.clientY;
      updateTarget();
    }
    const { from, to } = drag;
    finish();
    this.moveEntry(key, from, to);
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    list.addEventListener(type, event => {
      if (event.pointerId === drag?.id) finish();
    });
  }
  list.addEventListener('click', event => {
    if (event.target.closest('.reorder-handle') && suppressClick && event.detail > 0) {
      event.preventDefault();
      suppressClick = false;
    }
    const button = event.target.closest('[data-move]');
    if (button) {
      const from = Number(button.closest('[data-entry-index]').dataset.entryIndex);
      this.moveEntry(key, from, from + Number(button.dataset.move));
    }
  });
}
bindCatalog() {
  this.querySelectorAll('button[data-catalog]').forEach(b => b.onclick = () => {
    const [type, name, cost] = b.dataset.catalog.split('|');
    if (type === 'amp') {
      if (Object.hasOwn(AMP_PROFILES, name)) this.add('amps', makeAmp(name));
      return;
    }
    if (this.s.items.some(item => item.type === type && item.name === name)) return;
    this.add('items', {
      type,
      name,
      cost: +cost,
      description: CATALOG[type]?.find(x => x.name === name)?.group || ''
    })
  })
}
print() {
  const w = window.open('', '_blank');
  if (!w) {
    this.notify('Allow popups to print or save PDF.');
    return
  }
  w.document.write('<!doctype html><html><head><title>' + this.esc(this.s.name || 'Runner') +
    '</title><style>body{margin:0} .sheet{width:210mm;height:273.5mm;position:relative;background-image:url("' +
    new URL('../images/clean-sheet.webp', import.meta.url).href +
    '");background-size:100% 100%;container-type:inline-size} .overlay{position:absolute;font-family:Arial,sans-serif;font-size:9px;color:#29140d;white-space:nowrap;overflow:hidden} .wound{position:absolute;border-radius:50%;background:#5d2e20}' +
    '.sheet-notes{box-sizing:border-box;height:273.5mm;padding:14mm;overflow:hidden;font:11pt/1.5 Arial,sans-serif}' +
    '.sheet-notes h2{margin:0 0 .5em} .sheet-notes p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '@page{size:210mm 273.85mm;margin:0}' +
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact} .sheet-notes{break-before:page}}</style></head><body>' +
    this.printContentHTML() + '</body></html>');
  w.onbeforeprint = () => this.fitPrintedNotes(w.document);
  w.onload = () => setTimeout(() => w.print(), 350);
  w.document.close();
}
fitPrintedNotes(doc) {
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
drawSheet() {
  this.querySelector('#sheetMount').markup = this.printContentHTML()
}
printContentHTML() {
  return this.sheetHTML() + this.sheetNotesHTML(this.s.notes);
}
sheetNotesHTML(notes) {
  const text = String(notes || '');
  if (!text.trim()) return '';
  return `<section class="sheet-notes"><div><h2>Background / notes</h2><p>${this.esc(text)}</p></div></section>`;
}
sheetHTML() {
  const s = this.s;
  const lines = (values, x, y, step, w, max, size = 1.04, transform) => values.slice(0, max)
    .map((v, i) => this.sheetOverlayHTML(v, x, y + i * step, w, 1.7, size, undefined, transform)).join('');
  let h = '<div class="sheet">';
  // Coordinates measured against correctedAlignment.webp (1571 × 2048), scaled as percentages.
  h += this.sheetOverlayHTML(s.name, 21, 4.0, 32, 3, 2.5, 'center');
  const attrX = [6.1, 15.3, 24.3, 33.1, 42.5, 51.4];
  [...ATTRIBUTES.map(a => s.attributes[a]), s.edge].forEach((value, i) => h += this.sheetOverlayHTML(value, attrX[i], 12.0, 6.1, 3.1, 2.0,
    'center'));
  s.skills.slice(0, 11).forEach((v, i) => {
    const y = 19.15 + i * 2.16;
    const hasSpecialization = !!specializationLabel(v);
    const att = +s.attributes[v.attribute] || 0;
    h += this.sheetOverlayHTML(v.name + (hasSpecialization ? ' (+' + specializationLabel(v) + ')' : ''), 5.3, y, 24.8, 1.7, 1.2);
    h += this.sheetOverlayHTML(v.rating, 31.3, y, 5, 1.7, 1.2, 'center');
    h += this.sheetOverlayHTML(att, 38.6, y, 5, 1.7, 1.2, 'center');
    h += this.sheetOverlayHTML((+v.rating || 0) + att + (hasSpecialization ? (' (+2)') : ''), 46, y, 5, 1.7, 1.2, 'center')
  });
  h += lines(s.amps.map(v => v.name + ' (' + v.rating + ')' + (v.notes ? ' ' + v.notes : '')), 5.3, 46, 2.16, 57, 11,
    1.2);
  h += this.sheetOverlayHTML(s.knowledge.join(', '), 5.3, 72.6, 47, 1, 1.2);
  h += this.sheetOverlayHTML(s.essence, 51.6, 72.6, 7, 1, 1.2, 'center');
  const arms = s.items.filter(v => Object.hasOwn(sheetItemType, v.type));
  arms.slice(0, 4).forEach((v, i) => {
    const catalogType = CATALOG[v.type]?.find(x => normalizeName(x.name) === normalizeName(v.name))?.group;
    const description = catalogType || v.description;
    h += this.sheetOverlayHTML(v.name + ', ' + description, 5.3, 78 + i * 2.16, 43, 1.7, 1.2);
    h += this.sheetOverlayHTML(sheetItemType[v.type], 49.7, 78.2 + i * 2.16, 9, 1.7, 1, 'center')
  });
  const gear = s.items.filter(v => v.type === 'armor' || (v.type === 'equipment' && !isFreeCommlink(v.name)));
  h += lines(gear.map(v => v.name + ' ' + money(v.cost)), 5.3, 89.3, 1.76, 20, 4, 1);
  h += this.sheetOverlayHTML('Remaining: ' + money(calc(s).remaining), 7, 96.45, 22, 1.3, 1);
  const armor = mainArmor(s);
  const strength = +s.attributes.Strength || 0,
    willpower = +s.attributes.Willpower || 0;
  const woundRows = [{
    y: 91,
    base: strength
  }, {
    y: 92.7,
    base: strength + armor.protection
  }, {
    y: 94.5,
    base: strength
  }, {
    y: 96.3,
    base: willpower
  }];
  woundRows.forEach(row => [row.base, row.base + 3, row.base + 6].forEach((n, i) => h += this.sheetOverlayHTML(n, 44.6 + i * 5.5 + (i ==
    2 ? -1 : 0), row.y, 4.4, 1.4, 1, 'center')));
  h += this.sheetOverlayHTML(armor.name, 32.3, 92.8, 11, 1.5, 1);
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
        h += this.sheetWoundHTML(x, 89.88 + row * 1.2);
        index++
      }
    }
  });
  if (s.portrait) h += this.sheetPortraitHTML(s.portrait);  
  return h + '</div>';
}

sheetOverlayHTML(value, x, y, w, h = 1.65, size = 1.04, align = 'left', transform) {
  const transformStyle = transform ? 'transform: ' + transform : '';
  return `<div class="overlay" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;font-size:${size}cqw;text-align:${align};${transformStyle}">${this.esc(value)}</div>`;
}

sheetWoundHTML(x, y) {
  return `<span class="wound" style="left:${x}%;top:${y}%;width:1.28%;height:.97%"></span>`;
}

sheetPortraitHTML(portrait) {
  const mask = this.esc(new URL('../images/avatar-mask.webp', import.meta.url).href);
  // Align the full square mask with the painted opening on the sheet.
  const placement = 'position:absolute;left:64.8%;top:8.8%;width:32.8%;aspect-ratio:1;object-fit:cover';
  return `<img class="portrait" src="${this.esc(portrait)}" alt="Character portrait" style="${placement};mask:url(&quot;${mask}&quot;) center / 100% 100% no-repeat;mask-mode:luminance">`;
}
}
customElements.define('anarchy-builder', AnarchyBuilder);
