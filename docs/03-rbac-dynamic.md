# 03 · RBAC động (Dynamic Role-Based Access Control)

## 1. Ý tưởng

| Khái niệm      | Là gì                                                      | Sống ở đâu                                | Ai thay đổi                       |
| -------------- | ---------------------------------------------------------- | ----------------------------------------- | --------------------------------- |
| **Permission** | Một việc hệ thống cho phép làm: `class.enroll_self`         | Registry `core/shared/src/permissions.js` → seed vào bảng `permissions` | Dev, khi thêm tính năng |
| **Role**       | Tập hợp permission, có tên hiển thị                         | Bảng `roles` + `role_permissions`         | **Center Manager qua UI**, không cần dev |
| **User.roleId**| Mỗi user thuộc đúng 1 role                                  | Bảng `users`                              | Center Manager qua UI             |

**Code không biết role tồn tại.** Code chỉ hỏi: "user này có permission X không?". Vì vậy Center Manager có thể tạo role "Nhân viên kinh doanh", "Trưởng ca", gán quyền tuỳ ý, đổi quyền lúc 3h sáng — không sửa code, không deploy, không đăng nhập lại.

## 2. Luồng

```
Login → JWT { sub: userId }  (KHÔNG chứa role/permission trong token)
FE   → GET /auth/me → { user, permissions: ['dashboard.view', 'class.read', …] } → lưu store
FE   → sidebar = buildMenuItems(routeRegistry, can) ; nút = can(PERMISSIONS.X)
BE   → mỗi request: authenticate (JWT → user) → authorize(PERMISSIONS.X)
         → permissionService.getCodesByRoleId(user.roleId)  (DB, cache 30s – PERMISSION_CACHE_TTL_SECONDS)
         → có ≥ 1 quyền yêu cầu → next() ; không → 403 FORBIDDEN
Sửa role → role.service.update → invalidateRoleCache(roleId) → hiệu lực ngay
```

FE ẩn nút chỉ để đẹp; **BE luôn là nơi quyết định**. Không bao giờ tin FE.

## 3. Dùng trong code

**BE**
```js
import { PERMISSIONS } from '@scms/shared';
router.post('/', authorize(PERMISSIONS.CLASS_CREATE), validate(createClassSchema), controller.create);
router.get('/:id/roster', authorize(PERMISSIONS.CLASS_VIEW_ROSTER, PERMISSIONS.CLASS_READ_ALL), …); // service kiểm tra thêm phân công
```
Cần logic "chỉ xem của chính mình" (member xem gói của mình): permission `membership.read_own` + trong service lọc theo `req.user.id`. Quyền `read_all` thì không lọc. Đây là cách tách **quyền** (RBAC) và **phạm vi dữ liệu** (ownership) mà không đụng tên role.

**FE**
```jsx
const { can } = usePermission();
{can(PERMISSIONS.CLASS_CREATE) && <Button>Tạo lớp</Button>}
<PermissionGate permission={[PERMISSIONS.INVOICE_READ_ALL, PERMISSIONS.INVOICE_READ_OWN]}>…</PermissionGate>
// route: khai báo `permission` trong routeRegistry.jsx → PermissionRoute tự chặn
```

**❌ Cấm (ESLint chặn chuỗi tên role)**
```js
if (user.role.code === 'CENTER_MANAGER') …
if (user.role.name === 'Lễ tân') …
const isAdmin = user.roleId === 1;
```

## 4. Thêm permission mới (5 phút)

1. `core/shared/src/permissions.js`: thêm action vào module có sẵn hoặc module mới:
   ```js
   { module: 'attendance', label: 'Điểm danh', actions: { mark: 'Điểm danh học viên', read_own: 'Xem điểm danh của mình' } }
   ```
2. `npm run db:seed` → bảng `permissions` có thêm `attendance.mark`, `attendance.read_own`; role quản trị (`permissions: 'ALL'` trong `roles.seed.js`) tự nhận. Role khác: Center Manager tick trên UI **Vai trò & quyền**, hoặc bạn thêm vào mảng của role trong `roles.seed.js` nếu muốn có sẵn khi DB mới (chỉ áp dụng cho DB tạo mới; DB cũ giữ nguyên quyền manager đã chỉnh).
3. BE: `authorize(PERMISSIONS.ATTENDANCE_MARK)`. FE: `can(PERMISSIONS.ATTENDANCE_MARK)`.
4. Ghi vào bảng mục 6 dưới đây.

