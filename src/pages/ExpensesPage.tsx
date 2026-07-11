import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { ShowroomExpense } from '@/types';
import { formatDate, formatPKR, parseMoneyInput } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

type ExpenseTab = 'vehicle' | 'showroom_rent_salaries' | 'ppf_rent_salaries' | 'showroom_other';

import {
  categoryOptionsForIds,
  PPF_RENT_SALARY_CATEGORY_IDS,
  SHOWROOM_OTHER_CATEGORY_IDS,
  SHOWROOM_RENT_SALARY_CATEGORY_IDS,
  VEHICLE_CATEGORY_IDS,
} from '@/utils/expense-categories';

const TAB_CATEGORY_IDS: Record<Exclude<ExpenseTab, 'vehicle'>, Set<string>> = {
  showroom_rent_salaries: SHOWROOM_RENT_SALARY_CATEGORY_IDS,
  ppf_rent_salaries: PPF_RENT_SALARY_CATEGORY_IDS,
  showroom_other: SHOWROOM_OTHER_CATEGORY_IDS,
};

const EMPTY_EXPENSE_FORM = {
  vehicle_id: '',
  category_id: '',
  expense_date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
};

function getCurrentMonthExpenses<T extends { expense_date: string; amount: number }>(items: T[]) {
  const now = new Date();
  return items
    .filter((e) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

function groupByCategory(
  expenses: { category_id: string; amount: number }[],
  categories: ReturnType<typeof store.getExpenseCategories>,
) {
  const map = new Map<string, { name: string; total: number; count: number }>();

  for (const exp of expenses) {
    const cat = categories.find((c) => c.category_id === exp.category_id);
    const name = cat?.category_name ?? 'Uncategorized';
    const existing = map.get(exp.category_id) ?? { name, total: 0, count: 0 };
    existing.total += exp.amount;
    existing.count += 1;
    map.set(exp.category_id, existing);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

function filterShowroomExpenses(expenses: ShowroomExpense[], tab: Exclude<ExpenseTab, 'vehicle'>) {
  const allowed = TAB_CATEGORY_IDS[tab];
  return expenses.filter((exp) => allowed.has(exp.category_id));
}

function tabLabel(tab: ExpenseTab): string {
  switch (tab) {
    case 'vehicle':
      return 'Vehicle Expenses';
    case 'showroom_rent_salaries':
      return 'Showroom Rent & Salaries';
    case 'ppf_rent_salaries':
      return 'PPF Studio Rent & Salaries';
    case 'showroom_other':
      return 'Other Showroom';
  }
}

function addButtonLabel(tab: ExpenseTab): string {
  switch (tab) {
    case 'vehicle':
      return 'Add vehicle expense';
    case 'showroom_rent_salaries':
      return 'Add showroom rent / salary';
    case 'ppf_rent_salaries':
      return 'Add PPF rent / salary';
    case 'showroom_other':
      return 'Add showroom expense';
  }
}

export function ExpensesPage() {
  const loading = usePageLoading();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<ExpenseTab>('showroom_rent_salaries');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE_FORM);

  void refreshKey;

  useEffect(() => {
    return store.subscribe(() => setRefreshKey((k) => k + 1));
  }, []);

  const vehicleExpenses = store.getVehicleExpenses();
  const showroomExpenses = store.getShowroomExpenses();
  const categories = store.getExpenseCategories();
  const vehicles = store.getVehicles();

  const showroomRentSalaryExpenses = useMemo(
    () => filterShowroomExpenses(showroomExpenses, 'showroom_rent_salaries'),
    [showroomExpenses],
  );
  const ppfRentSalaryExpenses = useMemo(
    () => filterShowroomExpenses(showroomExpenses, 'ppf_rent_salaries'),
    [showroomExpenses],
  );
  const showroomOtherExpenses = useMemo(
    () => filterShowroomExpenses(showroomExpenses, 'showroom_other'),
    [showroomExpenses],
  );

  const monthlyVehicle = getCurrentMonthExpenses(vehicleExpenses);
  const monthlyShowroomRentSalary = getCurrentMonthExpenses(showroomRentSalaryExpenses);
  const monthlyPpfRentSalary = getCurrentMonthExpenses(ppfRentSalaryExpenses);
  const monthlyShowroomOther = getCurrentMonthExpenses(showroomOtherExpenses);

  const vehicleCategoryOptions = useMemo(
    () => categoryOptionsForIds(categories, VEHICLE_CATEGORY_IDS),
    [categories, refreshKey],
  );

  const categoryOptionsForTab = useMemo(() => {
    if (activeTab === 'vehicle') return vehicleCategoryOptions;
    const allowed = TAB_CATEGORY_IDS[activeTab as Exclude<ExpenseTab, 'vehicle'>];
    return categoryOptionsForIds(categories, allowed);
  }, [activeTab, categories, vehicleCategoryOptions, refreshKey]);

  const vehicleOptions = useMemo(
    () =>
      [...vehicles]
        .sort((a, b) => a.stock_number.localeCompare(b.stock_number))
        .map((v) => ({
          value: v.vehicle_id,
          label: `${v.stock_number} — ${v.make} ${v.model} ${v.model_year}`,
        })),
    [vehicles],
  );

  const vehicleByCategory = useMemo(
    () => groupByCategory(vehicleExpenses, categories),
    [vehicleExpenses, categories],
  );

  const openAddModal = (tab: ExpenseTab) => {
    setActiveTab(tab);
    const options =
      tab === 'vehicle'
        ? categoryOptionsForIds(categories, VEHICLE_CATEGORY_IDS)
        : categoryOptionsForIds(categories, TAB_CATEGORY_IDS[tab as Exclude<ExpenseTab, 'vehicle'>]);

    setForm({
      ...EMPTY_EXPENSE_FORM,
      category_id: options[0]?.value ?? '',
      vehicle_id: vehicleOptions[0]?.value ?? '',
    });
    setAddOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      error('Not allowed', 'Only administrators can add expenses.');
      return;
    }
    const amount = parseMoneyInput(form.amount);
    if (!form.category_id || !form.description.trim() || amount <= 0) {
      error('Missing fields', 'Enter description, category, and a valid amount.');
      return;
    }

    setSaving(true);
    try {
      if (activeTab === 'vehicle') {
        if (!form.vehicle_id) {
          error('Select vehicle', 'Choose which vehicle this expense applies to.');
          return;
        }
        const created = await store.createVehicleExpense({
          vehicle_id: form.vehicle_id,
          category_id: form.category_id,
          expense_date: form.expense_date,
          description: form.description,
          amount,
        });
        if (!created) {
          error('Save failed', 'Could not record vehicle expense.');
          return;
        }
        store.addAuditLog({
          user_id: user?.user_id ?? 'usr_001',
          action: 'CREATE',
          table_name: 'vehicle_expenses',
          record_id: created.expense_id,
          ip_address: '127.0.0.1',
        });
        success('Expense added', 'Vehicle expense recorded and total cost updated.');
      } else {
        const created = await store.createShowroomExpense({
          category_id: form.category_id,
          expense_date: form.expense_date,
          description: form.description,
          amount,
        });
        store.addAuditLog({
          user_id: user?.user_id ?? 'usr_001',
          action: 'CREATE',
          table_name: 'showroom_expenses',
          record_id: created.expense_id,
          ip_address: '127.0.0.1',
        });
        success('Expense added', `${tabLabel(activeTab)} expense recorded.`);
      }
      setAddOpen(false);
      setForm(EMPTY_EXPENSE_FORM);
      setRefreshKey((n) => n + 1);
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-40" />
        <SkeletonCard />
      </PageTransition>
    );
  }

  const modalDescription =
    activeTab === 'vehicle'
      ? 'Recorded on the vehicle and added to its total cost.'
      : activeTab === 'showroom_rent_salaries'
        ? 'Showroom premises rent or staff salaries.'
        : activeTab === 'ppf_rent_salaries'
          ? 'PPF studio premises rent or installer salaries.'
          : 'Other general showroom operating expenses.';

  return (
    <PageTransition>
      <PageHeader
        title="Expenses"
        subtitle="Vehicle costs, showroom rent & salaries, and PPF studio rent & salaries"
        actions={
          isAdmin ? (
            <Button onClick={() => openAddModal(activeTab)}>{addButtonLabel(activeTab)}</Button>
          ) : undefined
        }
      />

      <Tabs
        defaultValue="showroom_rent_salaries"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ExpenseTab)}
      >
        <TabsList className="mb-6 w-full flex-wrap">
          <TabsTrigger value="showroom_rent_salaries">Showroom Rent & Salaries</TabsTrigger>
          <TabsTrigger value="ppf_rent_salaries">PPF Studio Rent & Salaries</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle Expenses</TabsTrigger>
          <TabsTrigger value="showroom_other">Other Showroom</TabsTrigger>
        </TabsList>

        <TabsContent value="showroom_rent_salaries">
          <ShowroomExpensePanel
            title="Showroom Rent & Salaries"
            expenses={showroomRentSalaryExpenses}
            categories={categories}
            monthlyTotal={monthlyShowroomRentSalary}
          />
        </TabsContent>

        <TabsContent value="ppf_rent_salaries">
          <ShowroomExpensePanel
            title="PPF Studio Rent & Salaries"
            expenses={ppfRentSalaryExpenses}
            categories={categories}
            monthlyTotal={monthlyPpfRentSalary}
          />
        </TabsContent>

        <TabsContent value="vehicle">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="This month" value={formatPKR(monthlyVehicle)} />
            <SummaryCard
              label="Total vehicle expenses"
              value={formatPKR(vehicleExpenses.reduce((s, e) => s + e.amount, 0))}
            />
            <SummaryCard label="Categories" value={String(vehicleByCategory.length)} />
          </div>

          {vehicleByCategory.length > 0 && (
            <CategoryBreakdown title="By Category" items={vehicleByCategory} />
          )}

          <ExpenseTable
            title="All Vehicle Expenses"
            showVehicleColumn
            rows={sortedExpenses(vehicleExpenses).map((exp) => {
              const vehicle = vehicles.find((v) => v.vehicle_id === exp.vehicle_id);
              const cat = categories.find((c) => c.category_id === exp.category_id);
              return {
                id: exp.expense_id,
                date: exp.expense_date,
                description: exp.description,
                category: cat?.category_name ?? '—',
                extra: vehicle ? (
                  <Link to={`/inventory/${vehicle.vehicle_id}`} className="text-accent hover:underline">
                    {vehicle.stock_number}
                  </Link>
                ) : '—',
                amount: exp.amount,
              };
            })}
          />
        </TabsContent>

        <TabsContent value="showroom_other">
          <ShowroomExpensePanel
            title="Other Showroom Expenses"
            expenses={showroomOtherExpenses}
            categories={categories}
            monthlyTotal={monthlyShowroomOther}
          />
        </TabsContent>
      </Tabs>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={addButtonLabel(activeTab)}
        description={modalDescription}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="add-expense-form" loading={saving}>
              Save expense
            </Button>
          </>
        }
      >
        <form id="add-expense-form" onSubmit={handleSubmitExpense} className="grid gap-4 sm:grid-cols-2">
          {activeTab === 'vehicle' && (
            <div className="sm:col-span-2">
              <Select
                label="Vehicle"
                required
                value={form.vehicle_id}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicle_id: e.target.value }))}
                options={vehicleOptions}
                placeholder="Select vehicle"
              />
            </div>
          )}
          <Select
            label="Category"
            required
            value={form.category_id}
            onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
            options={categoryOptionsForTab}
          />
          <Input
            label="Date"
            type="date"
            required
            value={form.expense_date}
            onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))}
          />
          <Input
            label="Amount (PKR)"
            type="number"
            required
            min={1}
            step={1}
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={
                activeTab === 'showroom_rent_salaries' || activeTab === 'ppf_rent_salaries'
                  ? 'e.g. November rent or staff salaries'
                  : 'What was this expense for?'
              }
            />
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}

