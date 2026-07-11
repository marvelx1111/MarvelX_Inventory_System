import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PPFStudioNav } from '@/components/ppf/PPFStudioNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PPFRoll } from '@/types';
import { getPPFRollInventoryMeta, type PPFRollInventoryStatus } from '@/utils/ppf-inventory';
import { cn, formatDate, formatPKR, parseMoneyInput } from '@/utils/format';

const LOW_STOCK_THRESHOLD = 20;

interface RollWithMeta extends PPFRoll {
  brandName: string;
  brandCountry: string;
  inventoryStatus: PPFRollInventoryStatus;
  assignedJobId: string | null;
  assignedVehicleLabel: string | null;
  isLowStock: boolean;
}

interface NewRollForm {
  brand_id: string;
  film_type: string;
  width: string;
  total_length: string;
  purchase_cost: string;
  supplier: string;
  purchase_date: string;
}

const emptyRollForm = (): NewRollForm => ({
  brand_id: '',
  film_type: '',
  width: '1.52',
  total_length: '',
  purchase_cost: '',
  supplier: '',
  purchase_date: new Date().toISOString().slice(0, 10),
});

function RollProgressBar({
  remaining,
  total,
  isLowStock,
}: {
  remaining: number;
  total: number;
  isLowStock: boolean;
}) {
  const percent = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">Remaining length</span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            isLowStock ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-primary)]',
          )}
        >
          {remaining} / {total} m
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            isLowStock
              ? 'bg-gradient-to-r from-red-500 to-red-400'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-400',
          )}
        />
      </div>
      <p className="text-right text-[10px] tabular-nums text-[var(--text-tertiary)]">
        {percent.toFixed(0)}% remaining
      </p>
    </div>
  );
}

