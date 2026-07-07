import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { INVESTOR_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import { formatDate, formatPKR, getInitials } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function InvestorsPage() {
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  void refreshKey;

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

  const handleSaveInvestor = async (values: Record<string, string>) => {
    if (!selectedInvestor) return;
    setSaving(true);
    try {
      const updated = await store.updateInvestor(selectedInvestor.investor_id, {
        full_name: values.full_name.trim(),
        cnic: values.cnic.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        join_date: values.join_date,
      });
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
                onEdit={() => setEditOpen(true)}
              >
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Field label="CNIC" value={selectedInvestor.cnic} />
                  <Field label="Mobile" value={selectedInvestor.mobile} />
                  <Field label="Email" value={selectedInvestor.email || '—'} />
                  <Field label="Joined" value={formatDate(selectedInvestor.join_date)} />
                  <Field label="Total invested" value={formatPKR(totalInvested)} />
                  <Field label="Share percentage" value={`${currentShare.toFixed(2)}%`} />
                  <Field label="Total returns" value={formatPKR(totalReturns)} />
                </dl>
              </EditableCard>

              <Card padding="none" className="overflow-hidden">
                <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
                  <CardTitle>Investments</CardTitle>
                </CardHeader>
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
              </Card>

              <Card padding="none" className="overflow-hidden">
                <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
                  <CardTitle>Monthly Returns</CardTitle>
                </CardHeader>
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
              </Card>
            </>
          )}
        </div>
      </div>

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
