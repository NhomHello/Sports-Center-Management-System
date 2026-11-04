# Hủy khóa học, mã hoàn tiền và thông báo

Luồng hiện hành: hội viên hủy khóa → hệ thống tạo yêu cầu hoàn → hội viên lấy mã HT… liên hệ
admin → admin chuyển trả bên ngoài rồi nhập tham chiếu xác nhận. Không ghi tiền hủy/đổi khóa
vào ví. Hủy một buổi hoặc cả lớp từ phía trung tâm cũng tạo yêu cầu hoàn, không tự cộng số dư.
Phí hủy hiện hành đọc từ Cấu hình → Lớp học; không đổi tỷ lệ chỉ vì bổ sung lịch sử.

## Hội viên xem ở đâu

1. **Hồ sơ cá nhân → Lịch sử hủy khóa học**: xem từng lần hủy khóa đã thanh toán.
2. Bấm **Chi tiết hủy** để xem người thực hiện, lý do, thời điểm, hóa đơn gốc, số buổi đã mua,
   đã diễn ra/còn lại/đã hủy riêng, học phí đã chốt, giá trị còn lại, phí, số tiền và mã hoàn.
3. Cung cấp mã **HT…** khi liên hệ admin. Mã này dùng để tìm yêu cầu, khác với tham chiếu ngân hàng
   admin nhập sau khi chuyển trả. Hệ thống không thu thập thêm số tài khoản trong bước hủy.
4. **Hóa đơn → Yêu cầu hoàn tiền của tôi** hiển thị mọi yêu cầu hoàn chính chủ, kể cả hoàn một buổi.
   Lịch sử chỉ đổi sang **Đã hoàn tiền** khi admin đã xác nhận chuyển trả.
5. Thông báo xác nhận hủy, mã hoàn và thông báo đã hoàn được lưu trong **Thông báo**.

Hủy giữ chỗ chưa trả tiền không phát sinh yêu cầu hoàn; hóa đơn chờ bị FAILED, đăng ký CANCELLED.
Màn hình lịch sử hủy khóa tập trung các lần hủy khóa đã thanh toán; dữ liệu bỏ giữ chỗ vẫn được
lưu trong hóa đơn/audit hiện có.

## Admin xem và xử lý ở đâu

- **Quản lý hội viên → Chi tiết hội viên → Lịch sử hủy khóa học**: xem riêng người đó.
- **Hóa đơn → Lịch sử hủy khóa học**: tra cứu toàn bộ theo quyền.
- **Hóa đơn → Theo dõi hoàn tiền**: nhập mã HT… do hội viên cung cấp, kiểm tra số tiền/hội viên,
  chuyển trả thực tế rồi bấm **Xác nhận đã chuyển trả**, nhập tham chiếu ngân hàng.
- Chỉ người có `payment.refund` được xác nhận hoàn. Quyền này cũng cho vào màn hình hoàn tiền
  khi tài khoản không có quyền đọc các hóa đơn khác. Hội viên không thể gọi API hoàn tất.

`PENDING` là chờ chuyển trả, chưa phải đã hoàn. Hủy đăng ký và hoàn tiền là hai trạng thái riêng.
Hóa đơn gốc tiếp tục giữ chứng từ thanh toán; giao diện thông báo quyền học đã hủy thay vì báo
khóa còn hiệu lực. Không được tạo lại yêu cầu hoàn toàn bộ hóa đơn để bỏ qua phép tính hủy đã chốt.

## Ai nhận thông báo

| Người nhận | Nội dung |
| --- | --- |
| Hội viên được hủy, kể cả admin hủy hộ | Xác nhận đã hủy; yêu cầu hoàn có số tiền và mã HT… để liên hệ admin. |
| Nhân viên ACTIVE có quyền `payment.refund` | Hội viên, số tiền, lý do và mã cần xử lý; không chọn theo tên role. |
| HLV thực sự phụ trách các buổi SCHEDULED còn lại | Đăng ký học viên đã bị hủy; cập nhật danh sách. Không gửi số tiền hay mã hoàn. |
| Người đầu hàng chờ đủ điều kiện | Lời mời nhận chỗ khi việc hủy giải phóng chỗ; dùng cơ chế FIFO hiện có. |
| Hội viên sau khi admin xác nhận chuyển trả | Đã hoàn tiền, số tiền, mã HT… và tham chiếu. |

Thông báo được ghi cùng transaction hủy/hoàn, có khóa chống trùng. Lỗi transaction rollback cả
lần hủy và thông báo. Request hủy/hoàn lặp không tạo thêm tiền hay thông báo. Tên/lý do quá dài
được giới hạn theo kích thước trường thông báo để không làm thất bại giao dịch.

## Dữ liệu sau hủy

- Đăng ký chuyển CANCELLED, lưu người hủy/thời điểm và nhả chỗ. Không xóa User, Invoice hay Payment.
- PurchaseChange giữ số tiền đã chốt; audit giữ snapshot tên khóa, hóa đơn, số buổi và lý do tại
  thời điểm hủy. Đổi tên/lịch hoặc mua lại cùng khóa không viết đè lịch sử cũ.
- Điểm danh, báo nghỉ và nhận xét đã ghi vẫn còn. Không dùng bản ghi xin nghỉ cũ để cấp quyền
  điểm danh hoặc viết nhận xét cho buổi xảy ra sau khi học viên đã rút khỏi khóa.
- Lịch tập đang hiệu lực không tiếp tục tính học viên đã hủy. Dữ liệu cũ vẫn đọc được ở lịch sử.
- Học phí gốc tính từ snapshot hóa đơn, không dùng giá khóa hiện tại hoặc cộng khoản chuyển thừa
  chưa xử lý vào giá mỗi buổi. Khoản hoàn buổi riêng không làm đổi đơn giá các buổi còn lại.
- Dữ liệu hủy cũ thiếu snapshot số buổi hiện **Chưa ghi lại ở dữ liệu cũ**; không tính lại bằng
  lịch hiện tại để tạo ra số lịch sử không có thật. Các lần ghi số dư cũ được đánh dấu dữ liệu cũ.

## API và kiểm thử

- `GET /course-cancellations/me`: khóa phạm vi theo JWT, không nhận memberId từ người dùng.
- `GET /course-cancellations?memberId=…&search=…`: nhân viên có quyền đọc toàn bộ hóa đơn hoặc xử lý đăng ký hộ.
- `GET /course-cancellations/:id`: chính chủ hoặc nhân viên có quyền; đoán ID người khác trả 404.
- `GET /refunds/me`: yêu cầu hoàn chính chủ; `GET /refunds?search=HT…`: nhân viên có quyền hoàn.
- `POST /refunds/:id/complete`: quyền hoàn tiền, bắt buộc tham chiếu; đóng yêu cầu và gửi thông báo.
- `POST /enrollments/:id/cancel`: REFUND (mặc định), từ chối CREDIT. FE không còn lựa chọn ghi vào ví.

Không cần migration hoặc reset database. Khởi động lại BE và tải lại FE sau khi lấy mã mới.
Kiểm thử `course-cancellation-history.test.js`, `cancellation-retention.test.js`,
`cancellation-manual-refund.test.js` và E2E `course-cancellation-history.spec.mjs` kiểm tra toàn bộ
luồng và quyền xem. Các giao dịch/chuyển trả trong test là giả lập, không chuyển tiền thật.
