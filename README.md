# Sports-Center-Management-System

SWP391 FA26 · Đề tài 4 · GV: MinhTTH5 · Nhóm: Nhanh, Bảo, Khôi, Khải

Hệ thống quản lý trung tâm thể thao: hội viên & gói tập (Flow 1), lớp học & lịch (Flow 2),
thanh toán SePay & báo cáo (Flow 3), hồ sơ HLV/hội viên, tổng kết và đánh giá khóa học (Sprint 4). Phân quyền **RBAC động hoàn toàn** (role/permission quản lý trong DB qua UI).

## Tech stack

| Phần     | Công nghệ                                                                 |
| -------- | ------------------------------------------------------------------------- |
| Frontend | React 19, Vite 8, Ant Design v6, Axios, React Router 7, TanStack Query, Zustand |
| Backend  | Node 24, Express 5, Prisma 7, Zod 4, JWT, Pino                            |
| Database | MySQL 8 (Docker)                                                          |
| Tooling  | npm workspaces, ESLint 10, Prettier, Husky + lint-staged, Commitlint, Vitest |

## Chạy local bằng một script

```bash
git clone https://github.com/NhomHello/Sports-Center-Management-System.git
cd Sports-Center-Management-System
npm run dev
```

`npm run dev` tự cài dependency khi thiếu, tạo các file `.env` từ mẫu, bật MySQL,
chờ database healthy, generate Prisma, apply migration, seed tài khoản cho mọi role rồi
chạy BE (`:3000`) và FE (`:5173`). Script dùng được trên Windows, macOS và Linux.

Yêu cầu: Node ≥ 22 (khuyên 24), Docker Desktop/Engine có Compose v2, Git. Chi tiết:
[docs/huong-dan/onboarding.md](docs/huong-dan/onboarding.md).

**Tài khoản mẫu** (mật khẩu trong `core/be/.env`): `admin@scms.local` (Center Manager), `letan@scms.local`,
`coach.yoga@scms.local`, `member1@scms.local`… xem `core/be/prisma/seed/mock/users.mock.js`.

Frontend local hỗ trợ `localhost:5173` và `127.0.0.1:5173`. Nếu đăng nhập báo "Không thể kết nối máy chủ"
trong khi health vẫn trả `database: up`, kiểm tra `CORS_ORIGINS` trong `core/be/.env`: phải có origin
đúng với địa chỉ đang mở. Mẫu `.env.example` khai báo cả hai địa chỉ; với `.env` cũ, bổ sung địa chỉ
còn thiếu rồi khởi động lại backend. Health kiểm tra API/DB; đăng nhập qua trình duyệt còn cần CORS hợp lệ.

## Cấu trúc

```
core/shared   hằng số dùng chung BE + FE (permission registry, setting keys, error codes)
core/be       Express API - MVC theo module (routes / controller / service / validation), Prisma
core/fe       React + antd - pages / components / hooks / services / stores
docs          hướng dẫn, yêu cầu, task sheet, bàn giao và kiểm thử
outputs       bộ báo cáo cuối kỳ và bằng chứng xuất từ dự án
scripts       npm run dev / setup
```

## Tài liệu bắt buộc đọc

1. [docs/huong-dan/quy-tac-code.md](docs/huong-dan/quy-tac-code.md) — giới hạn 200 dòng/file, đặt tên, comment, tái sử dụng, **không hardcode**
2. [docs/huong-dan/cau-truc-du-an.md](docs/huong-dan/cau-truc-du-an.md) — MVC, thêm module/trang mới theo checklist
3. [docs/huong-dan/rbac-dong.md](docs/huong-dan/rbac-dong.md) — phân quyền động, thêm permission
4. [docs/huong-dan/git-workflow.md](docs/huong-dan/git-workflow.md) — nhánh, commit, PR
5. [docs/huong-dan/api-convention.md](docs/huong-dan/api-convention.md) — chuẩn request/response
6. [docs/huong-dan/viet-test-case.md](docs/huong-dan/viet-test-case.md) — cách viết test case & test tự động

## Scripts thường dùng (chạy ở thư mục gốc)

| Lệnh                    | Việc                                                     |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Chuẩn bị toàn bộ local, seed tài khoản, chạy MySQL + BE + FE            |
| `npm run dev -- --prepare-only` | Chỉ chuẩn bị DB/seed để kiểm tra, không chiếm cổng BE/FE         |
| `npm run db:migrate`    | Tạo migration mới sau khi sửa `schema.prisma` (hỏi tên)  |
| `npm run db:seed`       | Đồng bộ permission / role / settings / mock user vào DB  |
| `npm run db:demo`       | Reset dữ liệu nghiệp vụ rồi dựng dữ liệu demo (8 lớp, 45 hội viên, 9 gói tập, lịch sử thanh toán, tình huống đối soát) |
| `npm run db:clean`      | Chỉ reset: xoá hoá đơn, lớp, hội viên… giữ quyền, vai trò, cấu hình và tài khoản admin |
| `npm run db:studio`     | Mở Prisma Studio xem DB                                  |
| `npm run lint`          | Lint toàn bộ (tự chạy khi commit)                        |
| `npm test`              | Test BE (cần MySQL đang chạy) + FE                       |
| `npm run verify:sprint2` | Test toàn bộ và migration mới/nâng cấp trên DB tạm; cần quyền CREATE/DROP DATABASE |
| `npm run test:e2e`       | Playwright: bốn vai trò desktop và mobile 320px; server riêng 3100/5180 |

