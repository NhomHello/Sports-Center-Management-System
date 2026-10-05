# Sports-Center-Management-System

SWP391 FA26 · Đề tài 4 · GV: MinhTTH5 · Nhóm: Nhanh, Bảo, Khôi, Khải

Hệ thống quản lý trung tâm thể thao: hội viên & gói tập (Flow 1), lớp học & lịch (Flow 2),
thanh toán SePay & báo cáo (Flow 3). Phân quyền **RBAC động hoàn toàn** (role/permission quản lý trong DB qua UI).

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
[docs/06-onboarding.md](docs/06-onboarding.md).

**Tài khoản mẫu** (mật khẩu trong `core/be/.env`): `admin@scms.local` (Center Manager), `letan@scms.local`,
`coach.yoga@scms.local`, `member1@scms.local`… xem `core/be/prisma/seed/mock/users.mock.js`.

## Cấu trúc

```
core/shared   hằng số dùng chung BE + FE (permission registry, setting keys, error codes)
core/be       Express API - MVC theo module (routes / controller / service / validation), Prisma
core/fe       React + antd - pages / components / hooks / services / stores
docs          QUY TẮC & hướng dẫn - ĐỌC TRƯỚC KHI CODE
scripts       npm run dev / setup
```

## Tài liệu bắt buộc đọc

1. [docs/01-quy-tac-code.md](docs/01-quy-tac-code.md) — giới hạn 200 dòng/file, đặt tên, comment, tái sử dụng, **không hardcode**
2. [docs/02-cau-truc-du-an.md](docs/02-cau-truc-du-an.md) — MVC, thêm module/trang mới theo checklist
3. [docs/03-rbac-dynamic.md](docs/03-rbac-dynamic.md) — phân quyền động, thêm permission
4. [docs/04-git-workflow.md](docs/04-git-workflow.md) — nhánh, commit, PR
5. [docs/05-api-convention.md](docs/05-api-convention.md) — chuẩn request/response
6. [docs/test-cases/README.md](docs/test-cases/README.md) — test case & test tự động

## Scripts thường dùng (chạy ở thư mục gốc)

| Lệnh                    | Việc                                                     |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Chuẩn bị toàn bộ local, seed tài khoản, chạy MySQL + BE + FE            |
| `npm run dev -- --prepare-only` | Chỉ chuẩn bị DB/seed để kiểm tra, không chiếm cổng BE/FE         |
| `npm run db:migrate`    | Tạo migration mới sau khi sửa `schema.prisma` (hỏi tên)  |
| `npm run db:seed`       | Đồng bộ permission / role / settings / mock user vào DB  |
| `npm run db:studio`     | Mở Prisma Studio xem DB                                  |
| `npm run lint`          | Lint toàn bộ (tự chạy khi commit)                        |
| `npm test`              | Test BE (cần MySQL đang chạy) + FE                       |
