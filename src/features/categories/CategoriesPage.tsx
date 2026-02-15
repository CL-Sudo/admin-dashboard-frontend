import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from '@/api/categories';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleGate } from '@/components/auth/RoleGate';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');

  const createMut = useMutation({
    mutationFn: (n: string) => createCategory(n),
    onSuccess: async () => {
      toast('Category created');
      setName('');
      await qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: e =>
      toast('Create failed', { description: getErrorMessage(e) }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      updateCategory(id, n),
    onSuccess: async () => {
      toast('Category updated');
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: e =>
      toast('Update failed', {
        description: getErrorMessage(e),
      }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      toast('Category deleted');
      await qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: e =>
      toast('Delete failed', {
        description: getErrorMessage(e),
      }),
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <div className="text-sm opacity-70">
          Manage product categories
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <RoleGate allow={['ADMIN', 'STAFF']}>
          <div className="flex gap-2 max-w-md">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="New category name"
            />
            <Button
              onClick={() => createMut.mutate(name.trim())}
              disabled={!name.trim() || createMut.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </RoleGate>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-40 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={2}>Loading...</TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={2} className="text-red-500">
                    {getErrorMessage(error)}
                  </TableCell>
                </TableRow>
              )}

              {rows.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    {editing?.id === c.id ? (
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <RoleGate allow={['ADMIN', 'STAFF']}>
                        {editing?.id === c.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateMut.mutate({
                                  id: c.id,
                                  n: editName.trim(),
                                })
                              }
                              disabled={
                                !editName.trim() ||
                                updateMut.isPending
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(c);
                              setEditName(c.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </RoleGate>

                      <RoleGate allow={['ADMIN']}>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMut.mutate(c.id)}
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RoleGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && !isLoading && !error && (
                <TableRow>
                  <TableCell colSpan={2} className="opacity-70">
                    No categories.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