## Dữ liệu demo

`npm run db:demo` (chỉ chạy ở môi trường dev, có chặn `NODE_ENV=production`) gọi đúng các service nghiệp vụ
nên dữ liệu sinh ra giống khi người dùng thao tác thật. Mã nguồn ở `core/be/prisma/seed/demo/`.

- Tài khoản: `admin@scms.local` / `SEED_ADMIN_PASSWORD`; `quanly`, `letan`, `letan2`, `coach.yoga|gym|boxing|pilates|dance|abcd|zxcv`,
  `member1`…`member45` `@scms.local` / `SEED_MOCK_PASSWORD`.
- `member1`–`member15` có sẵn các tình huống của `docs/kiem-thu/nghiem-thu/LoTrinh_Demo_Sprint2_Sprint3.md` (mục 1.2):
  giữ chỗ lớp đầy, danh sách chờ, chuyển thiếu/thừa/hai lần, báo đã chuyển, gói sắp hết hạn, bảo lưu, hết hạn,
  chưa xác minh email, bị chặn đăng ký, bị khoá.
- `member16`–`member21`: tình huống góp ý giảng viên (Phần C của tài liệu demo): số dư sau hủy khóa, giữ chỗ khóa
  chờ thanh toán, kỳ gói nối tiếp, gói "Tự tập sáng sớm" (check-in ngoài khung bị từ chối), đổi gói chờ thu chênh
  lệch, báo nghỉ buổi. 5/8 lớp có học phí (bán theo khóa), 3 lớp miễn phí.
- Có 9 gói tập mẫu; các lớp được đăng ký đến đủ sức chứa để kiểm tra danh sách và điểm danh. Lớp
  "Boxing nhóm nhỏ" vẫn đầy để giữ tình huống danh sách chờ.
- Lớp "Sức mạnh cơ bản" có một buổi đang diễn ra ngay lúc seed để HLV `coach.gym` thử điểm danh.
- Hoá đơn online chờ thanh toán tự hết hạn sau `PAYMENT_ONLINE_TIMEOUT_MINUTES`; chạy lại `npm run db:demo` trước buổi demo.

## Sprint 2

Sprint 2 đã tích hợp vào `main`, trên nền Sprint 1. Các nhánh thành viên là `sprint-2/be-bao`, `sprint-2/be-nhanh`, `sprint-2/fe-khai`, `sprint-2/fe-khoi`.

Trang **`/schedule`** gồm danh mục, quản lý lớp, đăng ký/huỷ toàn lớp, xử lý hộ, lịch cá nhân/lịch dạy và roster theo permission. Mobile dùng danh sách chọn màn hình để truy cập đủ các chức năng. Huỷ dùng hạn do backend trả về; đổi lịch giữ buổi cũ và gửi thông báo qua outbox.

Khi `SEED_MOCK_DATA=true`, seed thêm 20 hội viên `member1`…`member20` với email đăng nhập `@scms.local`, 5 gói mẫu và hai lớp `DEMO · …` bắt đầu ngày kế tiếp (Gym 07:00, Yoga 18:00). Mỗi lớp mẫu được lấp đến sức chứa bằng các hội viên mẫu; lịch tạo qua service nên sẽ bỏ qua khung giờ xung đột. Email `@scms.local` chỉ dùng đăng nhập local, không phải hộp thư Gmail. Seed không ghi đè lớp/gói đã sửa. Với DB có sẵn, dùng `migrate deploy` qua `npm run dev`; giữ bảng đăng ký từng buổi và dữ liệu điểm danh cũ.

Chi tiết: task sheet tại `docs/ke-hoach/`, đặc tả tại `docs/yeu-cau/`, bàn giao tại `docs/handover/`, test case tại `docs/kiem-thu/SWP391_TestCase.xlsx`; bộ nộp cuối kỳ ở `outputs/bao-cao-cuoi-ky/`. Để chạy E2E lần đầu, cài Chromium bằng `npx playwright install chromium` sau khi cài dependency và chuẩn bị MySQL.

## Bộ báo cáo cuối kỳ

[Báo cáo Word/PDF, 5 slide PowerPoint/PDF, kịch bản demo 28 phút, task–commit–timeline và ERD](outputs/bao-cao-cuoi-ky/) được tổng hợp từ mã nguồn và tài liệu hiện hành. Xem [mục lục tài liệu](docs/README.md).

Sprint 4: Bảo nhận toàn bộ phần trước đây giao Nhanh (nền dữ liệu, BE tổng kết/đánh giá, báo cáo BE/FE, seed, tài liệu/demo); Khôi hồ sơ full-stack; Khải FE tổng kết/đánh giá và kiểm thử. AI/kế hoạch tập luyện đã loại khỏi phạm vi. Ngày kế hoạch không thay thế ngày Git; tác giả lịch sử được giữ nguyên.
