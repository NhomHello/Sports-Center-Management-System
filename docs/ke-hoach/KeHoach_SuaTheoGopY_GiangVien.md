# Kế hoạch sửa theo góp ý giảng viên (20/10 → 02/11/2026)

Thiết kế chi tiết: [`docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md`](../yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md).
**Hợp đồng chung (schema, API, công thức tiền, chủ sở hữu file):** [`docs/huong-dan/HopDong_GopY_GD2-4.md`](../huong-dan/HopDong_GopY_GD2-4.md).
**Việc của từng người (kèm lệnh mẫu dán vào AI):** [Nhanh](../handover/gopy-nhanh.md) ·
[Bảo](../handover/gopy-bao.md) · [Khải](../handover/gopy-khai.md) · [Khôi](../handover/gopy-khoi.md).

Mục tiêu: đóng toàn bộ 9 góp ý **trước khi bắt đầu Sprint 4 (AI) ngày 03/11**. Kế hoạch Sprint 4 giữ nguyên, chỉ
lùi sang sau mốc này.

## 1. Tóm tắt góp ý → giai đoạn → người làm

| Giai đoạn | Góp ý | BE | FE | Trạng thái |
|---|---|---|---|---|
| **GĐ1 – Lịch học** | Khung giờ, loại phòng, chuyên môn HLV, sửa lịch có xem trước | Nhanh | Nhanh | **Đã code**, chờ review |
| **GĐ0 – Nền dữ liệu** | Schema + migration + hợp đồng API cho GĐ2–4 | Nhanh | — | Làm trước tiên |
| **GĐ2 – Sản phẩm** | Bán theo gói "vô lý" → gói tự tập + khóa học có học phí; gói tự do | Nhanh | Khải | |
| **GĐ3 – Hủy, tiền, đổi** | Hủy thế nào, tiền ra sao; thanh toán xong có đổi được không | Bảo | Khôi | |
| **GĐ4 – Bảo lưu** | Bảo lưu chuyển trạng thái, tối đa 2 tháng, dữ liệu không rác | Bảo | Khôi | |
| **GĐ5 – Hoàn thiện** | Seed demo, kịch bản demo, BR/UC, test case | Nhanh | Khải, Khôi | |

## 2. Lịch

| Ngày | Nhanh | Bảo | Khải | Khôi |
|---|---|---|---|---|
| T3 20/10 – T4 21/10 | GY-00 (schema + API contract) | GY-R1 review BE GĐ1 | GY-R2 review FE GĐ1 | Đọc thiết kế, chuẩn bị màn GĐ3 |
| T5 22/10 | Merge GY-00 → mọi người rebase | Bắt đầu GY-30 | Bắt đầu GY-21 (theo contract) | Bắt đầu GY-31 (theo contract) |
| T5 22/10 – T3 27/10 | GY-20 | GY-30, GY-32, GY-33 | GY-21, GY-22 | GY-31, GY-34 |
| T4 28/10 – T6 30/10 | GY-50 seed demo, hỗ trợ tích hợp | GY-40, GY-35 | GY-23 E2E GĐ2 | GY-41, GY-36 E2E GĐ3–4 |
| T7 31/10 – CN 01/11 | GY-51 kịch bản demo, diễn tập | GY-52 BR/UC | GY-53 test case | GY-53 test case |
| T2 02/11 | **Khoá code**, chạy lại toàn bộ test + diễn tập trên `npm run db:demo` | | | |

Chậm hơn 1 ngày so với lịch → báo trong nhóm ngay để dời việc; không ôm việc sang tuần Sprint 4.

## 3. Quy tắc chung (bắt buộc)

- **Nhánh** `feature/gopy-<mã việc>-<tên>` (ví dụ `feature/gopy-gy30-huy-goi-be`), tách từ `main` mới nhất; PR vào `main`,
  **≥ 1 người review**, tác giả chạy sạch `npm run lint` + `npm test` (+ E2E liên quan) trước khi xin review.
