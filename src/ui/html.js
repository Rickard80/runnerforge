export function escapeHTML(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function optionHTML(label, { value, selected } = {}) {
  return `<option${value === undefined ? '' : ` value="${escapeHTML(value)}"`}${selected ? ' selected' : ''}>${escapeHTML(label)}</option>`;
}
