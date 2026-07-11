const routePreloaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/DashboardPage'),
  '/inventory': () => import('@/pages/InventoryPage'),
  '/purchases': () => import('@/pages/PurchasesPage'),
  '/sales': () => import('@/pages/SalesPage'),
  '/customers': () => import('@/pages/CustomersPage'),
  '/expenses': () => import('@/pages/ExpensesPage'),
  '/investors': () => import('@/pages/InvestorsPage'),
  '/finance': () => import('@/pages/FinancePage'),
  '/ppf': () => import('@/pages/PPFJobsPage'),
  '/users': () => import('@/pages/UsersPage'),
  '/audit': () => import('@/pages/AuditLogPage'),
};

const preloadedRoutes = new Set<string>();

export function preloadRoute(path: string): void {
  const preload = routePreloaders[path];
  if (!preload || preloadedRoutes.has(path)) return;
  preloadedRoutes.add(path);
  void preload().catch(() => {
    preloadedRoutes.delete(path);
  });
}
