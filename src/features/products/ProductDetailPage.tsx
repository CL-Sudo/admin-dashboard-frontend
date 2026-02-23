import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import DataTable, {
  type ColumnDef,
} from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';

import {
  ArrowLeft,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';

import { getProduct } from '@/api/products';
import {
  createProductImageUploadUrl,
  commitProductImage,
  removeProductImage,
} from '@/api/products';
import { uploadToSupabaseSignedUrl } from '@/lib/uploadSigned';
import { getAuditLogs, type AuditLog } from '@/api/audit';

import ProductFormDialog from './ProductFormDialog';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = id ?? '';
  const nav = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const productQ = useQuery({
    queryKey: ['products', 'detail', productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });

  const auditQ = useQuery({
    queryKey: ['audit-product-detail', productId],
    queryFn: () =>
      getAuditLogs({
        page: 1,
        limit: 50,
        entityType: 'Product',
        entityId: productId,
        sort: 'createdAt',
        order: 'desc',
      }),
    enabled: !!productId,
  });

  const product = productQ.data;

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Missing product');
      if (!imageFile) throw new Error('No file selected');

      // 1) get signed upload url
      const up = await createProductImageUploadUrl({
        productId: product.id,
        filename: imageFile.name,
        contentType: imageFile.type,
        sizeBytes: imageFile.size,
      });

      // 2) upload file direct to Supabase
      await uploadToSupabaseSignedUrl({
        signedUrl: up.signedUrl,
        file: imageFile,
      });

      // 3) commit (DB update + delete old image server-side)
      await commitProductImage(product.id, {
        imagePath: up.path,
        imageUrl: up.publicUrl,
      });
    },
    onSuccess: async () => {
      toast.success('Image updated');
      setImageFile(null);
      setPreviewUrl(null);
      await qc.invalidateQueries({ queryKey: ['products'] });
      await qc.invalidateQueries({
        queryKey: ['products', 'detail', productId],
      });
    },
    onError: e =>
      toast.error('Image upload failed', {
        description: getErrorMessage(e),
      }),
  });

  const removeMut = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Missing product');
      await removeProductImage(
        product.id,
        product.imagePath ?? undefined
      );
    },
    onSuccess: async () => {
      toast.success('Image removed');
      await qc.invalidateQueries({ queryKey: ['products'] });
      await qc.invalidateQueries({
        queryKey: ['products', 'detail', productId],
      });
    },
    onError: e =>
      toast.error('Remove failed', {
        description: getErrorMessage(e),
      }),
  });

  const activityCols: ColumnDef<AuditLog>[] = [
    {
      header: 'Time',
      cell: a => new Date(a.createdAt).toLocaleString(),
    },
    {
      header: 'Actor',
      cell: a =>
        a.actor?.email ?? a.actorUserId ?? 'System',
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

  const activityRows = auditQ.data?.data ?? [];

  const onSelectFile = (f: File | null) => {
    if (!f) {
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!allowedTypes.has(f.type)) {
      toast.error('Invalid file type', {
        description: 'Use JPG / PNG / WEBP',
      });
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error('File too large', {
        description: 'Max 10MB',
      });
      return;
    }
    setImageFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void nav('/products');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-2xl font-semibold">
              Product Detail
            </div>
          </div>
          <div className="text-sm opacity-70">
            <Link className="underline" to="/products">
              Products
            </Link>{' '}
            / {productId}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
            disabled={!product}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Product Profile */}
      {productQ.isLoading ? (
        <div>Loading...</div>
      ) : productQ.error ? (
        <div className="text-red-500">
          {getErrorMessage(productQ.error)}
        </div>
      ) : product ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm opacity-70">Name</div>
                <div className="font-medium">{product.name}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">SKU</div>
                <div className="font-mono text-sm">{product.sku}</div>
              </div>

              <div>
                <div className="text-sm opacity-70">Price</div>
                <div className="font-medium">
                  {(product.priceCents / 100).toFixed(2)}{' '}
                  {product.currency}
                </div>
              </div>

              <div>
                <div className="text-sm opacity-70">Status</div>
                <StatusBadge value={product.status} />
              </div>

              <div>
                <div className="text-sm opacity-70">Category</div>
                <div>{product.category?.name ?? '-'}</div>
              </div>

              <div>
                <div className="text-sm opacity-70">Updated</div>
                <div>
                  {new Date(product.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            {/* Image section */}
            <div className="grid gap-4 md:grid-cols-[220px,1fr]">
              <div className="space-y-2">
                <div className="text-sm opacity-70">Image</div>

                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt="Product"
                    className="h-48 w-48 rounded object-cover border"
                  />
                ) : (
                  <div className="h-48 w-48 rounded border flex items-center justify-center opacity-60">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}

                <div className="text-xs opacity-70">
                  Stored path:{' '}
                  <span className="font-mono">
                    {product.imagePath ?? '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">
                  Replace image
                </div>

                <div className="space-y-2">
                  <Label>Select file (JPG/PNG/WEBP, max 10MB)</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={e =>
                      onSelectFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-2">
                    <div className="text-sm opacity-70">Preview</div>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-24 w-24 rounded object-cover border"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => uploadMut.mutate()}
                    disabled={!imageFile || uploadMut.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadMut.isPending
                      ? 'Uploading...'
                      : 'Upload & Save'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => removeMut.mutate()}
                    disabled={
                      !product.imageUrl || removeMut.isPending
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Activity Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trail</CardTitle>
          <div className="text-sm opacity-70">
            Latest 50 audit events targeting this product
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditQ.isLoading ? (
            <div>Loading...</div>
          ) : auditQ.error ? (
            <div className="text-red-500">
              {getErrorMessage(auditQ.error)}
            </div>
          ) : (
            <DataTable
              columns={activityCols}
              rows={activityRows}
              keyFn={a => a.id}
              emptyText="No activity found."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product ?? null}
      />
    </div>
  );
}
