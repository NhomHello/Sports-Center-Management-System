# Hướng dẫn thay đổi mã nguồn

Đọc quy ước gốc trong `CLAUDE.md`, cấu hình ESLint và các module lân cận trước khi sửa. Giữ controller gọn, nghiệp vụ trong service, validation tại đầu vào và hằng số dùng chung trong `core/shared` khi cần cho cả backend/frontend.

Không dùng nhãn vai trò để bỏ qua middleware quyền; không nhận số tiền, trạng thái PAID/BOOKED hoặc ID chủ sở hữu từ client như dữ liệu đã được tin cậy. Tái sử dụng policy học phí, thời gian thanh toán, phạm vi buổi và builder báo cáo hiện có.

Thay schema cần migration phù hợp; giữ dữ liệu đã tham chiếu. Thay tiền/giữ chỗ cần xem lại transaction, idempotency, hạn thanh toán và race. Không sao chép bình luận cũ về gói thành luật khóa học nếu điều kiện trong service khác.

Lệnh chuẩn: `npm run lint`, `npm test`, `npm run build`; chạy các kiểm tra thích hợp với thay đổi và ghi đúng kết quả thực tế. Không ghi `.env`, mật khẩu hay API key vào log hoặc tài liệu.
