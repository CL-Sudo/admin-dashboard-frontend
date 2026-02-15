import { logout } from '@/api/auth';
import { tokenStorage } from '@/lib/storage';

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  exp?: number;
  iat?: number;
};

function base64UrlDecode(input: string) {
  // base64url -> base64
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '='
  );
  const json = atob(padded);
  return JSON.parse(json);
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return base64UrlDecode(parts[1]) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  const exp = payload?.exp;
  if (!exp) return false; // if missing exp, treat as non-expiring (or flip to true if you want strict)
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= exp;
}

export const authStore = {
  getAccessToken: () => tokenStorage.getAccess(),
  getRefreshToken: () => tokenStorage.getRefresh(),
  getUser: () => {
    const token = tokenStorage.getAccess();
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload) return null;
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
    };
  },
  hasRole: (role: string) => {
    const u = authStore.getUser();
    return !!u?.roles?.includes(role);
  },
  logout: async () => {
    try {
      await logout();
      tokenStorage.clear();
    } catch (error) {
      throw error;
    }
  },
};
