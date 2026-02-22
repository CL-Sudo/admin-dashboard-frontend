import LoginPage from '@/features/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import Protected from '@/components/auth/Protected';
import RequireRole from '@/components/auth/RequireRole';
import { createBrowserRouter } from 'react-router-dom';
import ProductsPage from '@/features/products/ProductsPage';
import CategoriesPage from '@/features/categories/CategoriesPage';
import AuditLogsPage from '@/features/audit/AuditLogsPage';
// import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UserPage from '@/features/users/UserPage';
import UserDetailPage from '@/features/users/UserDetailPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ProductDetailPage from '@/features/products/ProductDetailPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: (
          <RequireRole allow={['ADMIN', 'STAFF']}>
            <DashboardPage />
          </RequireRole>
        ),
      },
      // { path: '', element: <DashboardPage /> }, // or "/dashboard"
      // { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'users',
        element: (
          <RequireRole allow={['ADMIN']}>
            <UserPage />
          </RequireRole>
        ),
      },
      { path: 'users/:id', element: <UserDetailPage /> },
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
      { path: 'products/:id', element: <ProductDetailPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
