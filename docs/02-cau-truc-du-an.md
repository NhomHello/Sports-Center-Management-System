# 02 · Cấu trúc dự án & cách thêm module

## 1. Tổng quan (npm workspaces)

```
Sports-Center-Management-System/
├── package.json            scripts gốc: dev / setup / lint / test / db:*
├── docker-compose.yml      MySQL 8 (container scms-mysql)
├── scripts/                dev.mjs (một lệnh chạy tất cả), setup.mjs
├── docs/                   tài liệu (bạn đang đọc)
└── core/
    ├── shared/             @scms/shared – hằng số dùng chung BE + FE
    │   └── src/  permissions.js  settings.js  error-codes.js
    ├── be/                 @scms/be – Express API
    └── fe/                 @scms/fe – React + antd
```

## 2. Backend – MVC theo module

```
core/be/
├── prisma/
│   ├── schema.prisma          MODEL (M trong MVC) – toàn bộ bảng
│   ├── migrations/            do `npm run db:migrate` sinh, PHẢI commit
│   └── seed/                  index.js (idempotent), roles.seed.js, mock/
├── prisma.config.mjs          Prisma 7: DATABASE_URL, đường dẫn seed
├── src/
│   ├── server.js              listen + graceful shutdown (entry)
│   ├── app.js                 express app: helmet/cors/json/log/rate-limit → routes → 404 → error
│   ├── routes.js              gắn router của từng module vào /api/v1/…
│   ├── config/                env.js (zod, NƠI DUY NHẤT đọc process.env) · db.js (prisma) · logger.js
│   ├── constants/             hằng số kỹ thuật (PAGINATION, AUTH, VALIDATION, AUDIT_ACTIONS…)
│   ├── common/
│   │   ├── errors/api-error.js
│   │   ├── middlewares/       auth · authorize · validate · error
│   │   └── utils/             api-response · jwt · password · pagination · audit
│   └── modules/<ten-module>/
│       ├── <ten>.routes.js      ROUTE: url + middleware (authenticate, authorize, validate) + controller
│       ├── <ten>.controller.js  CONTROLLER: đọc req.validated → gọi service → sendSuccess. KHÔNG có nghiệp vụ
│       ├── <ten>.service.js     SERVICE: nghiệp vụ + Prisma. KHÔNG biết req/res
│       ├── <ten>.validation.js  Zod schema cho body/query/params
│       └── <ten>.mapper.js      (tuỳ chọn) biến record DB → DTO trả về
└── tests/                     test tích hợp (supertest) + helpers/
```

**Luồng 1 request**

```
Client → app.js (helmet, cors, json, pino-http, rate-limit)
       → routes.js → <module>.routes.js
       → authenticate (JWT → req.user)
       → authorize(PERMISSIONS.X) (đọc quyền role từ DB, cache 30s)
       → validate(schema) (→ req.validated)
       → controller → service → prisma
       → sendSuccess(res, { data, meta })
   lỗi ở bất kỳ đâu → errorHandler → { success:false, code, message, details }
```

**Vì sao module thay vì thư mục `controllers/ services/ routes/` chung?** Mỗi người làm 1 flow ở 1 thư mục riêng → ít conflict git, người mới muốn sửa "lớp học" chỉ mở `modules/class/`. Vẫn là MVC: Model = Prisma, View = FE, Controller = controller, Service = nghiệp vụ.

### Checklist thêm module BE (ví dụ `membership-plan`)

1. **Model**: thêm `model MembershipPlan { … @@map("membership_plans") }` vào `schema.prisma` → `npm run db:migrate` (đặt tên `add_membership_plan`) → commit `prisma/migrations/`.
2. **Permission**: đã có sẵn trong `core/shared/src/permissions.js` (`membership_plan.read/create/update/delete`). Nếu thiếu → thêm action → `npm run db:seed`.
3. Tạo thư mục `src/modules/membership-plan/` với 4 file, chép cấu trúc từ `modules/role/` (module mẫu đầy đủ CRUD):
   - `membership-plan.validation.js`: `createSchema`, `updateSchema`, `idSchema`, `listSchema` (dùng `paginationQuerySchema.extend`)
   - `membership-plan.service.js`: `list / getById / create / update / remove`, dùng `ApiError`, `recordAudit`
   - `membership-plan.controller.js`: mỗi hàm 3–5 dòng
   - `membership-plan.routes.js`: `router.use(authenticate)` + từng route `authorize(PERMISSIONS.MEMBERSHIP_PLAN_X)`
