export const infoIcon = '<span aria-hidden="true">ⓘ</span>';

export class RunnerInfo extends HTMLElement {
  connectedCallback() {
    if (this.firstElementChild) return;
    const doc = this.ownerDocument;
    const details = doc.createElement('details');
    const summary = doc.createElement('summary');
    const text = doc.createElement('span');
    text.className = 'info-text';
    text.id = this.getAttribute('description-id');
    text.textContent = this.getAttribute('description');
    summary.setAttribute('aria-label', this.getAttribute('label'));
    summary.setAttribute('aria-describedby', text.id);
    summary.innerHTML = infoIcon;
    summary.append(text);
    details.append(summary);
    this.append(details);
  }
}

customElements.define('runner-info', RunnerInfo);
