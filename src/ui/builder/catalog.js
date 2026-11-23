import { escapeHTML, optionHTML } from '../html.js';

export function catalogPanelHTML({ searchLabel, filters, categories, results }) {
  return [
    '<runner-catalog><div class="formgrid">',
      `<label class="field"><span>${escapeHTML(searchLabel)}</span>`,
        `<input data-catalog-search placeholder="Search names or type" value="${escapeHTML(filters.search)}">`,
      '</label>',
      '<label class="field"><span>Category</span><select data-catalog-category>',
        '<option value="">All categories</option>',
        ...categories.map(category => optionHTML(category, { value: category, selected: filters.category === category })),
      '</select></label>',
    '</div>',
    `<div class="catalog" data-catalog-results>${results}</div></runner-catalog>`
  ].join('');
}
export class RunnerCatalog extends HTMLElement {
  connectedCallback() {
    const search = this.querySelector('[data-catalog-search]');
    const category = this.querySelector('[data-catalog-category]');
    search.oninput = () => this.filter('search', search.value);
    category.onchange = () => this.filter('category', category.value);
    this.onclick = event => {
      const button = event.target.closest('button[data-catalog]');
      if (!button || !this.contains(button)) return;
      const [type, name, cost] = button.dataset.catalog.split('|');
      this.dispatchEvent(new CustomEvent('catalog-pick', {
        bubbles: true, detail: { type, name, cost: Number(cost) }
      }));
    };
  }

  set results(markup) {
    this.querySelector('[data-catalog-results]').innerHTML = markup;
  }

  filter(key, value) {
    this.dispatchEvent(new CustomEvent('catalog-filter', { bubbles: true, detail: { key, value } }));
  }
}

customElements.define('runner-catalog', RunnerCatalog);
