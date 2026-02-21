import { api } from './client';

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actorUserId?: string | null;
  metadata?: any;
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
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: 'createdAt';
  order?: 'asc' | 'desc';
}) {
  const res = await api.get<Paged<AuditLog>>('/audit', { params });
  return res.data;
}
