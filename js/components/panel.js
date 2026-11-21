export class RunnerPanel extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    this.classList.add('panel');
    const heading = document.createElement('h2');
    heading.textContent = this.getAttribute('heading') || '';
    this.prepend(heading)
  }
}
customElements.define('runner-panel', RunnerPanel);