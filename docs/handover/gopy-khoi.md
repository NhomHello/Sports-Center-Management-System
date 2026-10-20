# Góp ý GV – Việc của Khôi (FE: báo nghỉ, hủy, số dư, đổi, bảo lưu)

Đọc trước: `docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md` (mục 4, 5, 6), `docs/huong-dan/HopDong_GopY_GD2-4.md`,
`CLAUDE.md`. Chỉ sửa file thuộc cột **Khôi**: các component mới gắn vào "khe" GY-00 đã tạo
(`MembershipActions.jsx`, `EnrollmentActions.jsx`, `ApplyCreditButton.jsx`) và `FreezeControls.jsx`, `Cancel*.jsx`,
`Change*.jsx`, `ExcuseButton.jsx`, `ScheduleEventCard.jsx`, `CreditPanel.jsx`, `services/credit.service.js`,
`services/purchase.service.js`. **Không sửa** file của Khải (thẻ lớp, trang gói, thẻ gói của bạn).

## Việc và thời hạn

| Mã | Hạn | Nhánh | Việc |
|---|---|---|---|
| GY-31 | 24/10 | `feature/gopy-gy31-bao-nghi-fe` | Báo nghỉ buổi học |
| GY-34 | 28/10 | `feature/gopy-gy34-huy-so-du-doi-fe` | Hủy gói/khóa, số dư, đổi gói/lớp |
| GY-41 | 30/10 | `feature/gopy-gy41-bao-luu-fe` | Bảo lưu |
| GY-36 | 30/10 | `feature/gopy-gy36-e2e-gd3-4` | E2E GĐ3–4 |
| GY-53 | 01/11 | `chore/gopy-gy53-test-case` | Test case (cùng Khải) |

21/10: đọc thiết kế, phác màn hình. Từ 22/10 (sau GY-00) code theo hợp đồng; merge sau PR BE tương ứng của Bảo.

## Chi tiết

| Mã | Màn hình | Yêu cầu | Xong khi |
|---|---|---|---|
| GY-31 | **Lịch tập của tôi** (thẻ buổi) | Nút **Báo nghỉ** cho buổi sắp tới còn trong hạn (hết hạn: ẩn nút, ghi "Đã quá hạn báo nghỉ"); sau khi báo: tag "Xin nghỉ". HLV mở **Điểm danh** thấy học viên xin nghỉ đánh dấu sẵn | Hội viên báo nghỉ được, HLV thấy |
| GY-34 | **Gói của bạn** (khe `MembershipActions`) | Nút **Hủy gói** → hộp tính tiền (đã trả, phần chưa dùng, phí, được hoàn) → chọn **Nhận tiền hoàn** / **Ghi vào số dư** + lý do → xác nhận. Nút **Đổi gói** → chọn gói mới → bảng chênh lệch → thu thêm (mở hóa đơn) / trả lại (hoàn hoặc số dư) | Số tiền hiển thị khớp API preview; sau khi làm, thẻ gói cập nhật |
| GY-34 | **Khóa học đã đăng ký** (khe `EnrollmentActions`) | **Hủy khóa học**, **Đổi lớp** giống trên (đổi lớp chỉ liệt kê lớp còn chỗ) | |
| GY-34 | **Hồ sơ** + **Chi tiết hội viên** (lễ tân) | `CreditPanel`: số dư hiện tại + lịch sử biến động | |
| GY-34 | **Thanh toán** (khe `ApplyCreditButton`) | Khi có số dư: "Dùng số dư (còn 720.000 đ)" → trừ vào hóa đơn, QR/tiền mặt chỉ còn phần thiếu | Hóa đơn được trả hết bằng số dư thì tự "Đã thanh toán" |
| GY-41 | **Gói của bạn** / chi tiết hội viên (`FreezeControls`) | Hiện "Đã bảo lưu x / 60 ngày", form chọn khoảng (≥ 7 ngày, không vượt số ngày còn lại), trạng thái "Đang bảo lưu đến …", **Kết thúc bảo lưu**, lịch sử các lần | Không chọn được khoảng vượt 60 ngày; thông báo lỗi BE hiện rõ |
| GY-36 | E2E | `tests/e2e/gopy-gy36-*.spec.mjs`: báo nghỉ, hủy khóa nhận số dư rồi dùng số dư mua gói, đổi lớp thu thêm (webhook giả lập), bảo lưu + kết thúc sớm | E2E desktop pass |

## Lệnh dán vào AI (mẫu)

```
Bạn làm việc trong repo SWP309 (React + antd + TanStack Query). Đọc CLAUDE.md, docs/huong-dan/HopDong_GopY_GD2-4.md
và docs/handover/gopy-khoi.md mục <MÃ VIỆC>. Chỉ sửa file thuộc cột "Khôi" trong bảng chủ sở hữu (các component
gắn vào khe MembershipActions / EnrollmentActions / ApplyCreditButton và các file liệt kê). Không sửa file của Khải
và không sửa BE. Gọi API đúng hợp đồng mục 4; số tiền luôn lấy từ API preview, không tự tính ở FE.
Xong chạy npm run lint, npm test (FE), chụp màn hình trên dữ liệu npm run db:demo, tóm tắt thay đổi.
```
