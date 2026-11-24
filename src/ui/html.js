export function escapeHTML(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function optionHTML(label, { value, selected } = {}) {
  return `<option${value === undefined ? '' : ` value="${escapeHTML(value)}"`}${selected ? ' selected' : ''}>${escapeHTML(label)}</option>`;
}

export function inlineInputHTML(value, { path, label, type = 'text', maxLength }, attributes = '') {
  const constraint = type === 'number' ? ' step="1"' : maxLength ? ` maxlength="${maxLength}"` : '';
  return `<input type="${type}" data-inline-path="${escapeHTML(path)}" aria-label="${escapeHTML(label)}" value="${escapeHTML(value)}"${constraint}${attributes}>`;
}
