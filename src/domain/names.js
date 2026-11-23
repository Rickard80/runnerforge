export function normalizeName(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}
