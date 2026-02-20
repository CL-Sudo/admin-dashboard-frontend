import type { ListUsersParams } from '@/api/users';

export const usersKeys = {
  all: ['users'] as const,
  list: (params: ListUsersParams) => ['users', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};
