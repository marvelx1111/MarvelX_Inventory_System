import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSource } from '@/contexts/DataContext';
import type { PermissionModule } from '@/types';

const AuditLogPage = lazy(() => import('@/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));
const CustomersPage = lazy(() => import('@/pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const FinancePage = lazy(() => import('@/pages/FinancePage').then((m) => ({ default: m.FinancePage })));
const InventoryPage = lazy(() => import('@/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const InvestorsPage = lazy(() => import('@/pages/InvestorsPage').then((m) => ({ default: m.InvestorsPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const PPFExpensesPage = lazy(() => import('@/pages/PPFExpensesPage').then((m) => ({ default: m.PPFExpensesPage })));
const PPFJobDetailPage = lazy(() => import('@/pages/PPFJobDetailPage').then((m) => ({ default: m.PPFJobDetailPage })));
const PPFJobsPage = lazy(() => import('@/pages/PPFJobsPage').then((m) => ({ default: m.PPFJobsPage })));
const PPFRollsPage = lazy(() => import('@/pages/PPFRollsPage').then((m) => ({ default: m.PPFRollsPage })));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage').then((m) => ({ default: m.PurchasesPage })));
const SaleCreatePage = lazy(() => import('@/pages/SaleCreatePage').then((m) => ({ default: m.SaleCreatePage })));
const SaleDetailPage = lazy(() => import('@/pages/SaleDetailPage').then((m) => ({ default: m.SaleDetailPage })));
const SalesPage = lazy(() => import('@/pages/SalesPage').then((m) => ({ default: m.SalesPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage })));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

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

function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
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
        <Suspense fallback={<RouteLoadingFallback />}>
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

                <Route element={<AdminRoute />}>
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
        </Suspense>
      </DataReadyGate>
    </AuthReadyGate>
  );
}
