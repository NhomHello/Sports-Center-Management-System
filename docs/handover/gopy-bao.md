# Góp ý GV – Việc của Bảo (BE: hủy, số dư, đổi, bảo lưu, báo cáo)

Đọc trước: `docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md` (mục 4, 5, 6), `docs/huong-dan/HopDong_GopY_GD2-4.md`,
`CLAUDE.md`. Chỉ sửa file thuộc cột **Bảo** trong bảng chủ sở hữu. **Bắt đầu sau khi GY-00 đã merge** (22/10) —
trước đó làm GY-R1.

## Việc và thời hạn

| Mã | Hạn | Nhánh | Việc |
|---|---|---|---|
| GY-R1 | 21/10 | (review PR GĐ1) | Review BE GĐ1 (xem dưới) |
| GY-30 | 23/10 | `feature/gopy-gy30-bao-nghi-be` | Báo nghỉ một buổi |
| GY-32 | 25/10 | `feature/gopy-gy32-huy-goi-khoa-be` | Hủy gói tự tập / khóa học + công thức tiền |
| GY-33 | 26/10 | `feature/gopy-gy33-so-du-be` | Số dư tài khoản |
| GY-35 | 28/10 | `feature/gopy-gy35-doi-goi-lop-be` | Đổi gói / đổi lớp tính chênh lệch |
| GY-40 | 30/10 | `feature/gopy-gy40-bao-luu-be` | Bảo lưu trạng thái thật, tổng 60 ngày, job tự mở lại |
| GY-52 | 01/11 | `chore/gopy-gy52-br-uc` | Cập nhật BR/UC trong `docs/yeu-cau` |

## GY-R1 – Review BE GĐ1

Nhánh `feature/gopy-gd1-lich-hoc`. Kiểm tra: migration chỉ THÊM (không DROP bảng legacy); chạy migration trên DB tạm của
mình; `npm test` sạch; dùng Postman thử: giờ 12:30–13:30 bị chặn (vắt khung), Yoga ở Sàn võ bị chặn, HLV Boxing dạy Yoga
bị chặn, `POST /classes/:id/update-preview` trả số buổi đổi. Approve hoặc ghi lỗi trên PR.

## Chi tiết từng việc

| Mã | Yêu cầu | Test bắt buộc (`tests/gopy-<mã>-*.test.js`) |
|---|---|---|
| GY-30 | `POST /classes/sessions/:id/excuse`: hội viên (hoặc lễ tân với `memberId`) đang BOOKED lớp đó, trước hạn hủy → ghi attendance `EXCUSED`; no-show (BR-2.17) **không** đếm EXCUSED; điểm danh của HLV hiển thị "Xin nghỉ" (trả `status` trong roster) | trước hạn → OK; sau hạn → 422; không đăng ký → 403/422; 3 lần xin nghỉ không bị chặn |
| GY-32 | `cancel-preview` + `cancel` cho kỳ gói và khóa học theo **công thức hợp đồng mục 3** (đặt trong `modules/cancellation/settlement.js`, hàm thuần có unit test). `REFUND` → tạo `Refund` PENDING (luồng hoàn hiện có, cần `payment.refund` để hoàn tất); `CREDIT` → ghi sổ số dư ngay. Kỳ gói → `CANCELLED`, nhả `activeUserId`; khóa → enrollment `CANCELLED`, nhả chỗ, mời người chờ. Ghi `PurchaseChange` + audit. Báo cáo: trừ phần hoàn vào doanh thu ngày hoàn | ví dụ 1.200.000/18/6 → hoàn 720.000; hủy trước ngày bắt đầu → 0 phí; hủy kỳ đang bảo lưu/hết hạn → 422; hủy 2 lần → 409 |
| GY-33 | Sổ `CreditTransaction` chỉ thêm; mọi thay đổi số dư khoá dòng user (`FOR UPDATE`) và cập nhật `User.creditBalance` trong cùng transaction; `POST /invoices/:id/apply-credit` trừ tối đa `min(số dư, còn thiếu)` bằng `applyTransfer` provider `CREDIT` (hàm của Nhanh, chỉ gọi không sửa) | dùng một phần / đủ; số dư không âm; gọi song song 2 lần không trừ 2 lần; hóa đơn đủ tiền sau khi dùng số dư → kích hoạt như thanh toán thường |
| GY-35 | `change-preview` + `change`: `difference = newPrice − remainingValue` (không phí). `> 0` → tạo hóa đơn `ADJUSTMENT` (`changeId`), chỉ đổi khi trả đủ (`onAdjustmentPaid` trong `purchase-change.service.js`); `< 0` → hoàn hoặc số dư; `= 0` → đổi ngay. Đổi lớp: lớp mới phải còn chỗ, không trùng lịch; giữ chỗ lớp mới trong thời gian chờ thu thêm | Yoga 1.200.000 còn 12/18 → Pilates 1.500.000 = thu thêm 700.000; trả đủ mới chuyển đăng ký; hóa đơn thu thêm hết hạn → không đổi gì |
| GY-40 | Bảo lưu: tổng ngày bảo lưu của **một kỳ** ≤ `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS`, mỗi lần ≥ 7 ngày, không chồng lần khác; kỳ chuyển `FROZEN` khi tới ngày bắt đầu và về `ACTIVE` khi hết (job `freeze-resume.job.js` chạy mỗi phút) hoặc kết thúc sớm; cộng đúng số ngày đã dừng; thông báo hội viên; không check-in khi `FROZEN` | 30 + 31 ngày → 422; job mở lại đúng hạn và cộng đúng; kết thúc sớm sau 3 ngày → +3 ngày |

## Lệnh dán vào AI (mẫu)

```
Bạn làm việc trong repo SWP309. Đọc CLAUDE.md, docs/huong-dan/HopDong_GopY_GD2-4.md và
docs/handover/gopy-bao.md mục <MÃ VIỆC>. Chỉ sửa file thuộc cột "Bảo" trong bảng chủ sở hữu
(modules/cancellation, credit, purchase-change, attendance-excuse, membership-freeze, freeze-resume.job, report).
Không sửa schema.prisma, không tạo migration (đã có từ GY-00). Dùng đúng công thức ở hợp đồng mục 3.
Viết test BE cho từng dòng "Test bắt buộc", mọi thay đổi tiền có audit log và chạy trong transaction có khoá dòng.
Nếu cần sửa file của người khác thì dừng lại và báo tôi. Xong chạy npm run lint, npm test, tóm tắt thay đổi.
```
