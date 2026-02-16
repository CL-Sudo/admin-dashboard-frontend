import type { ProductListParams } from '@/api/products';

export const productsKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => ['products', params] as const,
};
