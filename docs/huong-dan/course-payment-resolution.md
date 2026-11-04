# Kết thúc các nhánh chuyển thiếu, thừa và nhiều lần

Luồng hủy khóa học hiện hành dùng mã hoàn để liên hệ admin, không ghi vào ví:
[xem lịch sử hủy và thông báo](course-cancellation-history.md).

Giữ chính sách hạn tại [course-payment-deadlines.md](course-payment-deadlines.md): chuyển tiền
trong 15 phút mặc định, thêm khoảng chờ webhook đúng hạn, không dùng việc chuyển thiếu để kéo dài
chỗ học. Ví dụ trong bảng dưới: khóa có giá 300.000đ.

## Kết quả bắt buộc của từng nhánh

| Tình huống | Cách xử lý | Trạng thái kết thúc |
| --- | --- | --- |
| Nhận 100k rồi 50k rồi 150k đúng hạn | Cộng các giao dịch khác ID vào cùng hóa đơn, đủ 300k thì xác nhận; đóng phiếu thiếu | Hóa đơn PAID, học viên BOOKED, phiếu thiếu MATCHED |
| Nhận 100k, hết thời gian giữ chỗ vẫn chưa đủ | Hủy giữ chỗ, nhả FIFO, tạo yêu cầu hoàn đúng 100k; chuyển trả thực tế rồi nhập tham chiếu | Đăng ký CANCELLED, phiếu REFUNDED |
| Nhận 100k rồi 250k | Tổng 350k đã bù đủ phần thiếu: đóng phiếu thiếu; còn một phiếu thừa 50k. Liên hệ và chấp nhận khóa khi còn quyền giữ chỗ | PAID/BOOKED; phiếu thừa chờ hoàn 50k hoặc điều chuyển theo thỏa thuận |
| Nhận thừa nhưng giữ chỗ hết hiệu lực trước khi được chấp nhận | Nhả chỗ và hoàn cả 350k, không chỉ hoàn 50k | CANCELLED và REFUNDED sau khi chuyển trả |
| Nhận thiếu 100k đúng hạn, 200k chuyển bù sau hạn | 100k đã áp dụng và 200k về trễ là hai nghĩa vụ tiền riêng. Hoàn/gán từng khoản đúng nguồn; không đóng nhầm khoản còn chưa xử lý | Mỗi khoản đều được gán hợp lệ hoặc hoàn xong; không tự hồi sinh chỗ cũ |
| Cùng webhook ID gửi lại | Trả DUPLICATE, không tạo thêm Payment, không cộng vào số tiền đã nhận | Một giao dịch chỉ được xử lý một lần |
| Khách thật sự chuyển thêm lần nữa sau PAID | ID ngân hàng khác là tiền thật mới: mở phiếu chuyển lặp, hoàn hoặc dùng cho khóa khác theo thỏa thuận | Phiếu MATCHED hoặc REFUNDED |
| Dùng 50k phần thừa cho khóa khác | Chuyển phần thừa sang sổ số dư rồi dùng cho khóa đích, tất cả trong một transaction. Không ghi thêm lần nhận tiền ngân hàng | Tiền còn thuộc khóa gốc là 300k; khóa đích nhận CREDIT 50k; phiếu cũ MATCHED |
| Khóa đích còn thiếu rồi hết hạn | Nhả chỗ, phần đã dùng bằng số dư trả lại số dư; tiền ngân hàng thực nhận còn lại xử lý hoàn riêng | Không hoàn ngân hàng trùng với số dư đã trả; phiếu tiền đã trả hết được đóng |

Phiếu MATCHED do phần thiếu đã được bù đủ không tự có nghĩa học viên đã vào lớp: nếu tổng tiền
thành thừa thì hóa đơn còn chờ chấp nhận phần lệch. Trạng thái đăng ký lấy từ ClassEnrollment.

## Một khoản tiền chỉ được phân bổ một lần

Phần thiếu được tính từ tổng tiền đã ghi vào Payment, trừ các khoản đã dành cho yêu cầu hoàn.
Không chỉ lấy số tiền của webhook đầu tiên. Có lệnh hoàn thì không cho dùng lại tiền của phiếu.
Hai yêu cầu hoàn cùng lúc chỉ tạo được một lệnh dưới khóa lịch/hóa đơn/phiếu.

