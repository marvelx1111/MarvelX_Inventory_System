import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { store } from '@/data/store';
import { VEHICLE_STATUS_CONFIG } from '@/utils/constants';
import { formatDate, formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

function getSaleStatus(sale: ReturnType<typeof store.getSales>[number]) {
  const vehicle = store.getVehicleById(sale.vehicle_id);
  if (sale.balance <= 0) return { label: 'Paid', variant: 'success' as const };
  if (vehicle?.status === 'booked') return { label: 'Booked', variant: 'warning' as const };
  return { label: 'Pending', variant: 'info' as const };
}

export function SalesPage() {
  const loading = usePageLoading();
  const sales = [...store.getSales()].sort(
    (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
  );

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} total sales records`}
        actions={
          <Link to="/sales/new">
            <Button icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }>
              New sale
            </Button>
          </Link>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="Create your first sale to start tracking revenue and deliveries."
          action={{ label: 'Create sale', onClick: () => window.location.assign('/sales/new') }}
        />
      ) : (
        <div className="space-y-3">
          {sales.map((sale, i) => {
            const vehicle = store.getVehicleById(sale.vehicle_id);
            const customer = store.getCustomerById(sale.customer_id);
            const status = getSaleStatus(sale);
            const vehicleStatus = vehicle ? VEHICLE_STATUS_CONFIG[vehicle.status] : null;

            return (
              <motion.div
                key={sale.sale_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`/sales/${sale.sale_id}`}>
                  <Card hoverLift padding="md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-[var(--text-tertiary)]">
                            {sale.sale_id}
                          </span>
                          <Badge variant={status.variant} dot>
                            {status.label}
                          </Badge>
                          {vehicleStatus && (
                            <Badge variant="default">{vehicleStatus.label}</Badge>
                          )}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                          {vehicle
                            ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                            : 'Unknown vehicle'}
                        </h3>
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                          {customer?.full_name ?? 'Unknown buyer'} · {formatDate(sale.sale_date)} ·{' '}
                          {sale.salesperson}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-4 sm:text-right">
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)]">Sale price</p>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {formatPKR(sale.sale_price - sale.discount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)]">Balance</p>
                          <p className={`font-semibold ${sale.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatPKR(sale.balance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)]">Profit</p>
                          <p className="font-semibold text-emerald-600">{formatPKR(sale.profit)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
