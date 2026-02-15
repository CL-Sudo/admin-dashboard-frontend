import { api } from './client';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutResponse = {
  success: boolean;
};

export async function login(email: string, password: string) {
  const res = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return res.data;
}

export function logout() {
  return api.post<LogoutResponse>('/auth/logout');
}
