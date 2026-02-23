import { Navigate } from 'react-router-dom';
import {
  authStore,
  isTokenExpired,
} from '@/features/auth/auth.store';
import type { JSX } from 'react';

export default function Protected({
  children,
}: {
  children: JSX.Element;
}) {
  const token = authStore.getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  if (isTokenExpired(token)) {
    void authStore.logout();
    return <Navigate to="/login" replace />;
  }
  return children;
}
