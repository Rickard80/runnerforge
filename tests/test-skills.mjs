import assert from 'node:assert/strict';
import { AMP_PROFILES } from '../src/domain/data/amp-profiles.js';
import { CATALOG } from '../src/domain/data/catalog.js';
import { CONCEPTS } from '../src/domain/data/concepts.js';
import { AMP_GROUP, ROLE } from '../src/domain/data/rules.js';
import { generateCharacter, trainGeneratedRunner } from '../src/domain/generator.js';
import { blank, calc } from '../src/domain/model.js';
import { riskReductionState, riskReductionTarget, RR_SCOPE } from '../src/domain/risk-reduction.js';
import { linkedAttributes, SKILLS, skillRule, specializationCode } from '../src/domain/specializations.js';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { AnarchyBuilder } = await import('../src/ui/builder/builder.js');
const { printContentHTML, sheetSkillPages } = await import('../src/ui/print-sheet.js');

function checkTraining([nameStr, ...specializationsArr]) {
  assert(skillRule(nameStr), `Unknown skill ${nameStr}`);
  for (const value of specializationsArr) {
    assert(specializationCode(nameStr, value), `Unknown specialization ${value} for ${nameStr}`);
  }
}

assert.equal(SKILLS.length, 14);
for (const { training = [], trainingChoices = [] } of Object.values(AMP_PROFILES)) {
  [...training, ...trainingChoices].forEach(checkTraining);
}
for (const concept of Object.values(CONCEPTS).flat()) {
  for (const amp of concept.amps) assert(Object.hasOwn(AMP_PROFILES, amp), `${concept.name} references unknown amp ${amp}`);
  concept.skills.forEach(nameStr => checkTraining([nameStr, ...(concept.specializations?.[nameStr] ?? [])]));
}
const { characterObj: specialist } = generateCharacter({ ...blank(), role: ROLE.Muscle, concept: 'Weapons Specialist' });
const rifles = riskReductionTarget(RR_SCOPE.Specialization, 'Ranged Weapons', 'Rifles').key;
assert(riskReductionState(specialist).ampGrantsMap.get(rifles)?.sources.has('Reflex Recorder'));
assert.equal(specializationCode('Sorcery', 'Health Spells'), 'W');
assert.equal(specializationCode('Conjuring', 'Spirits of Kin'), 'L/C');
assert.equal(specializationCode('Stealth', 'Lockpicking'), 'A/L');

const skill = (nameStr, rating, specializationsArr = []) => ({
  name: nameStr, rating, attribute: linkedAttributes({ name: nameStr })[0], specializations: specializationsArr
});
const app = new AnarchyBuilder();
app.update = () => {};
app.s.skills = [
  skill('Athletics', 3, ['Climbing', 'Parkour']),
  skill('Stealth', 4, ['Lockpicking']),
  skill('Survival', 3, ['First Aid', 'Animals', 'Composure']),
  skill('Cracking', 4, ['Cybercombat']),
  skill('Perception', 3),
  skill('Conjuring', 3, ['Banishing'])
];
app.s.attributes.Strength = 4;
app.s.attributes.Agility = 3;
app.s.attributes.Charisma = 3;
app.s.attributes.Willpower = 4;
const { first, continued } = sheetSkillPages(app.s);
assert.equal(first.length, 10);
assert.deepEqual(first.slice(0, 2).map(rowObj => [rowObj.attribute, rowObj.specs, rowObj.pool]), [
  ['Strength', 'Climbing', '7 (+2)'],
  ['Agility', 'Parkour', '6 (+2)']
]);
assert.deepEqual(first.slice(2, 4).map(rowObj => rowObj.specs), ['Lockpicking', '']);
assert.deepEqual(first.slice(4, 7).map(rowObj => rowObj.specs), ['First Aid', 'Animals', 'Composure']);
assert.deepEqual(continued.map(rowObj => rowObj.attribute), ['Logic', 'Charisma']);
const sheet = printContentHTML(app.s);
assert.doesNotMatch(sheet, /ⓘ|runner-info|<input/);
assert.match(sheet, />Athletics \(Climbing\)<.*left:38\.25%[^>]*>STR</);
assert.match(sheet, />Athletics \(Parkour\)<.*left:38\.25%[^>]*>AGI</);
assert.match(sheet, />Perception<.*left:38\.25%[^>]*>LOG</);
assert.match(sheet, /Skills continued.*Conjuring \(Banishing\)<\/th><td>3<\/td><td>LOG<.*Conjuring<\/th><td>3<\/td><td>CHA</);
assert.doesNotMatch(sheet, /Athletics, STR|Athletics, AGI|Conjuring, LOG/);
const preview = printContentHTML(app.s, true);
assert.equal([...preview.matchAll(/data-inline-path="skills\.0\.rating"/g)].length, 2);
assert.match(preview, /Skills continued.*data-inline-path="skills\.5\.rating"/);
app.tab = 'attributes';
assert.match(app.tabContentHTML(), /<runner-info label="About Survival"/);
assert.match(app.tabContentHTML(), /aria-expanded="false".*id="skill-attributes-panel"[^>]* hidden>/);
const toggle = {
  setAttribute(nameStr, valueStr) { this[nameStr] = valueStr; },
  focus() { this.focused = true; }
};
const panel = { hidden: true };
const close = {};
const elements = { '#skill-attributes-toggle': toggle, '#skill-attributes-panel': panel, '#skill-attributes-close': close, '#saved': {}, '#import': {} };
app.querySelector = selectorStr => elements[selectorStr] ?? null;
app.querySelectorAll = () => [];
app.bind();
toggle.onclick();
assert.equal(toggle['aria-expanded'], 'true');
assert.equal(panel.hidden, false);
assert.match(app.tabContentHTML(), /aria-expanded="true"/);
toggle.onclick();
assert.equal(panel.hidden, true);
toggle.onclick();
close.onclick();
assert.equal(toggle['aria-expanded'], 'false');
assert.equal(toggle.focused, true);
assert.equal(panel.hidden, true);
app.s.amps.push({ name: 'An Amp' });
assert.match(app.ampsHTML(), /<runner-info label="Source for An Amp"/);
assert.doesNotMatch(app.skillRowHTML(app.s.skills[2], 2), /ⓘ|runner-info/);
assert.deepEqual(linkedAttributes({ name: 'Firearms', attribute: 'Agility' }), ['Agility']);
app.removeSpecialization(1, 0);
assert.match(app.skillRowHTML(app.s.skills[1], 1), /data-attribute="Agility">Lockpicking \(AGI\).*data-attribute="Logic">Lockpicking \(LOG\)/);
app.addSpecialization(1, 'Lockpicking', 'Logic');
assert.deepEqual(sheetSkillPages(app.s).first.slice(2, 4).map(rowObj => [rowObj.label, rowObj.attribute]), [
  ['Stealth', 'Agility'],
  ['Stealth (Lockpicking)', 'Logic']
]);

