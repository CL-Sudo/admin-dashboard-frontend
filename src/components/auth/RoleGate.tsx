import { authStore } from '@/features/auth/auth.store';

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const user = authStore.getUser();
  if (!user) return fallback;
  const ok = allow.some(r => user.roles.includes(r));
  return ok ? children : fallback;
}
