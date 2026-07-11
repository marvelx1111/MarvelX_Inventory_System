import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  CUSTOMER_CREATE_DEFAULT_VALUES,
  CUSTOMER_EDIT_FIELDS,
  parseCustomerFormValues,
} from '@/config/edit-fields';
import { useAuth, usePermission } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const canManageCustomers = usePermission('customers');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  void refreshKey;

  const customers = store.getSelectableCustomers();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.cnic.includes(q) ||
        c.mobile.includes(q) ||
        c.whatsapp.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const handleCreate = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      const created = await store.createCustomer(parseCustomerFormValues(values));
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'customers',
        record_id: created.customer_id,
        ip_address: '127.0.0.1',
      });
      success('Customer added', `${created.full_name} was saved successfully.`);
      setCreateOpen(false);
      setRefreshKey((k) => k + 1);
      navigate(`/customers/${created.customer_id}`);
    } catch (err) {
      error('Could not add customer', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

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
        actions={
          canManageCustomers ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              + Add customer
            </Button>
          ) : undefined
        }
      />

      <SearchInput
        placeholder="Search by name, CNIC, mobile, city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        containerClassName="no-print mb-6 max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
          action={
            search
              ? { label: 'Clear search', onClick: () => setSearch('') }
              : canManageCustomers
                ? { label: 'Add customer', onClick: () => setCreateOpen(true) }
                : undefined
          }
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

      <EditRecordModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add customer"
        description="Fill in all contact fields — WhatsApp and address are in the section below Mobile."
        fields={CUSTOMER_EDIT_FIELDS}
        values={CUSTOMER_CREATE_DEFAULT_VALUES}
        onSave={handleCreate}
        saving={saving}
        size="xl"
        saveLabel="Add customer"
      />
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
