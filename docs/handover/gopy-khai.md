# Góp ý GV – Việc của Khải (FE: gói tự tập, khóa học, check-in)

Đọc trước: `docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md` (mục 2, 3), `docs/huong-dan/HopDong_GopY_GD2-4.md`,
`CLAUDE.md`. Chỉ sửa file thuộc cột **Khải**. **Không sửa** `MembershipActions.jsx`, `FreezeControls.jsx`,
`Cancel*.jsx`, `Change*.jsx`, `EnrollmentActions.jsx`, `ApplyCreditButton.jsx` (của Khôi) — chỉ để nguyên chỗ gắn.

## Việc và thời hạn

| Mã | Hạn | Nhánh | Việc |
|---|---|---|---|
| GY-R2 | 21/10 | (review PR GĐ1) | Review FE GĐ1 |
| GY-21 | 25/10 | `feature/gopy-gy21-goi-tu-tap-fe` | Trang Gói tập theo mô hình gói tự tập |
| GY-22 | 28/10 | `feature/gopy-gy22-khoa-hoc-fe` | Mua khóa học trên thẻ lớp + check-in |
| GY-23 | 30/10 | `feature/gopy-gy23-e2e-gd2` | E2E GĐ2 |
| GY-53 | 01/11 | `chore/gopy-gy53-test-case` | Test case (cùng Khôi) |

Bắt đầu GY-21/22 từ 22/10 theo hợp đồng API (giả lập dữ liệu nếu BE GY-20 chưa merge); chỉ merge sau GY-20.

## GY-R2 – Review FE GĐ1

`npm run db:demo`, đăng nhập `quanly`: tab **Loại phòng**, **Khung giờ** (thêm/sửa), **Phòng tập** (bắt chọn loại phòng),
**Tạo lớp** (chọn bộ môn trước → chỉ hiện phòng/HLV hợp), **Sửa lớp** và **Đổi giờ** có bước xem trước, **Hệ thống →
Tài khoản** cột Chuyên môn. Chạy E2E `sprint2*`, `sprint3-khoi-ui`. Approve hoặc ghi lỗi trên PR.

## Chi tiết

| Mã | Màn hình | Yêu cầu | Xong khi |
|---|---|---|---|
| GY-21 | **Gói tập** (hội viên) | Đổi tên hiển thị thành **Gói tự tập**; thẻ gói hiện khung giờ (vd "Sáng sớm 05:00–09:00"), khu vực ("Phòng máy"), "Không cần đặt chỗ – check-in tại quầy". Thẻ **Gói của bạn**: kỳ hiện tại + kỳ đã mua nối tiếp (`nextPeriods`) | Hội viên nhìn thẻ là biết dùng giờ nào, ở đâu |
| GY-21 | **Gói tập** (quản lý) | Form gói: chọn nhiều **Khung giờ**, nhiều **Khu vực** (chỉ loại phòng là khu tự tập) | Tạo/sửa gói được, lỗi BE hiện rõ |
| GY-22 | **Lớp học → Lớp đang mở** | Thẻ lớp hiện **Học phí** ("1.200.000 đ / 18 buổi"; giữa khóa: "800.000 đ cho 12 buổi còn lại"); nút **Đăng ký khóa học** → xác nhận giá → hóa đơn (QR như mua gói); thẻ hiện "Đang giữ chỗ – chờ thanh toán đến …" + nút **Thanh toán**; lớp miễn phí giữ nút cũ | Mua khóa online trọn vòng, giữ chỗ hiện đúng, hết hạn thì thẻ quay lại "Đăng ký khóa học" |
| GY-22 | **Đăng ký / hủy hộ** (lễ tân) | **Đăng ký hộ** lớp có học phí → tạo hóa đơn khóa tại quầy → mở hộp **Thu tiền** | Lễ tân bán khóa tại quầy trọn vòng |
| GY-22 | **Check-in tại quầy** | Hiện lý do BE khi sai khung giờ / khu vực / đang bảo lưu | |
| GY-23 | E2E | `tests/e2e/gopy-gy23-*.spec.mjs`: mua gói tự tập, mua khóa online (webhook giả lập), mua khóa tại quầy, check-in ngoài khung bị từ chối; sửa E2E cũ bị ảnh hưởng (đăng ký lớp giờ cần mua khóa) | E2E desktop pass |

## Lệnh dán vào AI (mẫu)

```
Bạn làm việc trong repo SWP309 (React + antd + TanStack Query). Đọc CLAUDE.md, docs/huong-dan/HopDong_GopY_GD2-4.md
và docs/handover/gopy-khai.md mục <MÃ VIỆC>. Chỉ sửa file thuộc cột "Khải" trong bảng chủ sở hữu.
Không sửa MembershipActions.jsx, FreezeControls.jsx, Cancel*.jsx, Change*.jsx, EnrollmentActions.jsx,
ApplyCreditButton.jsx (của Khôi) và không sửa BE. Gọi API đúng hợp đồng mục 4; chữ trên giao diện tiếng Việt.
Xong chạy npm run lint, npm test (FE), chụp màn hình các màn đã sửa trên dữ liệu npm run db:demo, tóm tắt thay đổi.
```
