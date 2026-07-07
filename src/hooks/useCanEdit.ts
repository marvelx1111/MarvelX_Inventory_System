import { useAuth } from '@/contexts/AuthContext';

/** Admin can edit any record. */
export function useCanEdit(): boolean {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin;
}
