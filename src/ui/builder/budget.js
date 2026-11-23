import { escapeHTML } from '../html.js';
import { money } from '../../domain/model.js';

function budgetRowHTML(label, amount) {
  return `<div class="rowline"><span>${escapeHTML(label)}</span><b>${money(amount)}</b></div>`;
}

export class RunnerBudget extends HTMLElement {
  set summary({ budget, limit, level, metatype }) {
    const { remaining, spent, warnings } = budget;
    const percentSpent = Math.min(100, spent / limit * 100);
    const warningItems = warnings.length
      ? warnings.map(warning => `<li>${escapeHTML(warning)}</li>`).join('')
      : '<li>No budget or basic limit warnings.</li>';

    this.innerHTML = [
      '<div class="balance">',
        `<div class="eyebrow">${escapeHTML(level)} · ${escapeHTML(metatype)}</div>`,
        '<div class="balance-title">Nuyen remaining</div>',
        `<div class="big ${remaining < 0 ? 'negative' : ''}">${money(remaining)}</div>`,
        `<div class="meter"><div style="width:${percentSpent}%"></div></div>`,
        budgetRowHTML('Budget', limit),
        budgetRowHTML('Spent', spent),
      '</div><div class="breakdown">',
        budgetRowHTML('Attributes', budget.attr),
        budgetRowHTML('Skills', budget.skills),
        budgetRowHTML('Knowledge', budget.knowledge),
        budgetRowHTML('Shadow Amps', budget.amps),
        budgetRowHTML('Gear & spells', budget.items),
      '</div><div class="warnings">',
        `<h3>Rule checks · ${warnings.length}</h3><ul>${warningItems}</ul>`,
      '</div>'
    ].join('');
  }
}

customElements.define('runner-budget', RunnerBudget);
