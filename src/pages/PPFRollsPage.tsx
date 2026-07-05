import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { store } from '@/data/store';
import type { PPFRoll } from '@/types';
import { cn, formatDate, formatPKR } from '@/utils/format';

const LOW_STOCK_THRESHOLD = 20;

interface RollWithBrand extends PPFRoll {
  brandName: string;
  brandCountry: string;
  usagePercent: number;
  isLowStock: boolean;
}

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
        {isLowStock && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <p className="text-right text-[10px] tabular-nums text-[var(--text-tertiary)]">
        {percent.toFixed(0)}% remaining
      </p>
    </div>
  );
}

function RollCard({ roll, index }: { roll: RollWithBrand; index: number }) {
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
          roll.isLowStock && 'border-red-300/60 dark:border-red-900/50',
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
              {roll.isLowStock && (
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
              <dd className="font-medium text-[var(--text-primary)]">{roll.supplier}</dd>
            </div>
          </dl>
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const rolls = useMemo((): RollWithBrand[] => {
    const brands = store.getPPFBrands();
    return store.getPPFRolls().map((roll) => {
      const brand = brands.find((b) => b.brand_id === roll.brand_id);
      return {
        ...roll,
        brandName: brand?.brand_name ?? 'Unknown',
        brandCountry: brand?.country ?? '—',
        usagePercent:
          roll.total_length > 0
            ? ((roll.total_length - roll.remaining_length) / roll.total_length) * 100
            : 0,
        isLowStock: roll.remaining_length < LOW_STOCK_THRESHOLD,
      };
    });
  }, []);

  const filteredRolls = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rolls;
    return rolls.filter(
      (roll) =>
        roll.roll_id.toLowerCase().includes(q) ||
        roll.film_type.toLowerCase().includes(q) ||
        roll.brandName.toLowerCase().includes(q) ||
        roll.supplier.toLowerCase().includes(q),
    );
  }, [rolls, search]);

  const lowStockCount = rolls.filter((r) => r.isLowStock).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Roll Inventory" subtitle="Film stock and remaining lengths" />
        <RollsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Roll Inventory"
        subtitle={`${rolls.length} rolls in stock${lowStockCount > 0 ? ` · ${lowStockCount} low on stock` : ''}`}
        actions={
          <Link to="/ppf">
            <Button variant="secondary" size="sm">
              View Jobs
            </Button>
          </Link>
        }
      />

      {lowStockCount > 0 && (
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
              {lowStockCount} roll{lowStockCount === 1 ? '' : 's'} below {LOW_STOCK_THRESHOLD}m
            </p>
            <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-400/80">
              Reorder soon to avoid job delays. Rolls under {LOW_STOCK_THRESHOLD}m are highlighted.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mb-6 max-w-md">
        <SearchInput
          placeholder="Search by roll, brand, film type, supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      {filteredRolls.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title={search ? 'No rolls match your search' : 'No rolls in inventory'}
            description={
              search
                ? 'Try a different search term or clear the filter.'
                : 'Film rolls will appear here once purchased.'
            }
            action={
              search
                ? { label: 'Clear search', onClick: () => setSearch('') }
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
    </div>
  );
}
