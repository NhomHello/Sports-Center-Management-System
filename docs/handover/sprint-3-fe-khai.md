# Sprint 3 – Khải

- Nhánh bàn giao: `sprint-3/fe-khai`, đã tích hợp `origin/main` trước khi triển khai.
- Tác giả các commit triển khai: `khainguyense190020 <khainguyen02112005@gmail.com>`.
- Phạm vi lấy theo 35 dòng có người làm **Khải** trong `docs/ke-hoach/SWP391_TaskSheet_Sprint3.xlsx`, gồm cả ba task BE được phân công. S3-08 được triển khai cùng nhánh theo yêu cầu làm toàn bộ công việc của Khải.

## Chức năng

| Task | Kết quả và vị trí chính |
| --- | --- |
| S3-08, S3-09 | API chỉ đọc `/audit-logs` và trang `/system/audit`: lọc người, ngày, thao tác, đối tượng; xem chi tiết thay đổi; quyền `audit.read`. |
| S3-19 | Trang `/reconciliation`: hàng chờ có phân trang/lọc, chi tiết phiếu và xác nhận số tiền thực nhận + tham chiếu. |
| S3-21 | API `/payments`, `/payments/me`, bảng từng lần nhận tiền; chính chủ tiếp tục thanh toán hóa đơn online còn hạn. |
| S3-47 | Check-in tại quầy trên `/members`; hiển thị cảnh báo và lỗi policy từ backend. |
| S3-53 | Gán giao dịch sai mã/tiền về muộn vào hóa đơn hội viên hoặc gói đang bán bằng API đối soát hiện có. |
| S3-57 | Xử lý tiền thừa/chuyển lặp: chỉ cho quyết định hoàn hoặc gia hạn sau khi ghi liên hệ, không tự cộng ngày. Việc chuyển trả và tham chiếu hoàn tiếp tục ở khu vực Hoàn tiền đã có. |
| S3-59 | Badge cảnh báo chuyển hai lần trên header; tooltip có số phiếu quá hạn; mở hàng chờ đối soát. |
| S3-61 | Timeline liên hệ chỉ thêm, lưu kênh/nội dung/kết quả và người ghi. |
| S3-66 | Biên lai in A5 dọc và tải PDF từ server: thông tin trung tâm, mã, hội viên, gói/thời hạn, số tiền bằng chữ, đủ từng payment và người thu. |
| S3-71, S3-72 | Đăng ký tại quầy trùng định danh trả thẻ hồ sơ theo `member.read`, che SĐT, mở hồ sơ hiện có. Khách tự đăng ký vẫn giữ phản hồi chung. |
| S3-76 | Bảo lưu và kết thúc sớm trên trang gói tập/hồ sơ hội viên; lịch sử và số ngày thực cộng lấy từ API. |
| S3-79 | Vào/rời danh sách chờ, thông báo giữ chỗ và xác nhận đăng ký qua luồng đăng ký lớp. |
| S3-80, S3-81 | Backend đếm buổi sau hạn gói; FE cảnh báo và có lối tắt gia hạn, vẫn cho đăng ký. |
| S3-87 | Hiển thị lý do/ngày mở lại đăng ký do vắng mặt; người có `class.unblock` gỡ chặn kèm lý do ở hồ sơ hội viên. |
| S3-88 | Test API, logic số tiền và E2E desktop ngoại lệ + đối soát/PDF; test case trong `docs/kiem-thu/SWP391_TestCase.xlsx`. |

## Giao diện

