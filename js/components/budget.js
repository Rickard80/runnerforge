export class RunnerBudget extends HTMLElement {
  connectedCallback() {
    this.classList.add('runner-budget')
  }
}
customElements.define('runner-budget', RunnerBudget);