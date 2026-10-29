# Lộ trình demo và review Sprint 2 – Sprint 3 (kèm phần sửa theo góp ý giảng viên)

Tài liệu dẫn buổi demo cho giảng viên. **Mọi bước dưới đây đã được diễn tập trên giao diện thật** với dữ liệu
`npm run db:demo` (desktop 1440×900); đường bấm ghi đúng nhãn đang hiển thị. Cột **Góp ý GV** để thư ký ghi
trong lúc demo; sau buổi demo chuyển vào bảng tổng hợp ở cuối file.

- **Phạm vi:** Sprint 2 (Flow 2 – Lớp học và lịch tập), Sprint 3 (Flow 3 – Thanh toán SePay, đối soát, báo cáo;
  ngoại lệ Flow 1 và 2; check-in, điểm danh; giao diện).
- **Thời lượng dự kiến:** ~55 phút (Sprint 2: 15 phút, Sprint 3: 35 phút, hỏi đáp: 5 phút).
- **Vai trò trong nhóm:** Nhanh dẫn demo và trả lời phần kiến trúc; người làm chức năng nào trình bày chức năng đó;
  một bạn làm thư ký ghi góp ý.

## 1. Chuẩn bị (làm trong 30 phút trước giờ demo)

| Việc | Lệnh / ghi chú |
|---|---|
| Bật MySQL, BE, FE | `npm run dev` (hoặc `npm run db:up` rồi `npm run dev`) |
| **Dựng lại dữ liệu demo** | `npm run db:demo` — chạy **≤ 15 phút trước bước B-2** vì hoá đơn online chờ thanh toán tự hết hạn sau 15 phút, và buổi "Sức mạnh cơ bản" dùng cho B-19 chỉ "đang diễn ra" 40 phút sau khi seed. Nếu lỡ quá giờ: B-2 cho member5 mua lại ở **Gói tập**; B-19 chạy lại `npm run db:demo`. |
| Nới giới hạn request (máy demo) | Trong `core/be/.env`: `RATE_LIMIT_MAX=5000`, `AUTH_RATE_LIMIT_MAX=300` rồi khởi động lại BE. Mặc định chỉ 20 lần đăng nhập/15 phút — buổi demo đổi ~20 tài khoản sẽ bị chặn giữa chừng. |
| Mở sẵn trình duyệt | Mỗi vai trò một cửa sổ (thường + ẩn danh, hoặc nhiều profile) để không phải đăng xuất liên tục |
| Mở sẵn terminal giả lập SePay | Thư mục gốc dự án, dùng lệnh ở mục 4 |
| Mở sẵn tài liệu | Task sheet Sprint 2, 3 (`docs/ke-hoach`), đặc tả UC/BR (`docs/yeu-cau`), sơ đồ flow |
| Demo qua laptop khác (tuỳ chọn) | Chạy ngrok trỏ vào FE; xem mục 5 |

### 1.1. Tài khoản

Mật khẩu chung **`Member@123`**; riêng admin dùng **`Admin@123`**. Tất cả email có đuôi `@scms.local`.

| Vai trò | Tài khoản | Họ tên | Dùng cho |
|---|---|---|---|
| Admin (Quản lý trung tâm) | `admin` | Center Manager | Vai trò & quyền, nhật ký thao tác, cấu hình |
| Quản lý trung tâm | `quanly` | Võ Thị Quản Lý | Lớp học, đối soát, hoàn tiền, báo cáo, bảo lưu, khoá tài khoản |
| Lễ tân | `letan` | Trần Thị Lễ Tân | Hội viên tại quầy, thu tiền mặt, check-in, đăng ký hộ, gỡ chặn |
| Lễ tân (ca 2) | `letan2` | Đặng Minh Thư | Như trên |
| HLV Yoga | `coach.yoga` | Nguyễn Văn Yoga | Yoga buổi sáng, Yoga thư giãn buổi tối |
| HLV Gym | `coach.gym` | Lê Văn Gym | Sức mạnh cơ bản, HIIT đốt mỡ — **điểm danh B-19** |
| HLV Boxing | `coach.boxing` | Đỗ Văn Boxing | Boxing nhập môn, Boxing nhóm nhỏ |
| HLV Pilates | `coach.pilates` | Hoàng Thu Hà | Pilates cải thiện tư thế |
| HLV Dance | `coach.dance` | Phan Bảo Ngọc | Zumba vui khỏe |
| Hội viên | `member1` … `member30` | xem mục 1.2 | `member1–15`: tình huống demo; `member16–30`: hội viên bình thường có gói và lịch học |

### 1.2. Trạng thái dữ liệu sau `npm run db:demo`

