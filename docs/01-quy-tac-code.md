# 01 · Quy tắc code (bắt buộc)

> Mọi quy tắc có dấu ⚙️ được **ESLint kiểm tra tự động** khi commit (husky + lint-staged). Vi phạm = không commit được.
> Muốn đổi ngưỡng: sửa `SIZE_LIMITS` trong `core/be/eslint.config.js` và `core/fe/eslint.config.js`, cả nhóm biểu quyết.

## 1. Giới hạn kích thước ⚙️

| Giới hạn                         | BE (`.js`) | FE `.js` | FE `.jsx` | Lý do                                             |
| -------------------------------- | ---------- | -------- | --------- | ------------------------------------------------- |
| Dòng / file (không tính trống + comment) | **200** | **200**  | **200**   | Người mới đọc hết 1 file trong 5 phút              |
| Dòng / hàm                       | **60**     | **60**   | **80**    | 1 hàm = 1 việc, nhìn vừa 1 màn hình                |
| Độ sâu lồng `if/for`             | 3          | 3        | 3         | Quá 3 → tách hàm hoặc early return                 |
| Tham số / hàm                    | 4          | 4        | 4         | Nhiều hơn → gom thành 1 object `{ a, b, c }`       |
| Độ phức tạp (cyclomatic)         | 10         | 10       | 10        | Nhiều nhánh → tách hàm / dùng bảng tra (map)       |

**Khi file sắp vượt 200 dòng, tách theo bảng này:**

| Đang ở đâu         | Tách ra                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `*.service.js`     | Tách theo nghiệp vụ con: `class.service.js` → `class-enrollment.service.js`, `class-schedule.service.js` |
| `*.controller.js`  | Gần như không bao giờ dài; nếu dài là do logic lọt vào controller → đẩy xuống service          |
| `*.validation.js`  | Tách schema dùng chung ra `common/validators/` (vd: `date-range.schema.js`)                  |
| Page `.jsx`        | Tách cột bảng → `XxxTableColumns.jsx`; form → `XxxFormModal.jsx`; filter → `XxxFilters.jsx`; logic → hook `useXxx.js` |
| Component `.jsx`   | Tách phần lặp lại thành component con cùng thư mục                                            |
| `schema.prisma`    | Không giới hạn dòng, nhưng mỗi model một khối có comment đầu khối                             |

## 2. Quy tắc đặt tên ⚙️ (file/folder) + review (biến/hàm)

### File & thư mục

| Loại                          | Quy ước                     | Ví dụ                                                      |
| ----------------------------- | --------------------------- | ---------------------------------------------------------- |
| Thư mục (BE + FE)             | `kebab-case`                | `membership-plan/`, `components/common/`                   |
| BE: file trong module         | `<module>.<lớp>.js`         | `class.routes.js`, `class.controller.js`, `class.service.js`, `class.validation.js`, `class.mapper.js` |
| BE: middleware / util / config| `kebab-case.js`             | `auth.middleware.js`, `api-error.js`, `env.js`             |
| FE: component / page / layout | `PascalCase.jsx`            | `RolesPage.jsx`, `RoleFormModal.jsx`, `MainLayout.jsx`     |
| FE: hook                      | `useXxx.js`                 | `usePermission.js`, `useTableQuery.js`                     |
| FE: service / store / util    | `camelCase.js`, có thể thêm `.service` | `role.service.js`, `authStore.js`, `format.js`     |
| FE: mock                      | `<entity>.mock.js`          | `classes.mock.js`                                          |
| Test                          | `<file>.test.js` cạnh file hoặc trong `tests/` | `pagination.test.js`, `tests/rbac.test.js` |
| Prisma model / bảng           | Model `PascalCase` số ít, bảng `snake_case` số nhiều (`@@map`), cột `snake_case` (`@map`) | `model MembershipPlan … @@map("membership_plans")` |
| Tránh                         | Tên trùng từ khoá / built-in | Dùng `GymClass` thay vì `Class`; `gymClasses` thay vì `classes` |

### Biến, hàm, hằng (review kiểm tra)