Khi dùng phần thừa cho khóa khác, hệ thống ghi nhận điều chuyển nội bộ có tham chiếu CREDIT,
cộng rồi trừ đúng số đó trong sổ số dư, ghi Payment CREDIT ở khóa đích và giảm tiền còn thuộc
hóa đơn gốc. Đây không phải chuyển trả ngân hàng. Nếu khóa đích không nhận được, toàn bộ transaction
rollback; phần thừa không bị mất. Nếu sau đó hoàn khóa gốc thì chỉ hoàn phần còn thuộc khóa gốc.

## Đóng phiếu đúng lúc

`REFUND_PENDING` nghĩa là còn việc phải làm. Nhân viên chuyển trả bên ngoài rồi nhập tham chiếu
qua `POST /refunds/:id/complete`; lúc đó mới có `Refund.DONE` và phiếu `REFUNDED`.
Không tự đánh dấu đã hoàn ngân hàng chỉ vì tạo yêu cầu.

Khi toàn bộ tiền đã áp dụng vào một hóa đơn được hoàn xong và không còn lệnh hoàn đang chờ,
hệ thống đóng các phiếu thiếu/thừa cũ còn mở của hóa đơn đó, đồng bộ log webhook và ghi audit.
Nếu còn một khoản hoàn chưa thực hiện thì phiếu tương ứng vẫn chờ. Khoản chuyển trễ, chuyển lặp,
sai mã chưa được gán không nằm trong Payment của hóa đơn nên không bị đóng theo tiền đã áp dụng.
Các khoản đó phải được giải quyết riêng.

Số dư trả lại tự động khi hết giữ chỗ cũng có bản ghi hoàn nội bộ CREDIT. Nếu toàn bộ tiền đã
áp dụng được trả về số dư và không còn tiền ngân hàng chờ trả thì phiếu tiền được đóng, tránh
để một phiếu chờ chuyển bù mà thực tế đã trả hết số dư.

Nếu chưa liên hệ hoặc chưa thực hiện được chuyển trả, giữ phiếu mở/chờ hoàn và theo dõi quá hạn;
không bỏ qua khoản tiền đã xác định được chủ sở hữu để làm sạch danh sách. Không cam kết tự động
chuyển tiền ngân hàng vì dự án hiện chưa có API thực hiện hoàn ngân hàng.

## Phần đã sửa và kiểm thử

- Đóng phiếu thiếu ngay khi chuyển bù đã phủ đủ giá hóa đơn, dù phát sinh chuyển thừa.
- Hoàn đủ tiền thì khép các phiếu thiếu/thừa cũ còn treo, kể cả dữ liệu cũ của cùng hóa đơn.
- Chặn nút xác nhận chuyển bù trên khóa đã hết giữ chỗ.
- Điều chuyển phần thừa qua sổ số dư để không thu/hoàn trùng giữa hai khóa.
- Đóng phiếu khi hết giữ chỗ và toàn bộ phần đã trả bằng số dư đã được trả về số dư.

Kiểm thử API: `course-payment-resolution.test.js`, `course-refund-closure.test.js`,
`course-excess-transfer.test.js`. Các case đi đến trạng thái kết thúc, gồm cạnh tranh hoàn tiền,
ngăn hoàn lặp và giữ độc lập các khoản tiền chưa được gán. Không chuyển tiền thật trong test.

Nghiệm thu ngày 04/11/2026: 267 test BE và 169 test FE đạt; lint toàn workspace và build FE đạt.
Hai lỗi treo phiếu được tái hiện bằng test thất bại trước sửa, sau sửa đạt. Nhóm 11 test mới ghi ở
sheet `TC-PAY-RESOLUTION` của `docs/kiem-thu/SWP391_TestCase.xlsx`.

## Cấu hình phí hủy khóa học

Trên UI: **Hệ thống → Cấu hình → Lớp học → Phí hủy khóa học (%)**, nhập tỷ lệ rồi
bấm **Lưu thay đổi**. Cần quyền xem và cập nhật cấu hình. Đặt 0 nếu không thu phí hủy;
setting là `CANCELLATION_FEE_PERCENT`. Phí áp dụng trên giá trị các buổi còn lại, không trên
cả học phí ban đầu. Chuyển trường khỏi nhóm Hội viên đã ẩn không thay đổi tỷ lệ đang lưu.
Sau khi cập nhật code, chạy `SEED_MOCK_DATA=false npm run db:seed` để đồng bộ nhóm/nhãn
trong database rồi tải lại trang cấu hình.
