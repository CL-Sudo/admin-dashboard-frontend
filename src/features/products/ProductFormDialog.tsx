import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
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
} from '@/api/products';
import { getCategories } from '@/api/categories';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { productsKeys } from './products.keys';
import { X } from 'lucide-react';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must be at most 120 characters'),
  sku: z
    .string()
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(64, 'SKU must be at most 64 characters')
    .regex(
      /^[A-Za-z0-9._-]+$/,
      'SKU can only contain letters, numbers, dot, underscore, and dash'
    ),
  priceCents: z
    .number()
    .int('Price must be a whole number in cents')
    .min(0, 'Price cannot be negative'),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be exactly 3 letters')
    .regex(/^[A-Za-z]{3}$/, 'Currency must be letters only'),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
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
    resolver: zodResolver(schema),
    mode: 'onChange',
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removedImageProductId, setRemovedImageProductId] = useState<
    string | null
  >(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
  const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  const revokePreviewObjectUrl = useCallback(() => {
    if (!previewObjectUrlRef.current) return;
    URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
  }, []);

  const resetImageState = useCallback(
    (nextPreview: string | null) => {
      setImageFile(null);
      revokePreviewObjectUrl();
      setPreviewUrl(nextPreview);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [revokePreviewObjectUrl]
  );

  useEffect(() => {
    if (product) {
      // Editing mode: populate form with product data
      form.reset({
        name: product.name,
        sku: product.sku,
        priceCents: product.priceCents,
        currency: product.currency ?? 'MYR',
        status: product.status ?? 'ACTIVE',
        description: product.description ?? '',
        categoryId: product.categoryId ?? null,
      });
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
    }
  }, [product, open, form]);

  useEffect(
    () => () => revokePreviewObjectUrl(),
    [revokePreviewObjectUrl]
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const created = await createProduct({
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description?.trim()
          ? v.description.trim()
          : undefined,
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
      await qc.invalidateQueries({ queryKey: productsKeys.all });
      setRemovedImageProductId(null);
      onOpenChange?.(false);
      resetImageState(null);
      form.reset();
    },
    onError: e =>
      toast.error('Create failed', {
        description: getErrorMessage(e),
      }),
  });

  const updateMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const updated = await updateProduct(product!.id, {
        ...v,
        categoryId: v.categoryId ?? null,
        description: v.description?.trim()
          ? v.description.trim()
          : undefined,
      });

      if (imageFile) {
        try {
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
        } catch (e) {
          toast.error('Image update failed', {
            description: getErrorMessage(e),
          });
        }
      }

      return updated;
    },
    onSuccess: async () => {
      toast.success('Product updated');
      await qc.invalidateQueries({ queryKey: productsKeys.all });
      setRemovedImageProductId(null);
      onOpenChange?.(false);
      resetImageState(null);
    },
    onError: e =>
      toast.error('Update failed', {
        description: getErrorMessage(e),
      }),
  });

  const removeImageMut = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Missing product');
      await removeProductImage(
        product.id,
        product.imagePath ?? undefined
      );
    },
    onSuccess: async () => {
      toast.success('Image removed');
      setRemovedImageProductId(product?.id ?? null);
      resetImageState(null);
      await qc.invalidateQueries({ queryKey: productsKeys.all });
      await qc.invalidateQueries({
        queryKey: ['products', 'detail', product?.id],
      });
    },
    onError: e =>
      toast.error('Remove image failed', {
        description: getErrorMessage(e),
      }),
  });

  const onSubmit = (v: FormValues) => {
    if (isEdit) return updateMut.mutate(v);
    return createMut.mutate(v);
  };
  const submitHandler = form.handleSubmit(onSubmit);
  const statusValue = useWatch({
    control: form.control,
    name: 'status',
  });
  const categoryValue = useWatch({
    control: form.control,
    name: 'categoryId',
  });

  const isSaving = createMut.isPending || updateMut.isPending;
  const canSubmit =
    form.formState.isValid &&
    !isSaving &&
    !removeImageMut.isPending &&
    (!isEdit || form.formState.isDirty || !!imageFile);
  const currentSavedImageUrl =
    removedImageProductId === product?.id
      ? null
      : (product?.imageUrl ?? null);
  const shownPreviewUrl = previewUrl ?? currentSavedImageUrl;
  const hasSelectedImageFile = imageFile !== null;
  const canRemoveSavedImage =
    isEdit && currentSavedImageUrl !== null && !hasSelectedImageFile;
  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetImageState(null);
      setRemovedImageProductId(null);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Product' : 'Create Product'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update product details and image.'
              : 'Fill in the product details to create a new item.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void submitHandler(e);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...form.register('name')}
                placeholder="e.g. Wireless Mouse"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                {...form.register('sku')}
                placeholder="e.g. WM-1000"
                onBlur={e => {
                  form.setValue(
                    'sku',
                    e.target.value.trim().toUpperCase(),
                    { shouldDirty: true, shouldValidate: true }
                  );
                }}
              />
              {form.formState.errors.sku && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Price (cents)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                {...form.register('priceCents', {
                  valueAsNumber: true,
                })}
              />
              <p className="text-xs opacity-70">
                Stored in cents. Example: 1999 = 19.99
              </p>
              {form.formState.errors.priceCents && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.priceCents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                maxLength={3}
                {...form.register('currency')}
                onBlur={e => {
                  form.setValue(
                    'currency',
                    e.target.value.trim().toUpperCase(),
                    { shouldDirty: true, shouldValidate: true }
                  );
                }}
              />
              {form.formState.errors.currency && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.currency.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusValue}
                onValueChange={v => {
                  if (
                    v !== 'ACTIVE' &&
                    v !== 'DRAFT' &&
                    v !== 'ARCHIVED'
                  ) {
                    return;
                  }
                  form.setValue('status', v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
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
                value={categoryValue ?? 'none'}
                onValueChange={v =>
                  form.setValue(
                    'categoryId',
                    v === 'none' ? null : v,
                    { shouldDirty: true, shouldValidate: true }
                  )
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
            <Textarea
              rows={3}
              maxLength={2000}
              placeholder="Optional notes about this product"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Product Image (optional)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;

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

                revokePreviewObjectUrl();
                setImageFile(f);
                const objectUrl = URL.createObjectURL(f);
                previewObjectUrlRef.current = objectUrl;
                setPreviewUrl(objectUrl);
              }}
            />
            <p className="text-xs opacity-70">
              JPG, PNG, or WEBP. Maximum file size: 10MB.
            </p>

            {shownPreviewUrl && (
              <div className="relative h-24 w-24">
                <img
                  src={shownPreviewUrl}
                  alt="Preview"
                  className="h-24 w-24 rounded object-cover border"
                />

                {(hasSelectedImageFile || canRemoveSavedImage) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      if (hasSelectedImageFile) {
                        resetImageState(null);
                        return;
                      }
                      if (canRemoveSavedImage) {
                        removeImageMut.mutate();
                      }
                    }}
                    disabled={removeImageMut.isPending || isSaving}
                    aria-label={
                      hasSelectedImageFile
                        ? 'Clear selected image'
                        : 'Remove current image'
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !canSubmit}
            >
              {isSaving
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                  ? 'Save'
                  : 'Create'}
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
