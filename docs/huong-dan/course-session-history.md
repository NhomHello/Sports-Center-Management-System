# Xem điểm danh và nhận xét theo khóa học

## Giao diện

- Hội viên vào **Điểm danh & nhận xét** (`/attendance`), chọn một khóa rồi bấm **Xem các buổi học**.
- Admin vào **Quản lý hội viên → Chi tiết hội viên → Buổi học & nhận xét**, chọn khóa của hội viên đó.
- Mỗi khóa có một bảng duy nhất: Buổi 1…N, thời gian bắt đầu/kết thúc theo giờ Việt Nam, HLV buổi học,
  điểm danh, đánh giá, nhận xét và người nhận xét. Khóa 20 buổi hiện đủ 20 dòng, không chia trang buổi.
- Không chỉ hiện các buổi đã được ghi điểm danh/nhận xét. Có thể xem cả buổi chưa diễn ra, chưa có
  kết quả, buổi đã hủy và phần khóa ngoài thời gian đăng ký của hội viên.
- **Danh sách khóa học** trở lại bước chọn khóa. **Cập nhật kết quả** lấy dữ liệu mới; bảng đang mở
  cũng làm mới định kỳ. Dữ liệu này chỉ đọc, không có thao tác sửa điểm danh/ghi chú trong màn lịch sử.

## Cách hiểu trạng thái

| Dữ liệu | Hiển thị |
| --- | --- |
| Attendance PRESENT / ABSENT / EXCUSED | Có mặt / Vắng mặt / Xin nghỉ theo bản ghi thật |
| Chưa có Attendance, buổi tương lai thuộc đăng ký | Chưa đến giờ học |
| Chưa có Attendance, buổi đã diễn ra thuộc đăng ký | Chưa điểm danh; không tự tính thành vắng |
| Buổi CANCELLED chưa có Attendance | Buổi đã hủy |
| Buổi trước lúc đăng ký hoặc sau khi hủy | Ngoài thời gian đăng ký |
| Chưa có Feedback | Chưa có nhận xét / Chưa đánh giá |

Kết quả thật đã ghi vẫn được giữ khi hội viên hủy hoặc đăng ký lại. Khoảng tham gia cũ lấy từ
snapshot lịch sử hủy, không chỉ dựa vào enrollment hiện tại có thể bị cập nhật khi mua lại.
Thứ tự buổi là thứ tự thời gian hiện tại của khóa, đồng hạng dùng ID để ổn định. N không hardcode 20.

HLV buổi học dùng snapshot/tài khoản được phân công theo buổi, có fallback về HLV của khóa.
Người viết nhận xét lấy từ Feedback.author, có thể khác HLV hiện tại sau khi đổi người dạy.
Điểm danh và Feedback được ghép theo **cả sessionId và memberId**, không ghép chỉ theo lớp.

## API và quyền

- `GET /attendance/courses`: khóa thuộc lịch sử của JWT, có tìm theo tên và phân trang khóa.
- `GET /attendance/courses/:classId`: toàn bộ buổi và dữ liệu chính chủ. Không nhận memberId qua query.
- `GET /members/:memberId/course-history`: danh sách khóa của hội viên, cần `attendance.manage`.
- `GET /members/:memberId/course-history/:classId`: chi tiết cùng quyền quản lý điểm danh.
- Đoán ID khóa không thuộc lịch sử trả 404; không có JWT trả 401; thiếu quyền xem người khác trả 403.
- Khóa còn mở nhưng người dùng chưa đăng ký/không có lịch sử không được đọc qua API lịch sử này.
- Các endpoint lịch sử điểm danh/Feedback cũ được giữ để tương thích, màn `/attendance` dùng API gộp mới.

Không sửa schema và không cần migration/reset dữ liệu. API đọc được cả khóa đã đóng, đã hoàn thành
hoặc đã hủy khi có đăng ký/hoá đơn/kết quả lịch sử của đúng hội viên.

## Nhãn đăng ký trên thẻ khóa

Khóa có enrollment BOOKED hiện nút **Đã đăng ký** bị khóa. Hủy/đổi khóa vẫn dùng thao tác riêng.
Giữ chỗ PENDING_PAYMENT vẫn hiện luồng thanh toán; trường hợp bị chặn vì đủ chỗ/trùng lịch không
bị đổi nhầm thành Đã đăng ký. Không thay đổi logic đăng ký hoặc thanh toán khi sửa nhãn.

## Kiểm thử

- `core/be/tests/course-history.test.js`: 6 case khóa chính chủ, đủ 20 buổi, kết quả trống,
  riêng tư giữa học viên, quyền admin và dữ liệu sau hủy/mua lại.
- `core/fe/src/utils/courseHistory.test.js`: 3 case không suy dữ liệu trống thành vắng, phân biệt
  buổi tương lai/đã hủy/ngoài đăng ký và giữ kết quả thực tế của lịch sử.
- `tests/e2e/course-session-history.spec.mjs`: hội viên/admin chọn khóa xem 20 dòng; điểm danh và
  nhận xét cùng dòng; không thấy ghi chú người khác; nút Đã đăng ký bị khóa.
- `tests/e2e/course-only.spec.mjs`: cập nhật bước xem Feedback theo lựa chọn khóa mới.
