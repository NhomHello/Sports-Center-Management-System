# Test case: Sprint 1 – thanh toán tại quầy và hoá đơn

Phạm vi dưới đây là phần backend của Nhanh trong Sprint 1; chưa bao gồm SePay và báo cáo ở sprint sau.

| ID | Mục tiêu | Dữ liệu / bước chính | Kết quả mong đợi | Tự động | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| TC-F3-01 | Không cho lễ tân sửa giá | Thu tiền khác `invoice.amount` | 422, không tạo payment | ✅ unit | Pass |
| TC-F3-02 | Hoàn tất thanh toán nguyên tử | Thu đúng tiền hoá đơn COUNTER | Payment, invoice PAID và membership cùng transaction | ✅ unit | Pass |
| TC-F3-03 | Giới hạn chi tiết hoá đơn | User đọc hoá đơn người khác | 404 | ✅ unit | Pass |
| TC-F3-04 | Chỉ xuất hoá đơn PAID | Lấy receipt của hoá đơn PENDING | 422 | ✅ unit | Pass |
| TC-F3-05 | Bản in dùng dữ liệu gốc | Lấy receipt hoá đơn PAID | Giữ nguyên số tiền; thông tin trung tâm từ setting | ✅ unit | Pass |

Frontend dùng dữ liệu từ `GET /invoices/:id/receipt` để mở hộp thoại in hoặc lưu PDF của trình duyệt. Backend không nhận số tiền hoặc thông tin trung tâm từ frontend.
