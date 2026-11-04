# Hạn giữ chỗ, webhook sát hạn và thu tiền tại quầy

Áp dụng cho hóa đơn COURSE. Cập nhật mã nguồn rồi chạy `SEED_MOCK_DATA=false npm run db:seed`
để bổ sung setting mới; không reset database. Worker hết hạn phải chạy cùng BE.

## Hai thời điểm khác nhau

- `paymentDeadline`/`expiresAt`: hạn khách chuyển tiền, mặc định 15 phút từ lúc tạo hóa đơn,
  theo `PAYMENT_ONLINE_TIMEOUT_MINUTES`. Áp dụng cả đơn khóa học tại quầy.
- `holdReleaseAt`: thời điểm được nhả chỗ. Online cộng thêm
  `PAYMENT_WEBHOOK_GRACE_SECONDS` (mặc định 120 giây); tại quầy bằng hạn thanh toán.

Khoảng chờ 120 giây chỉ để nhận thông báo trễ cho khoản tiền đã vào đúng hạn, không phải
thêm 2 phút để khách chuyển tiền. Không tạo lại hóa đơn để tự kéo dài deadline của cùng giữ chỗ.
Sau hạn, giao diện ẩn QR, khóa sử dụng số dư và khóa xác nhận tiền mặt, kể cả modal đang mở.

## Online sát hạn

Ví dụ hóa đơn tạo lúc 10:00:00, hạn 10:15:00, nhả chỗ từ 10:17:00:

| Trường hợp | Kết quả |
| --- | --- |
| Ngân hàng ghi nhận 10:14:59, webhook nhận 10:15:03 | Xác nhận nếu tiền đủ, giữ chỗ còn đúng hóa đơn, khóa còn hợp lệ và không trùng lịch. |
| Ngân hàng ghi nhận từ 10:15:00 trở đi | Lưu tiền vào phiếu đối soát, không nhận vào lớp dù job chưa chạy. |
| Webhook đến từ 10:17:00 trở đi, kể cả timestamp trước hạn | Đối soát, không tự khôi phục chỗ; chỗ có thể đã mời người trong hàng chờ. |
| Sau hạn nhưng thiếu/sai timestamp hoặc timestamp tương lai/trước khi tạo đơn | Đối soát, không đoán giờ thanh toán. |
| Chưa có timestamp, webhook nhận và chốt trước hạn | Dùng thời điểm server chốt; không áp dụng quyền đi qua hạn. |
| Chuyển thiếu | Chỉ chuyển bù trong hạn gốc; không kéo giữ chỗ thêm 48 giờ. Hết khoảng chờ thì hủy giữ chỗ và chờ hoàn tiền đã nhận. |
| Chuyển thừa, chưa được chấp nhận | Cần liên hệ/duyệt trong thời gian giữ chỗ. Hết khoảng chờ vẫn nhả chỗ; hoàn toàn bộ số đã nhận, không chỉ phần thừa. |
| Khách bấm “Tôi đã chuyển khoản” | Chỉ mở yêu cầu kiểm tra, không gia hạn giữ chỗ hay tự xác nhận vào lớp. |

SePay cung cấp `transactionDate` dạng `YYYY-MM-DD HH:mm:ss`, theo giờ Việt Nam:
[tài liệu webhook chính thức](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).
Server kiểm tra timestamp từ payload đã xác thực API key và lưu cả thời điểm ngân hàng trong Payment,
thời điểm tiếp nhận/chốt trong metadata. Mã không suy ra mili giây từ timestamp chỉ có giây.
Nếu webhook đến trễ và timestamp nằm cùng giây với deadline có phần mili giây, tự động xác nhận
không đủ chắc chắn: chuyển đối soát. Vì vậy trường hợp “14:59.999” được giải quyết bằng chứng cứ
thời gian ngân hàng, khoảng chờ có hạn và đối soát khi độ chính xác không đủ.

## Tại quầy

1. Nhân viên chọn học viên/khóa, hệ thống kiểm tra lịch và sức chứa rồi tạo hóa đơn COUNTER,
   giữ chỗ có deadline. Chưa xác nhận thu thì học viên chưa BOOKED.
