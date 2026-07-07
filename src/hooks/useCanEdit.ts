import { useAuth } from '@/contexts/AuthContext';

/** Admin can edit any record. */
export function useCanEdit(): boolean {
  const { isAdmin, hasPermission } = useAuth();
  return isAdmin || hasPermission('users');
}
