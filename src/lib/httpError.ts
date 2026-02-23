import { isAxiosError } from 'axios';

function extractMessage(data: unknown): string | string[] | undefined {
  if (typeof data !== 'object' || data === null) return undefined;

  const record = data as Record<string, unknown>;
  const message = record.message;
  if (typeof message === 'string' || Array.isArray(message)) {
    return message;
  }

  const error = record.error;
  if (typeof error === 'string' || Array.isArray(error)) {
    return error;
  }

  return undefined;
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const msg =
      extractMessage(err.response?.data) ??
      err.message ??
      'Something went wrong';

    return Array.isArray(msg) ? msg.join(', ') : String(msg);
  }

  return err instanceof Error ? err.message : 'Something went wrong';
}
