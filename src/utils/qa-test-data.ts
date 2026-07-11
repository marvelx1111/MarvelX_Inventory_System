/** Names created by automated QA scripts — hide from business dropdowns. */
export function isQaTestCustomerName(name: string): boolean {
  const normalized = name.trim();
  return normalized.startsWith('QA Loop') || normalized.startsWith('Dealer Loop');
}
