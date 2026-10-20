# Thiết kế sửa hệ thống theo góp ý giảng viên (20/10/2026)

## 0. Góp ý gốc

- Thiết lập **khung giờ**: một ngày có bao nhiêu khung giờ lớn (ví dụ 5h–9h); lịch học nằm trong khung giờ.
- Thiết lập **phòng tập** (số lượng), mỗi **loại phòng** có chức năng khác nhau.
- Thiết lập **chuyên môn** của người dạy. (Lưu ý chung: sửa lại lịch học.)
- **Bán theo gói như hiện tại là vô lý** — phải rõ bán theo cái gì.
- **Hủy** như nào, điều kiện hủy; hủy xong **tiền** xử lý ra sao.
- Cho **bảo lưu** chuyển trạng thái (trong vòng **2 tháng**), dữ liệu không bị rác.
- **Thanh toán xong có thay đổi được không**.
- **Gói tập tự do** được không?

## 1. Các quyết định đã chốt

| # | Vấn đề | Quyết định |
|---|---|---|
| Q1 | Bán cái gì | **Hai loại sản phẩm tách bạch**: (a) **Gói tự tập** — theo thời hạn, chỉ dùng trong các khung giờ và khu vực của gói, không cần đặt chỗ, check-in khi vào; (b) **Khóa học** — mỗi lớp có giá riêng, đăng ký lớp = mua khóa, **thanh toán xong mới có chỗ**. Học lớp **không** cần gói tự tập. |
| Q2 | Hủy và tiền | Hủy cả gói/khóa: **hoàn phần chưa dùng trừ phí hủy** (% cấu hình). Hội viên chọn **nhận tiền hoàn** hoặc **giữ làm số dư** để mua lần sau. Hủy một buổi học: chỉ báo nghỉ trước hạn, không phát sinh tiền, không bị tính vắng. |
| Q3 | Bảo lưu | Gói tự tập có trạng thái **Bảo lưu** thật trong DB; **tổng thời gian bảo lưu của một gói ≤ 60 ngày** (cấu hình). Hết hạn bảo lưu **hệ thống tự mở lại**, cộng bù đúng số ngày đã dừng, báo hội viên. Lịch sử bảo lưu giữ nguyên. |
| Q4 | Đổi sau thanh toán | **Cho đổi gói / đổi lớp, tính chênh lệch** theo giá trị còn lại; thiếu thì tạo hóa đơn thu thêm, thừa thì hoàn hoặc ghi số dư; lưu lịch sử đổi. Sau thanh toán **không sửa** giá, gói, ngày hiệu lực trực tiếp trên hóa đơn. |

## 2. Danh mục và lịch học

### 2.1. Khung giờ hoạt động (mới)

Quản lý cấu hình danh sách khung giờ trong ngày. Mặc định:

| Khung | Giờ |
|---|---|
| Sáng sớm | 05:00 – 09:00 |
| Sáng | 09:00 – 13:00 |
| Chiều | 13:00 – 17:00 |
| Tối | 17:00 – 22:00 |

- Mỗi khung giờ học trong tuần của lớp phải **nằm trọn trong một khung** (ví dụ 18:00–19:00 thuộc "Tối"; 08:30–09:30
  vắt qua hai khung → từ chối).
- Gói tự tập chọn được những khung nào được vào (ví dụ gói "Sáng sớm" chỉ 05:00–09:00).
- Không xoá khung đang có lớp hoặc gói dùng; chỉ ngừng hoạt động.

### 2.2. Loại phòng và phòng (mở rộng)

- **Loại phòng** (mới): tên, mô tả chức năng, **các bộ môn dạy được** trong loại phòng này, có phải **khu tự tập** không.
  Ví dụ: "Studio" (Yoga, Pilates), "Phòng máy" (Gym & Fitness, khu tự tập), "Sàn võ" (Boxing), "Phòng nhảy" (Zumba & Dance).
- **Phòng**: thuộc một loại phòng, có sức chứa. Số lượng phòng = số phòng khai báo.
- Xếp lịch: chỉ chọn được phòng **có loại phòng hỗ trợ bộ môn của lớp**; vẫn chặn trùng phòng (BR-2.4) và phòng bảo trì.

### 2.3. Chuyên môn huấn luyện viên (mới)