2. Nhân viên kiểm tra hóa đơn còn hạn trước khi nhận tiền, xác nhận ngay khi đã nhận đủ.
3. Server khóa lịch → hóa đơn → tài khoản, kiểm tra lại điều kiện và lấy mốc chốt từ đồng hồ server.
   Mốc chốt trước deadline được chấp nhận; việc commit hoàn tất vài mili giây sau deadline không
   làm đảo ngược quyết định trong transaction đó. Request nằm chờ khóa đến quá hạn bị từ chối.
4. Request thu lặp sau khi đã PAID trả hóa đơn cũ; không ghi khoản tiền thứ hai.
5. Nếu quá hạn: không thu trên hóa đơn cũ, nhả chỗ qua worker. Kiểm tra lại lịch/sức chứa/hàng chờ
   để tạo đơn mới trước khi tiếp tục thu. Không ghi lùi thời gian theo dữ liệu client.
6. Nếu khách đã đưa tiền nhưng server từ chối xác nhận, nhân viên trả lại hoặc thống nhất đơn mới
   sau khi kiểm tra chỗ. Phần giao nhận tiền mặt nằm ngoài hệ thống phải được nhân viên thực hiện;
   không hiển thị là đã thu/đã hoàn khi database chưa ghi nhận được.

Nếu khách chuyển khoản ngay tại quầy thì dùng hóa đơn ONLINE và chờ webhook; không bấm xác nhận
tiền mặt cho cùng khoản chuyển. Hóa đơn COUNTER đang giữ chỗ cần hủy giữ chỗ chưa nhận tiền
và tạo lại đúng kênh sau khi kiểm tra lịch/sức chứa nếu khách muốn đổi phương thức.

Thu bù bằng tiền mặt cho hóa đơn online hoặc trả bằng số dư cũng phải chốt trước deadline;
không dùng khoảng chờ webhook để tiếp tục thu. Hóa đơn PENDING đã nhận đủ/thừa không được thu thêm.

## Đồng thời và kết thúc xử lý

Webhook, thu quầy, hết hạn và đăng ký đều dùng cùng khóa lịch trước khóa hóa đơn. Mốc chốt
thanh toán được giữ nguyên trong transaction; chỉ một chuyển trạng thái thắng. Job không hủy
hóa đơn PAID. Trong khoảng chờ online, job giữ nguyên chỗ; khi hết khoảng chờ, job chuyển hóa đơn
chưa xác nhận sang FAILED, đăng ký CANCELLED và mời hàng chờ FIFO trong cùng transaction.

Worker quét theo chu kỳ nên nhả chỗ vật lý có thể muộn hơn mốc cấu hình; kiểm tra deadline trong
phép ghi vẫn chặn thanh toán quá hạn. Nếu BE/worker ngừng chạy, việc nhả chỗ tiếp tục khi khởi động
lại; webhook vẫn phải qua kiểm tra thời gian, không dựa riêng vào trạng thái PENDING còn sót.

Tiền thiếu/thừa đã áp dụng vào invoice giữ lịch sử và phiếu chờ hoàn; tiền về muộn chưa áp dụng
được giữ ở webhook/phiếu đối soát. Hủy giữ chỗ không xóa dấu vết khoản tiền. Hoàn tiền chỉ kết thúc
sau khi nhân viên chuyển trả và nhập tham chiếu. Không tự lấy lại chỗ đã nhường cho người khác.

## Kiểm thử

- `course-payment-window.service.test.js`: 9 case biên mili giây, thời điểm bằng deadline/grace,
  timezone, timestamp không hợp lệ và mốc chốt trong transaction.
- `course-payment-deadline.test.js`: 6 case API tiền đúng hạn đến trễ, job chạy song song,
  timestamp thiếu/sai, FIFO và giữ chỗ thiếu/thừa.
- `course-counter-deadline.test.js`: 4 case thu quầy hết hạn, thu lặp, rollback số dư và hoàn
  toàn bộ khoản chuyển thừa khi giữ chỗ hết hạn.
- `paymentDeadline.test.js`: trạng thái UI và chặn thu tiền quá hạn/đã nhận thừa.
- `tests/e2e/payment-deadline.spec.mjs`: QR tự ẩn và tiếp tục nhận webhook đúng hạn trong grace;
  modal thu tiền tự khóa nút khi hết hạn.

Các test dùng timestamp mô phỏng và database thật, không chuyển tiền ngân hàng thật.

Chi tiết các nhánh chuyển thiếu/thừa đến trạng thái kết thúc:
[Quy trình kết thúc đối soát](course-payment-resolution.md).
