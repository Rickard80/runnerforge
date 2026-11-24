import assert from 'node:assert/strict';
import { AMP_PROFILES } from '../src/domain/data/amp-profiles.js';
import { CONCEPTS } from '../src/domain/data/concepts.js';
import { trainGeneratedRunner } from '../src/domain/generation.js';
import { blank, calc } from '../src/domain/model.js';
import { linkedAttributes, SKILLS, skillRule, specializationCode } from '../src/domain/specializations.js';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { AnarchyBuilder } = await import('../src/ui/builder/builder.js');
const { printContentHTML, sheetSkillPages } = await import('../src/ui/print-sheet.js');

function checkTraining([name, ...specializations]) {
  assert(skillRule(name), `Unknown skill ${name}`);
  for (const value of specializations) {
    assert(specializationCode(name, value), `Unknown specialization ${value} for ${name}`);
  }
}

assert.equal(SKILLS.length, 14);
for (const { training = [], trainingChoices = [] } of Object.values(AMP_PROFILES)) {
  [...training, ...trainingChoices].forEach(checkTraining);
}
for (const concept of Object.values(CONCEPTS).flat()) {
  concept.skills.forEach(name => checkTraining([name, ...(concept.specializations?.[name] ?? [])]));
}
assert.equal(specializationCode('Sorcery', 'Health Spells'), 'W');
assert.equal(specializationCode('Conjuring', 'Spirits of Kin'), 'L/C');
assert.equal(specializationCode('Stealth', 'Lockpicking'), 'A/L');

const skill = (name, rating, specializations = []) => ({
  name, rating, attribute: linkedAttributes({ name })[0], specializations
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
assert.deepEqual(first.slice(0, 2).map(row => [row.attribute, row.specs, row.pool]), [
  ['Strength', 'Climbing', '7 (+2)'],
  ['Agility', 'Parkour', '6 (+2)']
]);
assert.deepEqual(first.slice(2, 4).map(row => row.specs), ['Lockpicking', '']);
assert.deepEqual(first.slice(4, 7).map(row => row.specs), ['First Aid', 'Animals', 'Composure']);
assert.deepEqual(continued.map(row => row.attribute), ['Logic', 'Charisma']);
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
  setAttribute(name, value) { this[name] = value; },
  focus() { this.focused = true; }
};
const panel = { hidden: true };
const close = {};
const elements = { '#skill-attributes-toggle': toggle, '#skill-attributes-panel': panel, '#skill-attributes-close': close, '#saved': {}, '#import': {} };
app.querySelector = selector => elements[selector] ?? null;
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
assert.deepEqual(sheetSkillPages(app.s).first.slice(2, 4).map(row => [row.label, row.attribute]), [
  ['Stealth', 'Agility'],
  ['Stealth (Lockpicking)', 'Logic']
]);

app.s.attributes.Strength = 3;
const mergedAthletics = sheetSkillPages(app.s).first.filter(row => row.skill.name === 'Athletics');
assert.equal(mergedAthletics.length, 1);
assert.equal(mergedAthletics[0].attributeLabel, 'STR, AGI');
assert.equal(mergedAthletics[0].label, 'Athletics (Climbing [STR], Parkour [AGI])');
assert.match(app.skillRowHTML(app.s.skills[0], 0), /strength 6.*agility 6.*data-path="skills.0.name"/);
assert.match(app.skillRowHTML(app.s.skills[0], 0), /popover="manual".*role="dialog".*Custom specialization.*>Name<.*>Attribute<.*data-close-custom.*data-confirm-custom disabled/);
app.s.knowledge = ['Seattle', 'Street vendors'];
assert.match(app.skillsHTML(), /class="stack knowledge-grid"/);
app.s.items = [{ name: 'Medkit', type: 'equipment', description: 'Medical', cost: 2500 }];
assert.doesNotMatch(app.itemRowHTML(0), /path="items.0.type"/);
assert.match(app.itemRowHTML(0), /label="Description \/ type" path="items.0.description"/);
assert.match(app.specializationBadges(app.s.skills[0], 0), /Climbing <span class="specialization-attribute">STR<.*Parkour <span class="specialization-attribute">AGI</);
const gear = app.catalogPanelHTML('gear', 'Catalog');
assert.match(gear, /value="Communication".*value="Drones".*value="General".*value="Medical".*value="Vehicle"/);
app.catalogFilters.gear.category = 'General';
const general = app.catalogHTML('gear');
assert.match(general, /Electronics toolkit.*Lockpick set.*Tool kit/);
assert.doesNotMatch(general, /Medkit|Racing Bike/);
app.catalogFilters.gear.category = 'Medical';
assert.match(app.catalogHTML('gear'), /DocWagon contract/);
app.catalogFilters.gear.category = 'Vehicle';
assert.match(app.catalogHTML('gear'), /data-catalog="amp\|Racing Bike\|5000"/);

const capped = blank();
capped.level = 'Ganger';
capped.skills = SKILLS.slice(0, 7).concat('Electronics')
  .map(name => skill(name, name === 'Electronics' ? 3 : 4));
capped.amps = Array.from({ length: 11 }, () => ({ name: 'Existing Shadow Amp', rating: 1 }));
const names = capped.skills.map(row => row.name);
const random = Math.random;
try {
  Math.random = () => 0;
  trainGeneratedRunner(capped, { skills: [] }, []);
} finally {
  Math.random = random;
}
assert.deepEqual(capped.skills.map(row => row.name), names);
assert.deepEqual(capped.skills.map(row => row.rating), [4, 4, 4, 4, 4, 4, 4, 3]);
assert(calc(capped).remaining >= 0);
console.log('Passed skill definitions, specialization dice pools, continuation rows, and capped generation.');
