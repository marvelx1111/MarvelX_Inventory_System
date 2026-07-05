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

export interface SalesTrendPoint {
  month: string;
  sales: number;
  revenue: number;
}

export interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  title?: string;
  description?: string;
}

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

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-lift)]">
      <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium text-[var(--text-primary)]">
          <span style={{ color: entry.color }}>
            {entry.dataKey === 'revenue' ? 'Revenue' : 'Sales'}:
          </span>{' '}
          {entry.dataKey === 'revenue' ? formatPKR(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function SalesTrendChart({
  data,
  title = 'Sales Trend',
  description = 'Monthly vehicle sales and revenue',
}: SalesTrendChartProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 py-4 sm:px-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-primary)"
                vertical={false}
              />
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
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#salesGradient)"
                activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            Sales count
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Revenue
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
