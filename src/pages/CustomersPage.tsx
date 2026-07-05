import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { store } from '@/data/store';
import type { Customer, CustomerType } from '@/types';
import { formatCNIC, getInitials } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const TYPE_VARIANT: Record<CustomerType, 'default' | 'info' | 'accent'> = {
  individual: 'default',
  dealer: 'info',
  corporate: 'accent',
};

const TYPE_LABEL: Record<CustomerType, string> = {
  individual: 'Individual',
  dealer: 'Dealer',
  corporate: 'Corporate',
};

export function CustomersPage() {
  const loading = usePageLoading();
  const [search, setSearch] = useState('');

  const customers = store.getCustomers();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.cnic.includes(q) ||
        c.mobile.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [customers, search]);

  if (loading) {
    return (
      <PageTransition>
        <SkeletonCard />
        <div className="mt-4 space-y-3">
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
        title="Customers"
        subtitle={`${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`}
      />

      <SearchInput
        placeholder="Search by name, CNIC, mobile, city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        containerClassName="mb-6 max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={search ? 'Try a different search term.' : 'Customers will appear here once added.'}
          action={search ? { label: 'Clear search', onClick: () => setSearch('') } : undefined}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((customer) => (
              <CustomerRow key={customer.customer_id} customer={customer} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageTransition>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <Link to={`/customers/${customer.customer_id}`}>
        <Card hoverLift padding="md">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              {getInitials(customer.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">{customer.full_name}</span>
                <Badge variant={TYPE_VARIANT[customer.customer_type]}>
                  {TYPE_LABEL[customer.customer_type]}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                {customer.mobile} · {formatCNIC(customer.cnic)} · {customer.city}
              </p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
