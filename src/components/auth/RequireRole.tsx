import { Navigate } from 'react-router-dom';
import { authStore } from '@/features/auth/auth.store';
import type { JSX } from 'react';

export default function RequireRole({
  allow,
  children,
}: {
  allow: string[];
  children: JSX.Element;
}) {
  const user = authStore.getUser();
  if (!user) return <Navigate to="/login" replace />;
  const ok = allow.some(r => user.roles.includes(r));
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
