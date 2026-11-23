import fs from 'node:fs';
globalThis.HTMLElement = class {};
globalThis.customElements = {
  define() {}
};
const {
  calc,
  maxed
} = await import('../src/domain/model.js');
const {
  LEVELS
} = await import('../src/domain/data/rules.js');
const {
  AnarchyBuilder,
  upgradeGeneratedAttribute
} = await import('../src/ui/builder/builder.js');
for (const name of ['Combat Mage 85', 'Street Shaman 13', 'Illusionist 76', 'Illusionist 43']) {
  const s = JSON.parse(fs.readFileSync(`/mnt/data/${name}.json`, 'utf8'));
  console.log('Uploaded fixture:', name, 'remaining', calc(s).remaining, 'maxed', maxed(s), 'max allowed', LEVELS[s
    .level].max);
}
let above = 0,
  below = 0;
for (let i = 0; i < 500; i++) {
  const app = new AnarchyBuilder();
  app.notify = () => {};
  app.randomize();
  const s = app.s;
  if (calc(s).remaining < 0) throw Error('Over budget');
  if (maxed(s) > LEVELS[s.level].max) throw Error('Too many max attributes');
  if (calc(s).remaining >= 20000) {
    above++;
    if (!app.lastGeneratedAttributeUpgrade) throw Error(
      `Generated character has ${calc(s).remaining}¥ but did not upgrade a linked attribute: ${JSON.stringify(s.attributes)}`
      );
  } else below++;
}
console.log('500 generated: >=20k remaining', above, '<20k', below);

// Regression: two user-submitted generated characters with unspent nuyen.
for (const name of ['Illusionist 50', 'Street Shaman 44']) {
  const s = JSON.parse(fs.readFileSync(`/mnt/data/${name}.json`, 'utf8'));
  const before = calc(s).remaining;
  let upgrades = 0;
  while (calc(s).remaining >= 20000 && upgradeGeneratedAttribute(s, LEVELS[s.level])) upgrades++;
  if (!upgrades) throw Error(`${name}: no attribute upgrade`);
  if (calc(s).remaining >= 20000) throw Error(`${name}: surplus remains after eligible upgrades`);
  if (maxed(s) > LEVELS[s.level].max) throw Error(`${name}: metatype maximum exceeded`);
  console.log(name, 'upgrades', upgrades, 'remaining', calc(s).remaining, 'attributes', s.attributes);
}