# Sprint 2 · FE Khải

- Nhánh thành viên: `sprint-2/fe-khai`.
- Nhánh chạy tích hợp: `sprint-2/integration`.
- Thời gian kế hoạch: 06–19/10. Nền: Sprint 1 trên `origin/main`.
- Commit triển khai chính: `0f439fb`; thay đổi nghiệm thu tiếp theo xem log nhánh tích hợp.

Danh mục, tạo/sửa/huỷ lớp, lớp mở và chi tiết (#29–34, #36–37).

## Chức năng phụ trách

| # | UC | Chức năng |
| --- | --- | --- |
| 29 | UC-CB-01 | Sửa danh sách bộ môn |
| 30 | UC-CB-14 | Danh sách phòng tập |
| 31 | UC-CB-14 | Tạo / sửa / ngừng hoạt động phòng |
| 32 | UC-CB-02 | Tạo lớp |
| 33 | UC-CB-03 | Sửa lớp / đổi lịch |
| 34 | UC-CB-04 | Huỷ lớp |
| 36 | UC-CB-05 | Danh sách lớp đang mở |
| 37 | UC-CB-15 | Chi tiết lớp |

## Bàn giao triển khai

Các module/component chính: ResourceCatalogPanel, ResourceFormModal, ClassListPanel, ClassFormModal, ClassDetailDrawer và ClassSessionsTable.

Đăng ký là **toàn lớp**. Backend trả chỗ còn lại, trạng thái đăng ký, canEnroll/canCancel, hạn huỷ và lý do từ chối. Hạn N giờ lấy từ system_settings, mặc định 12; ngoại lệ do đổi lịch chỉ cho hội viên bị xung đột thật, trước buổi xung đột đầu tiên.

Phạm vi lớp/roster kiểm tra ở BE; HLV chỉ thấy lớp phụ trách khi không có class.read_all. FE dùng Ant Design, Axios service, TanStack Query và tải lại lớp/lịch/roster sau thay đổi. UTC ở DB, giờ Việt Nam ở giao diện.

Nhánh origin/khoi không tồn tại tại lúc triển khai; không áp dụng hướng dẫn checkout/copy hoặc co-author từ nhánh đó. Các migration cũ giữ nguyên; chỉ thêm migration 20261005100000_sprint2_class_booking. UC-CB-18 từng buổi thuộc Sprint 3.

## Kiểm tra và tích hợp

Đối chiếu [coverage 18 chức năng](sprint-2-coverage.md), [test cases](../test-cases/TC-F2-class-booking.md), [API và DTO](../sprint-2-api.md).

Tích hợp local theo thứ tự BE Bảo → BE Nhanh → FE Khải → FE Khôi. Main được bảo toàn. Các bước push, PR và merge remote thuộc bàn giao riêng.

Chạy từ nhánh tích hợp sau khi chuyển bằng git switch sprint-2/integration: npm run dev; npm run verify:sprint2; npm run test:e2e; npm run lint; npm run format:check; npm run build. Kết quả cuối và hướng dẫn demo nằm trong coverage.
