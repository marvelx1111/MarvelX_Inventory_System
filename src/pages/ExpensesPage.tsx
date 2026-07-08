import { useMemo, useState, type ReactNode } from 'react';
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
import { formatDate, formatPKR, parseMoneyInput } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const VEHICLE_CATEGORY_IDS = new Set(['cat_001', 'cat_002', 'cat_003']);
const SHOWROOM_CATEGORY_IDS = new Set(['cat_004', 'cat_005', 'cat_006']);

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
  expenses: ReturnType<typeof store.getVehicleExpenses>,
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

export function ExpensesPage() {
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'vehicle' | 'showroom'>('vehicle');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE_FORM);

  void refreshKey;

  const vehicleExpenses = store.getVehicleExpenses();
  const showroomExpenses = store.getShowroomExpenses();
  const categories = store.getExpenseCategories();
  const vehicles = store.getVehicles();

  const monthlyVehicle = getCurrentMonthExpenses(vehicleExpenses);
  const monthlyShowroom = getCurrentMonthExpenses(showroomExpenses);

  const vehicleCategoryOptions = useMemo(
    () =>
      categories
        .filter((c) => VEHICLE_CATEGORY_IDS.has(c.category_id))
        .map((c) => ({ value: c.category_id, label: c.category_name })),
    [categories],
  );

  const showroomCategoryOptions = useMemo(
    () =>
      categories
        .filter((c) => SHOWROOM_CATEGORY_IDS.has(c.category_id))
        .map((c) => ({ value: c.category_id, label: c.category_name })),
    [categories],
  );

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

  const showroomByCategory = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const exp of showroomExpenses) {
      const cat = categories.find((c) => c.category_id === exp.category_id);
      const name = cat?.category_name ?? 'Uncategorized';
      const existing = map.get(exp.category_id) ?? { name, total: 0, count: 0 };
      existing.total += exp.amount;
      existing.count += 1;
      map.set(exp.category_id, existing);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [showroomExpenses, categories]);

  const sortedVehicleExpenses = [...vehicleExpenses].sort(
    (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
  );
  const sortedShowroomExpenses = [...showroomExpenses].sort(
    (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime(),
  );

  const openAddModal = (tab: 'vehicle' | 'showroom') => {
    setActiveTab(tab);
    setForm({
      ...EMPTY_EXPENSE_FORM,
      category_id:
        tab === 'vehicle'
          ? (vehicleCategoryOptions[0]?.value ?? '')
          : (showroomCategoryOptions[0]?.value ?? ''),
      vehicle_id: vehicleOptions[0]?.value ?? '',
    });
    setAddOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
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
        success('Expense added', 'Showroom expense recorded.');
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

  const categoryOptions = activeTab === 'vehicle' ? vehicleCategoryOptions : showroomCategoryOptions;

  return (
    <PageTransition>
      <PageHeader
        title="Expenses"
        subtitle="Track vehicle and showroom operating costs"
        actions={
          <Button onClick={() => openAddModal(activeTab)}>
            Add {activeTab === 'vehicle' ? 'vehicle' : 'showroom'} expense
          </Button>
        }
      />

      <Tabs defaultValue="vehicle" value={activeTab} onValueChange={(v) => setActiveTab(v as 'vehicle' | 'showroom')}>
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="vehicle">Vehicle Expenses</TabsTrigger>
          <TabsTrigger value="showroom">Showroom Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="This month" value={formatPKR(monthlyVehicle)} />
            <SummaryCard label="Total vehicle expenses" value={formatPKR(vehicleExpenses.reduce((s, e) => s + e.amount, 0))} />
            <SummaryCard label="Categories" value={String(vehicleByCategory.length)} />
          </div>

          {vehicleByCategory.length > 0 && (
            <Card padding="md" className="mb-6">
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {vehicleByCategory.map((cat) => (
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
          )}

          <ExpenseTable
            title="All Vehicle Expenses"
            showVehicleColumn
            rows={sortedVehicleExpenses.map((exp) => {
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

        <TabsContent value="showroom">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="This month" value={formatPKR(monthlyShowroom)} />
            <SummaryCard label="Total showroom expenses" value={formatPKR(showroomExpenses.reduce((s, e) => s + e.amount, 0))} />
            <SummaryCard label="Categories" value={String(showroomByCategory.length)} />
          </div>

          {showroomByCategory.length > 0 && (
            <Card padding="md" className="mb-6">
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {showroomByCategory.map((cat) => (
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
          )}

          <ExpenseTable
            title="All Showroom Expenses"
            showVehicleColumn={false}
            rows={sortedShowroomExpenses.map((exp) => {
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
        </TabsContent>
      </Tabs>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={activeTab === 'vehicle' ? 'Add vehicle expense' : 'Add showroom expense'}
        description={
          activeTab === 'vehicle'
            ? 'Recorded on the vehicle and added to its total cost.'
            : 'General showroom operating expense.'
        }
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
            options={categoryOptions}
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
              placeholder="What was this expense for?"
            />
          </div>
        </form>
      </Modal>
    </PageTransition>
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
