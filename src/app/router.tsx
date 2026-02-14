import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import Protected from '@/features/auth/Protected';

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
