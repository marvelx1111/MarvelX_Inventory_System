import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSource } from '@/contexts/DataContext';
import type { PermissionModule } from '@/types';
import {
  AuditLogPage,
  CustomerDetailPage,
  CustomersPage,
  DashboardPage,
  ExpensesPage,
  FinancePage,
  InventoryPage,
  InvestorsPage,
  LoginPage,
  PurchasesPage,
  SaleCreatePage,
  SaleDetailPage,
  SalesPage,
  VehicleDetailPage,
} from '@/pages';
import { PPFJobDetailPage } from '@/pages/PPFJobDetailPage';
import { PPFJobsPage } from '@/pages/PPFJobsPage';
import { PPFRollsPage } from '@/pages/PPFRollsPage';
import { PPFExpensesPage } from '@/pages/PPFExpensesPage';
import { UsersPage } from '@/pages/UsersPage';

function AuthReadyGate({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuth();
  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-[var(--text-secondary)]">Checking session...</p>
        </div>
      </div>
    );
  }
  return children;
}

function DataReadyGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { status } = useDataSource();
  if (!isAuthenticated) return children;
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-[var(--text-secondary)]">Loading Marvel X...</p>
        </div>
      </div>
    );
  }
  return children;
}

function ProtectedRoute({ module }: { module?: PermissionModule }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (module && !hasPermission(module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthReadyGate>
      <DataReadyGate>
      <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute module="dashboard" />}>
            <Route index element={<DashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute module="inventory" />}>
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/:id" element={<VehicleDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute module="purchases" />}>
            <Route path="purchases" element={<PurchasesPage />} />
          </Route>

          <Route element={<ProtectedRoute module="sales" />}>
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales/new" element={<SaleCreatePage />} />
            <Route path="sales/:id" element={<SaleDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute module="customers" />}>
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute module="expenses" />}>
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="ppf/expenses" element={<PPFExpensesPage />} />
          </Route>

          <Route element={<ProtectedRoute module="investors" />}>
            <Route path="investors" element={<InvestorsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="finance" />}>
            <Route path="finance" element={<FinancePage />} />
          </Route>

          <Route element={<ProtectedRoute module="ppf" />}>
            <Route path="ppf" element={<PPFJobsPage />} />
            <Route path="ppf/jobs/:jobId" element={<PPFJobDetailPage />} />
            <Route path="ppf/rolls" element={<PPFRollsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="users" />}>
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route element={<ProtectedRoute module="audit" />}>
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </DataReadyGate>
    </AuthReadyGate>
  );
}