app.s.attributes.Strength = 3;
const mergedAthletics = sheetSkillPages(app.s).first.filter(rowObj => rowObj.skill.name === 'Athletics');
assert.equal(mergedAthletics.length, 1);
assert.equal(mergedAthletics[0].attributeLabel, 'STR, AGI');
assert.equal(mergedAthletics[0].label, 'Athletics (Climbing [STR], Parkour [AGI])');
assert.match(app.skillRowHTML(app.s.skills[0], 0), /strength 6.*agility 6.*data-path="skills.0.name"/);
assert.match(app.skillRowHTML(app.s.skills[0], 0), /popover="manual".*role="dialog".*Custom specialization.*>Name<.*>Attribute<.*data-close-custom.*data-confirm-custom disabled/);
app.s.knowledge = ['Seattle', 'Street vendors'];
assert.match(app.skillsHTML(), /<runner-entry-list class="knowledge-grid" data-reorder-list="knowledge">/);
app.s.items = [{ name: 'Medkit', type: 'equipment', description: 'Medical', cost: 2500 }];
assert.doesNotMatch(app.itemRowHTML(0), /path="items.0.type"/);
assert.match(app.itemRowHTML(0), /label="Description \/ type" path="items.0.description"/);
assert.match(app.specializationBadges(app.s.skills[0], 0), /Climbing <span class="specialization-attribute">STR<.*Parkour <span class="specialization-attribute">AGI</);
const perception = skill('Perception', 3, ['Physical', 'Trail Signs']);
assert.match(app.specializationPicker(perception, 0), /data-attribute="Logic">Astral<\/option>/);
assert.doesNotMatch(app.specializationPicker(perception, 0), /\(LOG\)/);
const perceptionBadges = app.specializationBadges(perception, 0);
assert.match(perceptionBadges, /class="specialization-badge">Physical/);
assert.match(perceptionBadges, /class="specialization-badge specialization-badge-custom">Trail Signs/);
assert.doesNotMatch(perceptionBadges, /specialization-attribute/);
perception.specializationAttributes = { 'trail signs': 'Agility' };
assert.match(app.specializationBadges(perception, 0), /Trail Signs <span class="specialization-attribute"[^>]*>AGI<\/span>/);
const gear = app.catalogPanelHTML('gear', 'Catalog');
assert.match(gear, /value="Communication".*value="Drones".*value="General".*value="Medical"/);
assert.doesNotMatch(gear, /value="Vehicle"|Racing Bike/);
assert.match(gear, /label="Mirrored Persona" cost="5,000¥ · Sustained"/);
app.catalogFilters.gear.category = 'General';
const general = app.catalogHTML('gear');
assert.match(general, /Electronics toolkit.*Lockpick set.*Tool kit/);
assert.doesNotMatch(general, /Medkit|Racing Bike/);
app.catalogFilters.gear.category = 'Medical';
assert.match(app.catalogHTML('gear'), /DocWagon contract/);
app.catalogFilters.magic.category = 'Vehicle';
assert.match(app.catalogHTML('magic'), /data-catalog="amp\|Racing Bike" label="Racing Bike" cost="5,000¥/);
app.catalogFilters.gear = { category: '', search: '  SUSTAINED  ' };
assert.match(app.catalogHTML('gear'), /label="Mirrored Persona"/);
app.catalogFilters.gear.search = 'Sustained\tKatana';
assert.match(app.catalogHTML('gear'), /label="Katana"/);
assert.doesNotMatch(app.catalogHTML('gear'), /label="Mirrored Persona"/);
app.catalogFilters.gear.search = 'decoy Katana';
assert.match(app.catalogHTML('gear'), /label="Katana".*label="Mirrored Persona"/);
app.catalogFilters.magic = { category: '', search: 'vehicle' };
assert.match(app.catalogHTML('magic'), /label="Racing Bike"/);
app.catalogFilters.magic.search = 'vehicle danger';
assert.match(app.catalogHTML('magic'), /label="Danger Sense"/);
assert.doesNotMatch(app.catalogHTML('magic'), /label="Racing Bike"/);
app.catalogFilters.magic.search = 'pilot danger';
assert.match(app.catalogHTML('magic'), /label="Danger Sense".*label="Racing Bike"/);
app.catalogFilters.magic.category = 'Vehicle';
assert.match(app.catalogHTML('magic'), /label="Racing Bike"/);
assert.doesNotMatch(app.catalogHTML('magic'), /label="Danger Sense"/);
for (const [name, profile] of Object.entries(AMP_PROFILES)) {
  if (profile.group === AMP_GROUP.Vehicle) assert(!Object.hasOwn(CATALOG, name));
}

const gearApp = new AnarchyBuilder();
gearApp.update = () => {};
gearApp.addCatalogItem({ type: 'equipment', name: 'Medkit' });
gearApp.addCatalogItem({ type: 'complex form', name: 'Mirrored Persona' });
assert.equal(gearApp.s.items[0].description, 'Medical');
assert.equal(gearApp.s.items[1].description, CATALOG['Mirrored Persona'].description);
assert.match(gearApp.itemRowHTML(0), /label="Description \/ type" path="items.0.description" value="Medical"/);
assert.match(gearApp.itemRowHTML(1), /label="Description \/ type" path="items.1.description" value="Creates a virtual decoy"/);
assert.match(gearApp.itemRowHTML(1), /label="Name".*label="Rating" path="items.1.rating" value="2".*label="Description \/ type".*class="cost">5,000¥.*data-remove="items.1"/);
const price = {};
let budget;
gearApp.updateBudget = () => { budget = calc(gearApp.s); };
gearApp.changeField({
  dataset: { path: 'items.1.rating' },
  type: 'number',
  value: '3',
  closest: () => ({ querySelector: () => price })
});
assert.equal(gearApp.s.items[1].cost, 7500);
assert.equal(price.textContent, '7,500¥');
assert.equal(budget.items, 10000);
gearApp.addCatalogItem({ type: 'weapon', name: 'Katana' });
const printedGear = printContentHTML(gearApp.s);
assert.match(printedGear, /Mirrored Persona, Sustained, Creates a virtual decoy/);
assert.match(printedGear, />Katana, Long melee<\/div>/);
assert.match(printContentHTML(gearApp.s, true), /Mirrored Persona, Sustained, Creates a virtual decoy/);

const capped = blank();
capped.level = 'Ganger';
capped.skills = SKILLS.slice(0, 7).concat('Electronics')
  .map(nameStr => skill(nameStr, nameStr === 'Electronics' ? 3 : 4));
capped.amps = Array.from({ length: 11 }, () => ({ name: 'Existing Shadow Amp', rating: 1 }));
const names = capped.skills.map(rowObj => rowObj.name);
const random = Math.random;
try {
  Math.random = () => 0;
  trainGeneratedRunner(capped, { skills: [] }, []);
} finally {
  Math.random = random;
}
assert.deepEqual(capped.skills.map(rowObj => rowObj.name), names);
assert.deepEqual(capped.skills.map(rowObj => rowObj.rating), [4, 4, 4, 4, 4, 4, 4, 3]);
assert(calc(capped).remaining >= 0);
console.log('Passed skill definitions, specialization dice pools, continuation rows, and capped generation.');
