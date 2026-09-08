# Hướng dẫn cho AI assistant (Claude Code / Copilot / Cursor)

Dự án SWP391 - Sports Center Management System. Trước khi sinh code, đọc `docs/01-quy-tac-code.md`
và `docs/02-cau-truc-du-an.md`. Tóm tắt các ràng buộc KHÔNG được vi phạm:

- **Kích thước**: file ≤ 200 dòng (không tính trống/comment), hàm ≤ 60 dòng (`.js`) / ≤ 80 (`.jsx`). Vượt thì tách file/hàm.
- **Không hardcode**: URL/port/secret → `.env` (đọc qua `src/config/env.js`); số nghiệp vụ (7 ngày, 12 giờ, 15 phút…) → bảng `system_settings` đọc qua `settingService.getValue(SETTING_KEYS.X)`; enum → Prisma enum / `constants`; permission → `PERMISSIONS.*` từ `@scms/shared`.
- **RBAC động**: KHÔNG BAO GIỜ so sánh tên/code role (`user.role === 'ADMIN'`). BE: `authorize(PERMISSIONS.X)`. FE: `usePermission().can(PERMISSIONS.X)` / `<PermissionGate>`. Tên role chỉ được xuất hiện trong `core/be/prisma/seed/**`.
- **MVC theo module (BE)**: `src/modules/<ten>/<ten>.{routes,controller,service,validation}.js`. Controller chỉ gọi service + `sendSuccess`; service chứa nghiệp vụ + Prisma; validation bằng Zod qua `validate()`; controller đọc `req.validated.{body,query,params}`.
- **Response chuẩn**: `sendSuccess/sendCreated/sendNoContent`; lỗi `throw ApiError.xxx()`; không `res.json` tự do, không `try/catch` nuốt lỗi.
- **FE**: gọi API qua `src/services/*.service.js` (axios instance `http`), data fetching bằng TanStack Query, form antd, thông báo qua `App.useApp()`. Trang mới đăng ký ở `src/router/routeRegistry.jsx`.
- **Đặt tên**: BE file `kebab-case` + hậu tố lớp; FE component `PascalCase.jsx`, hook `useXxx.js`, còn lại `camelCase.js`; DB `snake_case`; hằng `UPPER_SNAKE`.
- **Comment**: JSDoc cho hàm export; comment giải thích "tại sao", không lặp lại code.
- **Tái sử dụng**: kiểm tra `core/be/src/common`, `core/fe/src/{components/common,hooks,utils}` trước khi viết mới; copy lần 2 = phải tách chung.

Lệnh: `npm run dev` (Docker + BE + FE), `npm run lint`, `npm test`, `npm run db:migrate`, `npm run db:seed`.
