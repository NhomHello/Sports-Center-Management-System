# Cấu trúc và kiến trúc

| Thư mục | Trách nhiệm |
| --- | --- |
| `core/shared/src` | Permission registry, khóa cấu hình và hằng số dùng chung |
| `core/be/src` | Express API, middleware, module nghiệp vụ và tác vụ nền |
| `core/be/prisma` | Schema, migration và seed |
| `core/fe/src` | Trang React, component, service gọi API, hook và store |
| `tests/e2e` | Kiểm thử luồng trình duyệt bằng Playwright |
| `docs` | Báo cáo, đặc tả, kế hoạch, kiểm thử và hướng dẫn hiện hành |
| `scripts/reporting` | Nguồn sinh bộ tài liệu hiện hành |

Luồng API: router → xác thực → kiểm tra quyền → validation → controller → service → Prisma/MySQL. Mã cụ thể có thể thêm kiểm tra phạm vi trong service; router dùng `authorize` với ít nhất một quyền trong danh sách.

Backend tổ chức theo module: tài khoản, hội viên, khóa/lịch, course-order, payment, reconciliation/refund, cancellation/purchase-change, attendance/session-feedback, profile, course-summary, report. Frontend gọi các API này; không tự quyết định giá hoặc chuyển trạng thái thanh toán.

Worker khởi tạo trong vòng đời server để hết hạn hóa đơn, xử lý hàng chờ, kết thúc/tổng kết khóa và thông báo/email. Tài liệu không giả định có broker hoặc microservice độc lập. Nguồn: `core/be/src/server.js`, `routes.js`, từng module và `core/fe/package.json`.
