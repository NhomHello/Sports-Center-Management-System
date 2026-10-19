# Lộ trình demo và review Sprint 2 – Sprint 3

Tài liệu dẫn buổi demo cho giảng viên. Mỗi bước có cột **Góp ý GV** để thư ký ghi trực tiếp trong lúc demo;
sau buổi demo, mọi góp ý được chuyển vào bảng tổng hợp ở cuối file và giao người xử lý.

- **Phạm vi:** Sprint 2 (Flow 2 – Lớp học và lịch tập), Sprint 3 (Flow 3 – Thanh toán SePay, đối soát,
  báo cáo; ngoại lệ Flow 1 và 2; điểm danh; sửa UI).
- **Thời lượng dự kiến:** khoảng 50 phút (Sprint 2: 15 phút, Sprint 3: 30 phút, hỏi đáp: 5 phút).
- **Vai trò trong nhóm:** Nhanh dẫn demo và trả lời phần kiến trúc; người làm chức năng nào trình bày
  chức năng đó; một bạn làm thư ký ghi góp ý.

## 1. Chuẩn bị trước buổi demo

| Việc | Ghi chú |
|---|---|
| Chạy BE, FE, MySQL trên máy demo | `npm run db:up`, `npm run dev` |
| Kiểm tra dữ liệu demo | Đăng nhập đủ các tài khoản ở mục 1.1, mở được Hàng chờ đối soát có 5 phiếu |
| Mở sẵn trình duyệt | Mỗi vai trò một cửa sổ (thường + ẩn danh, hoặc nhiều profile) để không phải đăng xuất |
| Mở sẵn tài liệu | Task sheet Sprint 2, 3 (`docs/ke-hoach`), đặc tả UC/BR (`docs/yeu-cau`), sơ đồ flow |
| Terminal giả lập SePay | Dùng lệnh ở mục 4 để bắn webhook khi không chuyển khoản thật |

### 1.1. Tài khoản demo

Mật khẩu chung `Member@123`; riêng admin dùng `Admin@123`.

| Vai trò | Tài khoản | Dùng cho |
|---|---|---|
| Admin | `admin@scms.local` | Vai trò & quyền, cấu hình, nhật ký thao tác |
| Quản lý trung tâm | `quanly@scms.local` | Lớp học, đối soát, hoàn tiền, báo cáo, bảo lưu |
| Lễ tân | `letan@scms.local` | Hội viên tại quầy, thu tiền mặt, check-in, đăng ký lớp hộ |
| Huấn luyện viên | `coach.yoga@`, `coach.gym@`, `coach.boxing@scms.local` | Lịch dạy, danh sách học viên, điểm danh |
| Hội viên | `member1@` … `member15@scms.local` | Xem trạng thái từng hội viên ở mục 1.2 |

### 1.2. Trạng thái dữ liệu hội viên

| Hội viên | Trạng thái chuẩn bị sẵn | Dùng ở bước |
|---|---|---|
| member1, member2 | Gói còn hạn, đã giữ 2 chỗ lớp Boxing | A-6, A-8 |
| member3 | Mua online đã thanh toán, đang chờ chỗ lớp Boxing | B-3, B-13 |
| member4 | Mua tại quầy, trả tiền mặt | B-4, B-9 |
| member5 | Hóa đơn online chưa thanh toán | B-2 |
| member6 | Chuyển thiếu, chờ chuyển bù | B-5 |
| member7 | Chuyển thừa | B-6 |
| member8 | Chuyển 2 lần cùng mã | B-7 |
| member9 | Đã báo "Tôi đã chuyển khoản" | B-8 |
| member10 | Gói còn 3 ngày, đang học lớp Yoga kéo dài sau ngày hết hạn | B-14 |
| member11 | Gói đang bảo lưu | B-12 |
| member12 | Gói đã hết hạn | B-11 |
| member13 | Chưa xác minh email | B-1 |
| member14 | Bị tạm chặn đăng ký vì vắng nhiều | B-15 |
| member15 | Tài khoản bị khóa | B-1 |

