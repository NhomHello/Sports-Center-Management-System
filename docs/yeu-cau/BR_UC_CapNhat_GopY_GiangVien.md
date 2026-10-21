# Cập nhật Business Rules và Use Case theo góp ý giảng viên (GĐ1–GĐ4)

> Bổ sung cho `07_Business_Rules.docx` và `01_Use_Case_Tong_Hop.docx` (hai file docx đã được chèn
> phụ lục cùng nội dung). Thiết kế: `ThietKe_SuaTheoGopY_GiangVien.md`. Hợp đồng API:
> `../huong-dan/HopDong_GopY_GD2-4.md`. Số liệu (12 giờ, 10%, 60 ngày, 7 ngày…) là giá trị mặc định,
> đổi được ở Hệ thống → Cấu hình.

## 1. Quy tắc đã sửa

| Mã | Trước | Sau góp ý |
|---|---|---|
| BR-1.3 / BR-1.4 | Mua thêm gói thì cộng dồn ngày vào cùng một membership | **Mỗi hóa đơn gói đã thanh toán tạo một kỳ gói riêng.** Còn kỳ đang chạy/mua trước thì kỳ mới bắt đầu ngay sau kỳ muộn nhất; không thì bắt đầu lúc thanh toán. Chỉ một kỳ "đang hiệu lực" mỗi hội viên |
| BR-1.12 | Cảnh báo gói hết hạn trước khi lớp kết thúc | Bỏ — học lớp không cần gói tự tập |
| BR-1.16 | Bảo lưu 7–30 ngày, tối đa N lần | Mỗi lần ≥ `MEMBERSHIP_FREEZE_MIN_DAYS` (7); **tổng các lần của một kỳ ≤ `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS` (60)**. Trạng thái **FROZEN** lưu thật trong DB; không còn chặn đăng ký lớp |
| BR-2.1 | Phải có gói còn hiệu lực mới đăng ký lớp | **Lớp có học phí: phải thanh toán khóa học mới có chỗ chính thức.** Lớp miễn phí (học phí 0) đăng ký trực tiếp |
| BR-2.17 | Vắng nhiều lần bị tạm chặn đăng ký | Giữ nguyên; buổi **"Xin nghỉ" (EXCUSED)** không tính là vắng và không bị ghi đè thành vắng |
| BR-PAY-xx | Áp dụng cho hóa đơn gói | Áp dụng y nguyên cho hóa đơn khóa học và hóa đơn chênh lệch (thiếu/thừa/lặp/sai mã/hết hạn) |

## 2. Quy tắc mới

