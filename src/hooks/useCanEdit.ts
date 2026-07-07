import { useAuth } from '@/contexts/AuthContext';

/** Admin (or users-module permission) can edit records. */
export function useCanEdit(): boolean {
  const { isAuthenticated, canEdit } = useAuth();
  return isAuthenticated && canEdit;
}
