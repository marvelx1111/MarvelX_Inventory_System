import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { store } from '@/data/store';
import type { PPFJobCard, PPFJobStatus } from '@/types';
import { PPF_STATUS_CONFIG } from '@/utils/constants';
import { cn, formatDate } from '@/utils/format';

const STATUSES: PPFJobStatus[] = ['booked', 'in_progress', 'completed', 'delivered'];

function useJobsData(refreshKey: number) {
  return useMemo(() => {
    void refreshKey;
    const jobs = store.getPPFJobCards();
    const customers = store.getPPFCustomers();
    const vehicles = store.getPPFVehicles();
    const packages = store.getPPFPackages();

    const enriched = jobs.map((job) => {
      const customer = customers.find((c) => c.ppf_customer_id === job.ppf_customer_id);
      const vehicle = vehicles.find((v) => v.ppf_vehicle_id === job.ppf_vehicle_id);
      const pkg = packages.find((p) => p.package_id === job.package_id);
      return { job, customer, vehicle, package: pkg };
    });

    const byStatus = STATUSES.reduce(
      (acc, status) => {
        acc[status] = enriched.filter(({ job }) => job.status === status);
        return acc;
      },
      {} as Record<PPFJobStatus, typeof enriched>,
    );

    return { jobs: enriched, byStatus, total: jobs.length };
  }, [refreshKey]);
}

function JobCard({
  job,
  customerName,
  vehicleLabel,
  packageName,
  onNavigate,
}: {
  job: PPFJobCard;
  customerName: string;
  vehicleLabel: string;
  packageName: string;
  onNavigate: () => void;
}) {
  const config = PPF_STATUS_CONFIG[job.status];

  return (
    <motion.button
      type="button"
      layout
      layoutId={`job-card-${job.job_id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onClick={onNavigate}
      className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-left shadow-[var(--shadow-soft)] transition-shadow hover:border-accent/30 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">{job.job_id}</span>
        <Badge variant="default" dot className={cn(config.bgColor, config.color)}>
          {config.label}
        </Badge>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{customerName}</p>
      <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{vehicleLabel}</p>
      <p className="mt-2 truncate text-xs text-[var(--text-tertiary)]">{packageName}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-secondary)] pt-3">
        <span className="truncate text-xs text-[var(--text-secondary)]">{job.installer_name}</span>
        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{formatDate(job.booked_date)}</span>
      </div>
    </motion.button>
  );
}

function KanbanColumn({
  status,
  items,
  onNavigate,
}: {
  status: PPFJobStatus;
  items: ReturnType<typeof useJobsData>['byStatus'][PPFJobStatus];
  onNavigate: (jobId: string) => void;
}) {
  const config = PPF_STATUS_CONFIG[status];

  return (
    <motion.div
      layout
      className="flex h-full min-h-[320px] w-[280px] shrink-0 flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 md:w-auto md:min-w-0 md:flex-1"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-4 py-3">
        <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</h3>
        <Badge variant="default" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-xs text-[var(--text-tertiary)]"
            >
              No jobs in this stage
            </motion.p>
          ) : (
            items.map(({ job, customer, vehicle, package: pkg }) => (
              <JobCard
                key={job.job_id}
                job={job}
                customerName={customer?.full_name ?? 'Unknown customer'}
                vehicleLabel={
                  vehicle
                    ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                    : 'Unknown vehicle'
                }
                packageName={pkg?.package_name ?? 'Unknown package'}
                onNavigate={() => onNavigate(job.job_id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JobsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 space-y-3 rounded-xl border border-[var(--border-primary)] p-4">
            <Skeleton className="h-5 w-1/2" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PPFJobsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { byStatus, total } = useJobsData(refreshKey);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleNavigate = useCallback(
    (jobId: string) => {
      navigate(`/ppf/jobs/${jobId}`);
    },
    [navigate],
  );

  const activeCount = byStatus.booked.length + byStatus.in_progress.length;

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Studio" subtitle="Track paint protection film jobs by stage" />
        <JobsSkeleton />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div>
        <PageHeader
          title="PPF Studio"
          subtitle="Track paint protection film jobs by stage"
          actions={
            <Button variant="secondary" onClick={() => navigate('/ppf/rolls')}>
              View Rolls
            </Button>
          }
        />
        <Card padding="none">
          <EmptyState
            title="No PPF jobs yet"
            description="Job cards will appear here once bookings are created."
            action={{ label: 'View roll inventory', onClick: () => navigate('/ppf/rolls') }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Studio"
        subtitle={`${activeCount} active job${activeCount === 1 ? '' : 's'} across the pipeline`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/ppf/rolls">
              <Button variant="secondary" size="sm">
                Roll Inventory
              </Button>
            </Link>
          </div>
        }
      />

      {/* Mobile: tabbed kanban */}
      <div className="lg:hidden">
        <Tabs defaultValue="booked">
          <TabsList className="w-full overflow-x-auto">
            {STATUSES.map((status) => (
              <TabsTrigger key={status} value={status} className="shrink-0">
                {PPF_STATUS_CONFIG[status].label}
                <Badge variant="default" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {byStatus[status].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUSES.map((status) => (
            <TabsContent key={status} value={status}>
              <LayoutGroup>
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {byStatus[status].map(({ job, customer, vehicle, package: pkg }) => (
                      <JobCard
                        key={job.job_id}
                        job={job}
                        customerName={customer?.full_name ?? 'Unknown customer'}
                        vehicleLabel={
                          vehicle
                            ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                            : 'Unknown vehicle'
                        }
                        packageName={pkg?.package_name ?? 'Unknown package'}
                        onNavigate={() => handleNavigate(job.job_id)}
                      />
                    ))}
                  </AnimatePresence>
                  {byStatus[status].length === 0 && (
                    <EmptyState
                      title={`No ${PPF_STATUS_CONFIG[status].label.toLowerCase()} jobs`}
                      description="Jobs will show up here as they move through the pipeline."
                      className="py-10"
                    />
                  )}
                </div>
              </LayoutGroup>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop: horizontal scroll / grid kanban */}
      <div className="hidden lg:block">
        <LayoutGroup>
          <motion.div
            layout
            className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible"
          >
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                items={byStatus[status]}
                onNavigate={handleNavigate}
              />
            ))}
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