| Mã | Nội dung |
|---|---|
| BR-GY-01 | Khung giờ hoạt động cấu hình được (mặc định Sáng sớm 05–09, Sáng 09–13, Chiều 13–17, Tối 17–22). Mỗi khung giờ học trong tuần và mỗi buổi đổi giờ phải nằm trọn trong một khung |
| BR-GY-02 | Loại phòng có danh sách bộ môn dạy được và cờ "khu tự tập". Xếp lớp chỉ chọn được phòng có loại phòng dạy được bộ môn của lớp |
| BR-GY-03 | HLV khai báo chuyên môn (bộ môn). Tạo/sửa lớp, đổi HLV chỉ chọn HLV có chuyên môn đúng bộ môn; không bỏ chuyên môn khi HLV còn dạy lớp bộ môn đó |
| BR-GY-04 | Sửa lớp / đổi giờ buổi: xem trước số buổi đổi, học viên đang học và ai bị trùng lịch; quản lý xác nhận mới lưu |
| BR-GY-05 | **Gói tự tập** = thời hạn + khung giờ được vào + khu tự tập được vào. Không chọn khung giờ = mọi khung; không chọn khu vực = mọi khu tự tập |
| BR-GY-06 | Check-in từ chối khi kỳ gói đang bảo lưu, giờ hiện tại ngoài khung của gói ("Ngoài khung giờ của gói …") hoặc khu vực lễ tân chọn không thuộc gói ("Gói không cho vào khu vực …") |
| BR-GY-07 | **Khóa học**: lớp có học phí cả khóa. Đăng ký giữa khóa trả `làm tròn nghìn(học phí × buổi còn lại / tổng buổi)` |
| BR-GY-08 | Mua khóa học tạo hóa đơn khóa học và **giữ chỗ (PENDING_PAYMENT)** tới hạn thanh toán; chỗ giữ tính vào sức chứa. Thanh toán đủ → đăng ký chính thức. Hết hạn / bỏ giữ chỗ → hủy hóa đơn chưa nhận tiền, nhả chỗ, mời người chờ |
| BR-GY-09 | **Báo nghỉ một buổi** trước giờ học ít nhất `CLASS_CANCEL_MIN_HOURS_BEFORE` (12) giờ: buổi ghi "Xin nghỉ", không hoàn tiền, không hủy đăng ký cả khóa |
| BR-GY-10 | **Hủy kỳ gói** (đang hoạt động, không bảo lưu) hoặc **hủy khóa học** (đã thanh toán, còn buổi): giá trị còn lại = đã trả × ngày chưa dùng / tổng ngày (gói) hoặc × buổi chưa diễn ra / số buổi đã mua (khóa); **phí hủy** = `CANCELLATION_FEE_PERCENT` (10%) giá trị còn lại; **hủy trước ngày bắt đầu: hoàn 100%, không phí** |
| BR-GY-11 | Hội viên chọn **nhận tiền hoàn** (tạo yêu cầu hoàn, quản lý chuyển trả và nhập mã tham chiếu) hoặc **ghi số dư** (cộng ngay). Hóa đơn gốc giữ "Đã thanh toán"; báo cáo trừ đúng phần đã hoàn |
| BR-GY-12 | **Số dư tài khoản**: sổ chỉ thêm (+ hủy/đổi/bù, − thanh toán), số dư không âm. Dùng số dư trừ trước vào hóa đơn đang chờ; phần còn lại trả QR / tiền mặt. Hóa đơn hết hạn thì phần số dư đã trừ được trả lại số dư |
| BR-GY-13 | Doanh thu không tính lại phần trả bằng số dư (đã là doanh thu của lần mua trước) |
| BR-GY-14 | **Đổi gói / đổi lớp sau thanh toán**: chênh lệch = giá mới − giá trị còn lại (không phí). > 0 → hóa đơn chênh lệch, thu đủ mới chuyển sang sản phẩm mới (lớp mới được giữ chỗ trong lúc chờ); ≤ 0 → chuyển ngay, phần dư hoàn hoặc ghi số dư. Đang có yêu cầu đổi chờ thanh toán thì chưa hủy/đổi tiếp |
| BR-GY-15 | Sau thanh toán **không sửa** giá, gói, ngày hiệu lực trên hóa đơn; chỉ thay đổi qua hủy / đổi / bảo lưu. Mọi lần hủy/đổi lưu lịch sử (từ → sang, giá trị còn lại, phí, chênh lệch, hóa đơn/khoản hoàn/số dư liên quan, người thực hiện) |
| BR-GY-16 | Bảo lưu: tới ngày bắt đầu kỳ chuyển FROZEN (không check-in); hết hạn bảo lưu **hệ thống tự mở lại**, cộng bù đúng số ngày đã dừng, dời các kỳ mua nối tiếp và báo hội viên. Kết thúc sớm chỉ cộng ngày thực dừng |
| BR-GY-17 | **Trung tâm hủy cả lớp**: học viên đã thanh toán được ghi số dư toàn bộ phần chưa học (không phí). **Trung tâm hủy một buổi**: ghi số dư giá trị một buổi |

## 3. Use case mới / sửa

