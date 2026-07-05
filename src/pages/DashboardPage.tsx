import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SalesTrendChart } from '@/components/charts/SalesTrendChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { store } from '@/data/store';
import { formatDate, formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const KPI_CONFIG = [
  {
    key: 'vehiclesInStock',
    label: 'Vehicles in Stock',
    format: (v: number) => String(v),
    suffix: '',
    link: '/inventory',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'monthlySales',
    label: 'Monthly Sales',
    format: (v: number) => String(v),
    suffix: '',
    link: '/sales',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'monthlyProfit',
    label: 'Monthly Profit',
    format: formatPKR,
    suffix: '',
    link: '/sales',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'pendingReceivables',
    label: 'Pending Balances',
    format: formatPKR,
    suffix: '',
    link: '/sales',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'ppfJobsActive',
    label: 'PPF Jobs in Progress',
    format: (v: number) => String(v),
    suffix: '',
    link: '/ppf',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'ppfLowStockRolls',
    label: 'Low PPF Roll Alerts',
    format: (v: number) => String(v),
    suffix: '',
    link: '/ppf',
    accent: 'text-red-600 dark:text-red-400',
  },
] as const;

function getMonthlyMetrics() {
  const trend = store.getSalesTrend(1);
  const current = trend[0];
  return {
    monthlySales: current?.salesCount ?? 0,
    monthlyProfit: current?.profit ?? 0,
  };
}

export function DashboardPage() {
  const loading = usePageLoading();
  const kpis = store.getDashboardKPIs();
  const monthly = getMonthlyMetrics();
  const trendData = store.getSalesTrend(6).map((p) => ({
    month: p.month,
    sales: p.salesCount,
    revenue: p.revenue,
  }));
  const auditLogs = store.getAuditLogs().slice(0, 8);
  const users = store.getUsers();

  const kpiValues: Record<string, number> = {
    vehiclesInStock: kpis.vehiclesInStock,
    monthlySales: monthly.monthlySales,
    monthlyProfit: monthly.monthlyProfit,
    pendingReceivables: kpis.pendingReceivables,
    ppfJobsActive: kpis.ppfJobsActive,
    ppfLowStockRolls: kpis.ppfLowStockRolls,
  };

  if (loading) {
    return (
      <PageTransition>
        <PageHeader title="Dashboard" subtitle="Overview and analytics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="mt-6 h-80 rounded-xl" />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of your dealership operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CONFIG.map((kpi, index) => (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={kpi.link}>
              <Card hoverLift padding="md" className="h-full">
                <p className="text-sm font-medium text-[var(--text-secondary)]">{kpi.label}</p>
                <p className={`mt-2 text-2xl font-bold ${kpi.accent}`}>
                  <CountUp
                    value={kpiValues[kpi.key]}
                    formatter={
                      kpi.key === 'monthlyProfit' || kpi.key === 'pendingReceivables'
                        ? formatPKR
                        : undefined
                    }
                  />
                </p>
                {kpi.key === 'ppfLowStockRolls' && kpiValues[kpi.key] > 0 && (
                  <Badge variant="danger" dot pulse className="mt-3">
                    Action needed
                  </Badge>
                )}
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SalesTrendChart data={trendData} />
        </div>

        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto px-2 py-2">
            {auditLogs.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No activity yet
              </p>
            ) : (
              <ul className="space-y-1">
                {auditLogs.map((log, i) => {
                  const user = users.find((u) => u.user_id === log.user_id);
                  return (
                    <motion.li
                      key={log.log_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-medium">{user?.full_name ?? 'System'}</span>{' '}
                          <span className="text-[var(--text-secondary)]">{log.action.toLowerCase()}</span>{' '}
                          <span className="font-mono text-xs text-accent">{log.record_id}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                          {formatDate(log.timestamp, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {log.table_name}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
