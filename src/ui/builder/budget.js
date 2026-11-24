import { escapeHTML } from '../html.js';
import { money } from '../../domain/model.js';

export class RunnerBudget extends HTMLElement {
  set summary({ budget: budgetObj, limit, level: levelStr, metatype: metatypeStr }) {
    const { remaining, spent, warnings } = budgetObj;
    const percentSpent = Math.max(0, Math.min(100, spent / limit * 100));
    const warningItems = warnings.length
      ? warnings.map(warningStr => `<li>${escapeHTML(warningStr)}</li>`).join('')
      : '<li>No budget or basic limit warnings.</li>';

    this.innerHTML = [
      '<div class="surface">',
        `<div class="eyebrow">${escapeHTML(levelStr)} · ${escapeHTML(metatypeStr)}</div>`,
        '<div class="balance-title">Nuyen remaining</div>',
        `<div class="big ${remaining < 0 ? 'negative' : ''}">${money(remaining)}</div>`,
        `<div class="meter" aria-hidden="true"><div style="width:${percentSpent}%"></div></div>`,
        budgetRowHTML('Budget', limit),
        budgetRowHTML('Spent', spent),
      '</div><div class="surface">',
        budgetRowHTML('Attributes', budgetObj.attr),
        budgetRowHTML('Skills', budgetObj.skills),
        budgetRowHTML('Knowledge', budgetObj.knowledge),
        budgetRowHTML('Shadow Amps', budgetObj.amps),
        budgetRowHTML('Gear & spells', budgetObj.items),
      '</div><div class="surface warnings">',
        `<h3>Rule checks · ${warnings.length}</h3><ul>${warningItems}</ul>`,
      '</div>'
    ].join('');
  }
}

function budgetRowHTML(labelStr, amount) {
  return `<div class="rowline"><span>${escapeHTML(labelStr)}</span><b>${money(amount)}</b></div>`;
}

customElements.define('runner-budget', RunnerBudget);