| Hội viên | Trạng thái chuẩn bị sẵn | Dùng ở bước |
|---|---|---|
| member1 (Nguyễn Minh Anh), member2 (Trần Quốc Bảo) | Gói 90 ngày; giữ 2/2 chỗ lớp **Boxing nhóm nhỏ (2 người)** (lớp đầy); member1 học thêm Yoga thư giãn buổi tối | A-6, A-10, B-13 |
| member3 (Lê Thu Cúc) | Gói 30 ngày mua online đã thanh toán; **đứng đầu danh sách chờ** Boxing nhóm nhỏ | B-3, B-13 |
| member4 (Hoàng Đức Dũng) | Gói 30 ngày mua tại quầy, lễ tân đã thu tiền mặt; chưa học lớp nào | A-7 |
| member5 (Phạm Gia Hân) | Hoá đơn online 360.000 đ **chưa thanh toán** (QR) | B-2, B-2a |
| member6 (Vũ Ngọc Hà) | **Chuyển thiếu** 200.000/360.000 đ, chờ chuyển bù | B-5 |
| member7 (Đặng Thanh Hải) | **Chuyển thừa** 200.000/120.000 đ, hoá đơn chờ quản lý chấp nhận | B-6 |
| member8 (Bùi Khánh Linh) | Đã thanh toán gói 7 ngày, **chuyển thêm lần 2 cùng mã** | B-7 |
| member9 (Đỗ Hoàng Long) | Hoá đơn chờ + đã bấm **"Tôi đã chuyển khoản"** | B-8 |
| (không có hội viên) | Giao dịch 360.000 đ **không ghi mã hoá đơn** | B-9 |
| member10 (Ngô Phương Mai) | Gói **còn 3 ngày**, đang học Yoga tối (lớp miễn phí) | B-14, B-18 |
| member11 (Dương Tuấn Minh) | Gói **đang bảo lưu** (bắt đầu 3 ngày trước, dự kiến 10 ngày) | B-12 |
| member12 (Lý Bảo Ngọc) | Gói **đã hết hạn** | A-8, B-11, B-18 |
| member13 (Trịnh Văn Phúc) | **Chưa xác minh email** | B-1, B-1b |
| member14 (Mai Thị Quỳnh) | **Bị tạm chặn đăng ký** 5 ngày vì vắng nhiều | B-15 |
| member15 (Hồ Đăng Khoa) | **Tài khoản bị khoá** | B-1 |
| member16 – member30 | Có gói (mua rải rác 4 tuần qua, online và tại quầy), mỗi người học 4–5 lớp (lớp có học phí đã mua khóa tại quầy) | A-9, B-16, B-19, B-20 |
| member16 – member21 | Tình huống góp ý GV: xem bảng ở **Phần C** | C-1 … C-12 |

Lớp (học từ ngày mai, 6 tuần; mở đăng ký đến trước buổi cuối 1 tuần). **Có học phí (bán theo khóa):** Yoga buổi
sáng 1.080.000 đ (T2/T4/T6 06:00), Sức mạnh cơ bản 900.000 đ (T2/T4/T6 19:00 + một buổi đang diễn ra lúc seed),
HIIT đốt mỡ 720.000 đ (T3/T5 06:30, T7 07:00), Boxing nhập môn 960.000 đ (T3/T5 19:30), Pilates cải thiện tư thế
1.200.000 đ. **Miễn phí:** Yoga thư giãn buổi tối (T3/T5 18:00), Boxing nhóm nhỏ (2 người) (T7 17:00, đầy 2/2),
Zumba vui khỏe (T2/T4 18:00, CN 09:00).

## 2. Phần A – Sprint 2: Lớp học và lịch tập (Flow 2)

Đường dẫn chung: menu trái **Lịch tập → Lớp học và lịch tập**. Ô **Tìm tên lớp** lọc ngay khi gõ.

