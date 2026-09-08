# SWP391 FA26 – Kế hoạch tuần 1 (bản rút gọn từ SWP391_Tuan1_Leader_Plan)

Đề tài 4: Sports Center Management System · GV: MinhTTH5 · 4 thành viên · Node.js + Express.js + React.

## 1. Team

| Thành viên       | Vai trò | Tuần 1                                                                                                                        |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Nhanh (Leader)   | BE + FE | Chốt rules, board task, repo; Flow 1 (draw.io); trọn phần SePay test mode (tài khoản, QR, webhook); review; họp GV             |
| Bảo              | BE + FE | Flow 2 + Flow 3 (draw.io)                                                                                                     |
| Khôi             | FE      | Design system + Figma high-fidelity Flow 1, 2 (màn 1–13)                                                                       |
| Khải             | FE      | Figma Flow 3 (màn 14–18) + Login/Register, layout sidebar                                                                     |

Giai đoạn code: Nhanh + Bảo làm BE (API, DB, SePay); Khôi + Khải làm FE. Leader luân phiên theo tuần.

## 2. Team rules (đã chốt trong repo)

- Discord; trả lời trong 12h; họp tối 30–45 phút, báo vắng trước 3h; có biên bản.
- Task trên board, deadline nội bộ sớm hơn GV 1 ngày. Gặp khó báo sớm. Không tự đổi requirement.
- Git: `main` / `dev` / `feature/*`, PR ≥ 1 review, commit `feat|fix|docs…` → chi tiết `docs/04-git-workflow.md`.
- ESLint + Prettier, MVC, `.env` không commit → `docs/01-quy-tac-code.md`.
- Tài liệu: `SWP391_<Loại>_<Phiên bản>`.

## 3. Actor

| Actor          | Mô tả                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Center Manager | Quản lý thành viên, coach, lớp, gói tập, báo cáo, phân quyền                             |
| Coach          | Lịch dạy, danh sách học viên, điểm danh, nhận xét                                        |
| Member         | Đăng ký tài khoản, mua/gia hạn gói, đăng ký lớp, xem lịch, thanh toán                    |
| Receptionist   | Đăng ký hộ tại quầy, ghi nhận thanh toán, in hoá đơn                                     |

## 4. Flow bắt buộc & business rules

### Flow 1 – User & Membership (REQUIRED)

- BR-1.1 Email / SĐT duy nhất.
- BR-1.2 Member có nhiều gói theo thời gian nhưng chỉ 1 gói active.
- BR-1.3 Gia hạn khi còn hạn: hết hạn mới = hết hạn cũ + thời hạn gói.
- BR-1.4 Gia hạn khi đã hết hạn: tính từ ngày thanh toán.
- BR-1.5 Gói hết hạn → không đăng ký lớp mới.
- Nhắc gia hạn trước N ngày (`MEMBERSHIP_EXPIRY_REMINDER_DAYS`, mặc định 7).

### Flow 2 – Class booking & Schedule (REQUIRED)

- BR-2.1 Chỉ member có gói active mới đăng ký lớp.
- BR-2.2 Không đăng ký khi lớp đủ chỗ.
- BR-2.3 Không đăng ký khi trùng giờ lớp khác đã đăng ký.
- BR-2.4 Coach không 2 lớp trùng giờ; phòng không 2 lớp trùng giờ.
- BR-2.5 Huỷ đăng ký trước giờ học tối thiểu N giờ (`CLASS_CANCEL_MIN_HOURS_BEFORE`, mặc định 12).
- Lịch đổi/huỷ → thông báo member trong lớp.

### Flow 3 – Payment & Report (REQUIRED)

- BR-3.1 Mỗi giao dịch có mã hoá đơn duy nhất; trạng thái Pending / Paid / Failed / Refunded.
- BR-3.2 Chỉ Paid mới kích hoạt gói.
- BR-3.3 Nội dung chuyển khoản chứa mã hoá đơn để webhook SePay đối chiếu.
- BR-3.4 Quá N phút chưa nhận webhook → Failed (`PAYMENT_ONLINE_TIMEOUT_MINUTES`, mặc định 15).
- BR-3.5 Báo cáo chỉ Center Manager xem (`report.view`).

Optional: Flow 4 Training & attendance, Flow 5 AI workout recommendation, Flow 6 AI assistant.

## 5. Màn hình (18)

| #  | Màn hình                                             | Actor            | Flow |
| -- | ---------------------------------------------------- | ---------------- | ---- |
| 1  | Login / Register                                     | Tất cả           | Chung |
| 2  | Layout sidebar theo vai trò (đã có – sinh theo quyền) | Tất cả          | Chung |
| 3  | Trang cá nhân + gói hiện tại                         | Member           | 1 |
| 4  | Danh sách gói tập (card)                             | Member           | 1 |
| 5  | Đăng ký member tại quầy                              | Receptionist     | 1 |
| 6  | Tìm kiếm member + trạng thái gói                     | Receptionist     | 1 |
| 7  | Quản lý gói tập (CRUD)                               | Manager          | 1 |
| 8  | Quản lý tài khoản & phân quyền (đã có)               | Manager          | 1 |
| 9  | Danh sách lớp + Đăng ký                              | Member           | 2 |
| 10 | Lịch tập cá nhân (calendar tuần)                     | Member           | 2 |
| 11 | Lịch dạy + danh sách học viên                        | Coach            | 2 |
| 12 | Tạo/sửa lớp                                          | Manager          | 2 |
| 13 | Quản lý bộ môn & phòng tập                           | Manager          | 2 |
| 14 | Checkout                                             | Member           | 3 |
| 15 | QR SePay + trạng thái thanh toán                     | Member           | 3 |
| 16 | Ghi nhận thanh toán tại quầy + in hoá đơn            | Receptionist     | 3 |
| 17 | Dashboard báo cáo                                    | Manager          | 3 |
| 18 | Lịch sử giao dịch                                    | Member / Manager | 3 |

## 6. Tech stack đã chốt

Backend Node.js + Express 5 (MVC theo module) · Frontend React + Ant Design v6 · MySQL 8 + Prisma 7 · SePay test mode · draw.io · Figma · GitHub (main/dev/feature) · Discord.
