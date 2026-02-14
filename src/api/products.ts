import { api } from './client';

// explaination: https://gemini.google.com/share/66810961566f

export type Product = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
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

export async function getProducts(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  // <Product> replaces the T[] in Paged<T> so the response data will be typed as Paged<Product>.
  const res = await api.get<Paged<Product>>('/products', { params });
  return res.data;
}