- Mỗi HLV khai báo **các bộ môn dạy được** (Hệ thống → Tài khoản → HLV → Chuyên môn).
- Tạo/sửa lớp, đổi HLV: chỉ chọn được HLV **có chuyên môn đúng bộ môn**; vẫn chặn trùng lịch HLV.

### 2.4. Sửa lịch học (kiểm tra đầy đủ)

Khi tạo lớp, sửa lớp, đổi giờ một buổi, đổi phòng, đổi HLV — server kiểm tra **đồng thời**:
1. nằm trong khung giờ hoạt động; 2. phòng đúng loại cho bộ môn, đủ sức chứa, không trùng, không bảo trì;
3. HLV đúng chuyên môn, không trùng; 4. **học viên bị ảnh hưởng**: trước khi lưu hiển thị bản xem trước (số học viên,
ai bị trùng lịch với lớp khác) để quản lý xác nhận; sau khi lưu thì báo từng người (giữ BR-2.15: không tự hủy).

## 3. Sản phẩm bán ra

### 3.1. Gói tự tập (thay cho "gói tập" hiện tại)

| Thuộc tính | Ví dụ |
|---|---|
| Tên, mã, giá, thời hạn (ngày) | "Tự tập sáng sớm 30 ngày", 290.000 đ, 30 ngày |
| Khung giờ được vào | Sáng sớm |
| Khu vực được vào (loại phòng là khu tự tập) | Phòng máy |
| Đặt chỗ trước | Không — check-in tại quầy |

- Check-in: kiểm tra gói còn hiệu lực, **giờ hiện tại thuộc khung của gói**, khu vực; sai khung → từ chối, nói rõ lý do.
- Mỗi lần mua là **một kỳ gói riêng** (một dòng gói hội viên gắn với một hóa đơn). Mua thêm khi còn hạn thì kỳ mới bắt
  đầu ngay sau kỳ cũ (giữ BR-1.3), hết hạn thì bắt đầu từ ngày thanh toán (BR-1.4). Nhờ tách kỳ, hủy/đổi/hoàn tính
  đúng cho từng lần mua.

### 3.2. Khóa học (lớp có giá)

- Lớp có thêm **học phí** cho cả khóa. Đăng ký giữa khóa trả theo **số buổi còn lại**:
  `học phí × số buổi còn lại / tổng số buổi` (làm tròn nghìn).
- Luồng: hội viên bấm **Đăng ký khóa học** → tạo hóa đơn khóa học (online QR hoặc tại quầy) → **giữ chỗ tạm** trong thời
  gian chờ thanh toán → thanh toán đủ → đăng ký chính thức. Hết hạn thanh toán → nhả chỗ, người danh sách chờ được mời.
- Mọi luật lệch tiền/đối soát hiện có áp dụng y nguyên cho hóa đơn khóa học.
- Học lớp **không còn cần gói tự tập** (BR-2.1 đổi thành "đã thanh toán khóa học").

## 4. Hủy và xử lý tiền

| Trường hợp | Ai làm | Điều kiện | Tiền |
|---|---|---|---|
| **Báo nghỉ một buổi** | Hội viên (hoặc lễ tân hộ) | Trước buổi ≥ `CLASS_CANCEL_MIN_HOURS_BEFORE` giờ (12) | Không hoàn; buổi ghi "Xin nghỉ", không tính vắng (BR-2.17) |
| **Hủy khóa học** | Hội viên gửi yêu cầu / lễ tân tại quầy | Khóa chưa kết thúc | `học phí đã trả × buổi chưa diễn ra / tổng buổi đã mua − phí hủy` |
| **Hủy gói tự tập** | Hội viên / lễ tân | Gói chưa hết hạn, không đang bảo lưu | `giá đã trả × ngày chưa dùng / tổng ngày − phí hủy` |
| Hủy **trước ngày bắt đầu** | như trên | | Hoàn 100%, không phí |

- Phí hủy: `CANCELLATION_FEE_PERCENT` (mặc định 10%).
- Hội viên chọn: **Hoàn tiền** (đi qua luồng hoàn tiền hiện có: quản lý chuyển trả, nhập mã tham chiếu) hoặc
  **Ghi số dư** (cộng ngay vào số dư tài khoản).
