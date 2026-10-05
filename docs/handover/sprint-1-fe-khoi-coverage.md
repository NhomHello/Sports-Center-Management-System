# FE Khôi — Sprint 1: chức năng và cách kiểm tra

Nguồn đối chiếu: `SWP391_TaskSheet_Sprint1.xlsx`, sheet `Task Sprint 1`, các dòng S1-02, S1-04, S1-06, S1-08, S1-28, S1-30, S1-32, S1-34, S1-36, S1-38 và S1-40; `docs/handover/sprint-1-fe-khoi.md`. Phạm vi này gồm các task FE của Khôi cùng những API cần thiết để màn hình dùng dữ liệu thật.

| Task | Màn hình / hành vi | API |
| --- | --- | --- |
| S1-02 | `/register`: chuẩn hóa email/SĐT, kiểm tra trùng, mật khẩu tối thiểu 8 ký tự; role mặc định do server gán | `POST /auth/register` |
| S1-04 | `/change-password`: kiểm tra mật khẩu cũ, đổi mật khẩu và yêu cầu đăng nhập lại; thu hồi token cũ | `POST /auth/password-changes` |
| S1-06 | `/profile`: thông tin tài khoản và membership của chính người đăng nhập | `GET /members/me` |
| S1-08 | `/profile`: sửa tên, email, SĐT; có thể xóa SĐT tùy chọn; không gửi role/trạng thái | `PATCH /members/me` |
| S1-28 | `/system/settings`: hiển thị khóa, nhãn, mô tả, đơn vị/miền từ API theo `system_setting.read` | `GET /settings` |
| S1-30 | `/system/settings`: kiểm tra dữ liệu theo metadata, chỉ gửi giá trị thay đổi theo `system_setting.update`; ghi audit | `PUT /settings` |
| S1-32 | Chuông và `/notifications`: danh sách cá nhân, loại sự kiện, thời điểm, trạng thái đọc | `GET /notifications` |
| S1-34 | Đánh dấu đã đọc từng thông báo hoặc nhiều thông báo; thao tác lặp lại an toàn, lỗi giữ trạng thái chưa đọc | `PATCH /notifications/:id/read` |
| S1-36 | `/payments`: chọn hội viên/gói đang bán, tạo hóa đơn tại quầy, thu đúng giá gốc, kích hoạt/gia hạn membership | `GET /members`, `GET /membership-plans`, `POST /memberships/orders`, `POST /payments/invoices/:invoiceId/cash` |
| S1-38 | Chi tiết hóa đơn: in/lưu PDF bằng hộp thoại trình duyệt khi `PAID`, có quyền `invoice.export` và API trả tên trung tâm | `GET /invoices/:id` |
| S1-40 | `/payments`: danh sách của mình hoặc mọi hóa đơn theo quyền; chi tiết gồm gói, số tiền yêu cầu/thực nhận và lịch sử payment | `GET /invoices/me`, `GET /invoices`, `GET /invoices/:id` |

Quyền được lấy từ API/role hiện tại. Người có `invoice.read_own` chỉ xem hóa đơn của mình; `invoice.export` mới bật in. FE không hiển thị dữ liệu mẫu khi API lỗi. Cấu hình giới hạn AI chỉ xuất hiện khi API cung cấp khóa và metadata; hiện chưa có định nghĩa khóa AI trong shared settings. Việc phát thông báo khi lớp thay đổi/hủy thuộc luồng lớp học; màn FE-Khôi sẽ hiển thị các bản ghi notification khi backend luồng đó tạo ra.

## Chạy cục bộ

Tại thư mục gốc dự án, chạy `npm run dev`. Lệnh này bật MySQL qua Docker, generate Prisma, deploy migration, seed dữ liệu thiếu, rồi khởi chạy BE ở `http://localhost:3000/api/v1` và FE ở `http://localhost:5173`. Seed không ghi đè quyền của role hiện có (trừ role quản trị). Xem `core/be/.env` để biết tài khoản admin và mật khẩu seed; các tài khoản mẫu được định nghĩa trong `core/be/prisma/seed/mock/users.mock.js` và dùng `SEED_MOCK_PASSWORD` khi được tạo lần đầu.

## Kiểm tra

Chạy `npm run lint`, `npm test`, `npm run build` và `git diff --check`. Các bài kiểm tra BE bao gồm phân quyền hồ sơ/hóa đơn, đăng ký trùng, thu hồi token khi đổi mật khẩu, thông báo chỉ của chủ tài khoản, cấu hình/audit, thanh toán đồng thời và giá gốc của hóa đơn. Bản in là PDF do trình duyệt tạo từ màn chi tiết, không có endpoint xuất PDF trên server.
