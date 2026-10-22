# Bàn giao bổ sung UI — 22/10/2026

Nhánh `feature/khai-ui-theme-classes`, nền `khai` / `31b4324`. Tiếp tục trực tiếp trên bản người dùng đã sửa; snapshot trước đợt bổ sung nằm tại `.cache/ui-khai/user-baseline-1792675732344`.

## Đã sửa

| Khu vực | Kết quả |
| --- | --- |
| Lịch sử điểm danh | Bộ lọc có nhãn, giá trị điều khiển đồng bộ và xóa đúng cả giao diện/request; cache tách theo người đăng nhập; ngày và khoảng giờ Việt Nam không lặp; phân biệt lịch sử rỗng/kết quả lọc rỗng; trạng thái lạ không bị ghi thành vắng mặt. |
| Chọn ngày | Popup hai tháng xếp dọc dưới 900px, cuộn bên trong; kiểm tra hình học tại 320 và 768px cho cả điểm danh và bảo lưu. |
| Tài khoản | Avatar 32px trong vùng bấm 44px; tên/vai trò gọn trên desktop, thu về avatar trên mobile; menu có email, vai trò, điều hướng và đăng xuất; hỗ trợ Enter/Escape và trạng thái mở cho trình đọc màn hình. |
| Gói tự tập | Tách thông điệp kỳ tự tập và học phí khóa học; bỏ giá/ngày và phần trăm tiết kiệm tính tại FE; bỏ nhãn “Phổ biến nhất” thiếu dữ liệu thống kê; giữ giá API. Thiếu khung giờ/khu vực thì yêu cầu liên hệ trung tâm. |
| Dữ liệu thử | Xóa chính xác 9 lớp và 1 gói thuộc fixture TEST_S1_c3e297971b7346d68e9c820ec6289dcd, cùng 36 buổi, 6 đăng ký thử, 2 sự kiện thử và 2 kỳ tự tập thử. Không có hóa đơn/số dư/giao dịch tiền trong tập bị xóa. |

Lớp người dùng tạo “Caramel Popcorn” vẫn được giữ. Bộ môn/phòng TEST mà lớp này đang dùng cũng được giữ để không làm hỏng tham chiếu hoặc tự ý chuyển lịch. Bốn tài khoản thử và audit không cần xóa tiếp tục được giữ.

## Nội dung gói là dữ liệu quản trị

Đã dùng API PUT membership-plans để cập nhật mô tả/quyền lợi của STARTER_30, ACTIVE_90, COMMIT_365 trong database local đang dùng. [Bản nội dung hiện tại](./plan-copy-current.json) ghi lại các trường công khai. Giá/thời hạn xác nhận không đổi: 360.000đ/30 ngày, 900.000đ/90 ngày, 2.880.000đ/365 ngày.

Không ánh xạ mã gói sang quyền lợi hardcode tại FE. Vì giữ nguyên BE/seed, database mới chạy seed cũ vẫn có nội dung seed cũ; quản trị cần cập nhật qua giao diện quản lý hoặc API. Nội dung mới ở database local đã lưu thật.

Sao lưu trước thay đổi (chỉ lưu local, không commit):

- `.cache/ui-khai/test-fixture-backup-1792676109812.json`: các dòng fixture đã xóa.
- `.cache/ui-khai/plan-copy-backup-1792676167299.json`: nội dung ba gói trước khi cập nhật.
- Các xóa fixture chạy trong transaction, giữ FK bật và chặn nếu phát hiện chủ sở hữu ngoài nhóm thử hoặc dữ liệu tài chính.

## Kiểm thử đợt này

