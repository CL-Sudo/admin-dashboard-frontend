import { useQuery } from '@tanstack/react-query';
import { getActivity, getMetrics } from '@/api/dashboard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  const metricsQ = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getMetrics,
  });
  const activityQ = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => getActivity(10),
  });

  const m = metricsQ.data;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold">Dashboard</div>
        <div className="text-sm opacity-70">Overview & activity</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {m?.totalProducts ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Products</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {m?.activeProducts ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Created (7d)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {m?.productsCreatedLast7Days ?? '—'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activityQ.isLoading && <div>Loading...</div>}
          {activityQ.data?.map(a => (
            <div
              key={a.id}
              className="border rounded p-3 flex justify-between"
            >
              <div>
                <div className="font-medium">{a.action}</div>
                <div className="text-sm opacity-70">
                  {a.actor?.email ?? 'System'} • {a.entityType}{' '}
                  {a.entityId ? `• ${a.entityId}` : ''}
                </div>
              </div>
              <div className="text-sm opacity-70">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {activityQ.data?.length === 0 && !activityQ.isLoading && (
            <div className="opacity-70">No recent activity.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