4. Gắn vào `src/routes.js`: `router.use('/membership-plans', membershipPlanRoutes);`
5. Số nghiệp vụ mới (nếu có) → `core/shared/src/settings.js` + seed, đọc bằng `settingService.getValue`.
6. Test: thêm `tests/membership-plan.test.js` (copy `tests/role.test.js`), ghi test case vào `docs/test-cases/`.
7. `npm run lint` → PR.

## 3. Frontend – React + antd

```
core/fe/src/
├── main.jsx / App.jsx        providers: QueryClient → ConfigProvider(vi_VN, theme) → antd App → Router
├── config/                   env.js (NƠI DUY NHẤT đọc import.meta.env) · queryClient.js
├── constants/                ROUTES, QUERY_KEYS, TABLE, USER_STATUS(_META), DATE_FORMATS…
├── theme/theme.js            design token antd + SPACING (Khôi/Khải chốt design system ở đây)
├── services/                 http.js (axios: gắn token, unwrap, xử lý 401) · <entity>.service.js
├── stores/authStore.js       zustand: token (persist), user, permissions
├── hooks/                    useAuth (đọc store) · useAuthProfile (nạp /me, chỉ ProtectedRoute dùng) · usePermission · useTableQuery
├── utils/                    permission.js · format.js · apiClientError.js
├── router/
│   ├── routeRegistry.jsx     ★ khai báo trang + permission + menu (sidebar tự sinh)
│   ├── AppRouter.jsx         createBrowserRouter
│   ├── ProtectedRoute.jsx    cần đăng nhập
│   ├── PermissionRoute.jsx   cần quyền → 403
│   └── buildMenuItems.js     registry → antd Menu items theo quyền
├── layouts/                  MainLayout (sidebar + header) · AuthLayout
├── components/common/        PageHeader · PageLoading · PermissionGate · StatusTag
├── pages/<khu-vuc>/<trang>/  XxxPage.jsx (+ XxxTableColumns.jsx, XxxFormModal.jsx, XxxFilters.jsx)
└── mocks/                    dữ liệu giả cho màn hình chưa có API (xoá khi API xong)
```

**Luồng dữ liệu**: Page → `useQuery({ queryFn: xxxService.list })` → `http` → API. Mutation → `useMutation` → `invalidateQueries(QUERY_KEYS.X)`. Trang mẫu: `pages/system/roles/` (CRUD + modal + ma trận quyền), `pages/system/users/` (bảng phân trang server + filter).

### Checklist thêm trang FE (ví dụ "Gói tập")

1. `constants/index.js`: thêm `ROUTES.MEMBERSHIP_PLANS = '/membership-plans'`, `QUERY_KEYS.MEMBERSHIP_PLANS = ['membership-plans']`.
2. `services/membershipPlan.service.js`: `listMembershipPlans`, `createMembershipPlan`, … (chỉ gọi `http`).
3. `pages/membership/plans/MembershipPlansPage.jsx` (+ `MembershipPlanTableColumns.jsx`, `MembershipPlanFormModal.jsx`). Copy từ `pages/system/roles/`.
4. `router/routeRegistry.jsx`: thêm `{ path, element: <MembershipPlansPage />, permission: PERMISSIONS.MEMBERSHIP_PLAN_READ, menu: { label: 'Gói tập', icon, group: 'Hội viên' } }`. Sidebar tự hiện cho ai có quyền.
5. Nút "Thêm/Sửa/Xoá" bọc `can(PERMISSIONS.MEMBERSHIP_PLAN_CREATE)` / `<PermissionGate>`.
6. Chưa có API? Dùng `mockRequest(membershipPlans)` từ `@/mocks` trong `queryFn`, ghi `// TODO(ten): thay bằng API` và xoá khi BE xong.
7. Test thủ công với 2 tài khoản: có quyền và không có quyền.

## 4. Shared (`core/shared`)

| File             | Chứa                                              | Ai sửa                    |
| ---------------- | ------------------------------------------------- | ------------------------- |
| `permissions.js` | Registry permission (module/action/label)         | Người thêm tính năng mới  |
| `settings.js`    | Key + giá trị mặc định của số nghiệp vụ           | Người thêm business rule  |
| `error-codes.js` | Mã lỗi thống nhất BE ↔ FE                         | Hiếm khi                  |

Sửa xong luôn chạy `npm run db:seed` để DB đồng bộ.

## 5. Chuẩn lệnh (root)

`npm run dev` · `npm run dev -- --be-only` · `npm run db:migrate` · `npm run db:seed` · `npm run db:studio` · `npm run lint` · `npm test` · `npm run build`
