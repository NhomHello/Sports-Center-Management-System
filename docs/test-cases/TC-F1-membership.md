# Test case: Sprint 1 – tài khoản, hồ sơ, cấu hình và thông báo

Phạm vi dưới đây là phần backend của Nhanh trong Sprint 1.

| ID | Mục tiêu | Dữ liệu / bước chính | Kết quả mong đợi | Tự động | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| TC-F1-01 | Chuẩn hoá định danh | Email có chữ hoa/khoảng trắng, SĐT `+84` | Email chữ thường; SĐT lưu đầu `0` | ✅ unit | Pass |
| TC-F1-02 | Từ chối SĐT sai | SĐT không đúng định dạng Việt Nam | Validation thất bại | ✅ unit | Pass |
| TC-F1-03 | Đăng ký dùng dữ liệu chuẩn hoá | POST `/auth/register` | Dữ liệu đã chuẩn hoá, role lấy từ `isDefault` | ✅ unit | Pass |
| TC-F1-04 | Mật khẩu mới phải khác mật khẩu cũ | POST `/auth/password-changes` với hai giá trị giống nhau | 400 `VALIDATION_ERROR` | ✅ unit | Pass |
| TC-F1-05 | Vô hiệu hoá token cũ sau đổi mật khẩu | Đổi mật khẩu đúng | Hash mới và `tokenVersion` tăng | ✅ unit | Pass |
| TC-F1-06 | Kiểm tra miền giá trị cấu hình | Số ngày nhắc hạn bằng `0` | 400, không cập nhật | ✅ unit | Pass |
| TC-F1-07 | Audit thay đổi cấu hình | Sửa tên trung tâm | Audit có giá trị trước/sau và người sửa | ✅ unit | Pass |
| TC-F1-08 | Đánh dấu nhiều thông báo idempotent | IDs có phần tử lặp | Mỗi thông báo của user chỉ cập nhật một lần | ✅ unit | Pass |
| TC-F1-09 | Chặn thông báo ngoài sở hữu | IDs chứa thông báo của user khác | 404, không cập nhật | ✅ unit | Pass |

Các API hồ sơ dùng `/members/me`, không nhận `userId` từ client nên không thể đọc hoặc sửa hồ sơ người khác. Payload cập nhật chỉ cho phép `fullName`, `email`, `phone`; role và trạng thái không nằm trong schema.
