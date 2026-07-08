import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditRecordModal, type EditFieldConfig } from '@/components/ui/EditRecordModal';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ADMIN_ROLE_ID, useAuth, usePermission } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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

const NEW_USER_DEFAULTS: Record<string, string> = {
  full_name: '',
  username: '',
  email: '',
  phone: '',
  role_id: '',
  status: 'active',
};

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

function UsersTable({
  users,
  isAdmin,
  currentUserId,
  onDelete,
}: {
  users: UserRow[];
  isAdmin: boolean;
  currentUserId?: string;
  onDelete: (user: UserRow) => void;
}) {
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
              {isAdmin && (
                <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">
                  Actions
                </th>
              )}
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
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user)}
                      disabled={user.user_id === currentUserId}
                      className="text-danger hover:text-danger"
                    >
                      Delete
                    </Button>
                  </td>
                )}
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
                  {isAdmin && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user)}
                        disabled={user.user_id === currentUserId}
                        className="text-danger hover:text-danger"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function RolesPanel({
  roles,
  isAdmin,
  onEditPermissions,
}: {
  roles: RoleRow[];
  isAdmin: boolean;
  onEditPermissions: (role: RoleRow) => void;
}) {
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
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-[var(--text-tertiary)]">No access granted</span>
                ) : (
                  role.permissions.map((perm) => (
                    <Badge key={perm.permission_id} variant="info">
                      {perm.permission_name}
                    </Badge>
                  ))
                )}
              </div>
              {isAdmin && (
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={() => onEditPermissions(role)}>
                    Edit access
                  </Button>
                </div>
              )}
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

function RolePermissionsModal({
  role,
  permissions,
  currentPermissionIds,
  saving,
  onClose,
  onSave,
}: {
  role: RoleRow | null;
  permissions: Permission[];
  currentPermissionIds: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (permissionIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set(currentPermissionIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role?.role_id]);

  const byModule = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.module]) groups[perm.module] = [];
      groups[perm.module].push(perm);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const toggle = (permissionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  return (
    <Modal
      open={role !== null}
      onClose={onClose}
      title={role ? `Edit access — ${role.role_name}` : 'Edit access'}
      description="Toggle the modules this role can access. Changes sync to Supabase immediately."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave([...selected])} loading={saving}>
            Save access
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {byModule.map(([module, perms]) => (
          <div key={module} className="rounded-lg border border-[var(--border-primary)] p-3">
            <p className="mb-2 text-sm font-semibold capitalize text-[var(--text-primary)]">
              {module}
            </p>
            <ul className="space-y-1.5">
              {perms.map((perm) => (
                <li key={perm.permission_id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={selected.has(perm.permission_id)}
                      onChange={() => toggle(perm.permission_id)}
                      className="h-4 w-4 rounded border-[var(--border-primary)] text-accent focus:ring-accent"
                    />
                    {perm.permission_name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function UsersPage() {
  const canManageUsers = usePermission('users');
  const { isAdmin, user: currentUser } = useAuth();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleRow | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    return store.subscribe(() => setRefreshKey((n) => n + 1));
  }, []);

  const { users, roles, permissions } = useMemo(() => {
    void refreshKey;
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
  }, [refreshKey]);

  const userFields = useMemo<EditFieldConfig[]>(
    () => [
      { key: 'full_name', label: 'Full name', required: true },
      { key: 'username', label: 'Username', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel' },
      {
        key: 'role_id',
        label: 'Role',
        type: 'select',
        required: true,
        options: roles.map((r) => ({ value: r.role_id, label: r.role_name })),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
    [roles],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCreateUser = async (values: Record<string, string>) => {
    if (store.isUsernameTaken(values.username)) {
      error('Username taken', 'Choose a different username.');
      return;
    }
    setSavingUser(true);
    try {
      const created = await store.createUser({
        full_name: values.full_name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        role_id: values.role_id,
        status: (values.status as User['status']) || 'active',
      });
      store.addAuditLog({
        user_id: currentUser?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'app_users',
        record_id: created.user_id,
        ip_address: '127.0.0.1',
      });
      setAddOpen(false);
      success('User added', `${created.full_name} can be granted login access via the auth bootstrap.`);
    } catch (err) {
      error('Could not add user', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (target: UserRow) => {
    if (target.user_id === currentUser?.user_id) {
      error('Cannot delete', 'You cannot delete your own account.');
      return;
    }
    const isTargetAdmin = target.role_id === ADMIN_ROLE_ID || target.roleName === 'Admin';
    if (isTargetAdmin) {
      const adminCount = users.filter(
        (u) => u.role_id === ADMIN_ROLE_ID || u.roleName === 'Admin',
      ).length;
      if (adminCount <= 1) {
        error('Cannot delete', 'At least one admin must remain.');
        return;
      }
    }
    if (!window.confirm(`Delete ${target.full_name}? This cannot be undone.`)) return;

    try {
      await store.deleteUser(target.user_id);
      store.addAuditLog({
        user_id: currentUser?.user_id ?? 'usr_001',
        action: 'DELETE',
        table_name: 'app_users',
        record_id: target.user_id,
        ip_address: '127.0.0.1',
      });
      info('User removed', `${target.full_name} was deleted.`);
    } catch (err) {
      error('Could not delete user', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleSaveRolePermissions = async (permissionIds: string[]) => {
    if (!roleToEdit) return;
    setSavingRole(true);
    try {
      await store.setRolePermissions(roleToEdit.role_id, permissionIds);
      store.addAuditLog({
        user_id: currentUser?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'role_permissions',
        record_id: roleToEdit.role_id,
        ip_address: '127.0.0.1',
      });
      success('Access updated', `${roleToEdit.role_name} permissions saved.`);
      setRoleToEdit(null);
    } catch (err) {
      error('Could not update access', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingRole(false);
    }
  };

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
        subtitle={`${users.length} team members · ${roles.length} roles${isAdmin ? '' : ' · read-only view'}`}
        actions={
          isAdmin ? (
            <Button onClick={() => setAddOpen(true)}>+ Add user</Button>
          ) : undefined
        }
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
            <UsersTable
              users={users}
              isAdmin={isAdmin}
              currentUserId={currentUser?.user_id}
              onDelete={handleDeleteUser}
            />
          )}
        </TabsContent>

        <TabsContent value="roles">
          {roles.length === 0 ? (
            <Card padding="none">
              <EmptyState title="No roles defined" description="System roles will appear here." />
            </Card>
          ) : (
            <RolesPanel roles={roles} isAdmin={isAdmin} onEditPermissions={setRoleToEdit} />
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

      <EditRecordModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add user"
        description="Create a team member profile. Grant login access afterwards via the auth bootstrap."
        fields={userFields}
        values={NEW_USER_DEFAULTS}
        onSave={handleCreateUser}
        saving={savingUser}
        saveLabel="Add user"
      />

      <RolePermissionsModal
        role={roleToEdit}
        permissions={permissions}
        currentPermissionIds={
          roleToEdit ? roleToEdit.permissions.map((p) => p.permission_id) : []
        }
        saving={savingRole}
        onClose={() => setRoleToEdit(null)}
        onSave={handleSaveRolePermissions}
      />
    </motion.div>
  );
}
