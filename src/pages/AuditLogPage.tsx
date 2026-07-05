import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePermission } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { AuditLog } from '@/types';
import { formatDate } from '@/utils/format';

interface AuditLogRow extends AuditLog {
  userName: string;
  userUsername: string;
}

import type { BadgeVariant } from '@/components/ui/Badge';

const ACTION_VARIANT: Record<string, BadgeVariant> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'info',
  VIEW: 'default',
};

function actionBadgeVariant(action: string): BadgeVariant {
  return ACTION_VARIANT[action] ?? 'accent';
}

function AuditSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card padding="none">
      <EmptyState
        title="Access restricted"
        description="You need audit log permissions to view system activity."
      />
    </Card>
  );
}

function AuditTable({ logs }: { logs: AuditLogRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border-primary)] lg:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Timestamp</th>
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">User</th>
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Action</th>
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Table</th>
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Record</th>
            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">IP</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {logs.map((log, index) => (
              <motion.tr
                key={log.log_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className="border-b border-[var(--border-secondary)] last:border-0"
              >
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {formatDate(log.timestamp, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{log.userName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">@{log.userUsername}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={actionBadgeVariant(log.action)}>{log.action}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                  {log.table_name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">
                  {log.record_id}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                  {log.ip_address}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

function AuditCards({ logs }: { logs: AuditLogRow[] }) {
  return (
    <div className="space-y-3 lg:hidden">
      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => (
          <motion.div
            key={log.log_id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: Math.min(index * 0.03, 0.2) }}
          >
            <Card padding="sm">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={actionBadgeVariant(log.action)}>{log.action}</Badge>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {formatDate(log.timestamp, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{log.userName}</p>
              <p className="text-xs text-[var(--text-secondary)]">@{log.userUsername}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--text-tertiary)]">Table</span>
                  <p className="font-mono text-[var(--text-primary)]">{log.table_name}</p>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)]">Record</span>
                  <p className="font-mono text-[var(--text-primary)]">{log.record_id}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--text-tertiary)]">IP address</span>
                  <p className="font-mono text-[var(--text-secondary)]">{log.ip_address}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function AuditLogPage() {
  const canViewAudit = usePermission('audit');
  const { info } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { logs, actions, tables, userOptions } = useMemo(() => {
    const users = store.getUsers();
    const rawLogs = store.getAuditLogs();

    const enriched: AuditLogRow[] = rawLogs.map((log) => {
      const user = users.find((u) => u.user_id === log.user_id);
      return {
        ...log,
        userName: user?.full_name ?? 'Unknown',
        userUsername: user?.username ?? 'unknown',
      };
    });

    const actions = [...new Set(enriched.map((l) => l.action))].sort();
    const tables = [...new Set(enriched.map((l) => l.table_name))].sort();
    const userOptions = users.map((u) => ({
      value: u.user_id,
      label: `${u.full_name} (@${u.username})`,
    }));

    return { logs: enriched, actions, tables, userOptions };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (tableFilter && log.table_name !== tableFilter) return false;
      if (userFilter && log.user_id !== userFilter) return false;
      return true;
    });
  }, [logs, actionFilter, tableFilter, userFilter]);

  const hasFilters = Boolean(actionFilter || tableFilter || userFilter);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const clearFilters = () => {
    setActionFilter('');
    setTableFilter('');
    setUserFilter('');
    info('Filters cleared', 'Showing all audit log entries.');
  };

  if (!canViewAudit) {
    return (
      <div>
        <PageHeader title="Audit Log" subtitle="System activity trail" />
        <AccessDenied />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Audit Log" subtitle="System activity trail" />
        <AuditSkeleton />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Audit Log"
        subtitle={`${filteredLogs.length} of ${logs.length} entries`}
        actions={
          hasFilters ? (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6" padding="md">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="All actions"
            options={actions.map((action) => ({ value: action, label: action }))}
          />
          <Select
            label="Table"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder="All tables"
            options={tables.map((table) => ({ value: table, label: table }))}
          />
          <Select
            label="User"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="All users"
            options={userOptions}
          />
        </div>
      </Card>

      {filteredLogs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title={hasFilters ? 'No matching entries' : 'No audit logs yet'}
            description={
              hasFilters
                ? 'Try adjusting your filters to see more results.'
                : 'System activity will be recorded here.'
            }
            action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
          />
        </Card>
      ) : (
        <>
          <AuditTable logs={filteredLogs} />
          <AuditCards logs={filteredLogs} />
        </>
      )}
    </motion.div>
  );
}
