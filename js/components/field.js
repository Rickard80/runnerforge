export class RunnerField extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    const label = document.createElement('label');
    label.className = 'field';
    const span = document.createElement('span');
    span.textContent = this.getAttribute('label') || '';
    label.append(span);
    const options = this.getAttribute('options');
    let control;
    if (options) {
      control = document.createElement('select');
      JSON.parse(options).forEach(value => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        opt.selected = String(value) === this.getAttribute('value');
        control.append(opt)
      })
    } else if (this.getAttribute('kind') === 'textarea') {
      control = document.createElement('textarea');
      control.rows = (this.getAttribute('path') || '').match(/^amps\.\d+\.notes$/) ? 1 : 2;
      control.value = this.getAttribute('value') || ''
    } else {
      control = document.createElement('input');
      control.type = this.getAttribute('kind') || 'text';
      control.value = this.getAttribute('value') || '';
      if (control.type === 'number') control.step = '1'
    }
    control.dataset.path = this.getAttribute('path');
    label.append(control);
    this.append(label)
  }
}
customElements.define('runner-field', RunnerField);