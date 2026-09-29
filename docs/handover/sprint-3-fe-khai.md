# Sprint 3 – FE – Khải

- Nhánh: `sprint-3/fe-khai`
- Thời gian: 20/10 → 02/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 49 | UC-UM-04 | Chọn gói, tạo hoá đơn (online) | ✅ Khôi đã làm (BE+FE) | POST /memberships/me/orders + CheckoutModal |
| 51 | UC-UM-15 | Xem nhật ký thao tác | ✅ Khôi đã làm (BE+FE) | GET /audit-logs + AuditLogTable |
| 54 | UC-PAY-01 | Màn QR và theo dõi trạng thái | ✅ Khôi đã làm (BE+FE) | CheckoutModal: QR, hạn thanh toán; có luồng mô phỏng local |
| 57 | UC-PAY-05 | Xác nhận thanh toán thủ công | ✅ Khôi đã làm (BE+FE) | /payments/reconciliation + ReviewModal / ReconciliationTable |
| 58 | UC-PAY-08 | Lịch sử giao dịch | ✅ Khôi đã làm (BE+FE) | /payments, /invoices + PaymentHistoryTable |
| 59 | UC-PAY-09 | Hoàn tiền | ✅ Khôi đã làm (BE+FE) | POST /payments/invoices/:id/refund + RefundModal |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-3/fe-khai`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/payments/CheckoutModal.jsx` |  |
| `core/fe/src/pages/payments/PaymentHistoryTable.jsx` |  |
| `core/fe/src/pages/payments/ReconciliationTable.jsx` |  |
| `core/fe/src/pages/payments/ReviewModal.jsx` |  |
| `core/fe/src/pages/payments/RefundModal.jsx` |  |
| `core/fe/src/pages/payments/AuditLogTable.jsx` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/pages/payments/PaymentsPage.jsx` | Tab Lịch sử giao dịch, Đối soát, Nhật ký; checkout / refund |
| `core/fe/src/services/payment.service.js` | getCheckout, simulatePayment, listPayments, refundInvoice, listReconciliation, resolveReconciliation, listAudit |
