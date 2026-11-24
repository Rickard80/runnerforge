import assert from 'node:assert/strict';
import { makeAmp } from '../src/domain/data/amp-profiles.js';
import { blank } from '../src/domain/model.js';
import { riskReductionState, riskReductionTarget, RR_SCOPE, toggleRiskReduction } from '../src/domain/risk-reduction.js';
import { restoreCharacter } from '../src/infrastructure/character-storage.js';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { printContentHTML } = await import('../src/ui/print-sheet.js');

const character = blank();
character.skills = [
  { name: 'Ranged Weapons', rating: 4, specializations: ['Pistols'] },
  { name: 'Piloting', rating: 3 },
  { name: 'Perception', rating: 3 },
  { name: 'Stealth', rating: 3 }
];
character.riskReduction = 0;
const agility = riskReductionTarget(RR_SCOPE.Attribute, 'Agility').key;
const rangedWeapons = riskReductionTarget(RR_SCOPE.Skill, 'Ranged Weapons').key;
const pistols = riskReductionTarget(RR_SCOPE.Specialization, 'Ranged Weapons', 'Pistols').key;
const physicalPerception = riskReductionTarget(RR_SCOPE.Specialization, 'Perception', 'Physical').key;
const physicalSneaking = riskReductionTarget(RR_SCOPE.Specialization, 'Stealth', 'Physical Sneaking').key;

toggleRiskReduction(character, [agility]);
toggleRiskReduction(character, [pistols]);
const saved = restoreCharacter(JSON.parse(JSON.stringify(character)));
assert.deepEqual(saved.riskReduction, [agility, pistols]);
assert.equal((printContentHTML(saved).match(/sheet-rr-marked/g) ?? []).length, 4);
toggleRiskReduction(character, [agility]);
assert.deepEqual(character.riskReduction, [pistols]);

character.amps = [
  makeAmp('Smartlink'),
  makeAmp('Ares SharpShooter Cybernetic Eyes'),
  makeAmp('Ares Predator IV'),
  makeAmp('Evo EyeDrone Cybernetic Eyes'),
  { ...makeAmp('Improved Ability'), notes: 'RR 1 on a chosen skill. Selected: Piloting.' },
  { ...makeAmp('Improved Attribute'), notes: 'RR 1 on Tests with a chosen attribute. Selected: Agility.' },
  { name: 'Custom Amp', notes: 'Risk Reduction 1 on Stealth (Physical Sneaking).' }
];
const { ampGrantsMap } = riskReductionState(character);
assert.equal(ampGrantsMap.get(rangedWeapons).sources.size, 2);
assert.deepEqual([...ampGrantsMap.get(physicalPerception).sources], ['Evo EyeDrone Cybernetic Eyes']);
assert.deepEqual([...ampGrantsMap.get(physicalSneaking).sources], ['Custom Amp']);
assert(ampGrantsMap.has(riskReductionTarget(RR_SCOPE.Skill, 'Piloting').key));
assert(ampGrantsMap.has(agility));
toggleRiskReduction(character, [rangedWeapons]);
assert.deepEqual(character.riskReduction, [pistols]);
const preview = printContentHTML(character, true);
assert.match(preview, /title="Ranged Weapons: Smartlink, Ares SharpShooter Cybernetic Eyes" aria-disabled="true"/);
assert.match(preview, /title="Perception \(Physical\): Evo EyeDrone Cybernetic Eyes" aria-disabled="true"/);
assert.doesNotMatch(printContentHTML(character), /data-rr-keys/);

character.amps.shift();
assert(riskReductionState(character).ampGrantsMap.has(rangedWeapons));
character.amps = [];
assert(!riskReductionState(character).ampGrantsMap.has(rangedWeapons));
assert.deepEqual(character.riskReduction, [pistols]);
console.log('Passed manual and Amp-granted Risk Reduction, legacy saves, duplicate sources, and sheet output.');
