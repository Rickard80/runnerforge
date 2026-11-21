export class RunnerCatalogItem extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    const b = document.createElement('button');
    b.className = 'catalogitem';
    b.dataset.catalog = this.getAttribute('data-catalog') || '';
    const name = document.createElement('span');
    name.textContent = this.getAttribute('label') || '';
    const cost = document.createElement('small');
    cost.textContent = this.getAttribute('cost') || '';
    b.append(name, cost);
    this.append(b)
  }
}
customElements.define('runner-catalog-item', RunnerCatalogItem);