- **Chỉ Nhanh sửa `schema.prisma` và tạo migration** (GY-00). Ai cần thêm cột → nhắn Nhanh, không tự tạo migration.
  Migration tạo bằng `--create-only`, **xoá mọi lệnh DROP bảng legacy**, chạy thử trên DB tạm trước (xem
  `docs/huong-dan` và ghi chú migration của nhóm).
- **Thứ tự merge:** GY-00 → PR BE của từng giai đoạn → PR FE tương ứng. FE làm trước theo contract, giả lập dữ liệu
  nếu BE chưa xong, nhưng chỉ merge sau BE.
- Số nghiệp vụ (phí hủy %, 60 ngày bảo lưu…) để trong **Cấu hình**, không viết cứng. Quyền dùng `PERMISSIONS.*`.
- Mọi thay đổi tiền phải có **audit log**, có **test BE** cho từng công thức (ví dụ trong thiết kế mục 4, 6).
- Commit tiếng Anh, Conventional Commits, **không** ghi AI vào commit.

## 4. Danh sách việc

### Review GĐ1 (đã code)

| Mã | Người | Việc | Hoàn thành khi |
|---|---|---|---|
| GY-R1 | Bảo | Review BE GĐ1: migration `20261020…_operating_frames_room_types_coach_subjects`, module `operating-frame`, `room-type`, `user/coach-subject`, `class-change-preview`, kiểm tra trong `class-schedule.service` | Chạy migration trên DB tạm của mình, `npm test` sạch, thử 3 luật (sai khung giờ / sai loại phòng / HLV sai chuyên môn) bằng Postman |
| GY-R2 | Khải | Review FE GĐ1: tab Loại phòng, Khung giờ, form phòng, form lớp lọc theo bộ môn, xem trước khi sửa lớp/đổi giờ, cột Chuyên môn | Đi lại các màn trên `npm run db:demo`, E2E `sprint2*`, `sprint3-khoi-ui` pass |

### GĐ0 – Nền dữ liệu (Nhanh, xong T5 22/10)

| Mã | Việc | Hoàn thành khi |
|---|---|---|
| GY-00 | Một migration cho GĐ2–4: gói tự tập (khung giờ, khu vực), **kỳ gói theo hóa đơn** (`memberships.invoice_id`, trạng thái `FROZEN`, `CANCELLED`), học phí lớp (`gym_classes.price`), loại hóa đơn (`MEMBERSHIP` / `COURSE` / `ADJUSTMENT`, `class_id`, số buổi mua), đăng ký chờ thanh toán (`PENDING_PAYMENT`), báo nghỉ (`EXCUSED`), sổ số dư (`credit_transactions`), lịch sử đổi (`purchase_changes`), cấu hình `CANCELLATION_FEE_PERCENT`, `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS`. Chuyển dữ liệu cũ: mỗi gói hiện có gắn với hóa đơn đã trả gần nhất. Viết **contract API** (mục 5) vào `docs/huong-dan/api-gopy.md` | Migration chạy sạch trên DB tạm và DB dev, không DROP bảng legacy, 187 test cũ vẫn pass; contract được Bảo, Khải, Khôi đọc và đồng ý |

### GĐ2 – Gói tự tập và khóa học

