import { escapeHTML, optionHTML } from '../html.js';

const SPECIALIZATION_CHOICE = Object.freeze({ Empty: '', Custom: '__custom__' });
const POPOVER_KEY = Object.freeze({ Close: 'Escape', Submit: 'Enter' });

export function specializationPickerHTML({ index, skillName: skillNameStr, options: optionsStr, attributes: attributesArr, preferred: preferredStr }) {
  return [
    `<runner-specialization-picker index="${index}" skill="${escapeHTML(skillNameStr)}">`,
      '<label class="field"><span>Specialization</span>',
        '<select data-specialization>',
          `<option value="${SPECIALIZATION_CHOICE.Empty}">Add…</option>`,
          optionsStr,
          `<option value="${SPECIALIZATION_CHOICE.Custom}">Custom…</option>`,
        '</select>',
      '</label>',
      `<div class="custom-specialization" popover="manual" role="dialog" aria-labelledby="custom-title-${index}">`,
        `<h4 id="custom-title-${index}">Custom specialization <span>${escapeHTML(skillNameStr)}</span></h4>`,
        '<div class="custom-specialization-fields">',
          `<label class="field"><span>Name</span><input data-custom-for="${index}" required></label>`,
          '<label class="field"><span>Attribute</span><select data-custom-attribute>',
            ...attributesArr.map(attributeStr => optionHTML(attributeStr, { selected: attributeStr === preferredStr })),
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
    if (this.controller) return;
    this.select = this.querySelector('[data-specialization]');
    this.tip = this.querySelector('.custom-specialization');
    this.nameInput = this.tip.querySelector('[data-custom-for]');
    this.attribute = this.tip.querySelector('[data-custom-attribute]');
    this.addButton = this.tip.querySelector('[data-confirm-custom]');
    this.controller = new AbortController();
    this.bindControls();
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = undefined;
  }

  get draft() {
    if (!this.tip?.matches(':popover-open')) return null;
    return { skill: this.getAttribute('skill'), name: this.nameInput.value, attribute: this.attribute.value };
  }

  restoreDraft({ name: nameStr, attribute: attributeStr }) {
    this.select.value = SPECIALIZATION_CHOICE.Custom;
    this.nameInput.value = nameStr;
    if ([...this.attribute.options].some(optionObj => optionObj.value === attributeStr)) this.attribute.value = attributeStr;
    this.updateAddButton();
    this.tip.showPopover({ source: this.select });
  }

  addCustom() {
    if (!this.nameInput.value.trim()) return;
    this.tip.hidePopover();
    this.choose(this.nameInput.value, this.attribute.value);
  }

  choose(nameStr, attributeStr) {
    this.dispatchEvent(new CustomEvent('specialization-add', {
      detail: { index: Number(this.getAttribute('index')), name: nameStr, attribute: attributeStr },
      bubbles: true
    }));
  }

  bindControls() {
    const options = { signal: this.controller.signal };
    this.select.addEventListener('change', () => this.chooseOption(), options);
    this.addButton.addEventListener('click', () => this.addCustom(), options);
    this.nameInput.addEventListener('input', () => this.updateAddButton(), options);
    this.tip.querySelector('[data-close-custom]').addEventListener('click', () => this.closeCustom(), options);
    this.tip.addEventListener('keydown', eventObj => this.handlePopoverKey(eventObj), options);
  }

  chooseOption() {
    if (this.select.value === SPECIALIZATION_CHOICE.Custom) {
      this.tip.showPopover({ source: this.select });
      this.nameInput.focus();
      return;
    }

    this.tip.hidePopover();
    if (this.select.value) this.choose(this.select.value, this.select.selectedOptions[0].dataset.attribute);
  }

  closeCustom() {
    this.tip.hidePopover();
    this.select.value = SPECIALIZATION_CHOICE.Empty;
    this.select.focus();
  }

  updateAddButton() {
    this.addButton.disabled = !this.nameInput.value.trim();
  }

  handlePopoverKey(eventObj) {
    if (eventObj.key === POPOVER_KEY.Close) this.closeCustom();
    if (eventObj.key === POPOVER_KEY.Submit && eventObj.target === this.nameInput) {
      eventObj.preventDefault();
      this.addCustom();
    }
  }
}

customElements.define('runner-specialization-picker', RunnerSpecializationPicker);
