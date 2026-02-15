import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createProduct,
  updateProduct,
  type Product,
  type ProductStatus,
} from '@/api/products';
import { getCategories } from '@/api/categories';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(1).default('MYR'),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProductFormDialog({
  trigger,
  product,
  onOpenChange,
  open,
}: {
  trigger?: React.ReactNode;
  product?: Product | null;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const qc = useQueryClient();

  const isEdit = !!product?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      sku: '',
      priceCents: 0,
      currency: 'MYR',
      status: 'ACTIVE',
      description: '',
      imageUrl: '',
      categoryId: null,
    },
  });

  useEffect(() => {
    if (!product) return;
    form.reset({
      name: product.name,
      sku: product.sku,
      priceCents: product.priceCents,
      currency: product.currency ?? 'MYR',
      status: (product.status ?? 'ACTIVE') as ProductStatus,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId ?? null,
    });
  }, [product, form]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      createProduct({
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description || undefined,
        imageUrl: v.imageUrl || undefined,
      }),
    onSuccess: async () => {
      toast.success('Product created');
      await qc.invalidateQueries({ queryKey: ['products'] });
      onOpenChange?.(false);
      form.reset();
    },
    onError: e =>
      toast.error('Create failed', {
        description: getErrorMessage(e),
      }),
  });

  const updateMut = useMutation({
    mutationFn: (v: FormValues) =>
      updateProduct(product!.id, {
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description || undefined,
        imageUrl: v.imageUrl || undefined,
      }),
    onSuccess: async () => {
      toast('Product updated');
      await qc.invalidateQueries({ queryKey: ['products'] });
      onOpenChange?.(false);
    },
    onError: e =>
      toast('Update failed', {
        description: getErrorMessage(e),
      }),
  });

  const onSubmit = (v: FormValues) => {
    if (isEdit) return updateMut.mutate(v);
    return createMut.mutate(v);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Product' : 'Create Product'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input {...form.register('sku')} />
              {form.formState.errors.sku && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Price (cents)</Label>
              <Input type="number" {...form.register('priceCents')} />
              {form.formState.errors.priceCents && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.priceCents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Input {...form.register('currency')} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={v => form.setValue('status', v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('categoryId') ?? 'none'}
                onValueChange={v =>
                  form.setValue('categoryId', v === 'none' ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {(categories ?? []).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} {...form.register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input {...form.register('imageUrl')} />
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-red-500">
                {form.formState.errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                createMut.isPending ||
                updateMut.isPending
              }
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
