import { api } from './client';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutResponse = {
  success: boolean;
};

export type ResetPasswordInput = {
  resetToken: string;
  newPassword: string;
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

export async function resetPassword(input: ResetPasswordInput) {
  const res = await api.post<{ success: true }>(
    '/auth/reset-password',
    input
  );
  return res.data;
}
