export const FIELD_KIND = Object.freeze({ Text: 'text', Number: 'number', Textarea: 'textarea' });

export const FIELD_PATH = Object.freeze({
  Name: 'name',
  Notes: 'notes',
  Role: 'role',
  Edge: 'edge',
  WoundSettings: 'woundSettings',
  MainArmorName: 'woundSettings.mainArmorName',
  AlternateArmorName: 'woundSettings.alternateArmorName',
  AlternateType: 'woundSettings.alternateType',
  AlternateAttribute: 'woundSettings.alternateAttribute',
  MainArmorIncrease: 'woundSettings.mainArmorIncrease',
  AlternateArmorIncrease: 'woundSettings.alternateArmorIncrease',
  VehicleBody: 'woundSettings.vehicleBody'
});

export function escapeHTML(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function optionHTML(labelStr, { value, selected: isSelected } = {}) {
  return `<option${value === undefined ? '' : ` value="${escapeHTML(value)}"`}${isSelected ? ' selected' : ''}>${escapeHTML(labelStr)}</option>`;
}

export function inlineInputHTML(value, { path: pathStr, label: labelStr, type: typeStr = FIELD_KIND.Text, maxLength }, attributesStr = '') {
  const constraint = typeStr === FIELD_KIND.Number ? ' step="1"' : maxLength ? ` maxlength="${maxLength}"` : '';
  return `<input type="${typeStr}" data-inline-path="${escapeHTML(pathStr)}" aria-label="${escapeHTML(labelStr)}" value="${escapeHTML(value)}"${constraint}${attributesStr}>`;
}
