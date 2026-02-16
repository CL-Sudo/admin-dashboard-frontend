import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getProducts,
  deleteProduct,
  type ProductStatus,
  type Product,
} from '@/api/products';
import { getCategories } from '@/api/categories';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/Pagination';
import ProductFormDialog from './ProductFormDialog';
import { RoleGate } from '@/components/auth/RoleGate';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';

export default function ProductsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | 'all'>('all');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search, 200);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      page,
      limit: 20,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    }),
    [debouncedSearch, status, categoryId, page]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      toast('Product deleted');
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: e =>
      toast('Delete failed', { description: getErrorMessage(e) }),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Products</CardTitle>
          <div className="text-sm opacity-70">
            Search, filter, create, edit
          </div>
        </div>

        <RoleGate allow={['ADMIN', 'STAFF']}>
          <Button onClick={openCreate} className="md:self-end">
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        </RoleGate>

        <ProductFormDialog
          open={dialogOpen}
          onOpenChange={v => {
            setDialogOpen(v);
            if (!v) setEditing(null);
          }}
          product={editing}
        />
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search name or SKU..."
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
              <SelectItem value="DRAFT">DRAFT</SelectItem>
              <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryId}
            onValueChange={v => {
              setCategoryId(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories ?? []).map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-35 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>Loading...</TableCell>
                </TableRow>
              )}

              {error && (
                <TableRow>
                  <TableCell colSpan={6} className="text-red-500">
                    {getErrorMessage(error)}
                  </TableCell>
                </TableRow>
              )}

              {data?.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="opacity-70">
                    No products found.
                  </TableCell>
                </TableRow>
              )}

              {data?.data?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                  </TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.category?.name ?? '-'}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-right">
                    {(p.priceCents / 100).toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <RoleGate allow={['ADMIN', 'STAFF']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </RoleGate>

                      <RoleGate allow={['ADMIN']}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => delMut.mutate(p.id)}
                          disabled={delMut.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RoleGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
