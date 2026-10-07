# Sprint 1 – FE – Khôi

- Nhánh: `sprint-1/fe-khoi`
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

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-1/fe-khoi`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/.env.example` |  |
| `core/fe/index.html` |  |
| `core/fe/src/main.jsx` |  |
| `core/fe/src/config/env.js` |  |
| `core/fe/src/theme/theme.js` |  |
| `core/fe/src/styles/app.css` |  |
| `core/fe/src/styles/home.css` |  |
| `core/fe/src/styles/polish.css` |  |
| `core/fe/src/layouts/AuthLayout.jsx` |  |
| `core/fe/src/layouts/MainLayout.jsx` |  |
| `core/fe/src/components/common/MainHeader.jsx` |  |
| `core/fe/src/components/common/NotificationBell.jsx` |  |
| `core/fe/src/components/common/PageHeader.jsx` |  |
| `core/fe/src/pages/auth/LoginPage.jsx` | Đăng nhập + đăng ký |
| `core/fe/src/pages/member/ProfilePage.jsx` | Hồ sơ + đổi mật khẩu |
| `core/fe/src/pages/dashboard/DashboardPage.jsx` |  |
| `core/fe/src/pages/dashboard/DashboardHero.jsx` |  |
| `core/fe/src/pages/dashboard/DashboardOverview.jsx` |  |
| `core/fe/src/pages/dashboard/DashboardQuickLinks.jsx` |  |
| `core/fe/src/pages/system/roles/RolesPage.jsx` |  |
| `core/fe/src/pages/system/settings/SettingsPage.jsx` |  |
| `core/fe/src/pages/system/users/UsersPage.jsx` |  |
| `core/fe/src/pages/payments/InvoiceTable.jsx` |  |
| `core/fe/src/pages/payments/InvoiceReceiptModal.jsx` | In / PDF hoá đơn |
| `core/fe/src/services/notification.service.js` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/constants/index.js` | Hằng số chung, QUERY_KEYS phần mình |
| `core/fe/src/hooks/usePermission.js` | Phần chung |
| `core/fe/src/router/AppRouter.jsx` | Phần chung |
| `core/fe/src/router/routeRegistry.jsx` | Route dashboard, profile, system, payments |
| `core/fe/src/pages/payments/PaymentsPage.jsx` | Khung trang + tab Hoá đơn |
| `core/fe/src/services/auth.service.js` | login, register, getMe |
| `core/fe/src/services/payment.service.js` | listInvoices, collectCash |
