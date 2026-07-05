import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionModule } from '@/types';
import {
  AuditLogPage,
  CustomerDetailPage,
  CustomersPage,
  DashboardPage,
  ExpensesPage,
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
import { UsersPage } from '@/pages/UsersPage';

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
          </Route>

          <Route element={<ProtectedRoute module="investors" />}>
            <Route path="investors" element={<InvestorsPage />} />
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
  );
}
