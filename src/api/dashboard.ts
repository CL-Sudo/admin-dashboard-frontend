import { api } from './client';

export type Metrics = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalCategories: number;
  productsCreatedLast7Days: number;
};

export type Activity = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: { email: string; name: string } | null;
};

export async function getMetrics() {
  const res = await api.get<Metrics>('/dashboard/metrics');
  return res.data;
}

export async function getActivity(limit = 10) {
  const res = await api.get<Activity[]>('/dashboard/activity', {
    params: { limit },
  });
  return res.data;
}
