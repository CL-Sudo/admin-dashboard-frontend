import { api } from './client';

export type DashboardKpis = {
  products: {
    total: number;
    missingImage: number;
    noCategory: number;
    status: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    disabled: number;
    loggedIn7d: number;
    dormant30d: number;
    roles: Array<{ role: string; count: number }>;
  };
  security: {
    activeRefreshSessions: number;
    pendingResetTokens: number;
    resetTokensExpiring24h: number;
  };
};

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

export async function getDashboardKpis() {
  const res = await api.get<DashboardKpis>('/dashboard/kpis');
  return res.data;
}

export async function getAuditTrend(days: number) {
  const res = await api.get<{
    from: string;
    days: number;
    data: Array<{ day: string; count: number }>;
  }>('/dashboard/audit-trend', { params: { days } });
  return res.data;
}

export async function getAuditBreakdown(days: number) {
  const res = await api.get<{
    from: string;
    days: number;
    data: Array<{ action: string; count: number }>;
  }>('/dashboard/audit-breakdown', { params: { days } });
  return res.data;
}

export async function getProductStatus() {
  const res = await api.get<Array<{ status: string; count: number }>>(
    '/dashboard/product-status'
  );
  return res.data;
}

export async function getCategoryCoverage() {
  const res = await api.get<{
    top: Array<{
      categoryId: string;
      name: string;
      productCount: number;
    }>;
    all: Array<{
      categoryId: string;
      name: string;
      productCount: number;
    }>;
    zeroCategories: Array<{
      categoryId: string;
      name: string;
      productCount: number;
    }>;
  }>('/dashboard/category-coverage');
  return res.data;
}

export async function getNeedsAttention() {
  const res = await api.get<{
    missingImages: Array<{
      id: string;
      name: string;
      sku: string;
      status: string;
      updatedAt: string;
    }>;
    noCategory: Array<{
      id: string;
      name: string;
      sku: string;
      status: string;
      updatedAt: string;
    }>;
    recentlyDisabledUsers: Array<{
      id: string;
      email: string;
      name: string;
      updatedAt: string;
    }>;
    pendingResets: Array<{
      id: string;
      userId: string;
      createdAt: string;
      expiresAt: string;
      user: { email: string; name: string };
    }>;
  }>('/dashboard/needs-attention');
  return res.data;
}
