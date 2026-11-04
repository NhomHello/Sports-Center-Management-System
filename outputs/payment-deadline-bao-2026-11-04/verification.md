# Nghiệm thu hạn giữ chỗ và thanh toán sát hạn

Ngày: 04/11/2026. Nhánh: `sprint-4/be-bao`, nền `2e9df48`.

## Thay đổi và phạm vi

Khóa học online có deadline chuyển tiền và khoảng chờ webhook riêng. Mặc định giữ quyền chuyển
15 phút rồi chờ thêm 120 giây chỉ cho khoản ngân hàng đã ghi nhận trước hạn. Deadline kiểm tra
trong transaction đã khóa lịch/hóa đơn, không phụ thuộc việc job đã chuyển FAILED hay chưa.
Không tiếp tục thu tiền mặt hoặc sử dụng số dư trong khoảng chờ webhook.

Timestamp SePay được đọc theo giờ Việt Nam và kiểm tra trước khi dùng; thiếu/sai/tương lai,
trước lúc tạo đơn hoặc không đủ chính xác ở giây ranh giới được chuyển đối soát khi nhận trễ.
Mốc chốt được giữ nguyên qua các bước kiểm tra và ghi trong cùng transaction. Payment lưu thời điểm
ngân hàng khi có; audit lưu decisionAt của server; payload gốc được giữ trong log webhook.

Tiền thiếu không kéo deadline khóa học thêm 48 giờ. Chuyển thừa chưa được chấp nhận cũng không
chiếm chỗ vô hạn. Hết khoảng chờ thì nhả chỗ, giữ lịch sử tiền và chuyển phiếu sang chờ hoàn.
Khóa chưa được chấp nhận cần hoàn cả số nhận, thay vì chỉ hoàn phần thừa. Thao tác dùng phần thừa
để mua khóa khác chỉ được phép sau khi hóa đơn gốc đã PAID.

Tại quầy: chốt trước deadline được xác nhận, kể cả commit hoàn tất sau deadline; chờ khóa đến
quá hạn bị từ chối. Thu lặp không tạo tiền mới. UI khóa nút trong modal đang mở và hiện tiền mặt
còn phải thu sau số dư đã dùng. Việc trả lại tiền mặt đã giao nhưng chưa ghi nhận thành công
thuộc trách nhiệm nhân viên; không tự ghi một khoản hoàn giả vào database.

## Kiểm tra

- Full suite: 256 test BE, 168 test FE đạt.
- Kiểm tra lại 6 file thanh toán trên mã sau khi thống nhất mốc chốt: 33 test đạt.
- ESLint toàn bộ workspace đạt; FE build đạt (còn cảnh báo kích thước bundle hiện hữu).
- E2E desktop: mua khóa qua webhook SePay và ghi chú buổi; QR tự dừng khi hết hạn rồi nhận
  webhook đúng hạn trong khoảng chờ; modal tiền mặt tự khóa xác nhận khi hết hạn.
- 25 case biên được ghi ở sheet `TC-PAY-DEADLINE` trong `docs/kiem-thu/SWP391_TestCase.xlsx`.

```bash
npm test
npm run lint
npm run build
npm run test -w @scms/be -- src/modules/payment/course-payment-window.service.test.js tests/course-payment-deadline.test.js tests/course-counter-deadline.test.js tests/course-payment-conflict.test.js tests/sepay-webhook.test.js tests/sprint1-payment.test.js
E2E_API_PORT=3118 E2E_FE_PORT=5198 npm exec -- playwright test tests/e2e/payment-deadline.spec.mjs tests/e2e/course-only.spec.mjs --project=desktop --reporter=list
```

## Vận hành

Chạy `SEED_MOCK_DATA=false npm run db:seed` để bổ sung `PAYMENT_WEBHOOK_GRACE_SECONDS`;
không cần migration hay reset. Lệnh này đã chạy trên local, giữ dữ liệu nghiệp vụ.
Chạy BE có worker để nhả chỗ theo chu kỳ; phép ghi thanh toán vẫn kiểm tra deadline độc lập.

Không thử chuyển tiền ngân hàng thật. Kiểm thử dùng webhook mô phỏng có xác thực và database thật,
dữ liệu fixture được dọn sau test. Hướng dẫn đầy đủ:
[Hạn giữ chỗ và thu tiền tại quầy](../../docs/huong-dan/course-payment-deadlines.md).
