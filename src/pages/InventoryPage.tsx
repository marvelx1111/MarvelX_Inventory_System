import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { store } from '@/data/store';
import type { Vehicle, VehicleStatus } from '@/types';
import { VEHICLE_STATUS_CONFIG } from '@/utils/constants';
import { formatPKR, cn } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

export function InventoryPage() {
  const loading = usePageLoading();
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const vehicles = store.getVehicles();
  const makes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles],
  );
  const years = useMemo(
    () => [...new Set(vehicles.map((v) => v.model_year))].sort((a, b) => b - a),
    [vehicles],
  );

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        v.stock_number.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.registration_number.toLowerCase().includes(q);

      const matchesMake = !make || v.make === make;
      const matchesStatus = !status || v.status === status;
      const matchesYear = !year || v.model_year === Number(year);
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      const matchesPrice = v.total_cost >= min && v.total_cost <= max;

      return matchesSearch && matchesMake && matchesStatus && matchesYear && matchesPrice;
    });
  }, [vehicles, search, make, status, year, minPrice, maxPrice]);

  const clearFilters = () => {
    setSearch('');
    setMake('');
    setStatus('');
    setYear('');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasFilters = search || make || status || year || minPrice || maxPrice;

  if (loading) {
    return (
      <PageTransition>
        <PageHeader title="Inventory" subtitle="Vehicle stock management" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Inventory"
        subtitle={`${filtered.length} of ${vehicles.length} vehicles`}
      />

      <Card padding="md" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SearchInput
            placeholder="Search stock, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            containerClassName="sm:col-span-2 lg:col-span-2"
          />
          <Select
            label="Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="All makes"
            options={makes.map((m) => ({ value: m, label: m }))}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={(
              Object.entries(VEHICLE_STATUS_CONFIG) as [VehicleStatus, (typeof VEHICLE_STATUS_CONFIG)[VehicleStatus]][]
            ).map(([value, cfg]) => ({ value, label: cfg.label }))}
          />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="All years"
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Input
            label="Min price"
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            label="Max price"
            type="number"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-medium text-accent hover:underline"
          >
            Clear all filters
          </button>
        )}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No vehicles found"
          description="Try adjusting your search or filters to find vehicles in stock."
          action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((vehicle) => (
              <VehicleCard key={vehicle.vehicle_id} vehicle={vehicle} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageTransition>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusCfg = VEHICLE_STATUS_CONFIG[vehicle.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/inventory/${vehicle.vehicle_id}`}>
        <Card hoverLift padding="md" className="h-full">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-[var(--text-tertiary)]">{vehicle.stock_number}</p>
              <h3 className="mt-1 truncate text-base font-semibold text-[var(--text-primary)]">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {vehicle.variant} · {vehicle.model_year}
              </p>
            </div>
            <Badge
              variant={
                vehicle.status === 'in_stock'
                  ? 'success'
                  : vehicle.status === 'booked'
                    ? 'warning'
                    : 'default'
              }
              dot
            >
              {statusCfg.label}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-secondary)] pt-4">
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {formatPKR(vehicle.total_cost)}
            </span>
            <span className={cn('text-xs', statusCfg.color)}>{vehicle.color}</span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
