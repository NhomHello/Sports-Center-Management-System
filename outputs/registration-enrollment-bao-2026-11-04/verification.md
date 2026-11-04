# Kiểm tra tài khoản mới tự xuất hiện đăng ký lớp

Ngày kiểm tra: 04/11/2026. Nền mã nguồn: `0ba2330`, nhánh làm việc `sprint-4/be-bao`.

## Kết quả

Chưa tái hiện được việc tự đăng ký lớp khi tạo tài khoản mới trong môi trường local.
Đăng ký bằng email mới, xác minh email, đăng nhập và mở danh sách/chi tiết lớp không tạo
ClassEnrollment, ClassWaitlist hay Invoice. Hồ sơ trả activeCourseCount = 0, lịch cá nhân rỗng.
Lớp thử đã có một học viên khác trả tiền để kiểm tra số đếm chung không bị gán nhầm sang người mới.
Chỉ POST mua khóa rõ ràng mới tạo đăng ký PENDING_PAYMENT và hóa đơn cho đúng người thao tác.

Trình duyệt thật cũng không phát sinh POST đăng ký/mua khóa khi tạo tài khoản và duyệt lớp.
Dòng sĩ số cũ `1 đã đăng ký` có thể gây nhầm với trạng thái cá nhân; đổi thành
`Sĩ số: 1 học viên`. Nhãn cá nhân `Đã đăng ký` vẫn chỉ hiện khi enrollment của tài khoản là BOOKED.
Đây là sửa cách diễn đạt, chưa phải bằng chứng cho nguyên nhân của báo cáo ban đầu.

## Phạm vi rà soát

- `auth.service.js`: đăng ký chỉ tạo User, audit và yêu cầu gửi email; không gọi booking.
- `email-verification.service.js`: xác minh chỉ cập nhật trạng thái email.
- `useLogin.js`: xóa cache trước khi nạp tài khoản mới.
- API lớp: tra enrollment theo ID người đăng nhập; sĩ số là tổng của lớp.
- Seed thường: chỉ đăng ký các email demo trong danh sách mẫu. Script refresh khóa học tạo
  sẵn lịch sử cho tài khoản `s4.member*`; các tài khoản đó là dữ liệu demo, không phải tài khoản
  người dùng vừa tạo qua form đăng ký.

## Kiểm thử tự động

```bash
npm run lint
npm run test -w @scms/be -- tests/auth-enrollment.test.js tests/auth.test.js tests/email-verification.test.js
E2E_API_PORT=3118 E2E_FE_PORT=5198 npm exec -- playwright test tests/e2e/registration-enrollment.spec.mjs --project=desktop --reporter=list
```

18 test API (gồm 3 case mới) và 1 E2E desktop. Email ở test API được mock; E2E tắt SMTP và
xác minh trực tiếp đúng tài khoản thử trong database để không gửi email thật. Test API riêng
vẫn đi qua endpoint xác minh bằng token thật từ nội dung mail mock. Mọi dữ liệu thử được dọn
trong teardown, không reset dữ liệu hiện có. Ảnh E2E: `new-account-without-enrollment.png`.

## Kiểm tra SePay cùng phiên làm việc

27 test thanh toán/đối soát/trùng lịch đạt (5 test trùng lịch + 22 test webhook, thu quầy,
thiếu/thừa, tiền muộn, hoàn tiền và quyền thao tác). E2E `course-only.spec.mjs` kiểm tra
mua khóa, hiển thị thanh toán và gửi webhook mô phỏng đúng tiền để xác nhận chỗ học.

Cấu hình local: đã có khóa webhook và ngân hàng/số tài khoản/tên nhận tiền.
Chưa có `SEPAY_API_TOKEN`, nên chưa sử dụng được thao tác đồng bộ giao dịch từ User API;
đây là kênh khác với webhook nhận tiền tự động. Chưa kiểm tra một giao dịch ngân hàng thật
và chưa xác nhận cấu hình webhook trên tài khoản SePay bên ngoài.
