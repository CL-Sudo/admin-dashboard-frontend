import LoginPage from '@/features/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import Protected from '@/components/auth/Protected';
import RequireRole from '@/components/auth/RequireRole';
import { createBrowserRouter } from 'react-router-dom';

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
      { index: true, element: <h1>Dashboard Page</h1> },
      {
        path: 'products',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF', 'VIEWER']}>
            {/* <ProductsPage /> */}
            <h1>Products Page</h1>
          </RequireRole>
        ),
      },
      {
        path: 'categories',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF', 'VIEWER']}>
            {/* <CategoriesPage /> */}
            <h1>Categories Page</h1>
          </RequireRole>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RequireRole allow={['ADMIN', 'STAFF']}>
            {/* <AuditLogsPage /> */}
            <h1>Audit Logs Page</h1>
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <h1>404 Not Found</h1> },
]);
