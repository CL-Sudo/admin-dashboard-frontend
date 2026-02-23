const getRequiredEnv = (name: string): string => {
  const value = import.meta.env[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
};
