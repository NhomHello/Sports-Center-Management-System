# Chạy hệ thống tại máy cá nhân

Yêu cầu: Node.js từ 22, npm từ 10, Git và Docker có Compose v2. Cấu hình engine nằm trong `package.json`; Docker dùng cho MySQL trong `docker-compose.yml` của dự án.

Từ thư mục chứa `package.json`:

```bash
npm run dev
```

`scripts/dev.mjs` và `scripts/setup.mjs` chuẩn bị dependency, file môi trường từ mẫu, MySQL, Prisma/migration và seed trước khi chạy frontend/backend. Mặc định frontend ở cổng 5173 và backend ở cổng 3000; cấu hình thực tế có thể đổi bằng môi trường. Dùng `npm run dev -- --prepare-only` nếu chỉ cần chuẩn bị.

Quy trình từng bước khi môi trường đã được cấu hình:

```bash
npm install
npm run db:up
npm run db:deploy -w @scms/be
npm run db:generate
npm run db:seed
npm run dev:be
```

Mở terminal khác để chạy `npm run dev:fe`. Không đưa `.env`, mật khẩu hoặc khóa SePay lên Git/tài liệu. Các giá trị bắt buộc được mô tả trong `.env.example` và `core/be/src/config/env.js`.

Bốn vai trò mặc định nằm ở `core/be/prisma/seed/roles.seed.js`. Tài khoản Quản lí trung tâm do seed tạo theo `SEED_ADMIN_EMAIL`; đây là tên biến cấu hình, không phải vai trò thứ năm. Tài khoản mẫu khóa học theo seed hiện tại; mật khẩu lấy từ cấu hình trên máy.

Nếu trình duyệt không kết nối được nhưng API health hoạt động, kiểm tra `CORS_ORIGINS` có đúng origin đang mở, gồm `localhost` hoặc `127.0.0.1` tương ứng. Kiểm tra database bằng health theo cấu hình `API_PREFIX`/`HEALTH_PATH`, không suy ra CORS đã đúng chỉ vì health trả thành công.

Nguồn: `package.json`, `scripts/dev.mjs`, `scripts/setup.mjs`, `core/be/package.json`, `core/be/src/app.js` và `core/be/src/config/env.js`.