| # | Người trình bày | Tài khoản | Thao tác (đúng nhãn trên màn hình) | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| A-1 | Bảo, Khải | quanly | Tab **Bộ môn** → **Thêm mới** → Tên, Mô tả → **Lưu**; thẻ → **Sửa** → **Lưu**; **Ngừng hoạt động** → **Đồng ý**. Làm tương tự ở tab **Phòng tập** (thêm Sức chứa). Sang tab **Quản lý lớp** → **Tạo lớp** mở danh sách Bộ môn/Phòng | Thẻ chuyển "Ngừng hoạt động" có nút **Kích hoạt lại**; bộ môn/phòng ngừng hoạt động không còn trong form tạo lớp | |
| A-2 | Bảo, Khải | quanly | **Quản lý lớp** → **Tạo lớp** → Tên lớp "Demo GV", Bộ môn, Phòng tập, Huấn luyện viên, Sức chứa, Ngày bắt đầu/kết thúc, Mở/Đóng đăng ký lúc → dòng lịch: **Thứ** + **Giờ học** (**Thêm thứ học** để thêm) → **Lưu lớp**. Thử lại với Phòng Gym, Thứ Tư 19:00 | Sinh các buổi học; trùng phòng/HLV bị chặn: "Phòng hoặc HLV bị trùng lịch" | |
| A-3 | Bảo, Khải | quanly | Thẻ lớp "Demo GV" → **⋯** → **Sửa lớp** → đổi Giờ học → **Lưu lớp** | Toast "Đã cập nhật lớp…"; chỉ buổi tương lai đổi giờ, buổi đã đổi/huỷ riêng giữ nguyên; hội viên đã đăng ký nhận thông báo | |
| A-4 | Bảo, Khải | quanly | Thẻ "Demo GV" → **⋯** → **Hủy lớp** → **Hủy lớp** | Thẻ "Đã hủy", hội viên nhận "Lớp học đã bị huỷ" | |
| A-5 | Nhanh, Khôi | quanly | Thẻ lớp → **Danh sách hội viên** (sĩ số, đang giữ chỗ, lịch sử đăng ký, **In danh sách**); **Chi tiết** (buổi học, **Đổi HLV phụ trách**, lịch sử thay đổi) | Thấy sĩ số, danh sách học viên, các buổi học | |
| A-6 | Bảo, Khải | member1 | Tab **Lớp đang mở** → lọc **Ngày học / Bộ môn / Huấn luyện viên** (**Xóa bộ lọc**) → **Chi tiết** | Thẻ hiện trạng thái đăng ký, "Còn X chỗ trống · đã đăng ký Y/Z" hoặc "Đã đủ chỗ", hạn đăng ký, hạn hủy buổi gần nhất | |
| A-7 | Nhanh, Khôi | member4 | Lớp đang mở → **Zumba vui khỏe** (lớp miễn phí) → **Đăng ký lớp** → **Đăng ký**; rồi **Hủy đăng ký** → **Hủy đăng ký**. Lớp có học phí dùng nút **Đăng ký khóa học** (xem C-5) | "Đã đăng ký lớp", số chỗ giảm; huỷ trước hạn được, số chỗ trả lại | |
| A-8 | Nhanh, Khôi | member12 | Lớp đang mở → thẻ **Zumba vui khỏe** | Gói tự tập đã hết hạn nhưng **vẫn đăng ký được lớp** (góp ý GV: học lớp không cần gói tự tập; lớp có học phí thì mua khóa) | Sửa theo góp ý |
| A-9 | Nhanh, Khôi | letan | Tab **Đăng ký / hủy hộ** → **Chọn hội viên** (gõ SĐT/email, ví dụ member20) → tab **Đăng ký lớp mới** → lớp miễn phí: **Đăng ký hộ** → **Đăng ký**; lớp có học phí: **Bán khóa học** → hoá đơn tại quầy → **Thu tiền**; tab **Đã đăng ký** → **Hủy hộ** | Thành công; member20 thấy lớp trong **Lịch tập của tôi**; roster ghi người thực hiện | |
| A-10 | Nhanh, Khôi | member1 | Tab **Lịch tập của tôi** → **Trước / Sau / Hôm nay**, chế độ **Ngày / Tuần** | Hiện đúng các buổi đã đăng ký | |
| A-11 | Nhanh, Khôi | coach.yoga | Tab **Lịch dạy** → buổi bất kỳ → **Danh sách hội viên** | Thấy sĩ số và danh sách học viên của buổi mình dạy | |

## 3. Phần B – Sprint 3: Thanh toán, đối soát, ngoại lệ, báo cáo

### 3.1. Tài khoản và email (Flow 1)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-1 | Nhanh, Khôi | member13, member15, member30 | Đăng nhập member13 (chưa xác minh), member15 (bị khoá); nhập sai mật khẩu member30 **5 lần** | member13: "Email chưa được xác minh" + **Gửi lại email xác minh**; member15: "Tài khoản đã bị khoá"; lần sai thứ 5: khoá đăng nhập 15 phút, hiện "Thử lại sau x phút y giây" (cấu hình `LOGIN_MAX_FAILED_ATTEMPTS`, `LOGIN_LOCK_MINUTES`) | |
| B-1a | Nhanh, Khôi | bất kỳ | **Quên mật khẩu?** → **Email đã đăng ký** → **Gửi liên kết đặt lại mật khẩu** | Thông báo đã gửi (không lộ email có tồn tại hay không). *Lưu ý: email `@scms.local` không nhận được thư — muốn demo trọn vẹn thì đổi email của một hội viên thành hộp thư thật trước buổi demo.* | |
| B-1b | Nhanh | letan | **Hội viên & gói tập → Quản lý hội viên** → tìm "member13" + Enter → **Xem** → **Xác minh email** → **Xác minh** | "Đã xác minh email cho hội viên"; member13 đăng nhập được | |