Quy ước tên action: `read / create / update / delete` cho CRUD; `read_own` (chỉ của mình) vs `read_all`; hành động đặc thù dùng động từ rõ (`enroll_self`, `record_cash`, `export`).

## 5. Bảng liên quan

```
roles            id, code (UNIQUE, IN_HOA), name, description, is_system, is_default
permissions      id, code (UNIQUE, module.action), module, module_label, action, label
role_permissions role_id, permission_id  (PK kép, cascade)
users            …, role_id
audit_logs       ai, làm gì, lên entity nào, lúc nào (mọi thay đổi role/quyền/user đều ghi)
```

- `is_system = true`: role seed sẵn, **không xoá được** (vẫn sửa quyền được).
- `is_default = true`: role gán cho tài khoản **tự đăng ký** (chỉ 1 role). Đổi bằng nút "Đặt mặc định" — không hardcode "MEMBER" trong code đăng ký.
- Role đang có user → không xoá được (đổi role cho user trước).
- Seed role quản trị luôn được cấp **toàn bộ** permission mỗi lần seed.

## 6. Danh sách permission hiện có

Xem `core/shared/src/permissions.js` (nguồn sự thật). Tóm tắt theo flow:

| Module            | Actions                                                                                      | Flow |
| ----------------- | -------------------------------------------------------------------------------------------- | ---- |
| dashboard         | view                                                                                         | –    |
| user              | read, create, update, delete, assign_role                                                    | –    |
| role              | read, create, update, delete                                                                 | –    |
| setting           | read, update                                                                                 | –    |
| audit             | read                                                                                         | –    |
| member            | read, create, update                                                                         | 1    |
| membership_plan   | read, create, update, delete                                                                 | 1    |
| membership        | read_own, purchase, manage, read_all                                                         | 1    |
| subject, room     | read, create, update, delete                                                                 | 2    |
| class             | read, read_all, create, update, delete, enroll_self, cancel_self, enroll_for_member, view_roster | 2    |
| schedule          | view_own, view_teaching                                                                      | 2    |
| payment           | checkout, record_cash, read_own, read_all                                                    | 3    |
| invoice           | read_own, read_all, export                                                                   | 3    |
| report            | view                                                                                         | 3    |

Role seed ban đầu (`prisma/seed/roles.seed.js`): Quản lý trung tâm (ALL), Lễ tân, Huấn luyện viên, Hội viên (mặc định khi đăng ký). Đây là **gợi ý ban đầu**, Center Manager toàn quyền đổi.

## 7. Test đã có

`core/be/tests/rbac.test.js`: role trống → 403; cấp quyền qua API → 200 ngay; thu hồi → 403; `/auth/me` phản ánh đúng. Chạy `npm test -w @scms/be` (cần MySQL).

## 8. Phạm vi lớp và lịch Sprint 2

- `class.read_all` mở phạm vi quản lý toàn trung tâm và roster. Seed cấp cho role quản trị; role đã có của nhân viên/HLV giữ quyền manager đã cấu hình.
- `class.read` mở lớp đang đăng ký, không cấp phạm vi quản lý. HLV có `schedule.view_teaching` mà không có `class.read_all` chỉ xem lớp được phân công, kể cả truy cập chi tiết bằng URL.
- `class.view_roster` vẫn cần HLV phụ trách lớp; quyền này tự nó không mở roster mọi lớp. `class.enroll_for_member` cho đăng ký/huỷ hộ và đọc điều kiện booking của member được chọn, không cấp quyền roster.
- `schedule.view_own` luôn lấy userId từ token. `schedule.view_teaching` lọc theo coachId của người đăng nhập. `class.read_all` không làm endpoint `/schedule/me` đọc lịch của người khác.

Xem [hợp đồng Sprint 2](sprint-2-api.md) và [test phân quyền](test-cases/TC-F2-class-booking.md).
