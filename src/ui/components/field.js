import { FIELD_KIND } from '../html.js';

export class RunnerField extends HTMLElement {
  connectedCallback() {
    if (this.firstElementChild) return;
    const label = this.ownerDocument.createElement('label');
    label.className = 'field';

    const caption = this.ownerDocument.createElement('span');
    caption.textContent = this.getAttribute('label') || '';
    const control = this.createControl();
    control.dataset.path = this.getAttribute('path');

    label.append(caption, control);
    this.append(label);
  }

  createControl() {
    const options = this.getAttribute('options');
    const value = this.getAttribute('value');
    if (options) return this.createSelect(JSON.parse(options), value);

    const kind = this.getAttribute('kind') || FIELD_KIND.Text;
    const control = this.ownerDocument.createElement(kind === FIELD_KIND.Textarea ? 'textarea' : 'input');
    if (kind === FIELD_KIND.Textarea) {
      control.rows = Number(this.getAttribute('rows')) || 2;
    } else {
      control.type = kind;
      if (control.type === FIELD_KIND.Number) control.step = this.getAttribute('step') || '1';
    }
    control.value = value || '';
    return control;
  }

  createSelect(optionsArr, valueStr) {
    const select = this.ownerDocument.createElement('select');
    for (const value of optionsArr) {
      const option = this.ownerDocument.createElement('option');
      option.value = value;
      option.textContent = value;
      option.selected = String(value) === valueStr;
      select.append(option);
    }
    return select;
  }
}

customElements.define('runner-field', RunnerField);
