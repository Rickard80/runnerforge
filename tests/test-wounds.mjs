import assert from 'node:assert/strict';
import { makeAmp } from '../src/domain/generation.js';
import { blank, equipArmorAmp, woundArmor, woundThresholds } from '../src/domain/model.js';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { AnarchyBuilder } = await import('../src/ui/builder/builder.js');
const { sheetWoundsHTML } = await import('../src/ui/print-sheet.js');

assert.deepEqual(woundThresholds('Physical', 4, 2), [6, 9, 12]);
assert.deepEqual(woundThresholds('Mental', 5, 1), [6, 9, 12]);
assert.deepEqual(woundThresholds('Matrix', 4, 2), [4, 7, 10]);
assert.deepEqual(woundThresholds('Vehicle', 4, 2), [6, 10, 14]);

const app = new AnarchyBuilder();
app.update = () => {};
app.notify = () => {};
const legacy = blank();
delete legacy.woundSettings;
legacy.items = [
  { type: 'armor', name: 'Lined coat (2)' },
  { type: 'armor', name: 'Armor jacket (3)' }
];
await app.importJSON({ text: async () => JSON.stringify(legacy) });
assert.deepEqual(woundArmor(app.s), {
  main: { name: 'Lined coat (2)', protection: 2 },
  alternate: { name: 'Armor jacket (3)', protection: 3 }
});
assert.match(app.woundsHTML(), /path="woundSettings.mainArmorName" value="Lined coat \(2\)"/);
assert.match(app.woundsHTML(), /path="woundSettings.alternateArmorIncrease" value="3"/);
assert.match(app.woundsHTML(), /path="woundSettings.alternateType" value="Mental"[^>]*options='\["Mental","Matrix","Vehicle"\]'/);

const armorInput = { dataset: { path: 'woundSettings.mainArmorIncrease' }, type: 'number', value: '0' };
const typeInput = { dataset: { path: 'woundSettings.alternateType' }, type: 'select-one', value: 'Vehicle' };
const attributeInput = { dataset: { path: 'woundSettings.alternateAttribute' }, type: 'select-one', value: 'Logic' };
const alternateInput = { dataset: { path: 'woundSettings.alternateArmorIncrease' }, type: 'number', value: '6' };
const vehicleBodyInput = { dataset: { path: 'woundSettings.vehicleBody' }, type: 'number', value: '6' };
app.querySelectorAll = selector => selector === '[data-path]' ? [armorInput, typeInput, attributeInput, alternateInput, vehicleBodyInput] : [];
app.querySelector = selector => ['#saved', '#import'].includes(selector) ? {} : null;
app.bind();
armorInput.onchange();
assert.equal(woundArmor(app.s).main.protection, 0);
armorInput.value = '';
armorInput.onchange();
assert.equal(woundArmor(app.s).main.protection, 2);

Object.assign(app.s.attributes, { Strength: 3, Willpower: 5, Logic: 4 });
const numbersAt = y => [...sheetWoundsHTML(app.s).matchAll(new RegExp(`top:${y}%;[^>]+>(\\d+)<`, 'g'))].map(match => Number(match[1]));
typeInput.onchange();
assert.equal(app.s.woundSettings.alternateAttribute, '---');
assert.equal(app.s.woundSettings.alternateArmorName, 'Vehicle');
assert.doesNotMatch(app.woundsHTML(), /path="woundSettings.alternateArmorName"/);
assert.match(app.woundsHTML(), /label="Body".*label="Armor"/);
assert.deepEqual(numbersAt(94.5), []);
vehicleBodyInput.onchange();
alternateInput.value = '2';
alternateInput.onchange();
assert.deepEqual(numbersAt(94.5), [8, 14, 20]);
vehicleBodyInput.value = '';
vehicleBodyInput.onchange();
attributeInput.onchange();
Object.assign(app.s.woundSettings, {
  mainArmorName: 'Travel coat',
  alternateArmorName: 'Vehicle shell',
  alternateArmorIncrease: 2
});
assert.deepEqual(numbersAt(91), [3, 6, 9]);
assert.deepEqual(numbersAt(92.7), [5, 8, 11]);
assert.deepEqual(numbersAt(94.5), [6, 10, 14]);
assert.match(sheetWoundsHTML(app.s), /Travel coat.*Vehicle shell/);

typeInput.value = 'Matrix';
typeInput.onchange();
assert.equal(app.s.woundSettings.alternateAttribute, '---');
assert.equal(app.s.woundSettings.alternateArmorName, 'Firewall');
assert.match(app.woundsHTML(), /path="woundSettings.alternateArmorName" value="Firewall"/);
assert.match(app.woundsHTML(), /label="Firewall rating"/);
assert.deepEqual(numbersAt(94.5), [2, 5, 8]);
alternateInput.value = '4';
alternateInput.onchange();
assert.deepEqual(numbersAt(94.5), [4, 7, 10]);
alternateInput.value = '';
alternateInput.onchange();
assert.deepEqual(numbersAt(94.5), []);

typeInput.value = 'Mental';
typeInput.onchange();
assert.equal(app.s.woundSettings.alternateAttribute, 'Willpower');
assert.match(app.woundsHTML(), /path="woundSettings.alternateArmorName" value="Armor jacket/);
assert.deepEqual(numbersAt(94.5), [8, 11, 14]);

const savedDamage = { ...app.s, woundSettings: { alternateType: 'Damage', alternateAttribute: 'Logic' } };
await app.importJSON({ text: async () => JSON.stringify(savedDamage) });
assert.equal(app.s.woundSettings.alternateType, 'Vehicle');
assert.equal(app.s.woundSettings.alternateAttribute, 'Logic');
await app.importJSON({ text: async () => JSON.stringify({
  ...app.s, woundSettings: { alternateType: 'Matrix', alternateAttribute: '---', alternateFirewall: 3 }
}) });
assert.equal(app.s.woundSettings.alternateArmorIncrease, 3);
assert.equal(Object.hasOwn(app.s.woundSettings, 'alternateFirewall'), false);
assert.equal(Object.hasOwn(app.s.woundSettings, 'alternateBody'), false);


const amp = makeAmp('Chameleon Suit');
const armored = blank();
equipArmorAmp(armored, amp);
armored.amps.push(amp);
armored.items.push({ type: 'armor', name: 'Lined coat (2)' });
assert.deepEqual(woundArmor(armored), {
  main: { name: 'Chameleon Suit', protection: 3 },
  alternate: { name: 'Lined coat (2)', protection: 2 }
});
console.log('Passed wound formulas, automatic armor, manual overrides, and printed thresholds.');