### 3.2. Mua gói và thanh toán (Flow 3)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-2 | Nhanh | member5 | **Tài chính → Hóa đơn** → dòng "Chờ chuyển khoản" → **Thanh toán** (hoặc **Hội viên & gói tập → Gói tập** → **Tiếp tục thanh toán**) | QR SePay, số tài khoản, **Nội dung (bắt buộc đúng)** = mã hoá đơn, đếm ngược hạn thanh toán, nút **Tôi đã chuyển khoản**. Mỗi gói chỉ có **một** hoá đơn chờ: bấm mua lại gói đó sẽ mở lại hoá đơn cũ | |
| B-2a | Nhanh | member5 + terminal | Giữ nguyên cửa sổ QR, chạy `npm run demo:webhook -- <mã HĐ> 360000` | Không cần tải lại: "Đã nhận thanh toán. Gói / khóa học đã có hiệu lực."; Tổng quan hiện số ngày gói; có thông báo "Đã thanh toán hoá đơn …" | |
| B-3 | Khải | member3 | **Tài chính → Hóa đơn** → tab **Hóa đơn** → dòng "Đã thanh toán" → **Chi tiết** → **Tải PDF** (tab **Lịch sử giao dịch** để xem các lần thanh toán) | PDF khổ A5, số tiền bằng chữ, mục "Các lần thanh toán" | |
| B-4 | Nhanh | letan | **Quản lý hội viên → Thêm hội viên** (khách mới) → **Đăng ký**. **Tài chính → Hóa đơn → Tạo hóa đơn tại quầy** → chọn hội viên, gói → xem "Tác động lên gói tập" → **Tạo hóa đơn** → **Đã nhận đủ tiền** → **In / Tải PDF** | Xem trước ngày hiệu lực trước khi tạo; hoá đơn kênh "Tại quầy", "Đã thanh toán", người thu là lễ tân | |

### 3.3. Đối soát SePay

Mở phiếu: **Tài chính → Hàng chờ đối soát** → dòng phiếu → **Xem phiếu** (ngăn kéo bên phải). Ghi liên hệ: chọn
**Kênh liên hệ**, nhập **Nội dung và ý kiến hội viên** → **Ghi lần liên hệ**. Quy tắc: **lệch tiền (thiếu hay
thừa) không bao giờ tự hoàn thành hoá đơn** (BR-PAY-06); các thao tác đóng phiếu thừa/lặp/báo đã chuyển đều cần
ghi liên hệ trước (BR-PAY-19).

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-5 | Khải, Khôi | member6 → terminal | member6: **Hóa đơn** thấy "Đã nhận 200.000 ₫ · thiếu 160.000 ₫", trạng thái "Chờ chuyển bù" → **Thanh toán**: QR đúng 160.000 đ, hạn chuyển bù "x ngày y giờ". Chạy `npm run demo:webhook -- <mã HĐ> 160000`. *(Cách khác: letan bấm **Thu tiền** trên hoá đơn đó → "Số tiền mặt cần thu bù 160.000 ₫" → **Đã nhận đủ tiền**)* | Hoá đơn tự chuyển "Đã thanh toán", phiếu thiếu tiền tự đóng | |
| B-6 | Khải | quanly (member7) | Phiếu **Thừa tiền** → nút **Chấp nhận hóa đơn** đang khoá → ghi liên hệ → **Chấp nhận hóa đơn** → **Chấp nhận** → phần **Hoàn tiền cho hội viên**: **Lý do hoàn tiền** → **Tạo yêu cầu hoàn** → **Tài chính → Hóa đơn → tab Theo dõi hoàn tiền** → **Xác nhận đã chuyển trả** + mã tham chiếu | Trước khi chấp nhận: hoá đơn "Chuyển thừa, chờ xác nhận", gói **chưa** cộng. Chấp nhận → gói kích hoạt; chỉ hoàn **80.000 đ phần thừa**, hoá đơn gốc vẫn "Đã thanh toán". (Nếu khách không mua: dùng **Hoàn tiền** ngay → hoàn toàn bộ, hoá đơn huỷ) | |
| B-7 | Khải | quanly (member8) | Nút **Đối soát** trên header đỏ có số (tooltip "Chuyển hai lần: 1") → phiếu **Chuyển khoản hai lần** → ghi liên hệ → **Gói gia hạn được hội viên đồng ý** = Trải nghiệm 7 ngày → **Dùng khoản tiền để gia hạn** | Không tự gia hạn khi tiền về lần 2; sau khi dùng: hoá đơn gia hạn mới "Đã thanh toán", member8 có thêm **một kỳ 7 ngày nối tiếp** sau kỳ đang dùng | |
| B-8 | Khải, Khôi | quanly (member9) | Phiếu **Hội viên báo đã chuyển** → mục **Hội viên khai báo** (số tiền, ngân hàng, mã, giờ) → ghi liên hệ → form đã điền sẵn số tiền/mã → **Xác nhận thanh toán**. *(Hoặc **Lý do từ chối** → **Từ chối phiếu**)* | Xác nhận → hoá đơn "Đã thanh toán". Từ chối → hội viên nhận "Chưa tìm thấy giao dịch chuyển khoản của bạn" kèm lý do. Phía hội viên, hoá đơn hiện "Đã báo chuyển, chờ kiểm tra" / "Báo chuyển bị từ chối" | |
| B-9 | Khải | member28 → quanly | member28: **Gói tập** → **Gia hạn** gói "Khởi động 30 ngày" (360.000 đ) → **Tạo hóa đơn**. quanly: phiếu **Sai hoặc thiếu mã** → **Gán vào hóa đơn** → **Hội viên** "member28" → **Hóa đơn có sẵn** vừa tạo → **Gán giao dịch** | Phiếu đóng, hoá đơn "Đã thanh toán" | |
| B-10 | Nhanh, Khôi | quanly | **Tài chính → Hóa đơn** → hoá đơn đã thanh toán (ví dụ của member4) → **Chi tiết** → **Hoàn tiền** → **Lý do hoàn** → **Tạo yêu cầu hoàn** → **Mã tham chiếu chuyển trả** → **Xác nhận đã chuyển trả** | Chỉ hoàn toàn bộ; hoá đơn "Đã hoàn tiền", **kỳ gói của hoá đơn đó bị hủy** (kỳ nối tiếp phía sau dời lên). Hoàn một phần: dùng **Hủy gói** (C-8) | |

