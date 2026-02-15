import { api } from './client';

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: { id: string; email: string; name: string } | null;
};

export type Paged<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
}) {
  const res = await api.get<Paged<AuditLog>>('/audit', { params });
  return res.data;
}
