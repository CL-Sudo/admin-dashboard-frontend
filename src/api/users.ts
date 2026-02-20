import { api } from './client';

export type UserStatus = 'ACTIVE' | 'DISABLED';
export type RoleName = 'ADMIN' | 'STAFF' | 'VIEWER';

export type UserRow = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: RoleName[];
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
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

export type ListUsersParams = {
  search?: string;
  status?: UserStatus;
  role?: RoleName;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'email' | 'name' | 'lastLoginAt';
  order?: 'asc' | 'desc';
};

export type CreateUserInput = {
  email: string;
  name: string;
  initialPassword?: string;
  roles?: RoleName[];
};

export type UpdateUserInput = Partial<
  Pick<CreateUserInput, 'email' | 'name'>
>;

export async function getUsers(params?: ListUsersParams) {
  console.log('Fetching users with params:', params);
  const res = await api.get<Paged<UserRow>>('/users', { params });
  return res.data;
}

export async function getUser(id: string) {
  const res = await api.get<UserRow>(`/users/${id}`);
  return res.data;
}

export async function createUser(input: CreateUserInput) {
  const res = await api.post<UserRow>('/users', input);
  return res.data;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const res = await api.patch<UserRow>(`/users/${id}`, input);
  return res.data;
}

export async function setUserStatus(id: string, status: UserStatus) {
  const res = await api.patch<UserRow>(`/users/${id}/status`, {
    status,
  });
  return res.data;
}

export async function setUserRoles(id: string, roles: RoleName[]) {
  const res = await api.patch<UserRow>(`/users/${id}/roles`, {
    roles,
  });
  return res.data;
}

export type PasswordResetResponse =
  | { success: true; resetToken?: string; expiresAt?: string }
  | { success: true };

export async function requestUserPasswordReset(id: string) {
  const res = await api.post<PasswordResetResponse>(
    `/users/${id}/password-reset`
  );
  return res.data;
}
