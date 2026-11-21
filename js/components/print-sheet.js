export class RunnerPrintSheet extends HTMLElement {
  connectedCallback() {
    this.classList.add('print-sheet-host')
  }
  set markup(value) {
    this.innerHTML = value
  }
}
customElements.define('runner-print-sheet', RunnerPrintSheet);