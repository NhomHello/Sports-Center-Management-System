# Sprint 3 – BE – Bảo

- Nhánh: `sprint-3/be-bao`
- Thời gian: 20/10 → 02/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 47 | UC-UM-12 | Gửi link đặt lại mật khẩu | ✅ Khôi đã làm (BE+FE) | /auth/password-reset-requests, /auth/password-resets + PasswordReset pages (mail adapter + dev mailbox). |
| 48 | UC-UM-12 | Đặt lại mật khẩu | ✅ Khôi đã làm (BE+FE) | /auth/password-reset-requests, /auth/password-resets + PasswordReset pages (mail adapter + dev mailbox). |
| 50 | UC-UM-10 | Job nhắc gia hạn | ✅ Khôi đã làm (BE, không có FE) | notification.job.js: startMembershipReminderJob |
| 51 | UC-UM-15 | Xem nhật ký thao tác | ✅ Khôi đã làm (BE+FE) | GET /audit-logs + AuditLogTable |
| 52 | UC-CB-18 | Đổi giờ một buổi | ✅ Khôi đã làm (BE+FE) | PATCH /classes/sessions/:id + SessionRescheduleModal |
| 53 | UC-CB-18 | Huỷ một buổi | ❌ Chưa làm | Chỉ có đổi giờ buổi; chưa có API/màn chuyển một buổi sang CANCELLED. |
| 60 | UC-RPT-01 | Dashboard báo cáo | 🟡 Khôi làm một phần | GET /reports/revenue + RevenueReportPanel: mới có doanh thu / hoàn tiền / net; chưa có chỉ số membership và lớp. |
| 61 | UC-RPT-01 | Xuất tệp báo cáo | ❌ Chưa làm | Chưa có xuất PDF/CSV/Excel. |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-3/be-bao`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/src/adapters/mail.adapter.js` |  |
| `core/be/src/modules/notification/notification.job.js` |  |
| `core/be/src/modules/audit/audit.controller.js` |  |
| `core/be/src/modules/audit/audit.routes.js` |  |
| `core/be/src/modules/audit/audit.service.js` |  |
| `core/be/src/modules/audit/audit.validation.js` |  |
| `core/be/src/modules/report/report.routes.js` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/src/modules/auth/auth.service.js` | requestPasswordReset, resetPassword, listLocalMailbox |
| `core/be/src/modules/auth/auth.controller.js` | requestPasswordReset, resetPassword, localMailbox |
| `core/be/src/modules/auth/auth.routes.js` | /password-reset-requests, /password-resets, /dev-mailbox |
| `core/be/src/modules/auth/auth.validation.js` | passwordResetRequestSchema, passwordResetSchema, localMailboxSchema |
| `core/be/src/modules/notification/notification.service.js` | runExpiryReminder |
| `core/be/src/modules/class/class-session.service.js` | update (đổi giờ buổi) |
| `core/be/src/modules/class/class.controller.js` | updateSession |
| `core/be/src/modules/class/class.routes.js` | PATCH /sessions/:id |
| `core/be/src/modules/class/class.validation.js` | updateSessionSchema |
| `core/be/src/modules/payment/payment-query.service.js` | getRevenueReport |
| `core/be/src/modules/payment/payment.validation.js` | revenueReportSchema |
| `core/be/src/routes.js` | Đăng ký /audit-logs, /reports |
| `core/be/src/server.js` | startMembershipReminderJob |
| `core/be/src/config/env.js` | Biến mail |
| `core/shared/src/settings.js` | Key nhắc gia hạn, hạn link reset |
| `core/be/tests/flows.test.js` | Test reset / đổi giờ buổi / report |

## Việc còn thiếu (phải tự làm thêm)

- #53 UC-CB-18 – Huỷ một buổi: Chỉ có đổi giờ buổi; chưa có API/màn chuyển một buổi sang CANCELLED.
- #60 UC-RPT-01 – Dashboard báo cáo: GET /reports/revenue + RevenueReportPanel: mới có doanh thu / hoàn tiền / net; chưa có chỉ số membership và lớp.
- #61 UC-RPT-01 – Xuất tệp báo cáo: Chưa có xuất PDF/CSV/Excel.