| Mã | Tên | Tác nhân | Luồng chính | BR |
|---|---|---|---|---|
| UC-CB-21 | Cấu hình khung giờ hoạt động | Quản lý | Lịch tập → Tài nguyên → Khung giờ: thêm/sửa/ngừng khung; không trùng khung đang hoạt động | GY-01 |
| UC-CB-22 | Cấu hình loại phòng | Quản lý | Tài nguyên → Loại phòng: tên, chức năng, bộ môn dạy được, khu tự tập | GY-02 |
| UC-UM-21 | Khai báo chuyên môn HLV | Quản lý | Hệ thống → Tài khoản → cột Chuyên môn → Sửa | GY-03 |
| UC-CB-03 (sửa) | Cập nhật lịch lớp có xem trước | Quản lý | Sửa lớp / đổi giờ buổi → hệ thống hiện số buổi đổi, học viên bị ảnh hưởng → Xác nhận | GY-04 |
| UC-UM-03 (sửa) | Xem gói tự tập và kỳ gói | Hội viên | Gói tập: thẻ gói hiện khung giờ/khu vực; thẻ "Gói của bạn" hiện kỳ đang dùng + kỳ mua nối tiếp | GY-05, 1.3 |
| UC-UM-08 (sửa) | Quản lý gói tự tập | Quản lý | Tạo/sửa gói: giá, thời hạn, khung giờ, khu tự tập | GY-05 |
| UC-AT-01 (sửa) | Check-in tại quầy | Lễ tân | Chọn hội viên, (tuỳ chọn) khu vực → hệ thống kiểm tra kỳ gói, bảo lưu, khung giờ, khu vực | GY-06 |
| UC-CB-06 (sửa) | Đăng ký lớp = mua khóa học | Hội viên / Lễ tân | Lịch tập → lớp có học phí → Đăng ký khóa học → hóa đơn (QR online hoặc tại quầy), giữ chỗ → thanh toán → chính thức | GY-07, GY-08 |
| UC-CB-23 | Báo nghỉ một buổi | Hội viên / Lễ tân | Lịch của tôi → buổi → Báo nghỉ → xác nhận | GY-09 |
| UC-PAY-20 | Hủy kỳ gói / hủy khóa học | Hội viên / Lễ tân | Xem trước (đã trả, còn lại, phí, được hoàn) → chọn Hoàn tiền / Ghi số dư → xác nhận | GY-10, GY-11 |
| UC-PAY-21 | Xem và dùng số dư | Hội viên / Lễ tân | Hồ sơ → Số dư; hóa đơn chờ thanh toán → Dùng số dư | GY-12, GY-13 |
| UC-PAY-22 | Đổi gói / đổi lớp | Hội viên / Lễ tân | Chọn gói/lớp đích → xem chênh lệch → thu thêm (hóa đơn chênh lệch) hoặc nhận phần dư | GY-14, GY-15 |
| UC-UM-20 (sửa) | Bảo lưu gói | Hội viên / Lễ tân | Chọn khoảng ngày (≥ 7, ≤ ngày còn lại của ngân sách 60) → kỳ FROZEN khi tới ngày → tự mở lại / kết thúc sớm | 1.16, GY-16 |
| UC-CB-04 (sửa) | Trung tâm hủy lớp / buổi | Quản lý | Hủy lớp hoặc buổi → hệ thống thông báo và bù số dư cho học viên đã thanh toán | GY-17 |

## 4. Trạng thái

- **Kỳ gói (membership):** `ACTIVE` (đang chạy hoặc mua trước chờ tới lượt) → `FROZEN` (đang bảo lưu) →
  `ACTIVE` → `EXPIRED`; hoặc → `CANCELLED` (hủy / đổi / hoàn hóa đơn).
- **Đăng ký lớp:** `PENDING_PAYMENT` (giữ chỗ chờ thanh toán) → `BOOKED` → `CANCELLED`.
- **Điểm danh buổi:** `PRESENT` / `ABSENT` / `EXCUSED` (xin nghỉ trước hạn).
- **Lần hủy/đổi (purchase change):** `PENDING_PAYMENT` (chờ thu chênh lệch) → `DONE`; hoặc `CANCELLED`
  khi hóa đơn chênh lệch hết hạn.
- **Hóa đơn:** thêm loại `COURSE` (khóa học) và `ADJUSTMENT` (chênh lệch đổi); trạng thái như cũ.
