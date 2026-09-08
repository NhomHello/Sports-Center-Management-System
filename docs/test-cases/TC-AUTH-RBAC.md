# Test case: Auth, RBAC động, Role

Tiền điều kiện chung: `npm run dev` đã chạy, DB đã seed (admin + mock user).

## Auth (`core/be/tests/auth.test.js`)

| ID         | Mục tiêu                                   | Tiền điều kiện        | Bước                                              | Dữ liệu                                  | Kết quả mong đợi                                                  | Tự động | Trạng thái |
| ---------- | ------------------------------------------ | --------------------- | ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- | ------- | ---------- |
| TC-AUTH-01 | Đăng nhập đúng                             | admin đã seed         | POST /auth/login                                  | admin@scms.local / Admin@123             | 200, `data.accessToken` string, `user.email` đúng, **không** có `passwordHash` | ✅ | Pass |
| TC-AUTH-02 | Sai mật khẩu                               | –                     | POST /auth/login                                  | admin / sai                              | 401, code `INVALID_CREDENTIALS`                                   | ✅      | Pass       |
| TC-AUTH-03 | Thiếu email                                | –                     | POST /auth/login                                  | `{ password }`                           | 400 `VALIDATION_ERROR`, `details[].field === 'email'`             | ✅      | Pass       |
| TC-AUTH-04 | /me không token                            | –                     | GET /auth/me                                      | –                                        | 401 `UNAUTHORIZED`                                                | ✅      | Pass       |
| TC-AUTH-05 | /me token rác                              | –                     | GET /auth/me + Bearer abc                         | –                                        | 401                                                               | ✅      | Pass       |
| TC-AUTH-06 | /me hợp lệ                                 | đã login              | GET /auth/me                                      | –                                        | 200, `user.role.name`, `permissions[]` không rỗng                 | ✅      | Pass       |
| TC-AUTH-07 | Đăng ký trùng email                        | admin tồn tại         | POST /auth/register                               | email admin                              | 409 `CONFLICT`                                                    | ✅      | Pass       |
| TC-AUTH-08 | Đăng ký mật khẩu ngắn                      | –                     | POST /auth/register                               | password `123`                           | 400                                                               | ✅      | Pass       |
| TC-AUTH-09 | Đăng ký thành công nhận role mặc định       | có role `isDefault`   | POST /auth/register                               | email mới                                | 201, `data.role.id` = role isDefault                              | ⬜ (viết thêm) | Chưa chạy |
| TC-AUTH-10 | Tài khoản bị khoá không đăng nhập được      | user status INACTIVE  | POST /auth/login                                  | user bị khoá                             | 403 `ACCOUNT_INACTIVE`                                            | ⬜      | Chưa chạy  |
| TC-AUTH-11 | Token hết hạn → FE tự đăng xuất            | JWT_EXPIRES_IN ngắn   | Đợi hết hạn, bấm bất kỳ menu                      | –                                        | Về trang login, không crash                                        | thủ công | Chưa chạy |
| TC-AUTH-12 | Rate limit login                            | AUTH_RATE_LIMIT_MAX=20| Gọi login sai 21 lần / 15 phút                    | –                                        | Lần 21 trả 429                                                    | thủ công | Chưa chạy |

## RBAC động (`core/be/tests/rbac.test.js`)

| ID         | Mục tiêu                                          | Tiền điều kiện                          | Bước                                                             | Kết quả mong đợi                                  | Tự động | Trạng thái |
| ---------- | ------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | ------- | ---------- |
| TC-RBAC-01 | Role không có quyền                               | role TEST_ trống, user thuộc role       | GET /roles bằng token user                                       | 403 `FORBIDDEN`                                   | ✅      | Pass       |
| TC-RBAC-02 | Cấp quyền có hiệu lực ngay, không login lại       | như trên                                | admin PUT /roles/:id `{permissionCodes:['role.read']}` → user GET /roles | 200, mảng role                              | ✅      | Pass       |
| TC-RBAC-03 | Có read nhưng không create                        | role chỉ có role.read                   | user POST /roles                                                 | 403                                               | ✅      | Pass       |
| TC-RBAC-04 | Thu hồi quyền                                     | –                                       | admin PUT permissionCodes [] → user GET /roles                   | 403                                               | ✅      | Pass       |
| TC-RBAC-05 | /me phản ánh quyền hiện tại                       | –                                       | admin cấp dashboard.view → user GET /auth/me                     | `permissions` = `['dashboard.view']`              | ✅      | Pass       |
| TC-RBAC-06 | Sidebar FE ẩn/hiện theo quyền                     | login letan@ (không có role.read)       | Xem sidebar                                                      | Không có mục "Vai trò & quyền"; gõ URL /system/roles → trang 403 | thủ công | Chưa chạy |
| TC-RBAC-07 | Nút ẩn theo quyền                                 | role có role.read, không có role.create | Vào /system/roles                                                | Không thấy nút "Thêm vai trò"                     | thủ công | Chưa chạy  |
| TC-RBAC-08 | Manager tạo role mới trên UI, gán cho user, user dùng được | admin                           | Tạo role "Trưởng ca" tick quyền; đổi role user; user login       | Menu/nút đúng theo quyền đã tick                  | thủ công | Chưa chạy |

## Role CRUD (`core/be/tests/role.test.js`)

| ID         | Mục tiêu                              | Bước                                               | Dữ liệu                              | Kết quả mong đợi                                | Tự động | Trạng thái |
| ---------- | ------------------------------------- | -------------------------------------------------- | ------------------------------------ | ----------------------------------------------- | ------- | ---------- |
| TC-ROLE-01 | Tạo role hợp lệ                       | POST /roles (admin)                                | code TEST_ROLE_x, 1 permission       | 201, `permissionCodes` đúng                     | ✅      | Pass       |
| TC-ROLE-02 | Trùng code                            | POST /roles cùng code                              | –                                    | 409                                             | ✅      | Pass       |
| TC-ROLE-03 | Code sai định dạng                    | POST /roles                                        | `sai_dinh_dang`                      | 400 `VALIDATION_ERROR`                          | ✅      | Pass       |
| TC-ROLE-04 | Permission không tồn tại              | PUT /roles/:id                                     | `['khong.ton.tai']`                  | 400, `details.missing` liệt kê                  | ✅      | Pass       |
| TC-ROLE-05 | Không xoá role hệ thống               | DELETE /roles/:id (isSystem)                       | –                                    | 422 `BUSINESS_RULE_VIOLATION`                   | ✅      | Pass       |
| TC-ROLE-06 | Xoá role test                         | DELETE → GET                                       | –                                    | 204 rồi 404                                     | ✅      | Pass       |
| TC-ROLE-07 | Không xoá role đang có user           | DELETE role của letan@                             | –                                    | 422, message hướng dẫn đổi role trước           | ⬜      | Chưa chạy  |
| TC-ROLE-08 | Đặt role mặc định                     | PATCH /roles/:id/default                           | –                                    | 200, chỉ 1 role isDefault=true                  | ⬜      | Chưa chạy  |
| TC-ROLE-09 | Không tự đổi role của chính mình      | PATCH /users/:adminId/role                         | –                                    | 422                                             | ⬜      | Chưa chạy  |
| TC-ROLE-10 | Không tự khoá chính mình              | PATCH /users/:adminId/status INACTIVE              | –                                    | 422                                             | ⬜      | Chưa chạy  |
