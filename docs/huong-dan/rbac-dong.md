# Vai trò và quyền

| Vai trò của đề tài | Mã seed | Trách nhiệm |
| --- | --- | --- |
| Hội viên | `MEMBER` | Đăng ký tài khoản; chọn và thanh toán khóa học; xem lịch, xin nghỉ, hủy/đổi khóa; xem nhận xét và kết quả; đánh giá khóa học. |
| Huấn luyện viên | `COACH` | Xem lịch dạy và học viên được phân công; điểm danh, nhận xét từng buổi; quản lý hồ sơ cá nhân; lập và công bố tổng kết khóa học. |
| Quản lí trung tâm | `CENTER_MANAGER` | Quản lý tài khoản, vai trò, tài nguyên, khóa học và cấu hình; xử lý đối soát, hoàn tiền; mở lại tổng kết, kiểm duyệt đánh giá và xem báo cáo. |
| Lễ tân | `RECEPTIONIST` | Tạo và tra cứu hội viên; hỗ trợ đăng ký/hủy khóa và xin nghỉ; thu tiền mặt, xuất biên lai; ghi nhận check-in tại quầy. |

Quyền là điều kiện cho một thao tác, không phải tên vai trò. `RolePermission` liên kết vai trò và permission; `User.roleId` là vai trò hiện tại. Ma trận mặc định nằm ở `core/be/prisma/seed/roles.seed.js`. Quản lí trung tâm có thể cấu hình ma trận; API không quyết định quyền chỉ bằng nhãn menu.

`authenticate` kiểm tra token, trạng thái tài khoản và tokenVersion. `authorize(...codes)` đọc quyền từ cơ sở dữ liệu qua service/cache và cho qua khi có ít nhất một mã phù hợp. Service tiếp tục kiểm tra chủ sở hữu, lớp/buổi được giao và thời gian truy cập.

Một số phạm vi quan trọng:

- Hội viên chỉ đọc hóa đơn, kết quả và nhận xét của chính mình.
- Huấn luyện viên điểm danh/nhận xét buổi phụ trách; hồ sơ học viên còn phụ thuộc buổi thực dạy và đồng ý chia sẻ.
- Lễ tân có quyền tạo/đọc hội viên, đăng ký hộ, thu tiền mặt và check-in theo ma trận mặc định. Quyền hủy hộ không tự cấp quyền xác nhận hoàn tiền.
- Quản lí trung tâm xử lý đối soát/hoàn, báo cáo và mở lại tổng kết theo quyền tương ứng.

Các API trả lỗi khi thiếu token, thiếu quyền hoặc nằm ngoài phạm vi. Không coi việc ẩn nút trên frontend là biện pháp phân quyền đầy đủ.

Nguồn: `common/middlewares/auth.middleware.js`, `authorize.middleware.js`, `permission/permission.service.js`, `profile/coach-member-scope.service.js`, `common/utils/session-access.js`.