| Mã | Người | Việc | Hoàn thành khi |
|---|---|---|---|
| GY-20 | Nhanh (BE) | (a) Gói tự tập: CRUD gói có khung giờ + khu vực (loại phòng là khu tự tập). (b) Mỗi lần mua = một kỳ gói; gia hạn khi còn hạn thì kỳ mới nối tiếp. (c) Check-in kiểm tra giờ hiện tại thuộc khung của gói, sai khung từ chối có lý do. (d) Lớp có học phí; học phí giữa khóa = học phí × buổi còn lại / tổng buổi. (e) `POST /classes/:id/orders` tạo hóa đơn khóa học + giữ chỗ `PENDING_PAYMENT`; trả đủ → `BOOKED`; hết hạn → nhả chỗ, mời người chờ. (f) Đăng ký lớp **không còn cần gói tự tập**. Webhook/đối soát/thu tiền mặt dùng chung cho hóa đơn khóa học | Test BE: mua gói tự tập; check-in đúng/sai khung; mua khóa giữa chừng đúng số tiền; hết hạn thanh toán nhả chỗ và mời người chờ; lệch tiền khóa học đi vào đối soát như gói |
| GY-21 | Khải (FE) | Trang **Gói tập**: thẻ gói tự tập hiển thị khung giờ, khu vực, "không cần đặt chỗ"; form quản lý gói có chọn khung giờ + khu vực | Hội viên thấy rõ gói dùng giờ nào, ở đâu; quản lý tạo/sửa gói qua form |
| GY-22 | Khải (FE) | **Lớp học**: thẻ lớp có học phí (kèm "giá cho N buổi còn lại"); nút **Đăng ký khóa học** → hóa đơn → QR / thu tại quầy; trạng thái "Đang giữ chỗ chờ thanh toán"; lễ tân "Đăng ký hộ" tạo hóa đơn khóa học. Check-in báo lý do sai khung giờ | Mua khóa online và tại quầy chạy trọn vòng trên giao diện |
| GY-23 | Khải | E2E GĐ2 (Playwright desktop) | E2E mới pass, E2E cũ cập nhật theo luồng mới |

### GĐ3 – Hủy, số dư, đổi

| Mã | Người | Việc | Hoàn thành khi |
|---|---|---|---|
| GY-30 | Bảo (BE) | **Báo nghỉ một buổi** (`EXCUSED`) trước hạn hủy; buổi xin nghỉ không tính vắng (BR-2.17) | Test: báo nghỉ trước/sau hạn; không bị chặn vì vắng |
| GY-32 | Bảo (BE) | **Hủy gói tự tập / hủy khóa học**: API xem trước số tiền (phần chưa dùng − phí `CANCELLATION_FEE_PERCENT`, hủy trước ngày bắt đầu không phí) và API xác nhận với lựa chọn **Hoàn tiền** (dùng luồng hoàn tiền hiện có) hoặc **Ghi số dư**. Hóa đơn gốc giữ "Đã thanh toán", ghi dòng hủy; báo cáo trừ đúng phần hoàn | Test đúng ví dụ thiết kế (1.200.000 đ, 18 buổi, học 6 → hoàn 720.000 đ); không hủy được kỳ đang bảo lưu hoặc đã hết |
| GY-33 | Bảo (BE) | **Số dư tài khoản**: sổ biến động (+ hủy/đổi, − dùng thanh toán); khi tạo hóa đơn có thể **dùng số dư** trừ trước, phần còn lại QR/tiền mặt; số dư không âm, không dùng hai lần | Test: dùng số dư một phần / đủ; hai yêu cầu dùng số dư cùng lúc không trừ hai lần |
| GY-35 | Bảo (BE) | **Đổi gói / đổi lớp**: xem trước giá trị còn lại, chênh lệch; thiếu → hóa đơn `ADJUSTMENT` thu thêm, đổi xong khi trả đủ; thừa → hoàn hoặc số dư; lưu `purchase_changes` | Test đúng ví dụ thiết kế (Yoga → Pilates, thu thêm 700.000 đ); lớp mới hết chỗ/trùng lịch thì từ chối |
| GY-31 | Khôi (FE) | Hội viên: nút **Báo nghỉ** trên buổi trong "Lịch tập của tôi"; HLV thấy "Xin nghỉ" khi điểm danh | |
| GY-34 | Khôi (FE) | Màn **Hủy gói / Hủy khóa** (bảng tính tiền hoàn, chọn Hoàn tiền / Ghi số dư), **số dư** trên Hồ sơ và ô "Dùng số dư" khi thanh toán, màn **Đổi gói / Đổi lớp** có bảng chênh lệch; lịch sử thay đổi trong chi tiết hội viên | Hội viên và lễ tân làm trọn vòng trên giao diện; số tiền khớp BE |
| GY-36 | Khôi | E2E GĐ3–4 | |

### GĐ4 – Bảo lưu

