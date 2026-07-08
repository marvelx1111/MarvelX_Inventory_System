import { formatPKR } from '@/utils/format';

interface VehicleCostBreakdownProps {
  totalCost: number;
  purchasePrice: number;
  /** Compact labels for summary cards */
  compact?: boolean;
}

export function VehicleCostBreakdown({
  totalCost,
  purchasePrice,
  compact = false,
}: VehicleCostBreakdownProps) {
  const labelClass = compact
    ? 'text-xs text-[var(--text-tertiary)]'
    : 'text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]';
  const valueClass = compact
    ? 'text-lg font-bold text-[var(--text-primary)]'
    : 'mt-1 text-lg font-bold text-[var(--text-primary)]';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className={labelClass}>Total cost (incl. expenses)</p>
        <p className={valueClass}>{formatPKR(totalCost)}</p>
      </div>
      <div>
        <p className={labelClass}>Actual price (bought for)</p>
        <p className={valueClass}>{formatPKR(purchasePrice)}</p>
      </div>
    </div>
  );
}