| Task | Thay đổi |
| --- | --- |
| UI-F1-04 | Bấm dòng mở hồ sơ; nút Xem có nhãn, mua/gia hạn là nút phụ. |
| UI-F1-05 | Tìm kiếm rõ hơn, cột không xuống dòng, lọc trạng thái gói tại server trước phân trang. |
| UI-F1-06, UI-F1-07 | Thống nhất hóa/hủy/khóa, hội viên; nhãn tiếng Việt và thương hiệu Sports Center. |
| UI-F1-08 | Xác nhận ngày hiệu lực dự kiến trước khi tạo hóa đơn; dùng chung MembershipEffectPreview; quyền mua không phụ thuộc role mặc định. |
| UI-F1-09, UI-F1-10 | Bộ lọc hội viên/nhân viên riêng, Empty có lối tắt; khoảng ngày, Do tôi tạo dựa audit tạo hóa đơn, tiền căn phải. |
| UI-F1-11 | Giải thích điều kiện tạo hóa đơn và luôn hiện khung giá/thời hạn. |
| UI-F1-15 | Nhãn thường, khoảng cách lỗi, gợi ý mật khẩu/email và giá VND, mô tả gói. |
| UI-F1-16 | Tiến độ ngày gói còn lại, gia hạn/xem hóa đơn; thông báo rỗng không hiện phân trang; chuông rõ hơn. |
| UI-F2-03 | Tag đã đăng ký, hạn hủy trước đăng ký, lớp đầy có màu cảnh báo và nút vào hàng chờ. |
| UI-F2-05 | Bộ lọc ngày/bộ môn/HLV cho lớp mở; API chỉ trả lựa chọn thuộc lớp mở trong phạm vi hội viên. |
| UI-F2-06 | Lịch dạy có sĩ số, roster/điểm danh trên card; ẩn tên HLV lặp và đổi phụ đề. |
| UI-F2-07 | Form hai nhóm/cột, TimePicker.RangePicker, mặc định OPEN, option phòng có sức chứa. |
| UI-F2-08 | Descriptions có viền, thao tác ở header/footer, bảng buổi gọn theo thứ/ngày/giờ/trạng thái/thao tác. |
| UI-F2-12 | Footer thao tác thống nhất; Sửa/Hủy lớp trong menu có xác nhận. |
| UI-F2-14 | Danh mục có lọc trạng thái/kích hoạt lại, tiêu đề ellipsis/tooltip, tag bảo trì và phân trang căn phải. |

## Chạy và quyền

```bash
npm run db:seed
npm run lint
npm test
npm run build
npx playwright test --project=desktop
```

Quyền mới `invoice.export_own` được seed vào registry. Role đang tồn tại giữ cấu hình quản lý; cần cấp `membership.freeze_self`/`membership.freeze_all`, `attendance.check_in`, `class.unblock`, `payment.reconcile`, `payment.refund` theo nhu cầu. `invoice.read_own` tiếp tục cho xuất biên lai chính chủ theo hợp đồng API sẵn có; chỉ `invoice.export` mở phạm vi tải PDF mọi hóa đơn.

E2E tạo fixture riêng và dọn đúng phạm vi. Bank giả chỉ dùng trong test và được khôi phục. Test SePay mặc định gửi payload đến API kiểm thử; có thể đặt `E2E_WEBHOOK_URL` để chạy smoke qua tunnel. Ảnh/trace ở `test-results/` và `playwright-report/`, ảnh nghiệm thu cũ ở `outputs/*-nghiem-thu/`; các thư mục ảnh sinh tự động không commit.

## Xác minh

- `npm run lint`: pass.
- `npm run build`: pass.
- Backend: 36 file, 180 test pass.
- Frontend: 14 file, 73 test pass.
- 10 E2E mới của Khải: pass (7 ngoại lệ + 3 đối soát/PDF).
- Hồi quy desktop: đã xác nhận đủ 40 ca pass. Lần toàn bộ có 32 ca pass; 8 ca cũ được cập nhật selector/kỳ vọng theo UI hiện tại và đã pass khi chạy lại. Kiểm tra cuối 4/4 ca (đăng ký hộ, chuyển bù, liên hệ lỗi 409 giữ nội dung, hoàn phần thừa và tải PDF) pass.
- 23 test case đã được ghi nhận Pass; 35 task chuyển sang Review để leader review code.
