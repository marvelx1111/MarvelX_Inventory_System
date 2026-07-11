import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatPKR } from '@/utils/format';
import type { FinanceTrendPoint } from '@/utils/finance';

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const labels: Record<string, string> = {
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Net profit',
  };

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-lift)]">
      <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium text-[var(--text-primary)]">
          <span style={{ color: entry.color }}>{labels[entry.dataKey] ?? entry.dataKey}:</span>{' '}
          {formatPKR(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function FinanceTrendChart({ data }: { data: FinanceTrendPoint[] }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
        <CardTitle>Monthly P&L Trend</CardTitle>
        <CardDescription>Revenue, expenses, and net profit over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="px-2 py-4 sm:px-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="financeRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="financeExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="financeProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CD1719" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#CD1719" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                width={56}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#financeRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#financeExpenses)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#CD1719"
                strokeWidth={2}
                fill="url(#financeProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Expenses
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            Net profit
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
