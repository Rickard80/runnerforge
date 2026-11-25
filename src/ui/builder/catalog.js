import { escapeHTML, optionHTML } from '../html.js';

export const CATALOG_FILTER = Object.freeze({ Search: 'search', Category: 'category' });

export function catalogPanelHTML({ searchLabel: searchLabelStr, filters: filtersObj, categories: categoriesArr, results: resultsStr }) {
  return [
    '<runner-catalog><div class="formgrid">',
      `<label class="field"><span>${escapeHTML(searchLabelStr)}</span>`,
        `<input data-catalog-search placeholder="Search" value="${escapeHTML(filtersObj[CATALOG_FILTER.Search])}">`,
      '</label>',
      '<label class="field"><span>Category</span><select data-catalog-category>',
        '<option value="">All categories</option>',
        ...categoriesArr.map(categoryStr => optionHTML(categoryStr, { value: categoryStr, selected: filtersObj[CATALOG_FILTER.Category] === categoryStr })),
      '</select></label>',
    '</div>',
    `<div class="catalog" data-catalog-results>${resultsStr}</div></runner-catalog>`
  ].join('');
}
export class RunnerCatalog extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    this.querySelector('[data-catalog-search]').addEventListener('input', eventObj =>
      this.filter(CATALOG_FILTER.Search, eventObj.target.value), options);
    this.querySelector('[data-catalog-category]').addEventListener('change', eventObj =>
      this.filter(CATALOG_FILTER.Category, eventObj.target.value), options);
    this.addEventListener('click', eventObj => this.pickItem(eventObj), options);
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = undefined;
  }

  pickItem(eventObj) {
    const button = eventObj.target.closest('button[data-catalog]');
    if (!button || !this.contains(button)) return;
    const [type, name] = button.dataset.catalog.split('|');
    this.dispatchEvent(new CustomEvent('catalog-pick', {
      bubbles: true, detail: { type, name }
    }));
  }

  set results(markupStr) {
    this.querySelector('[data-catalog-results]').innerHTML = markupStr;
  }

  filter(keyStr, valueStr) {
    this.dispatchEvent(new CustomEvent('catalog-filter', { bubbles: true, detail: { key: keyStr, value: valueStr } }));
  }
}

customElements.define('runner-catalog', RunnerCatalog);
