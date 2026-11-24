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
    if (upgradeGeneratedAttribute(structuredClone(s))) {
      throw Error(`Generated character has ${calc(s).remaining}¥ and can still upgrade a linked attribute: ${JSON.stringify(s.attributes)}`);
    }
  } else below++;
}
console.log('500 generated: >=20k remaining', above, '<20k', below);
