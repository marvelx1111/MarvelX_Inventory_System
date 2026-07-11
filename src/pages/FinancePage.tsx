import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import { estimateCashInHand } from '@/utils/finance';
import { formatDate, formatPKR, parseMoneyInput } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const FinanceTrendChart = lazy(() =>
  import('@/components/charts/FinanceTrendChart').then((m) => ({ default: m.FinanceTrendChart })),
);

function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-[var(--text-primary)]';

  return (
    <Card padding="md">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-tertiary)]">{hint}</p> : null}
    </Card>
  );
}

function AuditBadge({ category }: { category: string }) {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    profit: 'success',
    revenue: 'info',
    loss: 'danger',
    expense: 'warning',
    receivable: 'default',
    capital: 'info',
  };
  return <Badge variant={variants[category] ?? 'default'}>{category}</Badge>;
}

export function FinancePage() {
  const loading = usePageLoading();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ capital: '', cash_in_hand: '', notes: '' });

  void refreshKey;

  useEffect(() => {
    return store.subscribe(() => setRefreshKey((k) => k + 1));
  }, []);

  const summary = useMemo(() => store.getFinanceSummary(), [refreshKey]);
  const estimatedCash = useMemo(() => estimateCashInHand(store.getData()), [refreshKey]);

  const openEdit = () => {
    const settings = store.getFinanceSettings();
    setForm({
      capital: String(settings.capital || ''),
      cash_in_hand: String(settings.cash_in_hand || ''),
      notes: settings.notes,
    });
    setEditOpen(true);
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAdmin) {
      error('Not allowed', 'Only administrators can update finance settings.');
      return;
    }

    setSaving(true);
    try {
      await store.updateFinanceSettings(
        {
          capital: parseMoneyInput(form.capital),
          cash_in_hand: parseMoneyInput(form.cash_in_hand),
          notes: form.notes,
        },
        user?.user_id ?? null,
      );
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'finance_settings',
        record_id: 'fin_001',
        ip_address: '127.0.0.1',
      });
      success('Finance settings saved', 'Capital and cash in hand updated.');
      setEditOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not save finance settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </PageTransition>
    );
  }

  const netTone = summary.netProfit >= 0 ? 'positive' : 'negative';

  return (
    <PageTransition>
      <PageHeader
        title="Finance"
        subtitle="Total expenses, profit & loss, capital, and cash position"
        actions={
          isAdmin ? (
            <Button size="sm" onClick={openEdit}>
              Update capital & cash
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Capital" value={formatPKR(summary.capital)} hint="Owner / business capital" />
        <MetricCard
          label="Cash in hand"
          value={formatPKR(summary.cashInHand)}
          hint={`Estimated from cash flows: ${formatPKR(estimatedCash)}`}
        />
        <MetricCard label="Total revenue" value={formatPKR(summary.totalRevenue)} tone="positive" />
        <MetricCard
          label="Net profit / loss"
          value={formatPKR(summary.netProfit)}
          tone={netTone}
          hint="Vehicle + PPF profit minus showroom overhead"
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total expenses" value={formatPKR(summary.totalExpenses)} tone="warning" />
        <MetricCard
          label="Vehicle sales profit"
          value={formatPKR(summary.vehicleSalesProfit)}
          hint={`${summary.vehicleProfitCount} profitable · ${summary.vehicleLossCount} loss sales`}
        />
        <MetricCard
          label="Vehicle sales loss"
          value={formatPKR(summary.vehicleSalesLoss)}
          tone={summary.vehicleSalesLoss > 0 ? 'negative' : 'default'}
        />
        <MetricCard label="PPF studio profit" value={formatPKR(summary.ppfProfit)} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total receivables"
          value={formatPKR(summary.totalReceivables)}
          hint={`Vehicle ${formatPKR(summary.vehicleReceivables)} · PPF ${formatPKR(summary.ppfReceivables)}`}
        />
        <MetricCard label="Inventory at cost" value={formatPKR(summary.inventoryAtCost)} />
        <MetricCard label="Capital invested" value={formatPKR(summary.totalCapitalInvested)} />
        <MetricCard label="Investor returns paid" value={formatPKR(summary.investorReturnsPaid)} />
      </div>

      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <FinanceTrendChart data={summary.monthlyTrend} />
        </Suspense>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6 w-full flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="audit">Profit & loss audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Revenue breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-0 pb-0">
                <Row label="Vehicle sales revenue" value={formatPKR(summary.vehicleSalesRevenue)} />
                <Row label="PPF studio revenue" value={formatPKR(summary.ppfRevenue)} />
                <Row label="Purchase spend (acquisitions)" value={formatPKR(summary.purchaseSpend)} />
                <Row label="Total revenue" value={formatPKR(summary.totalRevenue)} strong />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Expense breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-0 pb-0">
                <Row label="Vehicle prep expenses" value={formatPKR(summary.vehiclePrepExpenses)} />
                <Row label="Showroom operating expenses" value={formatPKR(summary.showroomExpenses)} />
                <Row label="Showroom rent & salaries" value={formatPKR(summary.showroomOverhead)} />
                <Row label="PPF studio rent & salaries" value={formatPKR(summary.ppfOverhead)} />
                <Row label="Total expenses recorded" value={formatPKR(summary.totalExpenses)} strong />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <Card padding="none" className="overflow-hidden">
            <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
              <CardTitle>Expenses by category</CardTitle>
            </CardHeader>
            {summary.expenseBreakdown.length === 0 ? (
              <CardContent>
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                  No expenses recorded yet.
                </p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                      <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Category</th>
                      <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Entries</th>
                      <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.expenseBreakdown.map((item) => (
                      <tr key={item.name} className="border-b border-[var(--border-secondary)]/60">
                        <td className="px-5 py-3">{item.name}</td>
                        <td className="px-5 py-3 text-right text-[var(--text-secondary)]">{item.count}</td>
                        <td className="px-5 py-3 text-right font-medium">{formatPKR(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card padding="none" className="overflow-hidden">
            <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
              <CardTitle>Financial audit trail</CardTitle>
            </CardHeader>
            {summary.auditRows.length === 0 ? (
              <CardContent>
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                  No financial activity recorded yet.
                </p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                      <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Date</th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Item</th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Type</th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Detail</th>
                      <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.auditRows.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--border-secondary)]/60">
                        <td className="px-5 py-3 text-[var(--text-secondary)]">{formatDate(row.date)}</td>
                        <td className="px-5 py-3 font-medium">{row.label}</td>
                        <td className="px-5 py-3">
                          <AuditBadge category={row.category} />
                        </td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">{row.detail}</td>
                        <td
                          className={`px-5 py-3 text-right font-medium tabular-nums ${
                            row.amount >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatPKR(Math.abs(row.amount))}
                          {row.amount < 0 ? ' DR' : ' CR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Capital & cash in hand"
        description="Set your current business capital and physical cash position."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="finance-settings-form" loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <form id="finance-settings-form" onSubmit={handleSaveSettings} className="grid gap-4">
          <Input
            label="Capital (PKR)"
            type="number"
            min={0}
            step={1}
            required
            value={form.capital}
            onChange={(event) => setForm((prev) => ({ ...prev, capital: event.target.value }))}
          />
          <Input
            label="Cash in hand (PKR)"
            type="number"
            min={0}
            step={1}
            required
            value={form.cash_in_hand}
            onChange={(event) => setForm((prev) => ({ ...prev, cash_in_hand: event.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Optional notes about capital sources or cash position"
          />
        </form>
      </Modal>
    </PageTransition>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-secondary)]/60 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm tabular-nums ${strong ? 'font-bold text-[var(--text-primary)]' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
