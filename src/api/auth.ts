import { api } from './client';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string) {
  const res = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return res.data;
}
