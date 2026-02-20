import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getUsers,
  setUserStatus,
  type RoleName,
  type UserRow,
  type UserStatus,
} from '@/api/users';
import { usersKeys } from './users.keys';
import { useDebounce } from '@/lib/useDebounce';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/httpError';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Pagination from '@/components/shared/Pagination';
import DataTable, {
  type ColumnDef,
} from '@/components/shared/DataTable';
import UserStatusBadge from '@/components/shared/UserStatusBadge';
import RoleBadges from '@/components/shared/RoleBadges';
import { RoleGate } from '@/components/auth/RoleGate';

import UserFormDialog from './UserFormDialog';
import UserRolesDialog from './UserRolesDialog';
import PasswordResetDialog from './PasswordResetDialog';

import {
  Plus,
  Shield,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Pencil,
} from 'lucide-react';

export default function UsersPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 450);

  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [role, setRole] = useState<RoleName | 'all'>('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [selected, setSelected] = useState<UserRow | null>(null);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      role: role === 'all' ? undefined : role,
      page,
      limit: 20,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    }),
    [debouncedSearch, status, role, page]
  );

  const usersQ = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, s }: { id: string; s: UserStatus }) =>
      setUserStatus(id, s),

    // optimistic status patch across all users lists
    onMutate: async ({ id, s }) => {
      await qc.cancelQueries({ queryKey: usersKeys.all });
      const snapshots = qc.getQueriesData({
        queryKey: usersKeys.all,
      });

      qc.setQueriesData({ queryKey: usersKeys.all }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((u: UserRow) =>
            u.id === id ? { ...u, status: s } : u
          ),
        };
      });

      return { snapshots };
    },

    onError: (e, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]: any) =>
        qc.setQueryData(key, data)
      );
      toast('Status change failed', {
        description: getErrorMessage(e),
      });
    },

    onSuccess: async () => {
      toast('Status updated');
      await qc.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setSelected(u);
    setFormOpen(true);
  };

  const openRoles = (u: UserRow) => {
    setSelected(u);
    setRolesOpen(true);
  };

  const openReset = (u: UserRow) => {
    setSelected(u);
    setResetOpen(true);
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      header: 'Name',
      cell: u => <div className="font-medium">{u.name}</div>,
    },
    {
      header: 'Email',
      cell: u => <div className="font-mono text-xs">{u.email}</div>,
    },
    {
      header: 'Status',
      cell: u => <UserStatusBadge status={u.status} />,
    },
    { header: 'Roles', cell: u => <RoleBadges roles={u.roles} /> },
    {
      header: 'Last Login',
      cell: u =>
        u.lastLoginAt
          ? new Date(u.lastLoginAt).toLocaleString()
          : '-',
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: u => (
        <div className="inline-flex gap-2">
          <RoleGate allow={['ADMIN', 'STAFF']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(u)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRoles(u)}
            >
              <Shield className="h-4 w-4" />
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN', 'STAFF']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openReset(u)}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                statusMut.mutate({
                  id: u.id,
                  s: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              disabled={statusMut.isPending}
            >
              {u.status === 'ACTIVE' ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
          </RoleGate>
        </div>
      ),
    },
  ];

  const data = usersQ.data;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Users</CardTitle>
          <div className="text-sm opacity-70">
            Search, filter, manage status/roles, reset passwords
          </div>
        </div>

        <RoleGate allow={['ADMIN', 'STAFF']}>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </RoleGate>

        <UserFormDialog
          open={formOpen}
          onOpenChange={v => setFormOpen(v)}
          user={selected}
        />

        <UserRolesDialog
          open={rolesOpen}
          onOpenChange={v => setRolesOpen(v)}
          user={selected}
        />

        <PasswordResetDialog
          open={resetOpen}
          onOpenChange={v => setResetOpen(v)}
          user={selected}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <Select
            value={status}
            onValueChange={v => {
              setStatus(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="DISABLED">DISABLED</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={role}
            onValueChange={v => {
              setRole(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="VIEWER">VIEWER</SelectItem>
              <SelectItem value="STAFF">STAFF</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {usersQ.isLoading && <div>Loading...</div>}
        {usersQ.error && (
          <div className="text-red-500">
            {getErrorMessage(usersQ.error)}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          keyFn={u => u.id}
          emptyText="No users found."
        />

        <Pagination
          page={data?.meta.page ?? page}
          totalPages={totalPages}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      </CardContent>
    </Card>
  );
}
