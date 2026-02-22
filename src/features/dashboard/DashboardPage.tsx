import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAuditBreakdown,
  getAuditTrend,
  getCategoryCoverage,
  getDashboardKpis,
  getNeedsAttention,
  getProductStatus,
} from '@/api/dashboard';
import { getErrorMessage } from '@/lib/httpError';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import KpiCard from '@/components/dashboard/KpiCard';
import DataTable, {
  type ColumnDef,
} from '@/components/shared/DataTable';
import UserStatusBadge from '@/components/shared/UserStatusBadge';
import StatusBadge from '@/components/shared/StatusBadge';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';

type RangeDays = 7 | 30 | 90;

export default function DashboardPage() {
  const [days, setDays] = useState<RangeDays>(30);

  const kpisQ = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getDashboardKpis,
  });
  const trendQ = useQuery({
    queryKey: ['dashboard', 'audit-trend', days],
    queryFn: () => getAuditTrend(days),
  });
  const breakdownQ = useQuery({
    queryKey: ['dashboard', 'audit-breakdown', days],
    queryFn: () => getAuditBreakdown(days),
  });
  const prodStatusQ = useQuery({
    queryKey: ['dashboard', 'product-status'],
    queryFn: getProductStatus,
  });
  const catQ = useQuery({
    queryKey: ['dashboard', 'category-coverage'],
    queryFn: getCategoryCoverage,
  });
  const needsQ = useQuery({
    queryKey: ['dashboard', 'needs-attention'],
    queryFn: getNeedsAttention,
  });

  const statusDonutData = prodStatusQ.data ?? [];

  // Recharts requires a color per slice; you asked earlier "never specify colors" only applied to python charts.
  // Here we will avoid custom palettes: use default rendering by not setting fill per cell.
  // But Pie still needs something; omit <Cell> entirely to let defaults apply.
  const topCategories = catQ.data?.top ?? [];

  const missingImagesCols: ColumnDef<any>[] = [
    {
      header: 'Product',
      cell: p => (
        <Link to={`/products`} className="underline">
          {p.name}
        </Link>
      ),
    },
    {
      header: 'SKU',
      cell: p => <span className="font-mono text-xs">{p.sku}</span>,
    },
    { header: 'Status', cell: p => <StatusBadge value={p.status} /> },
    {
      header: 'Updated',
      cell: p => new Date(p.updatedAt).toLocaleString(),
    },
  ];

  const noCategoryCols: ColumnDef<any>[] = [
    {
      header: 'Product',
      cell: p => (
        <Link to={`/products`} className="underline">
          {p.name}
        </Link>
      ),
    },
    {
      header: 'SKU',
      cell: p => <span className="font-mono text-xs">{p.sku}</span>,
    },
    { header: 'Status', cell: p => <StatusBadge value={p.status} /> },
    {
      header: 'Updated',
      cell: p => new Date(p.updatedAt).toLocaleString(),
    },
  ];

  const disabledUsersCols: ColumnDef<any>[] = [
    {
      header: 'User',
      cell: u => (
        <Link to={`/users/${u.id}`} className="underline">
          {u.name}
        </Link>
      ),
    },
    {
      header: 'Email',
      cell: u => <span className="font-mono text-xs">{u.email}</span>,
    },
    {
      header: 'Status',
      cell: () => <UserStatusBadge status="DISABLED" />,
    },
    {
      header: 'Updated',
      cell: u => new Date(u.updatedAt).toLocaleString(),
    },
  ];

  const resetCols: ColumnDef<any>[] = [
    {
      header: 'User',
      cell: r => (
        <span className="font-medium">{r.user?.name ?? '-'}</span>
      ),
    },
    {
      header: 'Email',
      cell: r => (
        <span className="font-mono text-xs">
          {r.user?.email ?? '-'}
        </span>
      ),
    },
    {
      header: 'Created',
      cell: r => new Date(r.createdAt).toLocaleString(),
    },
    {
      header: 'Expires',
      cell: r => new Date(r.expiresAt).toLocaleString(),
    },
  ];

  const roleBarData = useMemo(() => {
    const roles = kpisQ.data?.users.roles ?? [];
    return roles.map(r => ({ role: r.role, count: r.count }));
  }, [kpisQ.data]);

  const productStatusSummary = useMemo(() => {
    const s = kpisQ.data?.products.status ?? {};
    const active = s['ACTIVE'] ?? 0;
    const draft = s['DRAFT'] ?? 0;
    const archived = s['ARCHIVED'] ?? 0;
    return { active, draft, archived };
  }, [kpisQ.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="text-sm opacity-70">
            Catalog health, admin activity, and security hygiene
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={String(days)}
            onValueChange={v => setDays(Number(v) as RangeDays)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* <Button asChild variant="outline">
            <Link to="/audit">View Audit Logs</Link>
          </Button> */}
        </div>
      </div>

      {/* KPI Row */}
      {kpisQ.isLoading ? (
        <div>Loading KPIs...</div>
      ) : kpisQ.error ? (
        <div className="text-red-500">
          {getErrorMessage(kpisQ.error)}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            title="Products (total)"
            value={kpisQ.data!.products.total}
          />
          <KpiCard
            title="Products missing image"
            value={kpisQ.data!.products.missingImage}
          />
          <KpiCard
            title="Products without category"
            value={kpisQ.data!.products.noCategory}
          />

          <KpiCard
            title="Users (active)"
            value={kpisQ.data!.users.active}
            subtitle={`Disabled: ${kpisQ.data!.users.disabled}`}
          />
          <KpiCard
            title="Users logged in (7d)"
            value={kpisQ.data!.users.loggedIn7d}
          />
          <KpiCard
            title="Dormant users (30d)"
            value={kpisQ.data!.users.dormant30d}
          />

          <KpiCard
            title="Active refresh sessions"
            value={kpisQ.data!.security.activeRefreshSessions}
          />
          <KpiCard
            title="Pending reset tokens"
            value={kpisQ.data!.security.pendingResetTokens}
            subtitle={`Expiring <24h: ${kpisQ.data!.security.resetTokensExpiring24h}`}
          />
        </div>
      )}

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Admin Activity Trend</CardTitle>
          <div className="text-sm opacity-70">
            Audit events per day (last {days} days)
          </div>
        </CardHeader>
        <CardContent className="h-[320px]">
          {trendQ.isLoading ? (
            <div>Loading trend...</div>
          ) : trendQ.error ? (
            <div className="text-red-500">
              {getErrorMessage(trendQ.error)}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendQ.data!.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickMargin={8} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Events"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Mid row: Breakdown + Product status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Audit Breakdown</CardTitle>
            <div className="text-sm opacity-70">
              Top actions in last {days} days
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {breakdownQ.isLoading ? (
              <div>Loading breakdown...</div>
            ) : breakdownQ.error ? (
              <div className="text-red-500">
                {getErrorMessage(breakdownQ.error)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownQ.data!.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Product Status</CardTitle>
            <div className="text-sm opacity-70">
              ACTIVE: {productStatusSummary.active} • DRAFT:{' '}
              {productStatusSummary.draft} • ARCHIVED:{' '}
              {productStatusSummary.archived}
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {prodStatusQ.isLoading ? (
              <div>Loading status...</div>
            ) : prodStatusQ.error ? (
              <div className="text-red-500">
                {getErrorMessage(prodStatusQ.error)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={statusDonutData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={70}
                    outerRadius={110}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category coverage + roles distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Category Coverage</CardTitle>
            <div className="text-sm opacity-70">
              Top categories by product count
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {catQ.isLoading ? (
              <div>Loading categories...</div>
            ) : catQ.error ? (
              <div className="text-red-500">
                {getErrorMessage(catQ.error)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickMargin={8} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="productCount" name="Products" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Role Distribution</CardTitle>
            <div className="text-sm opacity-70">Users per role</div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {kpisQ.isLoading ? (
              <div>Loading roles...</div>
            ) : kpisQ.error ? (
              <div className="text-red-500">
                {getErrorMessage(kpisQ.error)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" tickMargin={8} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Needs attention */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Needs Attention</CardTitle>
          <div className="text-sm opacity-70">
            Quick operational fixes
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {needsQ.isLoading ? (
            <div>Loading...</div>
          ) : needsQ.error ? (
            <div className="text-red-500">
              {getErrorMessage(needsQ.error)}
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="font-medium">
                    Products missing images
                  </div>
                  <DataTable
                    columns={missingImagesCols}
                    rows={needsQ.data!.missingImages}
                    keyFn={r => r.id}
                    emptyText="All products have images."
                  />
                </div>

                <div className="space-y-2">
                  <div className="font-medium">
                    Products without category
                  </div>
                  <DataTable
                    columns={noCategoryCols}
                    rows={needsQ.data!.noCategory}
                    keyFn={r => r.id}
                    emptyText="All products have categories."
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="font-medium">
                    Recently disabled users (7d)
                  </div>
                  <DataTable
                    columns={disabledUsersCols}
                    rows={needsQ.data!.recentlyDisabledUsers}
                    keyFn={r => r.id}
                    emptyText="No disabled users in the last 7 days."
                  />
                </div>

                <div className="space-y-2">
                  <div className="font-medium">
                    Pending password resets
                  </div>
                  <DataTable
                    columns={resetCols}
                    rows={needsQ.data!.pendingResets}
                    keyFn={r => r.id}
                    emptyText="No pending password reset tokens."
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
