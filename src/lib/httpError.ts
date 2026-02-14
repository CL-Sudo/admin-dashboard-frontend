import type { AxiosError } from 'axios';

export function getErrorMessage(err: unknown): string {
  // Axios error
  const ax = err as AxiosError<any>;
  const msg =
    ax?.response?.data?.message ||
    ax?.response?.data?.error ||
    ax?.message ||
    'Something went wrong';
  if (Array.isArray(msg)) return msg.join(', ');
  return String(msg);
}