- **Số dư tài khoản** (mới): sổ ghi từng biến động (+ hủy/đổi, − dùng thanh toán). Khi tạo hóa đơn có thể **dùng số
  dư** trừ trước; phần còn lại trả bằng QR/tiền mặt.
- Hủy xong: hóa đơn gốc vẫn "Đã thanh toán" (doanh thu thật), dòng hủy ghi số tiền hoàn/ghi số dư và phí giữ lại;
  báo cáo trừ đúng phần hoàn.

## 5. Bảo lưu gói tự tập

- Trạng thái gói: **Đang hoạt động → Bảo lưu → Đang hoạt động → Hết hạn** (lưu thật trong DB).
- Mỗi lần tối thiểu `MEMBERSHIP_FREEZE_MIN_DAYS` (7); **tổng các lần của một kỳ gói ≤ `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS`
  (60)**. Bắt đầu từ hôm nay hoặc một ngày tương lai.
- Đang bảo lưu: không check-in; ngày hết hạn chưa cộng.
- Kết thúc: **job tự mở lại** khi hết hạn bảo lưu (hoặc hội viên/lễ tân kết thúc sớm) → cộng đúng số ngày đã dừng →
  thông báo. Mọi lần bảo lưu được lưu lịch sử (không xoá, không sửa).
- Khóa học không bảo lưu (học theo lịch cố định); muốn dừng thì hủy khóa hoặc đổi lớp.

## 6. Thay đổi sau thanh toán

| Muốn đổi | Cách tính | Kết quả |
|---|---|---|
| Đổi gói tự tập | Giá trị còn lại = giá đã trả × ngày chưa dùng / tổng ngày | Mới − còn lại > 0 → hóa đơn thu thêm; < 0 → hoàn hoặc ghi số dư |
| Đổi lớp (khóa học) | Giá trị còn lại = học phí đã trả × buổi chưa học / tổng buổi đã mua; giá lớp mới tính theo buổi còn lại | Như trên; thu đủ mới chuyển đăng ký sang lớp mới |

- Không có phí khi đổi (khác hủy). Lớp mới phải còn chỗ, không trùng lịch.
- Lưu **lịch sử thay đổi** (từ gì → sang gì, giá trị còn lại, chênh lệch, hóa đơn/khoản hoàn liên quan, người thực hiện).
- Sau thanh toán chỉ sửa được ghi chú; giá, gói, ngày hiệu lực thay đổi **chỉ qua** đổi/hủy/bảo lưu ở trên.

## 7. Cấu hình mới (Hệ thống → Cấu hình)

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `CANCELLATION_FEE_PERCENT` | 10 | Phí hủy gói/khóa (%) |
| `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS` | 60 | Tổng ngày bảo lưu tối đa mỗi kỳ gói |
| (bỏ) `MEMBERSHIP_FREEZE_MAX_DAYS`, `MEMBERSHIP_FREEZE_MAX_TIMES` | | Thay bằng tổng 60 ngày |

## 8. Kế hoạch triển khai

| Giai đoạn | Nội dung | Ảnh hưởng demo |
|---|---|---|
| **GĐ1 – Lịch học** | Khung giờ, loại phòng + bộ môn, chuyên môn HLV, kiểm tra đầy đủ khi xếp/sửa lịch, xem trước học viên bị ảnh hưởng | A-1 → A-5, B-17 |
| **GĐ2 – Sản phẩm** | Gói tự tập (khung giờ, khu vực, check-in theo khung), kỳ gói tách theo hóa đơn, khóa học có học phí, đăng ký = mua khóa, giữ chỗ khi chờ thanh toán | A-6 → A-9, B-2 → B-4, B-18 |
| **GĐ3 – Hủy, số dư, đổi** | Báo nghỉ buổi, hủy gói/khóa tính tiền, số dư tài khoản, đổi gói/đổi lớp tính chênh lệch, lịch sử | Mục mới |
| **GĐ4 – Bảo lưu** | Trạng thái Bảo lưu thật, tổng 60 ngày, job tự mở lại | B-12 |
| **GĐ5 – Hoàn thiện** | Seed demo, kịch bản demo, test, tài liệu BR/UC cập nhật | Toàn bộ |

Migration chỉ **thêm** bảng/cột (không DROP bảng legacy), tạo bằng `--create-only` và kiểm tra trên DB tạm trước.