## 2. Phần A – Sprint 2: Lớp học và lịch tập (Flow 2)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| A-1 | Bảo, Khải | quanly | Lớp học và lịch tập → tab Bộ môn / Phòng tập: tạo, sửa, ngừng hoạt động | Bộ môn/phòng ngừng hoạt động không còn chọn được khi tạo lớp | |
| A-2 | Bảo, Khải | quanly | Tạo lớp: chọn bộ môn, phòng, HLV, sức chứa, khoảng ngày, lịch hằng tuần | Hệ thống sinh các buổi; báo lỗi khi trùng phòng hoặc trùng lịch HLV | |
| A-3 | Bảo, Khải | quanly | Sửa lớp / đổi lịch | Buổi chưa diễn ra được cập nhật; hội viên đã đăng ký nhận thông báo | |
| A-4 | Bảo, Khải | quanly | Hủy lớp | Lớp chuyển trạng thái hủy, hội viên nhận thông báo hủy lớp | |
| A-5 | Nhanh, Khôi | quanly | Danh sách lớp quản lý → mở chi tiết lớp và danh sách học viên | Thấy sĩ số, danh sách học viên, các buổi học | |
| A-6 | Bảo, Khải | member1 | Lớp đang mở → lọc theo ngày/bộ môn/HLV → xem chi tiết lớp | Card lớp hiện trạng thái đăng ký, hạn hủy, số chỗ còn | |
| A-7 | Nhanh, Khôi | member4 | Đăng ký lớp Sức mạnh cơ bản, rồi hủy đăng ký | Đăng ký thành công; hủy được khi còn trước hạn hủy | |
| A-8 | Nhanh, Khôi | member12 | Thử đăng ký một lớp | Bị chặn vì gói đã hết hạn, lý do hiện rõ | |
| A-9 | Nhanh, Khôi | letan | Đăng ký hộ / hủy hộ hội viên | Thao tác thành công, hội viên thấy trong lịch tập của mình | |
| A-10 | Nhanh, Khôi | member1 | Lịch tập của tôi (dạng tuần / danh sách) | Hiện đúng các buổi đã đăng ký | |
| A-11 | Nhanh, Khôi | coach.yoga | Lịch dạy → mở danh sách học viên một buổi | Thấy sĩ số và danh sách học viên của buổi mình dạy | |

## 3. Phần B – Sprint 3: Thanh toán, đối soát, ngoại lệ, báo cáo

### 3.1. Tài khoản và email (Flow 1)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-1 | Nhanh, Khôi | member13, member15, bất kỳ | Đăng nhập tài khoản chưa xác minh / bị khóa; nhập sai mật khẩu nhiều lần | Chưa xác minh: yêu cầu xác minh email; bị khóa: báo khóa; sai nhiều lần: tạm khóa đăng nhập | |
| B-1a | Nhanh, Khôi | bất kỳ | Quên mật khẩu → nhận link → đặt lại mật khẩu | Link dùng một lần và có hạn; đăng nhập được bằng mật khẩu mới | |
| B-1b | Nhanh | letan | Quản lý hội viên → xác minh email thủ công cho member13 | member13 đăng nhập được | |

### 3.2. Mua gói và thanh toán (Flow 3)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-2 | Nhanh | member5 | Gói tập → mua online → màn QR; hoặc mở lại hóa đơn đang chờ | Hiện QR SePay, mã hóa đơn, thời hạn; một hội viên chỉ có một hóa đơn chờ | |
| B-2a | Nhanh | member5 + terminal | Bắn webhook đúng số tiền (mục 4) | Hóa đơn PAID, gói được kích hoạt, hội viên nhận thông báo | |
| B-3 | Khải | member3 | Hóa đơn → lịch sử giao dịch → tải hóa đơn PDF | PDF khổ A5, có số tiền bằng chữ và các lần thanh toán | |
| B-4 | Nhanh | letan | Tạo hóa đơn tại quầy cho một hội viên → thu tiền mặt | Hóa đơn kênh COUNTER, PAID; xác nhận ngày hiệu lực trước khi tạo | |

### 3.3. Đối soát SePay (màn Hàng chờ đối soát)

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-5 | Khải, Khôi | quanly, member6 | Phiếu **chuyển thiếu** của member6; member6 xem hóa đơn | Hóa đơn vẫn chờ, hội viên thấy số tiền cần chuyển bù; chuyển bù đủ thì PAID | |
| B-6 | Khải | quanly | Phiếu **chuyển thừa** của member7 → ghi liên hệ → hoàn phần thừa | Bắt buộc ghi liên hệ trước khi hoàn; không hoàn quá phần thừa | |
| B-7 | Khải | quanly | Phiếu **chuyển 2 lần** của member8; xem cảnh báo trên header | Không tự gia hạn; quản lý chọn hoàn hoặc dùng khoản lặp để gia hạn | |
| B-8 | Khải, Khôi | quanly, member9 | Phiếu **hội viên báo đã chuyển** → xác nhận hoặc từ chối | Xác nhận thì PAID; từ chối thì hội viên nhận thông báo | |
| B-9 | Khải | quanly | Phiếu **không khớp mã** → map vào hội viên / hóa đơn | Giao dịch được gán đúng hóa đơn, phiếu đóng | |
| B-10 | Nhanh, Khôi | quanly | Hoàn tiền một hóa đơn đã thanh toán → xác nhận đã chuyển trả | Hóa đơn REFUNDED, thời hạn gói bị trừ tương ứng | |

