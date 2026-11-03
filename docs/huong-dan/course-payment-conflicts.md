# Trùng lịch khi mua khóa học và xử lý tiền

Áp dụng cả thanh toán tại quầy (COUNTER) và online SePay. Chạy migration
`20261103140224_course_schedule_conflict_reconciliation_reason` và generate Prisma Client
trước khi dùng mã mới.

## Đăng ký đồng thời

Transaction ghi dùng khóa `schedule_locks` trước khi đọc sức chứa/lịch rồi giữ khóa đến commit.
Lượt đăng ký tiếp theo đọc lại dữ liệu đã commit. BOOKED và giữ chỗ PENDING_PAYMENT hợp lệ
đều chiếm chỗ và chặn học viên đặt khóa trùng giờ; một hóa đơn đang chờ được tái sử dụng.
Hàng đợi FIFO và lời mời cũng giữ chỗ theo hạn cấu hình. Không dùng thứ tự request HTTP
làm cam kết thứ tự giành chỗ; không bảo đảm công bằng giữa các request chưa vào hàng đợi.

Trùng lịch thông thường là lỗi điều kiện nghiệp vụ. Race condition xảy ra khi hai thao tác
cùng kiểm tra lịch còn trống rồi cùng ghi. Kiểm tra và ghi trong cùng transaction có khóa
ngăn tình huống đó. Kiểm tra trên giao diện chỉ để báo sớm; server luôn kiểm tra lại.

## Khi lịch đổi trong lúc chờ tiền

Cả lần mở lại hóa đơn và lần áp dụng tiền đều kiểm tra lịch hiện tại. Trang thanh toán báo
trùng lịch, ẩn QR và khóa thu tiền/sử dụng tín dụng. Một request cũ vẫn bị server từ chối.

| Tình huống | Xử lý |
| --- | --- |
| Tại quầy, chưa ghi nhận tiền | Trả 409, không tạo Payment, không chuyển BOOKED; chọn khóa khác hoặc hủy giữ chỗ. |
| Khách đã đưa tiền mặt | Nhân viên trả lại tiền hoặc thống nhất khóa khác rồi thao tác lại; hệ thống không tự hoàn tiền mặt ngoài quầy. |
| Online, ngân hàng chưa chuyển | Dừng chuyển, chọn lại khóa hoặc hủy hóa đơn chờ. |
| SePay báo tiền đã về nhưng trùng lịch | Lưu webhook NEEDS_REVIEW, mở phiếu SCHEDULE_CONFLICT với toàn bộ khoản chuyển; không tạo Payment hoặc nhận học viên vào khóa xung đột. |
| Liên hệ khách và đổi khóa | Gán giao dịch sang hóa đơn đủ điều kiện/khóa không trùng. Tạo hóa đơn đích và áp dụng tiền trong cùng transaction khóa phiếu; thiếu/thừa tiền tiếp tục trạng thái đối soát tương ứng. |
| Liên hệ khách và hoàn tiền | Tạo yêu cầu hoàn toàn bộ tiền còn treo; phiếu REFUND_PENDING. Nhân viên chuyển trả bên ngoài, nhập tham chiếu để hoàn tất REFUNDED. |

Khi đổi khóa hoặc yêu cầu hoàn, hóa đơn gốc chưa có Payment được FAILED và giữ chỗ được
CANCELLED ngay trong transaction, tránh chiếm chỗ vô hạn. Nếu hóa đơn đã có tiền áp dụng
trước đó, khoản đó giữ lịch sử và cần xử lý riêng theo phiếu thiếu tiền/hoàn hóa đơn tương ứng;
không hủy sạch các khoản tiền khác chỉ vì một giao dịch mới bị xung đột.

Phiếu trùng lịch bắt buộc lưu lần liên hệ trước khi đổi khóa/hoàn. Không hỗ trợ hoàn một phần
rồi đóng phiếu làm mất phần còn lại. Phiếu đã xử lý hoặc có lệnh hoàn không thể dùng lại để
nhận tiền; transaction thất bại không để lại hóa đơn hoặc giữ chỗ mới mồ côi.
Webhook lặp cùng ID không cộng tiền lần nữa. Hai giao dịch ngân hàng khác ID là hai khoản
thực tế, phải đối soát từng khoản.

Kiểm thử API: `core/be/tests/course-payment-conflict.test.js` gồm đăng ký song song,
đổi lịch trong lúc chờ tiền, từ chối thu quầy/tín dụng, giữ tiền SePay để đối soát,
hoàn và đổi khóa đến trạng thái kết thúc. Kiểm thử thao tác UI:
`core/fe/src/utils/reconciliationActions.test.js`.
