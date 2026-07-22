import { useCallback, useEffect, useMemo, useState } from 'react';
import { PPFStudioNav } from '@/components/ppf/PPFStudioNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import {
  categoryOptionsForIds,
  EXPENSE_CATEGORIES,
  PPF_RENT_SALARY_CATEGORY_IDS,
} from '@/utils/expense-categories';
import { formatDate, formatPKR, parseMoneyInput } from '@/utils/format';

const EMPTY_FORM: {
  category_id: string;
  expense_date: string;
  description: string;
  amount: string;
} = {
  category_id: EXPENSE_CATEGORIES.ppf.rent,
  expense_date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
};

export function PPFExpensesPage() {
  const { user, isAdmin, hasPermission } = useAuth();
  const { success, error: toastError } = useToast();
  const canAddExpense = isAdmin || hasPermission('expenses');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    return store.subscribe(() => setRefreshKey((k) => k + 1));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(timer);
  }, []);

  const categories = store.getExpenseCategories();
  const categoryOptions = useMemo(
    () => categoryOptionsForIds(categories, PPF_RENT_SALARY_CATEGORY_IDS),
    [categories, refreshKey],
  );

  const expenses = useMemo(() => {
    void refreshKey;
    return store
      .getShowroomExpenses()
      .filter((exp) => PPF_RENT_SALARY_CATEGORY_IDS.has(exp.category_id))
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [refreshKey]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const exp of expenses) {
      const cat = categories.find((c) => c.category_id === exp.category_id);
      const name = cat?.category_name ?? exp.category_id;
      const existing = map.get(exp.category_id) ?? { name, total: 0, count: 0 };
      existing.total += exp.amount;
      existing.count += 1;
      map.set(exp.category_id, existing);
    }
    return [...map.values()];
  }, [expenses, categories]);

  const openAdd = useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      category_id: categoryOptions[0]?.value ?? EXPENSE_CATEGORIES.ppf.rent,
    });
    setAddOpen(true);
  }, [categoryOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddExpense) {
      toastError('Not allowed', 'You do not have permission to add expenses.');
      return;
    }
    const amount = parseMoneyInput(form.amount);
    if (!form.category_id || !form.description.trim() || amount <= 0) {
      toastError('Missing fields', 'Choose category, description, and amount.');
      return;
    }

    setSaving(true);
    try {
      const created = await store.createShowroomExpense({
        category_id: form.category_id,
        expense_date: form.expense_date,
        description: form.description,
        amount,
      });
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_003',
        action: 'CREATE',
        table_name: 'showroom_expenses',
        record_id: created.expense_id,
        ip_address: '127.0.0.1',
      });
      success('Expense saved', 'PPF studio rent or salary recorded.');
      setAddOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toastError('Save failed', err instanceof Error ? err.message : 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Studio" subtitle="Rent & salaries" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Studio"
        subtitle="Rent and salaries for the PPF studio"
        actions={
          canAddExpense ? (
            <Button size="sm" onClick={openAdd}>
              Add expense
            </Button>
          ) : undefined
        }
      />

      <PPFStudioNav />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card padding="sm">
          <p className="text-xs text-[var(--text-tertiary)]">This month</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPKR(monthlyTotal)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--text-tertiary)]">Total recorded</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatPKR(expenses.reduce((s, e) => s + e.amount, 0))}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-[var(--text-tertiary)]">Entries</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{expenses.length}</p>
        </Card>
      </div>

      {byCategory.length > 0 && (
        <Card padding="md" className="mb-6">
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {byCategory.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 py-3"
                >
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="mt-1 text-lg font-bold text-accent">{formatPKR(cat.total)}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{cat.count} entries</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
          <CardTitle>PPF Studio Rent & Salaries</CardTitle>
        </CardHeader>
        {expenses.length === 0 ? (
          <CardContent>
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No PPF studio rent or salary expenses yet.
              {canAddExpense ? ' Click Add expense to record rent or staff salaries.' : ''}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Description</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Category</th>
                  <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const cat = categories.find((c) => c.category_id === exp.category_id);
                  return (
                    <tr key={exp.expense_id} className="border-b border-[var(--border-secondary)]/60">
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="px-5 py-3">{exp.description}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {cat?.category_name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{formatPKR(exp.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add PPF studio expense"
        description="Record PPF studio rent or staff salaries."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="ppf-expense-form" loading={saving}>
              Save expense
            </Button>
          </>
        }
      >
        <form id="ppf-expense-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
              placeholder="e.g. March studio rent or installer salaries"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
