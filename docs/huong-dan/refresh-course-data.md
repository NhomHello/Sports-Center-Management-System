# Dữ liệu khóa học phục vụ demo

Từ thư mục gốc dự án, xem trước:

```bash
npm run db:refresh:courses
```

Chỉ khi đã kiểm tra cấu hình đang trỏ tới cơ sở dữ liệu demo và chấp nhận thay dữ liệu nghiệp vụ:

```bash
npm run db:refresh:courses -- --yes
```

`npm run db:demo` là lệnh gọi chế độ thực hiện ngay. Script có bước kiểm tra và transaction; không chạy giữa buổi báo cáo. Nó giữ các dữ liệu nền/tài khoản quản lý theo logic trong seed; không dùng số lượng mẫu trong tài liệu làm điều kiện đúng nếu seed đã được sửa.

Nguồn kiểm tra: `core/be/prisma/seed/course-only/refresh.js`, các file cùng thư mục, `core/be/package.json`. Seed mẫu có khóa/học viên phục vụ thanh toán, điểm danh và tổng kết. Sau khi chạy cần chọn đúng khóa đang mở, không trùng lịch và đúng hạn theo thời gian máy hiện tại.

Tạo dữ liệu demo không chứng minh đã kiểm thử ngân hàng hoặc gửi email thật. Không đưa mật khẩu, token hoặc nội dung `.env` vào báo cáo.