| Loại                     | Quy ước                                 | Ví dụ                                                         |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| Biến, hàm, thuộc tính    | `camelCase`, danh từ / động từ rõ nghĩa | `activeMembership`, `calculateEndDate()`                       |
| Boolean                  | tiền tố `is / has / can / should`       | `isExpired`, `hasActivePlan`, `canEnroll`                      |
| Hàm                      | bắt đầu bằng động từ                    | `getById`, `createInvoice`, `sendReminder`, `toPublicUser`    |
| Hàm xử lý sự kiện (FE)   | `handleXxx` (trong component), prop `onXxx` | `handleSubmit`, `<Form onFinish={handleSubmit}>`            |
| Hằng số                  | `UPPER_SNAKE_CASE`, gom trong object `Object.freeze` | `PAGINATION.MAX_PAGE_SIZE`, `ROUTES.SYSTEM_ROLES`  |
| Component React          | `PascalCase`, tên = tên file            | `export function RoleFormModal()`                              |
| Enum (Prisma + FE const) | `UPPER_SNAKE`                           | `UserStatus.ACTIVE`, `INVOICE_STATUS.PAID`                     |
| Permission code          | `<module>.<action>` chữ thường          | `class.enroll_self`, `report.view`                             |
| Biến môi trường          | `UPPER_SNAKE`, FE có tiền tố `VITE_`    | `JWT_SECRET`, `VITE_API_URL`                                   |
| API route                | danh từ số nhiều, `kebab-case`          | `/membership-plans`, `/classes/:id/enrollments`               |
| Không viết tắt tuỳ tiện  | `member` không phải `mem`, `invoice` không phải `inv` (trừ `id`, `url`, `dto`) |                          |

## 3. Quy tắc comment

1. **Hàm export phải có JSDoc** ⚙️ (cảnh báo): mô tả 1 dòng + `@param` / `@returns` khi kiểu không hiển nhiên.
   ```js
   /**
    * Gia hạn gói: còn hạn thì cộng tiếp từ ngày hết hạn cũ, hết hạn thì tính từ hôm nay.
    * @param {number} membershipId
    * @param {number} planId
    * @returns {Promise<Membership>}
    */
   export const renew = async (membershipId, planId) => { … };
   ```
2. **Comment giải thích "tại sao", không lặp lại "cái gì"**:
   ```js
   // ❌ tăng i lên 1
   // ✅ Trừ 1 vì Prisma đếm page từ 0 còn FE gửi từ 1
   ```
3. **Đầu file** (1–3 dòng) cho file không hiển nhiên: file này làm gì, ai gọi nó. Ví dụ `authorize.middleware.js`.
4. **Business rule phải có comment dẫn nguồn**: `// BR-2.5: huỷ đăng ký trước giờ học tối thiểu X giờ (setting CLASS_CANCEL_MIN_HOURS_BEFORE)`.
5. **TODO/FIXME có tên và việc**: `// TODO(bao): xử lý webhook trùng`. Không TODO vô danh.
6. **Không commit code bị comment-out**. Git giữ lịch sử rồi.
7. Ngôn ngữ: tiếng Việt (có dấu hoặc không dấu đều được, nhất quán trong 1 file). **Chuỗi hiển thị cho người dùng bắt buộc có dấu.**

## 4. Quy tắc tái sử dụng

1. **Luật copy lần 2**: copy-paste một đoạn lần thứ 2 → dừng lại, tách thành hàm/component/hook dùng chung, rồi cả 2 chỗ gọi nó.
2. **Trước khi viết mới, tìm trong kho có sẵn** (grep tên hàm 30 giây):

   | Cần                                   | Dùng cái có sẵn                                                        |
   | ------------------------------------- | ---------------------------------------------------------------------- |
   | BE: trả response                      | `sendSuccess / sendCreated / sendNoContent` (`common/utils/api-response.js`) |
   | BE: báo lỗi                           | `ApiError.badRequest / notFound / conflict / businessRule …`           |
   | BE: validate                          | `validate({ body, query, params })` + `paginationQuerySchema`          |
   | BE: phân trang                        | `toPrismaPage`, `buildPageMeta`                                        |
   | BE: bảo vệ route                      | `authenticate`, `authorize(PERMISSIONS.X)`                             |
   | BE: đọc số nghiệp vụ                  | `settingService.getValue(SETTING_KEYS.X)`                              |
   | BE: ghi nhật ký                       | `recordAudit({ … })`                                                   |
   | BE: user không lộ password            | `toPublicUser`, `USER_WITH_ROLE`                                       |
   | FE: gọi API                           | `http` (axios instance) qua `services/*.service.js`, không gọi axios trực tiếp |
   | FE: bảng phân trang server            | `useTableQuery()`                                                      |
   | FE: ẩn/hiện theo quyền                | `usePermission().can()`, `<PermissionGate>`                            |
   | FE: tiêu đề trang, loading, tag trạng thái | `PageHeader`, `PageLoading`, `StatusTag`                          |
   | FE: format tiền / ngày                | `formatCurrency`, `formatDate`, `formatDateTime`                       |
   | FE: thông báo                         | `const { message, modal } = App.useApp()`                              |
   | FE: khoảng cách / màu                 | `SPACING.*`, token trong `theme/theme.js`                              |

3. **Nơi đặt code dùng chung**:
   - Dùng cho cả BE + FE (hằng số thuần): `core/shared/src/`
   - BE dùng ở ≥ 2 module: `core/be/src/common/{middlewares,utils,errors,validators}`
   - FE dùng ở ≥ 2 trang: `core/fe/src/{components/common,hooks,utils}`
   - Chỉ 1 module/trang dùng: để trong thư mục module/trang đó.
