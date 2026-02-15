import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/api/audit';
import { getErrorMessage } from '@/lib/httpError';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/Pagination';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', { page }],
    queryFn: () => getAuditLogs({ page, limit: 25 }),
  });

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <div className="text-sm opacity-70">
          System activity trail
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={5} className="text-red-500">
                    {getErrorMessage(error)}
                  </TableCell>
                </TableRow>
              )}

              {data?.data?.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    {new Date(a.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{a.actor?.email ?? '-'}</TableCell>
                  <TableCell className="font-medium">
                    {a.action}
                  </TableCell>
                  <TableCell>{a.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {a.entityId ?? '-'}
                  </TableCell>
                </TableRow>
              ))}

              {data?.data?.length === 0 && !isLoading && !error && (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    No audit logs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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
