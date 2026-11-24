export function normalizeName(nameValue) {
  return String(nameValue ?? '').trim().toLocaleLowerCase();
}

export function compareNames(firstNameStr, secondNameStr) {
  return String(firstNameStr).localeCompare(String(secondNameStr), undefined, { sensitivity: 'base' });
}

export function compareNamedEntries(firstEntryObj, secondEntryObj) {
  return compareNames(firstEntryObj.name, secondEntryObj.name);
}
