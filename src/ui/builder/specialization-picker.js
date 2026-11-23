import { escapeHTML, optionHTML } from '../html.js';

export function specializationPickerHTML({ index, skillName, options, attributes, preferred }) {
  return [
    `<runner-specialization-picker index="${index}" skill="${escapeHTML(skillName)}">`,
      '<label class="field"><span>Specialization</span>',
        '<select data-specialization>',
          '<option value="">Add…</option>',
          options,
          '<option value="__custom__">Custom…</option>',
        '</select>',
      '</label>',
      `<div class="custom-specialization" popover="manual" role="dialog" aria-labelledby="custom-title-${index}">`,
        `<h4 id="custom-title-${index}">Custom specialization <span>${escapeHTML(skillName)}</span></h4>`,
        '<div class="custom-specialization-fields">',
          `<label class="field"><span>Name</span><input data-custom-for="${index}" required></label>`,
          '<label class="field"><span>Attribute</span><select data-custom-attribute>',
            ...attributes.map(attribute => optionHTML(attribute, { selected: attribute === preferred })),
          '</select></label>',
        '</div>',
        '<div class="custom-specialization-actions">',
          '<button type="button" data-close-custom>Cancel</button>',
          '<button type="button" class="primary" data-confirm-custom disabled>Add</button>',
        '</div>',
      '</div>',
    '</runner-specialization-picker>'
  ].join('');
}
export class RunnerSpecializationPicker extends HTMLElement {
  connectedCallback() {
    this.select = this.querySelector('[data-specialization]');
    this.tip = this.querySelector('.custom-specialization');
    this.nameInput = this.tip.querySelector('[data-custom-for]');
    this.attribute = this.tip.querySelector('[data-custom-attribute]');
    const add = this.tip.querySelector('[data-confirm-custom]');
    this.select.onchange = () => {
      if (this.select.value === '__custom__') {
        this.tip.showPopover({ source: this.select });
        this.nameInput.focus();
      } else {
        this.tip.hidePopover();
        if (this.select.value) this.choose(this.select.value, this.select.selectedOptions[0].dataset.attribute);
      }
    };
    const close = () => {
      this.tip.hidePopover();
      this.select.value = '';
      this.select.focus();
    };
    add.onclick = () => this.addCustom();
    this.nameInput.oninput = () => { add.disabled = !this.nameInput.value.trim(); };
    this.tip.querySelector('[data-close-custom]').onclick = close;
    this.tip.onkeydown = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'Enter' && event.target === this.nameInput) {
        event.preventDefault();
        this.addCustom();
      }
    };
  }

  get draft() {
    if (!this.tip?.matches(':popover-open')) return null;
    return { skill: this.getAttribute('skill'), name: this.nameInput.value, attribute: this.attribute.value };
  }

  restoreDraft({ name, attribute }) {
    this.select.value = '__custom__';
    this.nameInput.value = name;
    if ([...this.attribute.options].some(option => option.value === attribute)) this.attribute.value = attribute;
    this.nameInput.oninput();
    this.tip.showPopover({ source: this.select });
  }

  addCustom() {
    if (!this.nameInput.value.trim()) return;
    this.tip.hidePopover();
    this.choose(this.nameInput.value, this.attribute.value);
  }

  choose(name, attribute) {
    this.dispatchEvent(new CustomEvent('specialization-add', {
      detail: { index: Number(this.getAttribute('index')), name, attribute },
      bubbles: true
    }));
  }
}

customElements.define('runner-specialization-picker', RunnerSpecializationPicker);
