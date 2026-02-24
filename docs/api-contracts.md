# API Contracts

Base URL is configured by `VITE_API_BASE_URL`.

All requests use the shared Axios client in `src/api/client.ts`, which applies:

- `Authorization: Bearer <accessToken>` when present
- Automatic refresh and one-time retry on `401`

## Auth (`src/api/auth.ts`)

### `POST /auth/login`

- Function: `login(email, password)`
- Body:
  - `email: string`
  - `password: string`
- Response (`LoginResponse`):
  - `accessToken: string`
  - `refreshToken: string`

### `POST /auth/logout`

- Function: `logout()`
- Response (`LogoutResponse`):
  - `success: boolean`

### `POST /auth/reset-password`

- Function: `resetPassword(input)`
- Body (`ResetPasswordInput`):
  - `resetToken: string`
  - `newPassword: string`
- Response:
  - `{ success: true }`

## Users (`src/api/users.ts`)

### `GET /users`

- Function: `getUsers(params?)`
- Query (`ListUsersParams`):
  - `search?: string`
  - `status?: 'ACTIVE' | 'DISABLED'`
  - `role?: 'ADMIN' | 'STAFF' | 'VIEWER'`
  - `page?: number`
  - `limit?: number`
  - `sort?: 'createdAt' | 'email' | 'name' | 'lastLoginAt'`
  - `order?: 'asc' | 'desc'`
- Response: `Paged<UserRow>`

### `GET /users/:id`

- Function: `getUser(id)`
- Response: `UserRow`

### `POST /users`

- Function: `createUser(input)`
- Body (`CreateUserInput`):
  - `email: string`
  - `name: string`
  - `initialPassword?: string`
  - `roles?: RoleName[]`
- Response: `UserRow`

### `PATCH /users/:id`

- Function: `updateUser(id, input)`
- Body (`UpdateUserInput`):
  - `email?: string`
  - `name?: string`
- Response: `UserRow`

### `PATCH /users/:id/status`

- Function: `setUserStatus(id, status)`
- Body:
  - `status: 'ACTIVE' | 'DISABLED'`
- Response: `UserRow`

### `PATCH /users/:id/roles`

- Function: `setUserRoles(id, roles)`
- Body:
  - `roles: RoleName[]`
- Response: `UserRow`

### `POST /users/:id/password-reset`

- Function: `requestUserPasswordReset(id)`
- Response (`PasswordResetResponse`):
  - `{ success: true }`
  - Optional fields: `resetToken?: string`, `expiresAt?: string`

## Products (`src/api/products.ts`)

### `GET /products`

- Function: `getProducts(params?)`
- Query (`ProductListParams`):
  - `search?: string`
  - `status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'`
  - `categoryId?: string`
  - `page?: number`
  - `limit?: number`
  - `sort?: 'createdAt' | 'priceCents' | 'name'`
  - `order?: 'asc' | 'desc'`
- Response: `Paged<Product>`

### `GET /products/:id`

- Function: `getProduct(id)`
- Response: `Product`

### `POST /products`

- Function: `createProduct(input)`
- Body: `UpsertProductInput`
- Response: `Product`

### `PATCH /products/:id`

- Function: `updateProduct(id, input)`
- Body: `Partial<UpsertProductInput>`
- Response: `Product`

### `DELETE /products/:id`

- Function: `deleteProduct(id)`
- Response: `void`

### `POST /products/image-upload-url`

- Function: `createProductImageUploadUrl(input)`
- Body:
  - `productId: string`
  - `filename: string`
  - `contentType: string`
  - `sizeBytes: number`
- Response:
  - `bucket: string`
  - `path: string`
  - `token: string`
  - `signedUrl: string`
  - `publicUrl: string | null`

### `POST /products/:productId/image/commit`

- Function: `commitProductImage(productId, input)`
- Body:
  - `imagePath: string | null`
  - `imageUrl: string | null`
- Response: `void`

### `POST /products/:productId/image/remove`

- Function: `removeProductImage(productId, expectedImagePath?)`
- Body:
  - `expectedImagePath?: string`
- Response: `void`

## Categories (`src/api/categories.ts`)

### `GET /categories`

- Function: `getCategories()`
- Response: `Category[]`

### `POST /categories`

- Function: `createCategory(name)`
- Body:
  - `name: string`
- Response: `Category`

### `PATCH /categories/:id`

- Function: `updateCategory(id, name)`
- Body:
  - `name: string`
- Response: `Category`

### `DELETE /categories/:id`

- Function: `deleteCategory(id)`
- Response: `void`

## Audit (`src/api/audit.ts`)

### `GET /audit`

- Function: `getAuditLogs(params?)`
- Query:
  - `page?: number`
  - `limit?: number`
  - `action?: string`
  - `entityType?: string`
  - `entityId?: string`
  - `actorUserId?: string`
  - `createdFrom?: string`
  - `createdTo?: string`
  - `sort?: 'createdAt'`
  - `order?: 'asc' | 'desc'`
- Response: `Paged<AuditLog>`

## Dashboard (`src/api/dashboard.ts`)

### `GET /dashboard/metrics`

- Function: `getMetrics()`
- Response: `Metrics`

### `GET /dashboard/activity`

- Function: `getActivity(limit = 10)`
- Query:
  - `limit: number`
- Response: `Activity[]`

### `GET /dashboard/kpis`

- Function: `getDashboardKpis()`
- Response: `DashboardKpis`

### `GET /dashboard/audit-trend`

- Function: `getAuditTrend(days)`
- Query:
  - `days: number`
- Response:
  - `from: string`
  - `days: number`
  - `data: { day: string; count: number }[]`

### `GET /dashboard/audit-breakdown`

- Function: `getAuditBreakdown(days)`
- Query:
  - `days: number`
- Response:
  - `from: string`
  - `days: number`
  - `data: { action: string; count: number }[]`

### `GET /dashboard/product-status`

- Function: `getProductStatus()`
- Response:
  - `{ status: string; count: number }[]`

### `GET /dashboard/category-coverage`

- Function: `getCategoryCoverage()`
- Response:
  - `top`: category usage summary
  - `all`: full category usage
  - `zeroCategories`: categories with zero products

### `GET /dashboard/needs-attention`

- Function: `getNeedsAttention()`
- Response groups:
  - `missingImages`
  - `noCategory`
  - `recentlyDisabledUsers`
  - `pendingResets`

## Shared Pagination Shape

Current API modules define similar `Paged<T>` types:

- `data: T[]`
- `meta.page: number`
- `meta.limit: number`
- `meta.total: number`
- `meta.totalPages: number`

Recommended future cleanup: centralize this into one exported type to avoid drift.
