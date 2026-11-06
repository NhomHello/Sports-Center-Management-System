# Quy ước API

Prefix lấy từ `API_PREFIX`; router tổng ở `core/be/src/routes.js`. Controller dùng `sendSuccess`, `sendCreated` hoặc `sendNoContent`.

Thành công thông thường:

```json
{"success": true, "message": "OK", "data": {}, "meta": {}}
```

`meta` chỉ xuất hiện khi có dữ liệu phân trang/metadata. HTTP 201 dùng khi tạo mới, 204 không có body. Lỗi được xử lý qua middleware lỗi, có mã và thông báo; validation không cho client tự quyết định các trường số tiền/quyền học do server tính.

Các nhóm API được liệt kê trong [danh mục trích từ router](api-hien-hanh.md). Danh mục ghi điều kiện quyền nhìn thấy tại từng route; một số quyền nằm ở middleware chung và phạm vi nằm trong service, nên phải đọc cả nguồn trước khi sửa quyền.

Phân biệt các luồng:

- Mua khóa có học phí dùng `POST /classes/:id/orders`, tạo hóa đơn và PENDING_PAYMENT.
- API enrollment trực tiếp chỉ phục vụ lớp giá 0; không dùng để bỏ qua thanh toán khóa có học phí.
- Hủy/đổi khóa đã trả tiền dùng `/enrollments/:id/cancel-preview`, `/cancel`, `/change-preview`, `/change`.
- Khai báo đã chuyển chỉ tạo phiếu cần kiểm tra. Webhook nhận tiền và đối soát có điều kiện riêng.
- Các đường dẫn `/memberships` và `/membership-plans` được router nghỉ dùng chặn bằng HTTP 410 sau xác thực; các hàm cũ còn trong code không có nghĩa luồng bán gói vẫn mở.
- API số dư còn để xử lý dữ liệu tài chính; hủy/đổi khóa không cho chọn CREDIT trong validation hiện hành.

Nguồn: `core/be/src/common/utils/api-response.js`, `common/middlewares/error.middleware.js`, `modules/course-order`, `modules/cancellation`, `modules/purchase-change`, `modules/membership/retired-membership.routes.js`.
