# 06 · Onboarding – ngày đầu tiên

## 1. Cài máy (1 lần)

| Cần               | Cài                                                                                  | Kiểm tra                    |
| ----------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| Node.js 24 (≥ 22) | https://nodejs.org hoặc nvm (`nvm install 24 && nvm use 24`)                         | `node -v` → v24.x           |
| Docker Desktop    | https://www.docker.com/products/docker-desktop – bật lên trước khi chạy dự án        | `docker info` không lỗi     |
| Git               | https://git-scm.com                                                                  | `git -v`                    |
| VS Code           | + extension gợi ý khi mở repo (ESLint, Prettier, Prisma, EditorConfig)              |                             |

Windows: nên bật WSL2 backend cho Docker; chạy lệnh trong PowerShell hoặc Git Bash đều được.

## 2. Chạy dự án

```bash
git clone https://github.com/NhomHello/Sports-Center-Management-System.git
cd Sports-Center-Management-System
npm run dev
```

`npm run dev` dùng chung trên Windows, macOS và Linux: tự cài dependency khi thiếu → tạo
`.env` từ `.env.example` (nếu thiếu) → `docker compose up mysql` → chờ healthy →
`prisma generate` → apply migration → seed (permission, role, admin, settings, user mẫu) →
in bộ tài khoản demo → chạy BE (`node --watch`) và FE (`vite`) trong một terminal.
Nhấn Ctrl+C để tắt cả hai server; dữ liệu MySQL vẫn được giữ trong Docker volume.

| Địa chỉ                                   | Là gì                    |
| ----------------------------------------- | ------------------------ |
| http://localhost:5173                     | Frontend                 |
| http://localhost:3000/api/v1/health       | Backend health           |
| `npm run db:studio` → http://localhost:5555 | Prisma Studio (xem DB) |

Tuỳ chọn: `npm run dev -- --be-only`, `--fe-only`, `--no-docker` (tự chạy MySQL riêng,
sửa `DATABASE_URL`), `--no-seed`, hoặc `--prepare-only` để chỉ migrate/seed mà không mở server.

## 3. Tài khoản mẫu (dev)

| Email                     | Vai trò seed        | Mật khẩu                        |
| ------------------------- | ------------------- | ------------------------------- |
| admin@scms.local          | Quản lý trung tâm   | `SEED_ADMIN_PASSWORD` (Admin@123) |
| letan@scms.local          | Lễ tân              | `SEED_MOCK_PASSWORD` (Member@123) |
| coach.yoga@scms.local, coach.gym@scms.local | Huấn luyện viên | Member@123                 |
| member1…5@scms.local      | Hội viên            | Member@123                      |

Đăng nhập admin → **Hệ thống › Vai trò & quyền** để thấy RBAC động hoạt động: bỏ tick một quyền của "Lễ tân", đăng nhập `letan@` ở tab ẩn danh → menu/nút biến mất ngay.

## 4. Ngày làm việc điển hình

1. `git checkout dev && git pull` → `npm install` (nếu package.json đổi) → `npm run dev`.
2. Tạo nhánh `feature/…` (xem `04-git-workflow.md`).
3. Mở trang tương ứng để tham khảo pattern: BE `modules/role/`, FE `pages/system/roles/`.
4. Code → lưu là ESLint/Prettier tự sửa → commit (hook kiểm tra) → push → PR.

## 5. Lỗi hay gặp

| Triệu chứng                                                      | Cách xử lý                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Docker chua chay`                                               | Mở Docker Desktop, đợi icon xanh, chạy lại                                          |
| `port 3306 already in use`                                       | Máy có MySQL cài sẵn → tắt service hoặc đổi `MYSQL_PORT` trong `.env` gốc **và** port trong `DATABASE_URL` của `core/be/.env` |
| `[ENV] Bien moi truong khong hop le`                              | Đọc dòng báo thiếu gì, so với `core/be/.env.example`                                |
| `EADDRINUSE :3000` / `:5173`                                     | Tab terminal cũ còn chạy → tắt, hoặc đổi `PORT` / `VITE_PORT`                      |
| FE gọi API bị CORS                                               | `CORS_ORIGINS` trong `core/be/.env` phải chứa origin FE (`http://localhost:5173`)   |
| `Cannot find module '.prisma/client'`                            | `npm run db:generate`                                                               |
| Migration drift / lỗi DB dev                                     | `npm run db:reset` (xoá DB dev + seed lại)                                          |
| Commit bị chặn                                                   | Đọc lỗi ESLint (đa số là file > 200 dòng, magic number, console.log). Sửa, `git add`, commit lại |
| Windows: `'husky' is not recognized`                             | `npm install` ở thư mục gốc (script `prepare` cài hook)                             |
| Đổi `schema.prisma` mà `node --watch` không nhận                 | Ctrl+C, `npm run dev` lại (generate lại client)                                     |

## 6. Đọc tiếp

`docs/01-quy-tac-code.md` (bắt buộc) → `02-cau-truc-du-an.md` → `03-rbac-dynamic.md`.
