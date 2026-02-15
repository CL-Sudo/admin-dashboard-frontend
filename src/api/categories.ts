import { api } from './client';

export type Category = { id: string; name: string };

export async function getCategories() {
  const res = await api.get<Category[]>('/categories');
  return res.data;
}

export async function createCategory(name: string) {
  const res = await api.post<Category>('/categories', { name });
  return res.data;
}

export async function updateCategory(id: string, name: string) {
  const res = await api.patch<Category>(`/categories/${id}`, {
    name,
  });
  return res.data;
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}