### 3.4. Ngoại lệ hội viên và lớp học

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-11 | Khải | letan | **Quản lý hội viên → Thêm hội viên** với SĐT `0902000012` (của member12) → **Đăng ký** → **Mở hồ sơ này** | Không tạo trùng (BR-1.1), mở hồ sơ cũ để gia hạn | |
| B-12 | Bảo, Khải | quanly | **Quản lý hội viên** → member11 → **Xem** → tab **Gói tập**: trạng thái "Đang bảo lưu", lịch sử bảo lưu → **Kết thúc bảo lưu** → xác nhận | Ngày hết hạn được cộng bù đúng số ngày trọn vẹn đã dừng (2 ngày với dữ liệu demo), không cộng phần chưa dừng | |
| B-13 | Bảo, Khải | member1 → member3 | member1: **Lớp đang mở** → **Boxing nhóm nhỏ (2 người)** → **Hủy đăng ký**. member3: mở lại lớp đó | member3 thấy "Đang giữ chỗ cho bạn · bấm Đăng ký lớp để xác nhận" và hạn giữ chỗ; người khác không lấy được chỗ đó | |
| B-14 | Khải | member10 | **Tổng quan** (số ngày gói còn lại = 3) → **Lớp đang mở** → **Zumba vui khỏe** | Đăng ký được, **không còn cảnh báo** gói hết hạn trước lớp (góp ý GV: lớp tách khỏi gói tự tập, bỏ BR-1.12) | Sửa theo góp ý |
| B-15 | Bảo, Khải | member14, letan | member14: nút đăng ký bị khoá "Tạm chặn do vắng nhiều buổi. Được đăng ký lại từ …". letan: **Quản lý hội viên** → member14 → **Xem** → **Lý do gỡ chặn** → **Gỡ chặn đăng ký** | Gỡ chặn xong member14 đăng ký được | |
| B-16 | Bảo, Khôi | quanly | **Hệ thống → Tài khoản** → tìm "member25" + Enter → **Khóa** → xem trước các buổi bị ảnh hưởng → **Xác nhận khóa**. Thử **Khóa** coach.boxing (chỉ xem) | Xem trước danh sách buổi; khoá xong các đăng ký tương lai bị huỷ, người chờ được thông báo. HLV còn lớp: "Cần đổi HLV trước khi khóa" | |
| B-17 | Bảo, Khôi | quanly | Lớp "Demo GV" (tạo ở A-2, trước A-4) hoặc lớp bất kỳ → **Chi tiết** → dòng buổi **Đổi giờ** → **Lưu giờ mới**; **Hủy buổi** → **Lý do hủy**; **Đổi HLV phụ trách** → **HLV thay thế**. Tab **Phòng tập** → **Bảo trì** → khoảng thời gian + lý do → **Xem buổi bị ảnh hưởng** → **Chọn cách xử lý** từng buổi → **Áp dụng kế hoạch** | Xem trước buổi bị ảnh hưởng; chỉ gợi ý phòng đủ sức chứa lớp; hội viên nhận thông báo có giờ cũ → giờ mới / buổi bị huỷ kèm lý do / HLV mới | |
| B-18 | Bảo, Khải | letan | **Quản lý hội viên** → thẻ **Check-in tại quầy** → **Hội viên check-in** → **Xác nhận đến trung tâm** cho member22, member10, member12 | member22: "Đã ghi nhận check-in"; member10: cảnh báo "Gói sắp hết hạn: còn 3 ngày…"; member12: "Gói đã hết hạn hoặc chưa có gói". Khung giờ / khu vực: xem C-3 | |
| B-19 | Bảo, Khôi | coach.gym → member16 | **Lịch dạy** → buổi **Sức mạnh cơ bản** đang diễn ra hôm nay → **Điểm danh** → thử đổi "Có mặt"/"Vắng mặt" rồi lưu. member16: **Lịch tập → Lịch sử điểm danh** | HLV được đổi trạng thái trong giờ học; sau giờ kết thúc điểm danh bị khóa; hội viên thấy trạng thái cuối cùng đã lưu | |