### 3.4. Ngoại lệ hội viên và lớp học

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-11 | Khải | letan | Đăng ký hội viên tại quầy bằng SĐT của member12 | Không tạo trùng, hiện hồ sơ cũ để mở và gia hạn | |
| B-12 | Bảo, Khải | quanly, member11 | Bảo lưu gói / kết thúc bảo lưu sớm; xem lịch sử bảo lưu | Ngày hết hạn được cộng bù đúng số ngày bảo lưu | |
| B-13 | Bảo, Khải | member3, member1 | Lớp Boxing đầy: member3 đang chờ; member1 hủy đăng ký | Chỗ trống được giữ cho người đầu danh sách chờ | |
| B-14 | Khải | member10 | Xem lớp Yoga / đăng ký lớp mới | Cảnh báo số buổi rơi sau ngày hết hạn gói, vẫn cho đăng ký | |
| B-15 | Bảo, Khải | member14, letan | member14 thử đăng ký; lễ tân gỡ chặn kèm lý do | Bị chặn đến ngày hiển thị; gỡ chặn xong đăng ký được | |
| B-16 | Bảo, Khôi | quanly | Khóa tài khoản đang có lịch học | Xem trước các lịch bị ảnh hưởng trước khi khóa | |
| B-17 | Bảo, Khôi | quanly | Đổi giờ / hủy một buổi; đổi HLV phụ trách lớp; đặt phòng bảo trì | Xem trước buổi bị ảnh hưởng; hội viên nhận thông báo | |
| B-18 | Bảo, Khải | letan | Quản lý hội viên → check-in tại quầy | Check-in thành công; cảnh báo khi gói sắp hết hạn / hết hạn | |
| B-19 | Bảo, Khôi | coach | Mở buổi học trong ngày → điểm danh; hội viên xem lịch sử điểm danh | Cần một buổi đang diễn ra hoặc vừa kết thúc: tạo trước lớp có buổi trong ngày demo | |

### 3.5. Báo cáo, nhật ký và giao diện

| # | Người trình bày | Tài khoản | Thao tác | Kết quả mong đợi | Góp ý GV |
|---|---|---|---|---|---|
| B-20 | Bảo, Khôi | quanly | Báo cáo → lọc khoảng ngày → xuất PDF / CSV / Excel | Số liệu khớp các hóa đơn đã demo ở trên | |
| B-21 | Khải | admin | Nhật ký thao tác → lọc theo người, hành động, thời gian | Thấy các thao tác vừa demo; không có nút sửa/xóa | |
| B-22 | Nhanh | admin | Vai trò & quyền → bật/tắt một quyền → đăng nhập lại vai trò đó | Menu và API thay đổi theo quyền (RBAC động) | |
| B-23 | Khôi, Khải | các vai trò | Đi nhanh qua các màn đã sửa UI (Tổng quan, Hội viên, Hóa đơn, Lớp học) | So với báo cáo rà soát UI Flow 1, 2 | |

## 4. Lệnh giả lập webhook SePay

Dùng khi demo không chuyển khoản thật. Chạy ở thư mục `core/be`; thay `INVxxxxxx` và số tiền theo hóa đơn
đang demo. Khóa `SEPAY_WEBHOOK_API_KEY` lấy từ `core/be/.env`, không ghi vào tài liệu.

```bash
source .env
curl -X POST http://localhost:3000/api/v1/payments/sepay/webhook \
  -H "Authorization: Apikey $SEPAY_WEBHOOK_API_KEY" -H "Content-Type: application/json" \
  -d '{"id":"'"$(date +%s)"'","gateway":"ACB","transferType":"in","transferAmount":360000,
       "code":"INVxxxxxx","content":"Thanh toan INVxxxxxx","referenceCode":"FTDEMO01"}'
```

Đổi `transferAmount` nhỏ hơn / lớn hơn giá hóa đơn để demo chuyển thiếu / chuyển thừa; gửi lại cùng `code`
với `id` khác để demo chuyển 2 lần; bỏ `code` để demo giao dịch không khớp mã.

## 5. Câu hỏi dự kiến từ giảng viên

| Câu hỏi | Người trả lời | Ý chính |
|---|---|---|
| Phân quyền làm thế nào? | Nhanh | RBAC động: quyền gắn với vai trò trong DB, code chỉ kiểm tra mã quyền, không so tên vai trò |
| Số nghiệp vụ (hạn hủy, số lần vắng…) để ở đâu? | Bảo | Bảng `system_settings`, chỉnh trong màn Cấu hình, không hardcode |
| Làm sao tránh xác nhận thanh toán 2 lần? | Nhanh | Webhook idempotent theo mã giao dịch SePay; chuyển lặp tạo phiếu đối soát, không tự gia hạn |
| Kiểm thử thế nào? | Khôi, Khải | Unit/integration test BE (Vitest), test FE, E2E Playwright; task sheet ghi kết quả từng sprint |

## 6. Tổng hợp góp ý sau demo

| # | Bước | Góp ý của giảng viên | Mức độ (Cao / TB / Thấp) | Người xử lý | Sprint xử lý | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

Sau buổi demo: thư ký điền bảng trên trong ngày, leader tạo task tương ứng trong task sheet Sprint 4.
