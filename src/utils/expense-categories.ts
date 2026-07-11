/** Expense category IDs used across the app */
export const EXPENSE_CATEGORIES = {
  vehicle: {
    detailing: 'cat_001',
    mechanical: 'cat_002',
    documentation: 'cat_003',
  },
  showroom: {
    marketing: 'cat_004',
    utilities: 'cat_005',
    salaries: 'cat_006',
    rent: 'cat_007',
  },
  ppf: {
    rent: 'cat_008',
    salaries: 'cat_009',
  },
} as const;

export const VEHICLE_CATEGORY_IDS = new Set([
  EXPENSE_CATEGORIES.vehicle.detailing,
  EXPENSE_CATEGORIES.vehicle.mechanical,
  EXPENSE_CATEGORIES.vehicle.documentation,
]);

export const SHOWROOM_RENT_SALARY_CATEGORY_IDS: Set<string> = new Set([
  EXPENSE_CATEGORIES.showroom.rent,
  EXPENSE_CATEGORIES.showroom.salaries,
]);

export const PPF_RENT_SALARY_CATEGORY_IDS: Set<string> = new Set([
  EXPENSE_CATEGORIES.ppf.rent,
  EXPENSE_CATEGORIES.ppf.salaries,
]);

export const SHOWROOM_OTHER_CATEGORY_IDS: Set<string> = new Set([
  EXPENSE_CATEGORIES.showroom.marketing,
  EXPENSE_CATEGORIES.showroom.utilities,
]);

export const DEFAULT_EXPENSE_CATEGORIES = [
  { category_id: 'cat_001', category_name: 'Detailing', description: 'Vehicle cleaning and polishing' },
  { category_id: 'cat_002', category_name: 'Mechanical', description: 'Engine and mechanical repairs' },
  { category_id: 'cat_003', category_name: 'Documentation', description: 'Transfer and registration fees' },
  { category_id: 'cat_004', category_name: 'Marketing', description: 'Showroom marketing expenses' },
  { category_id: 'cat_005', category_name: 'Utilities', description: 'Electricity, water, internet' },
  { category_id: 'cat_006', category_name: 'Showroom Salaries', description: 'Showroom staff salaries and benefits' },
  { category_id: 'cat_007', category_name: 'Showroom Rent', description: 'Showroom premises rent and lease' },
  { category_id: 'cat_008', category_name: 'PPF Studio Rent', description: 'PPF studio premises rent and lease' },
  { category_id: 'cat_009', category_name: 'PPF Studio Salaries', description: 'PPF studio staff salaries and benefits' },
] as const;

export function categoryOptionsForIds(
  categories: { category_id: string; category_name: string }[],
  allowedIds: Set<string>,
) {
  const fromStore = categories
    .filter((c) => allowedIds.has(c.category_id))
    .map((c) => ({ value: c.category_id, label: c.category_name }));

  if (fromStore.length > 0) return fromStore;

  return DEFAULT_EXPENSE_CATEGORIES.filter((c) => allowedIds.has(c.category_id)).map((c) => ({
    value: c.category_id,
    label: c.category_name,
  }));
}