| Mã | Người | Việc | Hoàn thành khi |
|---|---|---|---|
| GY-40 | Bảo (BE) | Trạng thái **Bảo lưu** thật trên kỳ gói; tổng bảo lưu mỗi kỳ ≤ `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS` (60), mỗi lần ≥ 7 ngày; **job tự mở lại** khi hết hạn, cộng đúng số ngày đã dừng, báo hội viên; không check-in khi đang bảo lưu; lịch sử chỉ thêm | Test: 2 lần bảo lưu cộng dồn > 60 ngày bị chặn; job mở lại đúng ngày; kết thúc sớm cộng đúng |
| GY-41 | Khôi (FE) | Màn bảo lưu: số ngày còn được bảo lưu, trạng thái "Đang bảo lưu đến …", lịch sử, kết thúc sớm | |

### GĐ5 – Hoàn thiện

| Mã | Người | Việc |
|---|---|---|
| GY-50 | Nhanh | Cập nhật `prisma/seed/demo` theo mô hình mới: gói tự tập (Sáng sớm, Cả ngày…), học phí từng lớp, hội viên mua khóa, tình huống hủy/đổi/số dư/bảo lưu |
| GY-51 | Nhanh | Cập nhật kịch bản demo `docs/kiem-thu/nghiem-thu/LoTrinh_Demo_Sprint2_Sprint3.md` (thêm phần "Sửa theo góp ý"), diễn tập đủ trên giao diện |
| GY-52 | Bảo | Cập nhật `docs/yeu-cau` (BR-1.x, BR-2.1, BR-PAY…, UC mua/hủy/đổi/bảo lưu) cho khớp code |
| GY-53 | Khải, Khôi | Bổ sung test case vào `docs/kiem-thu/SWP391_TestCase.xlsx`, ghi kết quả chạy |

## 5. Hợp đồng API cần chốt ở GY-00 (bản nháp)

| API | Ai gọi | Ghi chú |
|---|---|---|
| `GET/POST/PUT /membership-plans` (+ `frameIds`, `roomTypeIds`) | quản lý | Gói tự tập |
| `POST /memberships/me/orders`, `POST /memberships/orders` | hội viên / lễ tân | Như cũ, tạo kỳ gói mới khi trả đủ |
| `POST /check-ins` | lễ tân | Thêm lỗi "ngoài khung giờ của gói" |
| `POST /classes/:id/orders` (`memberId` khi lễ tân làm hộ) | hội viên / lễ tân | Hóa đơn khóa học + giữ chỗ |
| `POST /classes/sessions/:id/excuse` | hội viên / lễ tân | Báo nghỉ |
| `GET /memberships/:id/cancel-preview`, `POST /memberships/:id/cancel` | hội viên / lễ tân | `settlement: REFUND | CREDIT` |
| `GET /enrollments/:id/cancel-preview`, `POST /enrollments/:id/cancel` | hội viên / lễ tân | Hủy khóa học |
| `GET /me/credit`, `GET /members/:id/credit` | hội viên / nhân viên | Số dư + sổ biến động |
| `POST /invoices/:id/apply-credit` | hội viên / lễ tân | Dùng số dư cho hóa đơn chờ |
| `GET /memberships/:id/change-preview?planId=`, `POST /memberships/:id/change` | hội viên / lễ tân | Đổi gói |
| `GET /enrollments/:id/change-preview?classId=`, `POST /enrollments/:id/change` | hội viên / lễ tân | Đổi lớp |
| `POST /memberships/:id/freezes`, `POST /memberships/:id/freezes/resume` | như cũ | Luật mới tổng 60 ngày |

## 6. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Nhiều người cùng sửa schema → xung đột migration | Chỉ GY-00 tạo migration; cần thêm thì Nhanh gộp |
| Đổi mô hình làm gãy test/E2E cũ (BR-2.1 "phải có gói mới học lớp") | Sửa test trong cùng PR với thay đổi, ghi rõ lý do theo góp ý |
| Sai công thức tiền | Mỗi công thức có test BE với số liệu ví dụ trong thiết kế; review chéo Bảo ↔ Nhanh |
| Trễ ảnh hưởng Sprint 4 | Khoá code 02/11; việc chưa xong chuyển thành task Sprint 4, không kéo dài |
