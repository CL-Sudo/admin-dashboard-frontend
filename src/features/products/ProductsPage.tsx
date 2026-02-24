import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getProducts,
  deleteProduct,
  type Product,
  type ProductStatus,
} from '@/api/products';
import { getCategories } from '@/api/categories';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/useDebounce';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Pagination from '@/components/shared/Pagination';
import ProductFormDialog from './ProductFormDialog';
import { RoleGate } from '@/components/auth/RoleGate';
import StatusBadge from '@/components/shared/StatusBadge';
import DataTable, {
  type ColumnDef,
} from '@/components/shared/DataTable';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { productsKeys } from './products.keys';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  const [status, setStatus] = useState<ProductStatus | 'all'>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(
    null
  );

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

  const productsQuery = useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => getProducts(params),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      toast.success('Product deleted');
      setDeleteConfirmOpen(false);
      setPendingDelete(null);
      await queryClient.invalidateQueries({
        queryKey: productsKeys.all,
      });
    },
    onError: e =>
      toast('Delete failed', {
        description: getErrorMessage(e),
      }),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: 'Product Image',
      cell: p =>
        p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={`${p.name} image`}
            className="h-30 w-30 rounded object-cover border"
          />
        ) : (
          <div className="h-30 w-30 rounded border opacity-40" />
        ),
    },
    {
      header: 'Name',
      className: 'max-w-[250px]',
      cell: p => (
        <Link
          to={`/products/${p.id}`}
          className="block truncate font-medium underline"
          title={p.name}
        >
          {p.name}
        </Link>
      ),
    },
    { header: 'SKU', cell: p => p.sku },
    { header: 'Category', cell: p => p.category?.name ?? '-' },
    { header: 'Status', cell: p => <StatusBadge value={p.status} /> },
    {
      header: 'Price',
      className: 'text-right',
      cell: p => (
        <span className="tabular-nums">
          {(p.priceCents / 100).toFixed(2)} {p.currency}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: p => (
        <div className="inline-flex gap-2">
          <RoleGate allow={['ADMIN', 'STAFF']}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(p)}
              aria-label={`Edit ${p.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </RoleGate>

          <RoleGate allow={['ADMIN']}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setPendingDelete(p);
                setDeleteConfirmOpen(true);
              }}
              aria-label={`Delete ${p.name}`}
              disabled={delMut.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGate>
        </div>
      ),
    },
  ];

  const data = productsQuery.data;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Products</CardTitle>
        </div>

        <RoleGate allow={['ADMIN', 'STAFF']}>
          <Button onClick={openCreate}>
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

      <CardContent className="space-y-4">
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
              setStatus(v as ProductStatus | 'all');
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

        {productsQuery.isLoading && <div>Loading...</div>}
        {productsQuery.error && (
          <div className="text-red-500">
            {getErrorMessage(productsQuery.error)}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          keyFn={p => p.id}
          emptyText="No products found."
        />

        <Dialog
          open={deleteConfirmOpen}
          onOpenChange={v => {
            if (delMut.isPending) return;
            setDeleteConfirmOpen(v);
            if (!v) setPendingDelete(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete product?</DialogTitle>
              <DialogDescription>
                {pendingDelete
                  ? `This will permanently delete "${pendingDelete.name}".`
                  : 'This will permanently delete the selected product.'}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPendingDelete(null);
                }}
                disabled={delMut.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!pendingDelete) return;
                  delMut.mutate(pendingDelete.id);
                }}
                disabled={delMut.isPending || !pendingDelete}
              >
                {delMut.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
