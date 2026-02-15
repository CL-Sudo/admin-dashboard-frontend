import LoginPage from '@/features/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import Protected from '@/components/auth/Protected';
import RequireRole from '@/components/auth/RequireRole';
import { createBrowserRouter } from 'react-router-dom';
import ProductsPage from '@/features/products/ProductsPage';
import CategoriesPage from '@/features/categories/CategoriesPage';
import AuditLogsPage from '@/features/audit/AuditLogsPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'products',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF', 'VIEWER']}>
            <ProductsPage />
          </RequireRole>
        ),
      },
      {
        path: 'categories',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF', 'VIEWER']}>
            <CategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF']}>
            <AuditLogsPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
