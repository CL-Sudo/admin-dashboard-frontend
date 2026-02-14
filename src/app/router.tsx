import { createBrowserRouter, Navigate } from 'react-router-dom';
import { tokenStorage } from '@/lib/storage';
import type { JSX } from 'react';
import LoginPage from '@/features/auth/LoginPage';

function Protected({ children }: { children: JSX.Element }) {
  const token = tokenStorage.getAccess();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <h1>Protected Route</h1>
      </Protected>
    ),
    children: [
      { index: true, element: <h1>Dashboard page</h1> },
      { path: 'products', element: <h1>Products page</h1> },
    ],
  },
  { path: '*', element: <h1>Not Found page</h1> },
]);