function sortedExpenses<T extends { expense_date: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
  );
}

function ShowroomExpensePanel({
  title,
  expenses,
  categories,
  monthlyTotal,
}: {
  title: string;
  expenses: ShowroomExpense[];
  categories: ReturnType<typeof store.getExpenseCategories>;
  monthlyTotal: number;
}) {
  const byCategory = useMemo(() => groupByCategory(expenses, categories), [expenses, categories]);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="This month" value={formatPKR(monthlyTotal)} />
        <SummaryCard label="Total" value={formatPKR(expenses.reduce((s, e) => s + e.amount, 0))} />
        <SummaryCard label="Entries" value={String(expenses.length)} />
      </div>

      {byCategory.length > 0 && <CategoryBreakdown title="By Category" items={byCategory} />}

      <ExpenseTable
        title={title}
        showVehicleColumn={false}
        rows={sortedExpenses(expenses).map((exp) => {
          const cat = categories.find((c) => c.category_id === exp.category_id);
          return {
            id: exp.expense_id,
            date: exp.expense_date,
            description: exp.description,
            category: cat?.category_name ?? '—',
            extra: null,
            amount: exp.amount,
          };
        })}
      />
    </>
  );
}

function CategoryBreakdown({
  title,
  items,
}: {
  title: string;
  items: { name: string; total: number; count: number }[];
}) {
  return (
    <Card padding="md" className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <div
              key={cat.name}
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{cat.name}</p>
              <p className="mt-1 text-lg font-bold text-accent">{formatPKR(cat.total)}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{cat.count} entries</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </Card>
  );
}

interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  category: string;
  extra: ReactNode;
  amount: number;
}

function ExpenseTable({
  title,
  rows,
  showVehicleColumn,
}: {
  title: string;
  rows: ExpenseRow[];
  showVehicleColumn: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Card padding="md">
        <p className="text-center text-sm text-[var(--text-tertiary)]">No expenses recorded</p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Date</th>
              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Description</th>
              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Category</th>
              {showVehicleColumn && (
                <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Vehicle</th>
              )}
              <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border-secondary)] last:border-0">
                <td className="px-5 py-3 text-[var(--text-secondary)]">{formatDate(row.date)}</td>
                <td className="px-5 py-3 text-[var(--text-primary)]">{row.description}</td>
                <td className="px-5 py-3 text-[var(--text-secondary)]">{row.category}</td>
                {showVehicleColumn && <td className="px-5 py-3">{row.extra ?? '—'}</td>}
                <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                  {formatPKR(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} padding="sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-[var(--text-primary)]">{row.description}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {formatDate(row.date)} · {row.category}
                </p>
                {row.extra && <div className="mt-1 text-xs">{row.extra}</div>}
              </div>
              <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                {formatPKR(row.amount)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