4. **Component nhận props, không tự fetch** trừ page/container. Component chung không import store/service.
5. **Không sửa hàm dùng chung để phục vụ 1 chỗ** — thêm tham số tuỳ chọn hoặc tạo hàm mới, không đổi hành vi cũ.

## 5. KHÔNG hardcode ⚙️

Nguyên tắc: **thứ gì có thể thay đổi mà không đổi logic thì không được nằm trong logic.**

| Thứ                                            | ❌ Cấm                                   | ✅ Đặt ở                                                             |
| ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| URL, host, port, secret, API key               | `'http://localhost:3000'`, `'my-secret'` | `.env` → `env.X` (`src/config/env.js`). ESLint chặn `process.env` / `import.meta.env` ngoài file config |
| Số nghiệp vụ (7 ngày nhắc hạn, 12 giờ huỷ lớp, 15 phút chờ thanh toán, tiền tố hoá đơn) | `if (hours < 12)` | Bảng `system_settings` → `await settingService.getValue(SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE)`. Khai báo key + default trong `core/shared/src/settings.js`, seed 1 lần, sửa qua UI Cấu hình |
| Số kỹ thuật (page size, timeout, độ dài mật khẩu) | `take: 10`                            | `constants/index.js` (`PAGINATION.DEFAULT_PAGE_SIZE`). ESLint `no-magic-numbers` chặn số lẻ trong logic |
| Trạng thái, loại                               | `status === 'PAID'`                     | Prisma enum (`Enums.InvoiceStatus.PAID`) ở BE; `INVOICE_STATUS.PAID` ở FE constants |
| Quyền                                          | `'role.read'`                            | `PERMISSIONS.ROLE_READ` từ `@scms/shared`                            |
| **Vai trò**                                    | `user.role.code === 'CENTER_MANAGER'`   | **Không bao giờ.** Kiểm tra permission, không kiểm tra role. Tên role chỉ có trong `prisma/seed/**` |
| Danh sách chọn (bộ môn, phòng, gói)            | mảng cứng trong component               | Lấy từ API; mock chỉ dùng tạm từ `src/mocks/` và phải xoá khi API có |
| Đường dẫn route FE                             | `navigate('/system/roles')`             | `navigate(ROUTES.SYSTEM_ROLES)`                                      |
| Màu, khoảng cách                               | `style={{ color: '#1677ff', margin: 17 }}` | token `theme/theme.js`, `SPACING.MD`                              |
| Mã lỗi                                         | `if (err.message === 'Not found')`      | `err.code === ERROR_CODES.NOT_FOUND`                                 |
| Text hiển thị                                  | (được phép viết thẳng trong component)  | Nếu sau này cần đa ngôn ngữ mới tách i18n                            |

**Cách nghĩ khi thêm 1 con số**: "Center Manager có thể muốn đổi số này không?" → có → `system_settings`; không nhưng dev có thể đổi → `constants`; là bí mật/khác nhau giữa máy → `.env`.

## 6. Xử lý lỗi & bất đồng bộ

- BE: **không** `try/catch` trong controller/service trừ khi cần chuyển đổi lỗi. Express 5 tự bắt lỗi async → `errorHandler`. Lỗi nghiệp vụ: `throw ApiError.businessRule('…')`.
- BE: không `console.log` ⚙️ → dùng `logger.info({ ctx }, 'msg')` / `req.log`.
- FE: không `console.log` ⚙️ trong code commit. Lỗi API hiển thị qua `message.error(error.message)`; lỗi validate field qua `form.setFields(error.toFormFields())`.
- FE: luôn có trạng thái loading (`isPending`) và empty (antd Table tự có).
- Không `alert()`, `confirm()` – dùng `Modal.confirm` / `Popconfirm`.

## 7. Checklist trước khi tạo PR

- [ ] `npm run lint` sạch, `npm test` pass (BE cần MySQL đang chạy)
- [ ] Không file > 200 dòng, không hàm > 60/80 dòng
- [ ] Không URL/secret/số nghiệp vụ/tên role trong code
- [ ] Hàm export có JSDoc; comment "tại sao" ở chỗ khó
- [ ] Đã tìm và dùng lại thứ có sẵn (mục 4) thay vì copy
- [ ] Thêm permission/setting mới → đã sửa `core/shared`, chạy `npm run db:seed`, ghi vào `docs/03-rbac-dynamic.md`
- [ ] Sửa `schema.prisma` → có migration (`npm run db:migrate`) và commit thư mục `prisma/migrations`
- [ ] UI: chụp ảnh/GIF vào PR; đã thử với tài khoản không có quyền (phải thấy 403 / nút ẩn)
