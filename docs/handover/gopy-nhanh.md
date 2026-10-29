# Góp ý GV – Việc của Nhanh (BE lead: nền dữ liệu + GĐ2 BE + hoàn thiện)

Đọc trước: `docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md`, `docs/huong-dan/HopDong_GopY_GD2-4.md`, `CLAUDE.md`.
Chỉ sửa file thuộc cột **Nhanh** trong bảng chủ sở hữu (hợp đồng mục 1).

## Việc và thời hạn

| Mã | Hạn | Nhánh | Việc |
|---|---|---|---|
| GĐ1 | 21/10 | `feature/gopy-gd1-lich-hoc` | Đã code. Mở PR, nhờ Bảo (BE) + Khải (FE) review, sửa theo review, merge |
| GY-00 | **22/10** | `feature/gopy-gy00-nen-du-lieu` | Nền cho cả nhóm (chi tiết dưới). Merge sớm nhất có thể vì 3 người kia chờ |
| GY-20 | 27/10 | `feature/gopy-gy20-goi-tu-tap-khoa-hoc-be` | Gói tự tập + khóa học có học phí (BE) |
| GY-50 | 30/10 | `feature/gopy-gy50-seed-demo` | Seed demo theo mô hình mới |
| GY-51 | 01/11 | `chore/gopy-gy51-kich-ban-demo` | Kịch bản demo + diễn tập |

## GY-00 – Nền dữ liệu (làm đúng thứ tự)

1. `schema.prisma`: thêm đúng mục 2 của hợp đồng (tên bảng snake_case, `@map`).
2. Migration: `npx prisma migrate dev --create-only --name gopy_gd2_4`; **xoá mọi DROP / ALTER bảng legacy** (attendances,
   enrollments, exercise_completions, password_reset_tokens, training_*, cột cũ của invoices/payments/users); chỉ giữ
   thêm mới. Chuyển dữ liệu: `memberships.invoice_id` = hóa đơn PAID mới nhất của kỳ (nếu có); `invoices.kind =
   'MEMBERSHIP'`. Chạy thử trên DB tạm `scms_gy00` (dump DB dev → import → `migrate deploy`) rồi mới áp vào DB dev.
3. `core/shared`: 2 cấu hình mới (hợp đồng mục 2).
4. Tạo **file rỗng/khung** cho người khác (chỉ export, không logic) và đăng ký route trong `routes.js`:
   - BE Bảo: `modules/cancellation/{cancellation.routes,controller,service,validation}.js`, `modules/credit/*`,
     `modules/purchase-change/*` (export `onAdjustmentPaid = async () => {}`), `attendance/attendance-excuse.service.js`,
     `membership/freeze-resume.job.js` (export `startFreezeResumeJob = () => () => {}`); route trả 501 "Đang phát triển".
   - FE Khôi: `pages/membership/MembershipActions.jsx`, `pages/schedule/EnrollmentActions.jsx`,
     `pages/payments/ApplyCreditButton.jsx` (đều `return null`) và gắn vào `CurrentMembershipCard`,
     `ClassBookingActions`, `OnlinePaymentPanel`, `InvoiceCashModal`.
5. `payment-apply.service.js`: khi hóa đơn đủ tiền gọi bộ phân phối theo `invoice.kind`
   (`MEMBERSHIP` → kích hoạt kỳ gói, `COURSE` → xác nhận đăng ký, `ADJUSTMENT` → `onAdjustmentPaid`).
6. Chạy `npm run lint`, `npm test` (phải pass như trước), E2E desktop. Merge.

## GY-20 – Gói tự tập + khóa học (BE)

| Phần | Yêu cầu | Test bắt buộc (`tests/gopy-gy20-*.test.js`) |
|---|---|---|
| Gói tự tập | CRUD nhận `frameIds`, `roomTypeIds` (chỉ loại phòng `isSelfTrainingArea`); gói phải có ≥ 1 khung, ≥ 1 khu vực | tạo gói thiếu khung → 422; khu vực không phải khu tự tập → 422 |
| Kỳ gói | Mỗi hóa đơn PAID tạo **một** kỳ: còn hạn → bắt đầu ngay sau kỳ cuối (BR-1.3); hết hạn → bắt đầu từ lúc trả (BR-1.4). `activeUserId` chỉ cho kỳ đang hiệu lực; job gói chuyển kỳ kế tiếp lên khi kỳ trước hết | mua 2 lần liên tiếp → 2 kỳ nối nhau; kỳ 1 hết → kỳ 2 thành hiện tại |
| Check-in | Giờ hiện tại (VN) phải thuộc một khung của gói; lý do rõ khi sai | trong khung → OK; ngoài khung → 422 kèm tên khung |
| Học phí lớp | `price` trong form lớp (BE validation ≥ 0); trả `totalSessions`, `remainingSessions`, `priceForRemaining` | lớp 18 buổi, còn 12 → giá đúng công thức |
| Mua khóa | `POST /classes/:id/orders`: kiểm tra như đăng ký cũ (còn chỗ tính cả người giữ chỗ, không trùng lịch, không bị chặn) **trừ** điều kiện có gói; tạo hóa đơn `COURSE` + enrollment `PENDING_PAYMENT` giữ chỗ đến `expiresAt`; một hội viên chỉ 1 hóa đơn khóa chờ cho mỗi lớp | 2 người cùng mua chỗ cuối → 1 người được; trả đủ → `BOOKED`; hết hạn → chỗ nhả, người chờ được mời; chuyển thiếu/thừa → đối soát như gói |
| Đăng ký miễn phí | Chỉ cho lớp `price = 0` | lớp có giá → 422 |
| Tại quầy | Lễ tân tạo hóa đơn khóa `COUNTER` cho hội viên, thu tiền mặt như gói | |

Không đụng: hủy/đổi/số dư/bảo lưu (của Bảo).

## GY-50, GY-51

- Seed: 2–3 gói tự tập (ví dụ "Sáng sớm 30 ngày" khung Sáng sớm + Phòng máy, "Cả ngày 30 ngày" mọi khung), học phí từng lớp
  (600.000–1.500.000 đ), hội viên đã mua khóa, mỗi tình huống của Bảo/Khôi có 1 hội viên sẵn (hủy, đổi, số dư, bảo lưu).
- Kịch bản: thêm phần "Sửa theo góp ý" vào `LoTrinh_Demo_Sprint2_Sprint3.md`, diễn tập hết trên giao diện.

## Lệnh dán vào AI (mẫu cho GY-20)

```
Bạn làm việc trong repo SWP309. Đọc CLAUDE.md, docs/huong-dan/HopDong_GopY_GD2-4.md và
docs/handover/gopy-nhanh.md mục GY-20. Chỉ sửa các file thuộc cột "Nhanh" trong bảng chủ sở hữu.
Làm GY-20 đúng hợp đồng API và công thức. Viết test BE cho từng dòng "Test bắt buộc".
Không tạo migration mới (schema đã có từ GY-00). Không sửa file của người khác; nếu thấy cần, dừng lại và báo tôi.
Xong thì chạy npm run lint, npm test, và tóm tắt file đã đổi.
```