function RollCard({ roll, index }: { roll: RollWithMeta; index: number }) {
  const costPerMeter = roll.total_length > 0 ? roll.purchase_cost / roll.total_length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Card
        hoverLift
        className={cn(
          roll.isLowStock && roll.inventoryStatus === 'in_stock' && 'border-red-300/60 dark:border-red-900/50',
          roll.inventoryStatus === 'assigned' && 'border-blue-300/50 dark:border-blue-900/40',
        )}
      >
        <CardHeader className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="truncate">{roll.film_type}</CardTitle>
              <CardDescription>
                {roll.brandName} · {roll.brandCountry}
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{roll.roll_id}</span>
              <Badge
                variant="default"
                dot
                className={
                  roll.inventoryStatus === 'assigned'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                }
              >
                {roll.inventoryStatus === 'assigned' ? 'Assigned' : 'In stock'}
              </Badge>
              {roll.isLowStock && roll.inventoryStatus === 'in_stock' && (
                <Badge variant="danger" dot pulse>
                  Low stock
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RollProgressBar
            remaining={roll.remaining_length}
            total={roll.total_length}
            isLowStock={roll.isLowStock}
          />

          {roll.inventoryStatus === 'assigned' && roll.assignedJobId && (
            <div className="rounded-lg border border-blue-200/60 bg-blue-50/60 px-3 py-2 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
              <p className="font-medium text-blue-800 dark:text-blue-300">Dedicated to 1 vehicle</p>
              <p className="mt-0.5 text-blue-700/80 dark:text-blue-400/80">
                Job{' '}
                <Link to={`/ppf/jobs/${roll.assignedJobId}`} className="font-mono underline">
                  {roll.assignedJobId}
                </Link>
                {roll.assignedVehicleLabel ? ` · ${roll.assignedVehicleLabel}` : ''}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-[var(--text-tertiary)]">Width</dt>
              <dd className="font-medium text-[var(--text-primary)]">{roll.width} m</dd>
            </div>
            <div>
              <dt className="text-[var(--text-tertiary)]">Cost / meter</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {formatPKR(Math.round(costPerMeter))}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-tertiary)]">Purchase cost</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {formatPKR(roll.purchase_cost)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-tertiary)]">Purchased</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {formatDate(roll.purchase_date)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--text-tertiary)]">Supplier</dt>
              <dd className="font-medium text-[var(--text-primary)]">{roll.supplier || '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddRollModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState<NewRollForm>(emptyRollForm);
  const [saving, setSaving] = useState(false);

  const brandOptions = useMemo(
    () =>
      store.getPPFBrands().map((brand) => ({
        value: brand.brand_id,
        label: `${brand.brand_name} (${brand.country})`,
      })),
    [open],
  );

  useEffect(() => {
    if (open) setForm(emptyRollForm());
  }, [open]);

  const update = <K extends keyof NewRollForm>(key: K, value: NewRollForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.brand_id !== '' &&
    form.film_type.trim() !== '' &&
    Number(form.width) > 0 &&
    Number(form.total_length) > 0 &&
    parseMoneyInput(form.purchase_cost) > 0 &&
    form.purchase_date !== '';

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await store.createPPFRoll({
        brand_id: form.brand_id,
        film_type: form.film_type,
        width: Number(form.width),
        total_length: Number(form.total_length),
        purchase_cost: parseMoneyInput(form.purchase_cost),
        supplier: form.supplier,
        purchase_date: form.purchase_date,
      });
      success('Roll added', 'New film roll is now in PPF inventory.');
      onCreated();
      onClose();
    } catch (err) {
      toastError(
        'Could not add roll',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="Add film roll"
      description="Receive a new PPF roll into studio inventory. Each roll can only be assigned to one vehicle job."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
            Add to inventory
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Brand"
          options={brandOptions}
          placeholder="Select brand"
          value={form.brand_id}
          onChange={(e) => update('brand_id', e.target.value)}
        />
        <Input
          label="Film type"
          value={form.film_type}
          onChange={(e) => update('film_type', e.target.value)}
          placeholder="e.g. Ultimate Plus"
        />
        <Input
          label="Width (m)"
          type="number"
          step="0.01"
          value={form.width}
          onChange={(e) => update('width', e.target.value)}
        />
        <Input
          label="Total length (m)"
          type="number"
          step="0.1"
          value={form.total_length}
          onChange={(e) => update('total_length', e.target.value)}
          placeholder="e.g. 30"
        />
        <Input
          label="Purchase cost (PKR)"
          type="number"
          step="1"
          value={form.purchase_cost}
          onChange={(e) => update('purchase_cost', e.target.value)}
        />
        <Input
          label="Purchase date"
          type="date"
          value={form.purchase_date}
          onChange={(e) => update('purchase_date', e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Supplier"
            value={form.supplier}
            onChange={(e) => update('supplier', e.target.value)}
            placeholder="Optional supplier name"
          />
        </div>
      </div>
    </Modal>
  );
}

function RollsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PPFRollsPage() {
  const { hasPermission } = useAuth();
  const canManageInventory = hasPermission('ppf');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inventoryTab, setInventoryTab] = useState<'all' | 'in_stock' | 'assigned'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const rolls = useMemo((): RollWithMeta[] => {
    void refreshKey;
    const brands = store.getPPFBrands();
    const jobs = store.getPPFJobCards();
    const vehicles = store.getPPFVehicles();

    return store.getPPFRolls().map((roll) => {
      const brand = brands.find((b) => b.brand_id === roll.brand_id);
      const meta = getPPFRollInventoryMeta(roll.roll_id, jobs);
      const vehicle = meta.job
        ? vehicles.find((v) => v.ppf_vehicle_id === meta.job?.ppf_vehicle_id)
        : null;

      return {
        ...roll,
        brandName: brand?.brand_name ?? 'Unknown',
        brandCountry: brand?.country ?? '—',
        inventoryStatus: meta.status,
        assignedJobId: meta.job?.job_id ?? null,
        assignedVehicleLabel: vehicle
          ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
          : null,
        isLowStock: roll.remaining_length < LOW_STOCK_THRESHOLD,
      };
    });
  }, [refreshKey]);

  const filteredRolls = useMemo(() => {
    let list = rolls;
    if (inventoryTab === 'in_stock') {
      list = list.filter((roll) => roll.inventoryStatus === 'in_stock');
    } else if (inventoryTab === 'assigned') {
      list = list.filter((roll) => roll.inventoryStatus === 'assigned');
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (roll) =>
        roll.roll_id.toLowerCase().includes(q) ||
        roll.film_type.toLowerCase().includes(q) ||
        roll.brandName.toLowerCase().includes(q) ||
        roll.supplier.toLowerCase().includes(q) ||
        (roll.assignedJobId?.toLowerCase().includes(q) ?? false),
    );
  }, [rolls, search, inventoryTab]);

  const stats = useMemo(
    () => ({
      total: rolls.length,
      inStock: rolls.filter((r) => r.inventoryStatus === 'in_stock').length,
      assigned: rolls.filter((r) => r.inventoryStatus === 'assigned').length,
      lowStock: rolls.filter((r) => r.isLowStock && r.inventoryStatus === 'in_stock').length,
    }),
    [rolls],
  );

  const recentTransactions = useMemo(() => {
    void refreshKey;
    const rollMap = new Map(rolls.map((r) => [r.roll_id, r]));
    return store
      .getPPFStockTransactions()
      .slice(0, 8)
      .map((txn) => ({
        ...txn,
        rollLabel: rollMap.get(txn.roll_id)?.film_type ?? txn.roll_id,
      }));
  }, [refreshKey, rolls]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleRollCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Studio" subtitle="Film roll sub-inventory" />
        <RollsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Studio"
        subtitle="Film roll sub-inventory — one roll per vehicle job"
        actions={
          canManageInventory ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Add roll
            </Button>
          ) : undefined
        }
      />

      <PPFStudioNav />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total rolls', value: stats.total },
          { label: 'In stock', value: stats.inStock },
          { label: 'Assigned to jobs', value: stats.assigned },
          { label: 'Low stock', value: stats.lowStock },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {stats.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {stats.lowStock} unassigned roll{stats.lowStock === 1 ? '' : 's'} below{' '}
              {LOW_STOCK_THRESHOLD}m
            </p>
            <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-400/80">
              Add new rolls to inventory before booking more jobs.
            </p>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="all" value={inventoryTab} onValueChange={(v) => setInventoryTab(v as typeof inventoryTab)}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="in_stock">In stock ({stats.inStock})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned ({stats.assigned})</TabsTrigger>
          </TabsList>
          <div className="w-full max-w-md">
            <SearchInput
              placeholder="Search rolls, brands, jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>
        </div>

        {(['all', 'in_stock', 'assigned'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filteredRolls.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title={search ? 'No rolls match your search' : 'No rolls in this view'}
                  description={
                    search
                      ? 'Try a different search term or clear the filter.'
                      : tab === 'in_stock'
                        ? 'Add a new roll to stock inventory for upcoming jobs.'
                        : 'Assigned rolls will appear here when linked to vehicle jobs.'
                  }
                  action={
                    search
                      ? { label: 'Clear search', onClick: () => setSearch('') }
                      : canManageInventory && tab === 'in_stock'
                        ? { label: 'Add roll', onClick: () => setAddOpen(true) }
                        : undefined
                  }
                />
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRolls.map((roll, index) => (
                  <RollCard key={roll.roll_id} roll={roll} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent stock movements</CardTitle>
          <CardDescription>Purchases and usage logged for PPF film inventory</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No stock transactions yet.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-secondary)] text-xs text-[var(--text-tertiary)]">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Roll</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Change</th>
                  <th className="pb-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.transaction_id} className="border-b border-[var(--border-secondary)]/60">
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="py-2.5 pr-4">{txn.rollLabel}</td>
                    <td className="py-2.5 pr-4 capitalize">{txn.transaction_type}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {txn.length_change > 0 ? '+' : ''}
                      {txn.length_change} m
                    </td>
                    <td className="py-2.5 font-mono text-xs text-[var(--text-tertiary)]">
                      {txn.reference || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AddRollModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleRollCreated} />
    </div>
  );
}
