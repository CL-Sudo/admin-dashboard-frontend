import axios from 'axios';
import { env } from '@/lib/env';
import { tokenStorage } from '@/lib/storage';
import { authEvents } from '@/features/auth/auth.events';

// Study: https://gemini.google.com/share/a2e1921c7d96
// Refined Version: https://gemini.google.com/share/42c29a12e90a

export const api = axios.create({
  baseURL: env.apiBaseUrl,
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

api.interceptors.request.use(config => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// response interceptor takes two arguments: a success handler and an error handler.
api.interceptors.response.use(
  // If the API returns a 200 OK or 201 Created, the interceptor does nothing
  res => res,
  async error => {
    const original = error.config;
    const status = error.response?.status;

    // check if the status is 401 or the request has already been retried
    if (status !== 401 || original?._retry) throw error;
    original._retry = true; // mark the request as retried

    // "Is there a way to save this session? No? Then blow it all up and log the user out."
    const refresh = tokenStorage.getRefresh();
    // the missing refresh token implies that:
    // 1. The user never logged in
    // 2. the user manually cleared their browser data
    // 3. the session expired long enough ago that both tokens are now invalid
    if (!refresh) {
      tokenStorage.clear(); // ensure no stale tokens remain
      throw error; // stop the interceptor from trying to refresh.
    }

    // If a token refresh request is already in progress, wait for it to complete
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push(token => {
          if (!token) return reject(error);
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    isRefreshing = true;

    try {
      const r = await axios.post(`${env.apiBaseUrl}/auth/refresh`, {
        refreshToken: refresh,
      });
      const newAccess = r.data.accessToken as string;
      const newRefresh = r.data.refreshToken as string;

      tokenStorage.setAccess(newAccess);
      tokenStorage.setRefresh(newRefresh);

      queue.forEach(fn => fn(newAccess));
      queue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      queue.forEach(fn => fn(null));
      queue = [];
      authEvents.emitLogout();
      tokenStorage.clear();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);