### 3.5. Báo cáo, nhật ký và giao diện

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-20 | Bảo, Khôi | quanly | **Tài chính → Báo cáo** → **Khoảng ngày** (đầu tháng → hôm nay) → **Áp dụng** → chọn CSV / XLSX / PDF → **Xuất báo cáo** | Ba nhóm chỉ số Tài chính / Gói tập / Lớp học, bảng doanh thu theo ngày có số liệu 4 tuần; file xuất có nhãn tiếng Việt. "Đã hoàn" chỉ tính hoàn hoá đơn (hoàn phần chuyển thừa không phải doanh thu) | |
| B-21 | Khải | admin | **Hệ thống → Nhật ký thao tác** → lọc **Tên người thực hiện**, **Thao tác** (CREATE/UPDATE/…), **Đối tượng** (Invoice, GymClass…), khoảng thời gian | Thấy các thao tác vừa demo; không có nút sửa/xoá | |
| B-22 | Nhanh | admin → coach.yoga | **Hệ thống → Vai trò & quyền** → COACH → **Sửa** → bỏ "Xem trang tổng quan" → **Lưu** → đăng nhập coach.yoga → **bật lại quyền** sau khi xem | Menu "Tổng quan" biến mất, vào `/` bị 403 (RBAC động, không sửa code) | |
| B-23 | Khôi, Khải | các vai trò | Đi nhanh: Tổng quan, Quản lý hội viên, Hóa đơn, Hàng chờ đối soát, Lớp học | So với báo cáo rà soát UI Flow 1, 2 | |

## 4. Phần C – Sửa theo góp ý giảng viên (GĐ1–GĐ4)

