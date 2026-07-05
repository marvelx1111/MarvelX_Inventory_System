import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { usePermission } from '@/contexts/AuthContext';
import { store } from '@/data/store';
import type { Permission, Role, User } from '@/types';
import { cn, getInitials } from '@/utils/format';

interface UserRow extends User {
  roleName: string;
  roleDescription: string;
  permissions: Permission[];
}

interface RoleRow extends Role {
  permissions: Permission[];
  userCount: number;
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
      {getInitials(name)}
    </div>
  );
}

function AccessDenied() {
  return (
    <Card padding="none">
      <EmptyState
        title="Access restricted"
        description="You need user management permissions to view this page. Contact your administrator."
        icon={
          <svg
            className="h-16 w-16 text-[var(--text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        }
      />
    </Card>
  );
}

function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--border-primary)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">User</th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Role</th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
              <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <motion.tr
                key={user.user_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="border-b border-[var(--border-secondary)] last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.full_name} />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        @{user.username} · {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{user.roleName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{user.roleDescription}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={user.status === 'active' ? 'success' : 'default'}
                    dot={user.status === 'active'}
                  >
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.map((perm) => (
                      <Badge key={perm.permission_id} variant="accent" className="text-[10px]">
                        {perm.module}
                      </Badge>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {users.map((user, index) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <UserAvatar name={user.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">@{user.username}</p>
                    </div>
                    <Badge
                      variant={user.status === 'active' ? 'success' : 'default'}
                      dot={user.status === 'active'}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{user.email}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {user.roleName}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{user.roleDescription}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {user.permissions.map((perm) => (
                      <Badge key={perm.permission_id} variant="accent" className="text-[10px]">
                        {perm.module}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function RolesPanel({ roles }: { roles: RoleRow[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {roles.map((role, index) => (
        <motion.div
          key={role.role_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{role.role_name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <Badge variant="default">{role.userCount} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                Permissions ({role.permissions.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((perm) => (
                  <Badge key={perm.permission_id} variant="info">
                    {perm.permission_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function PermissionsPanel({ permissions }: { permissions: Permission[] }) {
  const byModule = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.module]) groups[perm.module] = [];
      groups[perm.module].push(perm);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {byModule.map(([module, perms], index) => (
        <motion.div
          key={module}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          <Card padding="sm">
            <p className="mb-2 text-sm font-semibold capitalize text-[var(--text-primary)]">
              {module}
            </p>
            <ul className="space-y-1">
              {perms.map((perm) => (
                <li
                  key={perm.permission_id}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs text-[var(--text-secondary)]',
                    'bg-[var(--bg-tertiary)]',
                  )}
                >
                  {perm.permission_name}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function UsersPage() {
  const canManageUsers = usePermission('users');
  const [loading, setLoading] = useState(true);

  const { users, roles, permissions } = useMemo(() => {
    const allRoles = store.getRoles();
    const allPermissions = store.getPermissions();
    const rolePermissions = store.getRolePermissions();
    const allUsers = store.getUsers();

    const getRolePermissions = (roleId: string): Permission[] => {
      const permIds = rolePermissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => rp.permission_id);
      return allPermissions.filter((p) => permIds.includes(p.permission_id));
    };

    const userRows: UserRow[] = allUsers.map((user) => {
      const role = allRoles.find((r) => r.role_id === user.role_id);
      return {
        ...user,
        roleName: role?.role_name ?? 'Unassigned',
        roleDescription: role?.description ?? '',
        permissions: getRolePermissions(user.role_id),
      };
    });

    const roleRows: RoleRow[] = allRoles.map((role) => ({
      ...role,
      permissions: getRolePermissions(role.role_id),
      userCount: allUsers.filter((u) => u.role_id === role.role_id).length,
    }));

    return { users: userRows, roles: roleRows, permissions: allPermissions };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  if (!canManageUsers) {
    return (
      <div>
        <PageHeader title="Users & Roles" subtitle="Team access and permissions" />
        <AccessDenied />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Users & Roles" subtitle="Team access and permissions" />
        <UsersSkeleton />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Users & Roles"
        subtitle={`${users.length} team members · ${roles.length} roles · read-only view`}
      />

      <Tabs defaultValue="users">
        <TabsList className="mb-6 w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {users.length === 0 ? (
            <Card padding="none">
              <EmptyState title="No users found" description="User accounts will appear here." />
            </Card>
          ) : (
            <UsersTable users={users} />
          )}
        </TabsContent>

        <TabsContent value="roles">
          {roles.length === 0 ? (
            <Card padding="none">
              <EmptyState title="No roles defined" description="System roles will appear here." />
            </Card>
          ) : (
            <RolesPanel roles={roles} />
          )}
        </TabsContent>

        <TabsContent value="permissions">
          {permissions.length === 0 ? (
            <Card padding="none">
              <EmptyState
                title="No permissions defined"
                description="Permission modules will appear here."
              />
            </Card>
          ) : (
            <PermissionsPanel permissions={permissions} />
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
