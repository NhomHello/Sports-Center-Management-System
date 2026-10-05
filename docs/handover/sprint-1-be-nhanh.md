# Sprint 1 – BE – Nhanh

- Nhánh: `sprint-1/be-nhanh`
- Thời gian: 21/09 → 05/10
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 9 | UC-UM-01 | Đăng ký tài khoản | ✅ Khôi đã làm (BE+FE) | POST /auth/register + LoginPage |
| 10 | UC-UM-13 | Đổi mật khẩu | ✅ Khôi đã làm (BE+FE) | POST /auth/password-changes + ProfilePage |
| 11 | UC-UM-02 | Xem hồ sơ cá nhân | ✅ Khôi đã làm (BE+FE) | GET/PATCH /members/me + ProfilePage |
| 12 | UC-UM-02 | Cập nhật hồ sơ cá nhân | ✅ Khôi đã làm (BE+FE) | GET/PATCH /members/me + ProfilePage |
| 22 | UC-UM-16 | Xem cấu hình hệ thống | ⬜ Có sẵn từ baseline | Module setting có từ baseline; Khôi bổ sung các key cấu hình mới (shared/settings.js). |
| 23 | UC-UM-16 | Sửa cấu hình hệ thống | ⬜ Có sẵn từ baseline | Module setting có từ baseline; Khôi bổ sung các key cấu hình mới (shared/settings.js). |
| 24 | UC-UM-17 | Danh sách thông báo | ✅ Khôi đã làm (BE+FE) | module notification + NotificationBell |
| 25 | UC-UM-17 | Đánh dấu đã đọc | ✅ Khôi đã làm (BE+FE) | module notification + NotificationBell |
| 26 | UC-PAY-06 | Thanh toán tại quầy | ✅ Khôi đã làm (BE+FE) | POST /payments/invoices/:id/cash |
| 27 | UC-PAY-07 | In / xuất PDF hoá đơn | ✅ Khôi đã làm (BE+FE) | InvoiceReceiptModal: in / lưu PDF qua trình duyệt (window.print), chưa sinh file PDF phía server. |
| 28 | UC-PAY-10 | Chi tiết hoá đơn | ✅ Khôi đã làm (BE+FE) | GET /invoices/:id + InvoiceReceiptModal |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-1/be-nhanh`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/prisma/migrations/20260924120000_add_flow1_membership/migration.sql` | Migration Flow 1 (dùng chung với Bảo) |
| `core/be/.env.example` |  |
| `core/be/package.json` |  |
| `package-lock.json` | Đi kèm package.json |
| `core/be/src/config/db.js` |  |
| `core/be/src/common/middlewares/error.middleware.js` |  |
| `core/be/src/common/utils/vietnam-time.js` |  |
| `core/be/src/common/utils/vietnam-time.test.js` |  |
| `core/be/src/modules/auth/auth.validation.test.js` |  |
| `core/be/tests/auth.test.js` |  |
| `core/be/src/modules/notification/notification.controller.js` |  |
| `core/be/src/modules/notification/notification.routes.js` |  |
| `core/be/src/modules/notification/notification.validation.js` |  |
| `core/be/src/modules/payment/invoice.routes.js` |  |
| `core/be/src/modules/payment/invoice.service.js` |  |
| `core/be/src/modules/payment/settlement.service.js` |  |
| `core/be/tests/helpers/flow-fixture.js` | Fixture dùng chung |
| `docs/test-cases/README.md` |  |
| `docs/03-rbac-dynamic.md` |  |
| `docs/06-onboarding.md` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/prisma/schema.prisma` | Phần chung + model Notification, Invoice, Payment, enum Flow 1 |
| `core/be/prisma/seed/index.js` | Gọi seed Flow 1 |
| `core/be/prisma/seed/roles.seed.js` | Quyền auth/notification/payment/invoice |
| `core/be/src/config/env.js` | Biến môi trường chung |
| `core/be/src/constants/index.js` | Hằng số chung, AUDIT_ACTIONS, ENTITIES |
| `core/be/src/routes.js` | Đăng ký route auth/notifications/invoices/payments |
| `core/be/src/server.js` | Phần khởi động chung (job để Sprint 3) |
| `core/shared/src/permissions.js` | Quyền Flow 1 phần mình |
| `core/shared/src/settings.js` | Key cấu hình Flow 1 |
| `core/be/src/modules/auth/auth.controller.js` | register, changePassword, me |
| `core/be/src/modules/auth/auth.routes.js` | /register, /password-changes, /me |
| `core/be/src/modules/auth/auth.service.js` | register, changePassword, getMe |
| `core/be/src/modules/auth/auth.validation.js` | registerSchema, passwordChangeSchema |
| `core/be/src/modules/member/member.controller.js` | getOwn, updateOwn (/members/me) |
| `core/be/src/modules/member/member.routes.js` | GET/PATCH /members/me |
| `core/be/src/modules/member/member.service.js` | Hàm cho /members/me |
| `core/be/src/modules/member/member.validation.js` | updateOwnProfileSchema |
| `core/be/src/modules/notification/notification.service.js` | listForUser, markRead, createForUsers |
| `core/be/src/modules/payment/payment.service.js` | collectCash |
| `core/be/src/modules/payment/payment.controller.js` | listInvoices, getInvoice, collectCash |
| `core/be/src/modules/payment/payment.routes.js` | POST /invoices/:id/cash |
| `core/be/src/modules/payment/payment.validation.js` | invoiceIdSchema, invoiceParamsSchema, invoiceListSchema |
| `core/be/tests/flows.test.js` | Test Flow 1 phần mình |