Nguồn: `docs/yeu-cau/BR_UC_CapNhat_GopY_GiangVien.md`. Mở đầu phần này bằng câu trả lời ngắn cho 9 góp ý:
**khung giờ** cấu hình được; **loại phòng** có chức năng/bộ môn và cờ khu tự tập; **chuyên môn HLV**; xếp lịch
kiểm tra đủ và xem trước; **bán hai loại**: gói tự tập (thời hạn + khung giờ + khu vực) và khóa học (lớp có học
phí, thanh toán mới có chỗ); **hủy** có công thức và phí, chọn hoàn tiền hoặc số dư; **bảo lưu** trạng thái thật,
tổng ≤ 60 ngày, tự mở lại; **đổi sau thanh toán** tính chênh lệch; **gói tự do** = gói tự tập không giới hạn khung giờ.

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| C-1 | Nhanh | quanly | **Lịch tập → Lớp học và lịch tập** → tab **Khung giờ** (4 khung mặc định) → tab **Loại phòng** (Studio, Phòng máy *khu tự tập*, Sàn võ, Phòng nhảy) → **Hệ thống → Tài khoản** → cột **Chuyên môn** của coach.yoga → **Sửa** | Thấy cấu hình khung giờ, chức năng từng loại phòng, chuyên môn HLV | Khung giờ, phòng, chuyên môn |
| C-2 | Nhanh | quanly | **Quản lý lớp** → **Tạo lớp**: chọn Bộ môn "Boxing" → danh sách **Phòng tập** chỉ còn Sàn Boxing, **Huấn luyện viên** chỉ còn coach.boxing; đặt giờ 08:30–09:30 → **Lưu lớp**; sửa lớp có học viên → bảng **xem trước** | 08:30–09:30 bị chặn "không nằm trọn trong một khung giờ"; sửa lớp hiện số buổi đổi và học viên bị ảnh hưởng trước khi xác nhận | Sửa lại lịch học |
| C-3 | Nhanh | letan | **Quản lý hội viên → Check-in tại quầy** → member19 (gói *Tự tập sáng sớm 30 ngày*, chỉ 05:00–09:00) → **Xác nhận đến trung tâm**; thử chọn **Khu vực** "Studio" | Ngoài 05–09: "Ngoài khung giờ của gói (Sáng sớm 05:00–09:00)"; khu Studio: "Gói không cho vào khu vực Studio" | Gói tự tập / tự do |
| C-4 | Nhanh | member1 | **Hội viên & gói tập → Gói tập** | Thẻ gói hiện khung giờ (tag xanh) và khu tự tập (tag lục); "Gói của bạn" hiện kỳ đang dùng, kỳ nối tiếp (nếu có), nút **Hủy gói / Đổi gói** | Bán theo gói vô lý |
| C-5 | Khải | member4 | **Lớp đang mở** → **HIIT đốt mỡ** (tag "Học phí 720.000 ₫") → **Đăng ký khóa học · 720.000 ₫** → **Đăng ký**. Chỉ cho GV thấy thẻ **Sức mạnh cơ bản**: học phí thấp hơn giá gốc 900.000 ₫ vì đã qua một buổi (giá theo buổi còn lại) | Chuyển sang hóa đơn khóa học có QR; thẻ lớp hiện "Chờ thanh toán", **Thanh toán khóa học / Bỏ giữ chỗ**; chỗ đã bị giữ. Chạy `npm run demo:webhook -- <mã HĐ> 720000` → đăng ký chính thức | Bán khóa học |
| C-6 | Khải | member17 | **Lớp đang mở** → lớp "Chờ thanh toán" → **Bỏ giữ chỗ** | Hóa đơn hủy, chỗ nhả cho người khác / danh sách chờ | Giữ chỗ khi chờ trả tiền |
| C-7 | Khôi | member16 | **Hồ sơ** → thẻ **Số dư tài khoản** (900.000 ₫ từ lần hủy khóa) → **Gói tập** → mua "Khởi động 30 ngày" → **Dùng số dư** → **Dùng số dư** | Hóa đơn "Đã thanh toán" bằng số dư; sổ số dư ghi "Thanh toán"; báo cáo không tính lại doanh thu phần số dư | Hủy xong tiền đi đâu |
| C-8 | Khôi | member3 | **Gói tập** → **Hủy gói** → xem bảng (Đã thanh toán / Giá trị chưa sử dụng / Phí hủy 10% / Được hoàn) → **Ghi vào số dư** hoặc **Nhận tiền hoàn** → Lý do → **Xác nhận hủy** | Kỳ gói "Đã hủy"; Ghi số dư: cộng ngay; Nhận tiền hoàn: quanly thấy ở **Theo dõi hoàn tiền** → **Xác nhận đã chuyển trả** | Hủy như nào, tiền ra sao |
| C-9 | Khôi | member1 | **Lịch tập của tôi** → buổi Yoga thư giãn → **Báo nghỉ** → **Xác nhận báo nghỉ**. (member21 đã báo nghỉ sẵn một buổi Zumba) | Buổi hiện tag "Xin nghỉ"; HLV điểm danh thấy "Xin nghỉ", ghi vắng không ghi đè; không tính vào chặn vắng nhiều | Hủy một buổi |
| C-10 | Khôi | member4 (sau C-5) hoặc letan | Thẻ lớp HIIT đã trả phí → **Đổi lớp** → chọn lớp đích → xem **Giá trị còn lại / Giá sản phẩm mới / chênh lệch** → **Xác nhận đổi**; **Gói tập** → **Đổi gói** tương tự. member20: đổi gói đang **chờ thu chênh lệch** (letan mở hóa đơn "Đổi sang Năng động 90 ngày" → **Thu tiền**) | Thu thêm: hóa đơn chênh lệch, trả xong mới chuyển; rẻ hơn: chuyển ngay, phần dư hoàn hoặc ghi số dư; lịch sử đổi được lưu | Thanh toán xong đổi được không |
| C-11 | Bảo | quanly | **Quản lý hội viên** → member11 → **Xem / sửa** → tab **Gói tập**: trạng thái "Đang bảo lưu", "Đã bảo lưu x / 60 ngày" → **Kết thúc bảo lưu**; thử **Yêu cầu bảo lưu** vượt số ngày còn lại | Kỳ về "Đang hoạt động", cộng bù đúng ngày đã dừng; vượt ngân sách bị chặn. Hết hạn bảo lưu thì job tự mở lại và báo hội viên | Bảo lưu 2 tháng |
| C-12 | Bảo | quanly | **Quản lý lớp** → lớp có học viên đã trả phí → **Chi tiết** → **Hủy buổi** (hoặc **⋯ → Hủy lớp**) | Học viên đã trả được ghi số dư giá trị một buổi (hoặc toàn bộ phần chưa học khi hủy cả lớp) | Dữ liệu không rác |

