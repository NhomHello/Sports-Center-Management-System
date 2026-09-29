# Sprint 3 – BE – Nhanh

- Nhánh: `sprint-3/be-nhanh`
- Thời gian: 20/10 → 02/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 49 | UC-UM-04 | Chọn gói, tạo hoá đơn (online) | ✅ Khôi đã làm (BE+FE) | POST /memberships/me/orders + CheckoutModal |
| 54 | UC-PAY-01 | Màn QR và theo dõi trạng thái | ✅ Khôi đã làm (BE+FE) | CheckoutModal: QR, hạn thanh toán; có luồng mô phỏng local |
| 55 | UC-PAY-02 | Xử lý webhook SePay | ✅ Khôi đã làm (BE, không có FE) | POST /payments/webhooks/sepay (payment-webhook.service) |
| 56 | UC-PAY-04 | Job hết hạn hoá đơn | ✅ Khôi đã làm (BE, không có FE) | invoice-expiry.job.js |
| 57 | UC-PAY-05 | Xác nhận thanh toán thủ công | ✅ Khôi đã làm (BE+FE) | /payments/reconciliation + ReviewModal / ReconciliationTable |
| 58 | UC-PAY-08 | Lịch sử giao dịch | ✅ Khôi đã làm (BE+FE) | /payments, /invoices + PaymentHistoryTable |
| 59 | UC-PAY-09 | Hoàn tiền | ✅ Khôi đã làm (BE+FE) | POST /payments/invoices/:id/refund + RefundModal |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-3/be-nhanh`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/src/adapters/payment.adapter.js` |  |
| `core/be/src/modules/payment/payment-webhook.service.js` |  |
| `core/be/src/modules/payment/payment-review.service.js` |  |
| `core/be/src/modules/payment/invoice-expiry.job.js` |  |
| `docs/test-cases/TC-F3-payment-report.md` | Bảo bổ sung phần report |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/src/modules/payment/payment.service.js` | getCheckout, simulateLocalPayment, refundInvoice |
| `core/be/src/modules/payment/payment-query.service.js` | listPayments |
| `core/be/src/modules/payment/payment.controller.js` | checkout, simulate, refund, listPayments, listReviewQueue, resolveWebhook, verifySePayKey, receiveSePayWebhook |
| `core/be/src/modules/payment/payment.routes.js` | webhook, checkout, refund, reconciliation, GET /payments |
| `core/be/src/modules/payment/payment.validation.js` | paymentIdSchema, paymentListSchema, refundSchema, resolveWebhookSchema, webhookBodySchema |
| `core/be/src/modules/membership/membership.controller.js` | createOwnOrder |
| `core/be/src/modules/membership/membership.routes.js` | POST /me/orders |
| `core/be/src/modules/membership/membership.validation.js` | createOwnOrderSchema |
| `core/be/prisma/schema.prisma` | Log webhook, trường online của Invoice/Payment |
| `core/be/src/config/env.js` | Biến SePay |
| `core/be/src/server.js` | startInvoiceExpiryJob |
| `core/shared/src/settings.js` | Timeout hoá đơn, chu kỳ job |
| `core/shared/src/permissions.js` | PAYMENT_* |
| `core/be/tests/flows.test.js` | Test thanh toán online / webhook / hoàn tiền |
