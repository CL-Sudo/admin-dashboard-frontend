import { api } from './client';

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type Product = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  status: ProductStatus;
  imageUrl?: string | null;
  description?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

export type Paged<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductListParams = {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'priceCents' | 'name';
  order?: 'asc' | 'desc';
};

export type UpsertProductInput = {
  name: string;
  sku: string;
  priceCents: number;
  currency?: string;
  status?: ProductStatus;
  description?: string;
  imageUrl?: string;
  categoryId?: string | null;
};

// <Product> replaces the T[] in Paged<T> so the response data will be typed as Paged<Product>.
export async function getProducts(params?: ProductListParams) {
  const res = await api.get<Paged<Product>>('/products', { params });
  return res.data;
}

export async function createProduct(input: UpsertProductInput) {
  const res = await api.post<Product>('/products', input);
  return res.data;
}

export async function updateProduct(
  id: string,
  input: Partial<UpsertProductInput>
) {
  const res = await api.patch<Product>(`/products/${id}`, input);
  return res.data;
}

export async function deleteProduct(id: string) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}
