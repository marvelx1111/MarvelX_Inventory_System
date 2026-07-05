import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { store } from '@/data/store';
import { formatDate, formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

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

  const vehicleExpenses = store.getVehicleExpenses();
  const showroomExpenses = store.getShowroomExpenses();
  const categories = store.getExpenseCategories();
  const vehicles = store.getVehicles();

  const monthlyVehicle = getCurrentMonthExpenses(vehicleExpenses);
  const monthlyShowroom = getCurrentMonthExpenses(showroomExpenses);

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

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-40" />
        <SkeletonCard />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Expenses"
        subtitle="Track vehicle and showroom operating costs"
      />

      <Tabs defaultValue="vehicle">
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

function ExpenseTable({ title, rows }: { title: string; rows: ExpenseRow[] }) {
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
              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Vehicle</th>
              <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border-secondary)] last:border-0">
                <td className="px-5 py-3 text-[var(--text-secondary)]">{formatDate(row.date)}</td>
                <td className="px-5 py-3 text-[var(--text-primary)]">{row.description}</td>
                <td className="px-5 py-3 text-[var(--text-secondary)]">{row.category}</td>
                <td className="px-5 py-3">{row.extra ?? '—'}</td>
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
