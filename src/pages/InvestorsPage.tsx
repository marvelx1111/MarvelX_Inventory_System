import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import {
  INVESTMENT_CREATE_DEFAULT_VALUES,
  INVESTOR_CREATE_DEFAULT_VALUES,
  INVESTOR_EDIT_FIELDS,
  parseInvestorFormValues,
} from '@/config/edit-fields';
import { useAuth, usePermission } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import { formatDate, formatPKR, getInitials, parseMoneyInput } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_OPTIONS = MONTH_NAMES.map((label, index) => ({
  value: String(index + 1),
  label,
}));

const EMPTY_INVESTOR_FORM = {
  ...INVESTOR_CREATE_DEFAULT_VALUES,
  ...INVESTMENT_CREATE_DEFAULT_VALUES,
};

const EMPTY_INVESTMENT_FORM = { ...INVESTMENT_CREATE_DEFAULT_VALUES };

const EMPTY_RETURN_FORM = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  total_profit: '',
  percentage_share: '',
  return_amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
};

export function InvestorsPage() {
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const canManageInvestors = usePermission('investors');
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [addInvestorOpen, setAddInvestorOpen] = useState(false);
  const [addInvestmentOpen, setAddInvestmentOpen] = useState(false);
  const [addReturnOpen, setAddReturnOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [investorForm, setInvestorForm] = useState(EMPTY_INVESTOR_FORM);
  const [investmentForm, setInvestmentForm] = useState(EMPTY_INVESTMENT_FORM);
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM);
  void refreshKey;

  useEffect(() => store.subscribe(() => setRefreshKey((n) => n + 1)), []);

  const investors = store.getInvestors();
  const investments = store.getInvestments();
  const returns = store.getInvestorReturns();

  const selectedId = selectedInvestorId ?? investors[0]?.investor_id ?? null;
  const selectedInvestor = investors.find((i) => i.investor_id === selectedId);

  const investorInvestments = useMemo(
    () => investments.filter((inv) => inv.investor_id === selectedId),
    [investments, selectedId],
  );

  const investorReturns = useMemo(
    () =>
      returns
        .filter((r) => r.investor_id === selectedId)
        .sort((a, b) => b.year - a.year || b.month - a.month),
    [returns, selectedId],
  );

  const totalInvested = investorInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investorReturns.reduce((sum, r) => sum + r.return_amount, 0);
  const currentShare = investorInvestments.reduce((sum, inv) => sum + inv.percentage_share, 0);

  const allInvestmentsSummary = useMemo(() => {
    return investors.map((investor) => {
      const invs = investments.filter((i) => i.investor_id === investor.investor_id);
      const total = invs.reduce((s, i) => s + i.amount, 0);
      const share = invs.reduce((s, i) => s + i.percentage_share, 0);
      const rets = returns.filter((r) => r.investor_id === investor.investor_id);
      const returnTotal = rets.reduce((s, r) => s + r.return_amount, 0);
      return { investor, total, share, returnTotal, investmentCount: invs.length };
    });
  }, [investors, investments, returns]);

  const openAddInvestment = () => {
    setInvestmentForm({
      ...EMPTY_INVESTMENT_FORM,
      investment_date: new Date().toISOString().slice(0, 10),
    });
    setAddInvestmentOpen(true);
  };

  const openAddReturn = () => {
    setReturnForm({
      ...EMPTY_RETURN_FORM,
      percentage_share: currentShare > 0 ? String(currentShare) : '',
      payment_date: new Date().toISOString().slice(0, 10),
    });
    setAddReturnOpen(true);
  };

  const handleSaveInvestor = async (values: Record<string, string>) => {
    if (!selectedInvestor) return;
    setSaving(true);
    try {
      const updated = await store.updateInvestor(selectedInvestor.investor_id, parseInvestorFormValues(values));
      if (!updated) {
        error('Update failed', 'Could not save investor changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'investors',
        record_id: selectedInvestor.investor_id,
        ip_address: '127.0.0.1',
      });
      success('Investor updated', 'Investor details saved successfully.');
      setEditOpen(false);
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorForm.full_name.trim()) {
      error('Missing name', 'Enter the investor full name.');
      return;
    }
    const amount = parseMoneyInput(investorForm.amount);
    const share = Number(investorForm.percentage_share);
    if (!amount || amount <= 0) {
      error('Missing investment', 'Enter the initial investment amount.');
      return;
    }
    if (!share || share <= 0 || share > 100) {
      error('Invalid share', 'Enter a profit share between 0 and 100%.');
      return;
    }

    setSaving(true);
    try {
      const investor = await store.createInvestor(parseInvestorFormValues(investorForm));
      const investment = await store.createInvestment({
        investor_id: investor.investor_id,
        amount,
        investment_date: investorForm.investment_date,
        percentage_share: share,
        notes: investorForm.notes.trim(),
      });
      if (!investment) {
        error('Partial save', 'Investor was created but the investment could not be saved.');
        return;
      }

      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'investors',
        record_id: investor.investor_id,
        ip_address: '127.0.0.1',
      });
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'investments',
        record_id: investment.investment_id,
        ip_address: '127.0.0.1',
      });

      success('Investor added', `${investor.full_name} registered with ${formatPKR(amount)} invested.`);
      setAddInvestorOpen(false);
      setInvestorForm({ ...EMPTY_INVESTOR_FORM, join_date: new Date().toISOString().slice(0, 10), investment_date: new Date().toISOString().slice(0, 10) });
      setSelectedInvestorId(investor.investor_id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      error('Could not add investor', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    const amount = parseMoneyInput(investmentForm.amount);
    const share = Number(investmentForm.percentage_share);
    if (!amount || amount <= 0) {
      error('Missing amount', 'Enter the investment amount.');
      return;
    }
    if (!share || share <= 0 || share > 100) {
      error('Invalid share', 'Enter a profit share between 0 and 100%.');
      return;
    }

    setSaving(true);
    try {
      const investment = await store.createInvestment({
        investor_id: selectedInvestor.investor_id,
        amount,
        investment_date: investmentForm.investment_date,
        percentage_share: share,
        notes: investmentForm.notes.trim(),
      });
      if (!investment) {
        error('Save failed', 'Could not record the investment.');
        return;
      }

      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'investments',
        record_id: investment.investment_id,
        ip_address: '127.0.0.1',
      });

      success('Investment recorded', `${formatPKR(amount)} added for ${selectedInvestor.full_name}.`);
      setAddInvestmentOpen(false);
      setInvestmentForm(EMPTY_INVESTMENT_FORM);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not record investment.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    const totalProfit = parseMoneyInput(returnForm.total_profit);
    const share = Number(returnForm.percentage_share);
    const returnAmount = parseMoneyInput(returnForm.return_amount);
    const month = Number(returnForm.month);
    const year = Number(returnForm.year);

    if (!totalProfit || totalProfit <= 0) {
      error('Missing profit', 'Enter the total profit pool for this period.');
      return;
    }
    if (!share || share <= 0 || share > 100) {
      error('Invalid share', 'Enter a valid share percentage.');
      return;
    }
    if (!returnAmount || returnAmount <= 0) {
      error('Missing return', 'Enter the return amount paid.');
      return;
    }

    setSaving(true);
    try {
      const record = await store.createInvestorReturn({
        investor_id: selectedInvestor.investor_id,
        month,
        year,
        total_profit: totalProfit,
        percentage_share: share,
        return_amount: returnAmount,
        payment_date: returnForm.payment_date,
      });
      if (!record) {
        error('Save failed', 'Could not record the return.');
        return;
      }

      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'investor_returns',
        record_id: record.return_id,
        ip_address: '127.0.0.1',
      });

      success('Return recorded', `${formatPKR(returnAmount)} paid to ${selectedInvestor.full_name}.`);
      setAddReturnOpen(false);
      setReturnForm(EMPTY_RETURN_FORM);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not record return.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard className="lg:col-span-2" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Investors"
        subtitle="Manage investments and profit-sharing returns"
        actions={
          canManageInvestors ? (
            <Button onClick={() => setAddInvestorOpen(true)}>+ Add investor</Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Total investors" value={String(investors.length)} />
        <SummaryTile
          label="Total invested"
          value={formatPKR(investments.reduce((s, i) => s + i.amount, 0))}
        />
        <SummaryTile
          label="Total returns paid"
          value={formatPKR(returns.reduce((s, r) => s + r.return_amount, 0))}
        />
        <SummaryTile label="Active investments" value={String(investments.length)} />
      </div>

      {investors.length === 0 ? (
        <EmptyState
          title="No investors yet"
          description="Register a new investor with their profile and first investment to start tracking profit sharing."
          action={
            canManageInvestors
              ? { label: '+ Add your first investor', onClick: () => setAddInvestorOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card padding="none" className="overflow-hidden">
            <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
              <CardTitle>Investor Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-[var(--border-secondary)]">
                {allInvestmentsSummary.map(({ investor, total, share, returnTotal }) => (
                  <motion.li key={investor.investor_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedInvestorId(investor.investor_id)}
                      className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-hover)] ${
                        selectedId === investor.investor_id ? 'bg-[var(--bg-active)]' : ''
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                        {getInitials(investor.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--text-primary)]">
                          {investor.full_name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {formatPKR(total)} · {share.toFixed(1)}% share
                        </p>
                      </div>
                      <Badge variant="success">{formatPKR(returnTotal)}</Badge>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            {selectedInvestor && (
              <>
                <EditableCard
                  title={selectedInvestor.full_name}
                  onEdit={canManageInvestors ? () => setEditOpen(true) : undefined}
                >
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Field label="CNIC" value={selectedInvestor.cnic || '—'} />
                    <Field label="Mobile" value={selectedInvestor.mobile || '—'} />
                    <Field label="Email" value={selectedInvestor.email || '—'} />
                    <Field label="Address" value={selectedInvestor.address || '—'} />
                    <Field label="Joined" value={formatDate(selectedInvestor.join_date)} />
                    <Field label="Total invested" value={formatPKR(totalInvested)} />
                    <Field label="Share percentage" value={`${currentShare.toFixed(2)}%`} />
                    <Field label="Total returns" value={formatPKR(totalReturns)} />
                  </dl>
                </EditableCard>

                <Card padding="none" className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[var(--border-secondary)] px-5 py-4">
                    <CardTitle>Investments</CardTitle>
                    {canManageInvestors && (
                      <Button type="button" variant="secondary" size="sm" onClick={openAddInvestment}>
                        + Add investment
                      </Button>
                    )}
                  </CardHeader>
                  {investorInvestments.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
                      No investments recorded yet.
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Date</th>
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Amount</th>
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Share %</th>
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investorInvestments.map((inv) => (
                              <tr key={inv.investment_id} className="border-b border-[var(--border-secondary)] last:border-0">
                                <td className="px-5 py-3 text-[var(--text-secondary)]">
                                  {formatDate(inv.investment_date)}
                                </td>
                                <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                                  {formatPKR(inv.amount)}
                                </td>
                                <td className="px-5 py-3">
                                  <Badge variant="accent">{inv.percentage_share.toFixed(2)}%</Badge>
                                </td>
                                <td className="px-5 py-3 text-[var(--text-secondary)]">
                                  {inv.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="space-y-3 p-4 md:hidden">
                        {investorInvestments.map((inv) => (
                          <Card key={inv.investment_id} padding="sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{formatPKR(inv.amount)}</span>
                              <Badge variant="accent">{inv.percentage_share.toFixed(2)}%</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                              {formatDate(inv.investment_date)}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                <Card padding="none" className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[var(--border-secondary)] px-5 py-4">
                    <CardTitle>Monthly Returns</CardTitle>
                    {canManageInvestors && (
                      <Button type="button" variant="secondary" size="sm" onClick={openAddReturn}>
                        + Record return
                      </Button>
                    )}
                  </CardHeader>
                  {investorReturns.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
                      No returns paid yet.
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Period</th>
                              <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Total Profit</th>
                              <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Share %</th>
                              <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Return</th>
                              <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investorReturns.map((ret) => (
                              <tr key={ret.return_id} className="border-b border-[var(--border-secondary)] last:border-0">
                                <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                                  {MONTH_NAMES[ret.month - 1]} {ret.year}
                                </td>
                                <td className="px-5 py-3 text-right text-[var(--text-secondary)]">
                                  {formatPKR(ret.total_profit)}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <Badge variant="info">{ret.percentage_share.toFixed(2)}%</Badge>
                                </td>
                                <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                                  {formatPKR(ret.return_amount)}
                                </td>
                                <td className="px-5 py-3 text-[var(--text-secondary)]">
                                  {formatDate(ret.payment_date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="space-y-3 p-4 md:hidden">
                        {investorReturns.map((ret) => (
                          <Card key={ret.return_id} padding="sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">
                                  {MONTH_NAMES[ret.month - 1]} {ret.year}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                  Profit pool: {formatPKR(ret.total_profit)} · Share: {ret.percentage_share.toFixed(2)}%
                                </p>
                              </div>
                              <span className="font-semibold text-emerald-600">
                                {formatPKR(ret.return_amount)}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {selectedInvestor && (
        <EditRecordModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit investor"
          fields={INVESTOR_EDIT_FIELDS}
          values={{
            full_name: selectedInvestor.full_name,
            cnic: selectedInvestor.cnic,
            mobile: selectedInvestor.mobile,
            email: selectedInvestor.email,
            address: selectedInvestor.address,
            join_date: selectedInvestor.join_date,
          }}
          onSave={handleSaveInvestor}
          saving={saving}
        />
      )}

      <Modal
        open={addInvestorOpen}
        onClose={() => setAddInvestorOpen(false)}
        title="Add investor"
        description="Register a new investor with profile details and their first investment."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddInvestorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="add-investor-form" loading={saving}>
              Save investor
            </Button>
          </>
        }
      >
        <form id="add-investor-form" onSubmit={handleCreateInvestor} noValidate className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Investor profile</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={investorForm.full_name}
                onChange={(e) => setInvestorForm((f) => ({ ...f, full_name: e.target.value }))}
              />
              <Input
                label="CNIC"
                value={investorForm.cnic}
                onChange={(e) => setInvestorForm((f) => ({ ...f, cnic: e.target.value }))}
                placeholder="35202-1234567-1"
              />
              <Input
                label="Mobile"
                type="tel"
                value={investorForm.mobile}
                onChange={(e) => setInvestorForm((f) => ({ ...f, mobile: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={investorForm.email}
                onChange={(e) => setInvestorForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Join date"
                type="date"
                value={investorForm.join_date}
                onChange={(e) => setInvestorForm((f) => ({ ...f, join_date: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Address"
                  rows={2}
                  value={investorForm.address}
                  onChange={(e) => setInvestorForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border-secondary)] pt-6">
            <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Initial investment</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Investment amount (PKR)"
                type="number"
                min={0}
                value={investorForm.amount}
                onChange={(e) => setInvestorForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <Input
                label="Investment date"
                type="date"
                value={investorForm.investment_date}
                onChange={(e) => setInvestorForm((f) => ({ ...f, investment_date: e.target.value }))}
              />
              <Input
                label="Profit share (%)"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={investorForm.percentage_share}
                onChange={(e) => setInvestorForm((f) => ({ ...f, percentage_share: e.target.value }))}
                hint="Percentage of showroom profit owed to this investor"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Notes"
                  rows={2}
                  value={investorForm.notes}
                  onChange={(e) => setInvestorForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional — e.g. capital injection terms"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={addInvestmentOpen}
        onClose={() => setAddInvestmentOpen(false)}
        title="Add investment"
        description={selectedInvestor ? `Record additional capital from ${selectedInvestor.full_name}.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddInvestmentOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="add-investment-form" loading={saving}>
              Save investment
            </Button>
          </>
        }
      >
        <form id="add-investment-form" onSubmit={handleAddInvestment} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount (PKR)"
            type="number"
            min={0}
            value={investmentForm.amount}
            onChange={(e) => setInvestmentForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Input
            label="Investment date"
            type="date"
            value={investmentForm.investment_date}
            onChange={(e) => setInvestmentForm((f) => ({ ...f, investment_date: e.target.value }))}
          />
          <Input
            label="Profit share (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={investmentForm.percentage_share}
            onChange={(e) => setInvestmentForm((f) => ({ ...f, percentage_share: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              rows={2}
              value={investmentForm.notes}
              onChange={(e) => setInvestmentForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={addReturnOpen}
        onClose={() => setAddReturnOpen(false)}
        title="Record monthly return"
        description={selectedInvestor ? `Log a profit return paid to ${selectedInvestor.full_name}.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddReturnOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="add-return-form" loading={saving}>
              Save return
            </Button>
          </>
        }
      >
        <form id="add-return-form" onSubmit={handleAddReturn} noValidate className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Month"
            value={returnForm.month}
            onChange={(e) => setReturnForm((f) => ({ ...f, month: e.target.value }))}
            options={MONTH_OPTIONS}
          />
          <Input
            label="Year"
            type="number"
            min={2000}
            max={2100}
            value={returnForm.year}
            onChange={(e) => setReturnForm((f) => ({ ...f, year: e.target.value }))}
          />
          <Input
            label="Total profit pool (PKR)"
            type="number"
            min={0}
            value={returnForm.total_profit}
            onChange={(e) => {
              const totalProfit = e.target.value;
              setReturnForm((f) => {
                const share = Number(f.percentage_share);
                const next = { ...f, total_profit: totalProfit };
                if (share > 0 && totalProfit) {
                  next.return_amount = String(Math.round(parseMoneyInput(totalProfit) * (share / 100)));
                }
                return next;
              });
            }}
          />
          <Input
            label="Share (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={returnForm.percentage_share}
            onChange={(e) => {
              const share = e.target.value;
              setReturnForm((f) => {
                const next = { ...f, percentage_share: share };
                const profit = parseMoneyInput(f.total_profit);
                if (profit > 0 && share) {
                  next.return_amount = String(Math.round(profit * (Number(share) / 100)));
                }
                return next;
              });
            }}
          />
          <Input
            label="Return amount (PKR)"
            type="number"
            min={0}
            value={returnForm.return_amount}
            onChange={(e) => setReturnForm((f) => ({ ...f, return_amount: e.target.value }))}
          />
          <Input
            label="Payment date"
            type="date"
            value={returnForm.payment_date}
            onChange={(e) => setReturnForm((f) => ({ ...f, payment_date: e.target.value }))}
          />
        </form>
      </Modal>
    </PageTransition>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