- `npm run lint`: đạt cho shared, BE, FE.
- `npm test -w @scms/fe`: 143/143 test, 23 file; gồm theme, tương phản palette, giữ chỗ, hiển thị giá API và điểm danh.
- `npm run build`: đạt; còn cảnh báo chunk dùng chung khoảng 570kB, chưa tối ưu bundle trong đợt này.
- Prettier check cho các file FE thay đổi và E2E liên quan: đạt.
- `git diff --check`: đạt.
- [Kết quả Playwright](./refinement-test-results.json): 23/23 ca đạt, không skip/flaky. Có bốn role sáng/tối, Enter/Escape menu, xóa bộ lọc, popup ngày, ribbon, không tràn ngang; các kích thước 320/768/1366/1440/1920; đăng ký lớp, xung đột lịch, đăng ký hộ, mua gói online, QR/webhook và đối soát/hoàn tiền theo luồng BE hiện có.
- Ca bổ sung `S3-49/51` trong `sprint3-khoi-ui.spec.mjs`: đạt. Ghi điểm danh qua UI/API thật, xác nhận database, kiểm tra lịch sử chính chủ và từ chối trang báo cáo; thêm ảnh bảng có dữ liệu ở sáng/tối. Tổng cộng 24 ca Playwright đã chạy đạt.
- Database dùng cho các thao tác nghiệp vụ: `scms_ui_khai_20261022_1792659785973`, đã chuẩn bị bằng migration và `npm run db:demo` ở đợt trước. Không reset database `scms` đang sử dụng.
- Kiểm tra tương phản tự động ở mức token chính; chưa phải chứng nhận WCAG toàn bộ sản phẩm hoặc kiểm tra bằng trình đọc màn hình thật.

Chạy lại bộ kiểm thử UI bằng Node tương thích với dependency kiểm thử (lần này dùng Node 24): chuẩn bị một database test riêng đã seed demo, đặt `UI_TEST_DATABASE=scms_ui_<tên>`, rồi chạy `node tests/e2e/run-ui-refinement.mjs`. Runner từ chối tên không thuộc nhóm database test; không tạo/reset database. Biến E2E_API_PORT/E2E_FE_PORT có thể đổi cổng. Không trỏ vào database đang dùng.

## Ảnh minh chứng

- `refinement-before-user`: bốn ảnh người dùng gửi, trước đợt bổ sung này.
- `refinement-real-local`: API thật, database local scms sau dọn fixture/cập nhật nội dung, 1440px, hội viên và quản lý, sáng/tối. Lịch sử đang rỗng là dữ liệu thật.
- `refinement-demo`: API thật trên database test riêng. Dữ liệu demo này có danh mục/quyền lợi seed cũ, không đại diện nội dung ba gói đã cập nhật trong scms. Ảnh desktop và responsive được tạo từ bộ kiểm thử mới.
- Các ảnh/báo cáo ngoài nhóm refinement là hồ sơ đợt trước, không dùng để thay thế kết quả kiểm thử mới.

## Giới hạn nghiệp vụ theo nhánh đang chạy

Chỉ sửa FE và kiểm thử liên quan; giữ hợp đồng API/permission và các thay đổi local có sẵn. BE hiện chưa cung cấp đầy đủ hợp đồng cho hủy/đổi gói hoặc khóa theo chính sách 10%, số dư, xin nghỉ từng buổi và ngân sách bảo lưu tổng 60 ngày/kỳ. Chưa bổ sung các nút giả hoặc tự tính số tiền ở FE. Không tuyên bố đã triển khai các chính sách này, hoàn bù khi trung tâm hủy, hoặc seed tình huống mới member16–21 trong đợt UI.

Quy tắc người dùng đã cung cấp được giữ làm đầu vào đợt nghiệp vụ tiếp theo: mỗi lần mua là kỳ riêng; khóa học thanh toán độc lập; học giữa khóa theo buổi còn lại; xin nghỉ đúng hạn không tính vắng; hủy trước ngày bắt đầu hoàn 100%, sau đó hoàn phần chưa dùng trừ 10%, chọn hoàn tiền/số dư; số dư trả hóa đơn không ghi doanh thu lần hai; đổi gói/lớp tính chênh lệch bằng preview API; bảo lưu trạng thái thật tối đa 60 ngày/kỳ và tự mở lại; trung tâm hủy buổi/lớp thì bù số dư; demo 5 lớp phí/3 lớp miễn phí.

Hai file có sửa đổi của người dùng trước đợt này (`core/be/tests/helpers/reconciliation.js`, `scripts/lib.mjs`) được giữ nguyên byte so với snapshot và để ngoài commit UI. Không push hoặc merge remote. Main, khai, nhánh UI cũ và stash gốc được giữ nguyên.
