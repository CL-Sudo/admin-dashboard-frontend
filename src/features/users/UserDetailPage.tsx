import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getUser, setUserStatus, type UserStatus } from '@/api/users';
import { getAuditLogs } from '@/api/audit';
import { usersKeys } from './users.keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/httpError';
import { RoleGate } from '@/components/auth/RoleGate';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DataTable, {
  type ColumnDef,
} from '@/components/shared/DataTable';
import RoleBadges from '@/components/shared/RoleBadges';
import UserStatusBadge from '@/components/shared/UserStatusBadge';
import PasswordResetDialog from './PasswordResetDialog';
import UserRolesDialog from './UserRolesDialog';
import UserFormDialog from './UserFormDialog';

import {
  ArrowLeft,
  KeyRound,
  Pencil,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function UserDetailPage() {
  const { id } = useParams();
  const userId = id ?? '';
  const nav = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const userQ = useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => getUser(userId),
    enabled: !!userId,
  });

  // Pull recent audit logs and filter client-side for this user.
  // (Upgrade later by adding entityId filter to backend /audit.)
  const auditQ = useQuery({
    queryKey: ['audit-user-detail', userId],
    queryFn: () =>
      getAuditLogs({
        page: 1,
        limit: 50,
        // Option A: actions done to the user record
        entityType: 'User',
        entityId: userId,
        // Option B: actions performed by the user (uncomment if you want)
        // actorUserId: userId,
      } as any),
    enabled: !!userId,
  });

  const statusMut = useMutation({
    mutationFn: ({ s }: { s: UserStatus }) =>
      setUserStatus(userId, s),
    onSuccess: async () => {
      toast('Status updated');
      await qc.invalidateQueries({
        queryKey: ['audit-user-detail', userId],
      });
      await qc.invalidateQueries({ queryKey: usersKeys.all });
      await qc.invalidateQueries({
        queryKey: usersKeys.detail(userId),
      });
    },
    onError: e =>
      toast('Status change failed', {
        description: getErrorMessage(e),
      }),
  });

  const user = userQ.data;

  const activity = useMemo(() => {
    const logs = auditQ.data?.data ?? [];
    return logs.filter(l => {
      const matchesEntity =
        l.entityType === 'User' && l.entityId === userId;
      const matchesActor = l.actorUserId === userId;
      return matchesEntity || matchesActor;
    });
  }, [auditQ.data, userId]);

  const cols: ColumnDef<any>[] = [
    {
      header: 'Time',
      cell: a => new Date(a.createdAt).toLocaleString(),
    },
    {
      header: 'Actor',
      cell: a =>
        a.actor?.email ?? (a.actorUserId ? a.actorUserId : 'System'),
    },
    {
      header: 'Action',
      cell: a => <span className="font-medium">{a.action}</span>,
    },
    { header: 'Entity', cell: a => a.entityType },
    {
      header: 'Entity ID',
      cell: a => (
        <span className="font-mono text-xs">{a.entityId ?? '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav('/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-2xl font-semibold">User Detail</div>
          </div>
          <div className="text-sm opacity-70">
            <Link className="underline" to="/users">
              Users
            </Link>{' '}
            / {userId}
          </div>
        </div>

        <div className="flex gap-2">
          <RoleGate allow={['ADMIN', 'STAFF']}>
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={!user}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN']}>
            <Button
              variant="outline"
              onClick={() => setRolesOpen(true)}
              disabled={!user}
            >
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN', 'STAFF']}>
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
              disabled={!user}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN']}>
            <Button
              variant="outline"
              disabled={!user || statusMut.isPending}
              onClick={() =>
                statusMut.mutate({
                  s:
                    user!.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
            >
              {user?.status === 'ACTIVE' ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </RoleGate>
        </div>
      </div>

      {userQ.isLoading && <div>Loading...</div>}
      {userQ.error && (
        <div className="text-red-500">
          {getErrorMessage(userQ.error)}
        </div>
      )}

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm opacity-70">Name</div>
                <div className="font-medium">{user.name}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Email</div>
                <div className="font-mono text-sm">{user.email}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Status</div>
                <UserStatusBadge status={user.status} />
              </div>
              <div>
                <div className="text-sm opacity-70">Roles</div>
                <RoleBadges roles={user.roles} />
              </div>
              <div>
                <div className="text-sm opacity-70">Created</div>
                <div>{new Date(user.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Last Login</div>
                <div>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditQ.isLoading && <div>Loading...</div>}
          {auditQ.error && (
            <div className="text-red-500">
              {getErrorMessage(auditQ.error)}
            </div>
          )}

          <DataTable
            columns={cols}
            rows={activity}
            keyFn={a => a.id}
            emptyText="No activity found in the latest logs."
          />
        </CardContent>
      </Card>

      {/* dialogs */}
      <UserFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user ?? null}
      />
      <UserRolesDialog
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        user={user ?? null}
      />
      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        user={user ?? null}
      />
    </div>
  );
}
