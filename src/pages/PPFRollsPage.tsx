import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PPFStudioNav } from '@/components/ppf/PPFStudioNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PPFRoll } from '@/types';
import { formatPPFStockChange, getInStockPPFRolls } from '@/utils/ppf-inventory';
import { formatDate, formatPKR, parseMoneyInput } from '@/utils/format';

interface RollRow extends PPFRoll {
  brandName: string;
}

interface RollForm {
  brand_name: string;
  film_type: string;
  purchase_cost: string;
  supplier: string;
  purchase_date: string;
}

const emptyRollForm = (): RollForm => ({
  brand_name: '',
  film_type: '',
  purchase_cost: '',
  supplier: '',
  purchase_date: new Date().toISOString().slice(0, 10),
});

function rollToForm(roll: RollRow): RollForm {
  return {
    brand_name: roll.brandName,
    film_type: roll.film_type,
    purchase_cost: String(roll.purchase_cost),
    supplier: roll.supplier,
    purchase_date: roll.purchase_date,
  };
}

function RollFormModal({
  open,
  mode,
  rollId,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  rollId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState<RollForm>(emptyRollForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && rollId) {
      const brands = store.getPPFBrands();
      const roll = store.getPPFRolls().find((r) => r.roll_id === rollId);
      if (roll) {
        const brand = brands.find((b) => b.brand_id === roll.brand_id);
        setForm(rollToForm({ ...roll, brandName: brand?.brand_name ?? '' }));
        return;
      }
    }
    setForm(emptyRollForm());
  }, [open, mode, rollId]);

  const update = <K extends keyof RollForm>(key: K, value: RollForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.brand_name.trim() !== '' &&
    form.film_type.trim() !== '' &&
    parseMoneyInput(form.purchase_cost) > 0 &&
    form.purchase_date !== '';

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const payload = {
        brand_name: form.brand_name,
        film_type: form.film_type,
        purchase_cost: parseMoneyInput(form.purchase_cost),
        supplier: form.supplier,
        purchase_date: form.purchase_date,
      };

      if (mode === 'edit' && rollId) {
        const updated = await store.updatePPFRoll(rollId, payload);
        if (!updated) {
          toastError(
            'Cannot edit roll',
            'This roll is already used on a vehicle job and cannot be changed.',
          );
          return;
        }
        success('Roll updated', 'Inventory details saved.');
      } else {
        await store.createPPFRoll(payload);
        success('Roll added', 'One roll added to PPF inventory.');
      }
      onSaved();
      onClose();
    } catch (err) {
      toastError('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={mode === 'edit' ? 'Edit roll' : 'Add roll'}
      description="Each roll is one physical unit for one vehicle. When assigned to a job, it leaves inventory."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
            {mode === 'edit' ? 'Save changes' : 'Add roll'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Brand name"
          value={form.brand_name}
          onChange={(e) => update('brand_name', e.target.value)}
          placeholder="e.g. 3M, XPEL, SunTek"
        />
        <Input
          label="Film type"
          value={form.film_type}
          onChange={(e) => update('film_type', e.target.value)}
          placeholder="e.g. Ultimate Plus"
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
            placeholder="Optional"
          />
        </div>
      </div>
    </Modal>
  );
}

function RollCard({
  roll,
  index,
  canManage,
  onEdit,
  onDelete,
}: {
  roll: RollRow;
  index: number;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Card hoverLift>
        <CardHeader className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="truncate">{roll.brandName}</CardTitle>
              <CardDescription className="truncate">{roll.film_type}</CardDescription>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{roll.roll_id}</span>
              <Badge
                variant="default"
                dot
                className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                In stock
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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

          {canManage && (
            <div className="flex gap-2 border-t border-[var(--border-secondary)] pt-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-red-600" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
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
  const { success, error: toastError } = useToast();
  const canManageInventory = hasPermission('ppf');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRollId, setEditingRollId] = useState<string | undefined>();

  const inStockRolls = useMemo((): RollRow[] => {
    void refreshKey;
    const brands = store.getPPFBrands();
    const jobs = store.getPPFJobCards();
    return getInStockPPFRolls(store.getPPFRolls(), jobs).map((roll) => {
      const brand = brands.find((b) => b.brand_id === roll.brand_id);
      return {
        ...roll,
        brandName: brand?.brand_name ?? 'Unknown brand',
      };
    });
  }, [refreshKey]);

  const filteredRolls = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inStockRolls;
    return inStockRolls.filter(
      (roll) =>
        roll.roll_id.toLowerCase().includes(q) ||
        roll.film_type.toLowerCase().includes(q) ||
        roll.brandName.toLowerCase().includes(q) ||
        roll.supplier.toLowerCase().includes(q),
    );
  }, [inStockRolls, search]);

  const usedRollCount = useMemo(() => {
    void refreshKey;
    return store.getPPFJobCards().length;
  }, [refreshKey]);

  const recentTransactions = useMemo(() => {
    void refreshKey;
    return store.getPPFStockTransactions().slice(0, 10);
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openAdd = () => {
    setFormMode('add');
    setEditingRollId(undefined);
    setFormOpen(true);
  };

  const openEdit = (rollId: string) => {
    setFormMode('edit');
    setEditingRollId(rollId);
    setFormOpen(true);
  };

  const handleDelete = async (rollId: string) => {
    const ok = window.confirm('Remove this roll from inventory? This cannot be undone.');
    if (!ok) return;
    const deleted = await store.deletePPFRoll(rollId);
    if (!deleted) {
      toastError(
        'Cannot delete roll',
        'This roll is already used on a vehicle job and cannot be removed.',
      );
      return;
    }
    success('Roll deleted', 'The roll was removed from inventory.');
    refresh();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Studio" subtitle="Roll inventory" />
        <RollsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Studio"
        subtitle="Roll inventory — one roll per vehicle"
        actions={
          canManageInventory ? (
            <Button size="sm" onClick={openAdd}>
              Add roll
            </Button>
          ) : undefined
        }
      />

      <PPFStudioNav />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card padding="sm">
          <p className="text-xs text-[var(--text-tertiary)]">Rolls in stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {inStockRolls.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Available to assign when booking a job
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--text-tertiary)]">Rolls used on jobs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {usedRollCount}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Leave inventory when assigned to a vehicle
          </p>
        </Card>
      </div>

      <div className="mb-6 max-w-md">
        <SearchInput
          placeholder="Search brand, film type, roll ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      {filteredRolls.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title={search ? 'No rolls match your search' : 'No rolls in stock'}
            description={
              search
                ? 'Try a different search term or clear the filter.'
                : 'Add a roll to inventory, then assign it when booking a PPF job for a vehicle.'
            }
            action={
              search
                ? { label: 'Clear search', onClick: () => setSearch('') }
                : canManageInventory
                  ? { label: 'Add roll', onClick: openAdd }
                  : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRolls.map((roll, index) => (
            <RollCard
              key={roll.roll_id}
              roll={roll}
              index={index}
              canManage={canManageInventory}
              onEdit={() => openEdit(roll.roll_id)}
              onDelete={() => handleDelete(roll.roll_id)}
            />
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Stock activity</CardTitle>
          <CardDescription>Rolls received (+1) and used on jobs (-1)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No stock activity yet.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
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
                    <td className="py-2.5 pr-4 font-mono text-xs">{txn.roll_id}</td>
                    <td className="py-2.5 pr-4 capitalize">{txn.transaction_type}</td>
                    <td className="py-2.5 pr-4">{formatPPFStockChange(txn.length_change)}</td>
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

      <RollFormModal
        open={formOpen}
        mode={formMode}
        rollId={editingRollId}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}