## 5. Giả lập webhook SePay

Chạy ở **thư mục gốc dự án** (đọc khoá từ `core/be/.env`, không in khoá). Lấy mã hoá đơn ở cột "Mã hóa đơn".

```bash
npm run demo:webhook -- INV000123 360000          # đúng / thiếu / thừa tuỳ số tiền
npm run demo:webhook -- INV000123 120000 --twice  # gửi 2 giao dịch cùng mã (chuyển lặp)
npm run demo:webhook -- - 360000                  # không ghi mã hoá đơn (phiếu "Sai hoặc thiếu mã")
```

Webhook thật của SePay: `https://<địa chỉ>/api/v1/payments/sepay/webhook`, header `Authorization: Apikey <key>`.
Nút **Đồng bộ từ SePay** cần `SEPAY_API_TOKEN` trong `core/be/.env`; chưa cấu hình thì báo rõ để đối chiếu thủ công.

## 6. Demo trên laptop khác qua ngrok (tuỳ chọn)

FE chạy với `VITE_API_URL=/api/v1` và proxy `/api` sang BE, rồi `ngrok http 5173`: một URL dùng chung cho giao
diện và webhook SePay. Toàn bộ request đi qua ngrok đến BE từ cùng một IP, nên phải nới giới hạn request (mục 1).

## 7. Câu hỏi dự kiến từ giảng viên

| Câu hỏi | Người trả lời | Ý chính |
|---|---|---|
| Phân quyền làm thế nào? | Nhanh | RBAC động: quyền gắn với vai trò trong DB, code chỉ kiểm tra mã quyền, không so tên vai trò (demo B-22) |
| Số nghiệp vụ (hạn hủy, số lần vắng, thời gian chờ thanh toán…) để ở đâu? | Bảo | Bảng `system_settings`, chỉnh trong **Hệ thống → Cấu hình**, không hardcode |
| Làm sao tránh xác nhận thanh toán 2 lần? | Nhanh | Webhook idempotent theo id giao dịch SePay; chuyển lặp tạo phiếu đối soát, không tự gia hạn |
| Chuyển sai số tiền thì sao? | Nhanh, Khải | Không bao giờ tự hoàn thành: thiếu → chờ chuyển bù (QR phần còn thiếu hoặc thu tiền mặt tại quầy); thừa → quản lý liên hệ rồi chấp nhận + hoàn phần thừa, hoặc hoàn toàn bộ |
| Một khoản tiền có thể bị dùng 2 lần không? | Khải | Không: phiếu đã có lệnh hoàn thì không gán/gia hạn/xác nhận được nữa; số "đã nhận" luôn trừ tiền đã hoàn |
| Dữ liệu demo lấy ở đâu? | Nhanh | `npm run db:demo` dựng lại toàn bộ qua đúng các service nghiệp vụ (`core/be/prisma/seed/demo`) |
| Kiểm thử thế nào? | Khôi, Khải | Unit/integration test BE (Vitest), test FE, E2E Playwright; kịch bản này đã được diễn tập trên giao diện thật |

## 8. Tổng hợp góp ý sau demo

| # | Bước | Góp ý của giảng viên | Mức độ (Cao / TB / Thấp) | Người xử lý | Sprint xử lý | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

Sau buổi demo: thư ký điền bảng trên trong ngày, leader tạo task tương ứng trong task sheet Sprint 4.


## Bổ sung demo Sprint 4 (29/10/2026)

Lộ trình cuối kỳ bổ sung hồ sơ HLV/hội viên, tổng kết khoá, đánh giá và báo cáo theo thời gian.
Dùng [kịch bản Sprint 4](../../huong-dan/demo-sprint4.md) cho trình tự 15 phút, tài khoản giả, cách seed
và điều kiện SMTP. Không làm các function AI/kế hoạch tập luyện đã huỷ.
Bảo nhận task Nhanh và triển khai trên `sprint-4/be-bao`; Khôi phụ trách hồ sơ, Khải phụ trách UI tổng kết.
Đã chạy test API và E2E báo cáo; buổi diễn tập trực tiếp cả nhóm thực hiện sau tích hợp các nhánh.
