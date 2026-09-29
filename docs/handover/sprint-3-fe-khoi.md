# Sprint 3 – FE – Khôi

- Nhánh: `sprint-3/fe-khoi`
- Thời gian: 20/10 → 02/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 47 | UC-UM-12 | Gửi link đặt lại mật khẩu | ✅ Khôi đã làm (BE+FE) | /auth/password-reset-requests, /auth/password-resets + PasswordReset pages (mail adapter + dev mailbox). |
| 48 | UC-UM-12 | Đặt lại mật khẩu | ✅ Khôi đã làm (BE+FE) | /auth/password-reset-requests, /auth/password-resets + PasswordReset pages (mail adapter + dev mailbox). |
| 52 | UC-CB-18 | Đổi giờ một buổi | ✅ Khôi đã làm (BE+FE) | PATCH /classes/sessions/:id + SessionRescheduleModal |
| 53 | UC-CB-18 | Huỷ một buổi | ❌ Chưa làm | Chỉ có đổi giờ buổi; chưa có API/màn chuyển một buổi sang CANCELLED. |
| 60 | UC-RPT-01 | Dashboard báo cáo | 🟡 Khôi làm một phần | GET /reports/revenue + RevenueReportPanel: mới có doanh thu / hoàn tiền / net; chưa có chỉ số membership và lớp. |
| 61 | UC-RPT-01 | Xuất tệp báo cáo | ❌ Chưa làm | Chưa có xuất PDF/CSV/Excel. |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-3/fe-khoi`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/auth/PasswordResetRequestPage.jsx` |  |
| `core/fe/src/pages/auth/PasswordResetPage.jsx` |  |
| `core/fe/src/pages/schedule/SessionRescheduleModal.jsx` |  |
| `core/fe/src/pages/payments/RevenueReportPanel.jsx` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/services/auth.service.js` | requestPasswordReset, resetPassword, getLocalMailbox |
| `core/fe/src/services/schedule.service.js` | Đổi giờ buổi |
| `core/fe/src/services/payment.service.js` | getRevenue |
| `core/fe/src/router/routeRegistry.jsx` | Route đặt lại mật khẩu |

## Việc còn thiếu (phải tự làm thêm)

- #53 UC-CB-18 – Huỷ một buổi: Chỉ có đổi giờ buổi; chưa có API/màn chuyển một buổi sang CANCELLED.
- #60 UC-RPT-01 – Dashboard báo cáo: GET /reports/revenue + RevenueReportPanel: mới có doanh thu / hoàn tiền / net; chưa có chỉ số membership và lớp.
- #61 UC-RPT-01 – Xuất tệp báo cáo: Chưa có xuất PDF/CSV/Excel.
