import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  commitProductImage,
  createProduct,
  createProductImageUploadUrl,
  removeProductImage,
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
import { uploadToSupabaseSignedUrl } from '@/lib/uploadSigned';
// import { productsKeys } from './products.keys';

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(1).default('MYR'),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  description: z.string().optional(),
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
      categoryId: null,
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product?.imageUrl ?? null
  );

  const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
  const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  useEffect(() => {
    if (product) {
      // Editing mode: populate form with product data
      form.reset({
        name: product.name,
        sku: product.sku,
        priceCents: product.priceCents,
        currency: product.currency ?? 'MYR',
        status: (product.status ?? 'ACTIVE') as ProductStatus,
        description: product.description ?? '',
        categoryId: product.categoryId ?? null,
      });
      setPreviewUrl(product.imageUrl ?? null);
    } else if (open) {
      // Create mode: reset form when dialog opens
      form.reset({
        name: '',
        sku: '',
        priceCents: 0,
        currency: 'MYR',
        status: 'ACTIVE',
        description: '',
        categoryId: null,
      });
      setPreviewUrl(null);
    }
  }, [product, open, form]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const created = await createProduct({
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description || undefined,
      });

      if (imageFile) {
        const up = await createProductImageUploadUrl({
          productId: created.id,
          filename: imageFile.name,
          contentType: imageFile.type,
          sizeBytes: imageFile.size,
        });

        await uploadToSupabaseSignedUrl({
          signedUrl: up.signedUrl,
          file: imageFile,
        });

        // 3) persist imagePath + public imageUrl
        await commitProductImage(created.id, {
          imagePath: up.path,
          imageUrl: up.publicUrl,
        });
      }

      return created;
    },
    onSuccess: async () => {
      toast.success('Product created');
      await qc.invalidateQueries({ queryKey: ['products'] });
      onOpenChange?.(false);
      setImageFile(null);
      setPreviewUrl(null);
      form.reset();
    },
    onError: e =>
      toast.error('Create failed', {
        description: getErrorMessage(e),
      }),
  });

  const updateMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const created = updateProduct(product!.id, {
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description || undefined,
      });

      if (imageFile) {
        const up = await createProductImageUploadUrl({
          productId: product!.id,
          filename: imageFile.name,
          contentType: imageFile.type,
          sizeBytes: imageFile.size,
        });

        await uploadToSupabaseSignedUrl({
          signedUrl: up.signedUrl,
          file: imageFile,
        });

        await commitProductImage(product!.id, {
          imagePath: up.path,
          imageUrl: up.publicUrl,
        });
      }

      return created;
    },
    onSuccess: async () => {
      toast.success('Product updated');
      await qc.invalidateQueries({ queryKey: ['products'] });
      onOpenChange?.(false);
      setImageFile(null);
      setPreviewUrl(null);
    },
    onError: e =>
      toast.error('Update failed', {
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
            <Label>Product Image (optional)</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e => {
                const f = e.target.files?.[0] ?? null;
                if (!f) {
                  setImageFile(null);
                  setPreviewUrl(null);
                  return;
                }

                if (!allowedTypes.has(f.type)) {
                  toast.error('Invalid file type', {
                    description: 'Use JPG / PNG / WEBP',
                  });
                  e.currentTarget.value = '';
                  return;
                }

                if (f.size > MAX_IMAGE_BYTES) {
                  toast.error('File too large', {
                    description: 'Max 10MB',
                  });
                  e.currentTarget.value = '';
                  return;
                }

                setImageFile(f);
                setPreviewUrl(URL.createObjectURL(f));
              }}
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-24 w-24 rounded object-cover border"
              />
            )}

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!product) return;
                  await removeProductImage(
                    product.id,
                    product.imagePath ?? undefined
                  );
                  toast.success('Image removed');
                  await qc.invalidateQueries({
                    queryKey: ['products'],
                  });
                  setPreviewUrl(null);
                }}
              >
                Remove image
              </Button>
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

  // Replace createMut:
  // const createMut = useMutation({
  //   mutationFn: (v: FormValues) =>
  //     createProduct({
  //       ...v,
  //       categoryId: v.categoryId ?? null,
  //       description: v.description || undefined,
  //       imageUrl: v.imageUrl || undefined,
  //     }),

  //   onMutate: async v => {
  //     await qc.cancelQueries({ queryKey: productsKeys.all });
  //     const snapshots = qc.getQueriesData({
  //       queryKey: productsKeys.all,
  //     });

  //     const tempId = `temp-${crypto.randomUUID()}`;
  //     const temp: Product = {
  //       id: tempId,
  //       name: v.name,
  //       sku: v.sku,
  //       priceCents: v.priceCents,
  //       currency: v.currency ?? 'MYR',
  //       status: v.status,
  //       description: v.description ?? null,
  //       imageUrl: v.imageUrl ?? null,
  //       categoryId: v.categoryId ?? null,
  //       category:
  //         categories?.find(c => c.id === v.categoryId) ?? null,
  //     };

  //     qc.setQueriesData(
  //       { queryKey: productsKeys.all },
  //       (old: any) => {
  //         if (!old?.data) return old;
  //         return {
  //           ...old,
  //           data: [temp, ...old.data],
  //           meta: { ...old.meta, total: (old.meta?.total ?? 0) + 1 },
  //         };
  //       }
  //     );

  //     return { snapshots, tempId };
  //   },

  //   onError: (e, _v, ctx) => {
  //     ctx?.snapshots?.forEach(([key, data]: any) =>
  //       qc.setQueryData(key, data)
  //     );
  //     toast('Create failed', {
  //       description: getErrorMessage(e),
  //     });
  //   },

  //   onSuccess: async (created, _v, ctx) => {
  //     toast('Product created');

  //     // Replace temp row with real one
  //     qc.setQueriesData(
  //       { queryKey: productsKeys.all },
  //       (old: any) => {
  //         if (!old?.data) return old;
  //         return {
  //           ...old,
  //           data: old.data.map((p: Product) =>
  //             p.id === ctx?.tempId ? created : p
  //           ),
  //         };
  //       }
  //     );

  //     onOpenChange?.(false);
  //     form.reset();
  //   },

  //   onSettled: async () => {
  //     await qc.invalidateQueries({ queryKey: productsKeys.all });
  //   },
  // });

  // const updateMut = useMutation({
  //   mutationFn: (v: FormValues) =>
  //     updateProduct(product!.id, {
  //       ...v,
  //       categoryId: v.categoryId ?? null,
  //       description: v.description || undefined,
  //       imageUrl: v.imageUrl || undefined,
  //     }),

  //   onMutate: async v => {
  //     await qc.cancelQueries({ queryKey: productsKeys.all });
  //     const snapshots = qc.getQueriesData({
  //       queryKey: productsKeys.all,
  //     });

  //     qc.setQueriesData(
  //       { queryKey: productsKeys.all },
  //       (old: any) => {
  //         if (!old?.data) return old;
  //         return {
  //           ...old,
  //           data: old.data.map((p: Product) =>
  //             p.id === product!.id
  //               ? {
  //                   ...p,
  //                   name: v.name,
  //                   sku: v.sku,
  //                   priceCents: v.priceCents,
  //                   currency: v.currency ?? p.currency,
  //                   status: v.status,
  //                   description: v.description ?? null,
  //                   imageUrl: v.imageUrl ?? null,
  //                   categoryId: v.categoryId ?? null,
  //                   category:
  //                     categories?.find(c => c.id === v.categoryId) ??
  //                     null,
  //                 }
  //               : p
  //           ),
  //         };
  //       }
  //     );

  //     return { snapshots };
  //   },

  //   onError: (e, _v, ctx) => {
  //     ctx?.snapshots?.forEach(([key, data]: any) =>
  //       qc.setQueryData(key, data)
  //     );
  //     toast('Update failed', {
  //       description: getErrorMessage(e),
  //     });
  //   },

  //   onSuccess: async () => {
  //     toast('Product updated');
  //     onOpenChange?.(false);
  //   },

  //   onSettled: async () => {
  //     await qc.invalidateQueries({ queryKey: productsKeys.all });
  //   },
  // });
}
