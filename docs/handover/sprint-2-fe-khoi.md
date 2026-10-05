# Sprint 2 · FE Khôi

- Nhánh thành viên: `sprint-2/fe-khoi`.
- Nhánh chạy tích hợp: `sprint-2/integration`.
- Thời gian kế hoạch: 06–19/10. Nền: Sprint 1 trên `origin/main`.
- Commit triển khai chính: `3845131`; thay đổi nghiệm thu tiếp theo xem log nhánh tích hợp.

9 chức năng thuộc 8 UC; UC-CB-17 có hai màn hình (#38–46).

## Chức năng phụ trách

| # | UC | Chức năng |
| --- | --- | --- |
| 38 | UC-CB-17 | Danh sách lớp (quản lý) |
| 39 | UC-CB-17 | Chi tiết lớp và học viên (quản lý) |
| 40 | UC-CB-06 | Đăng ký lớp |
| 41 | UC-CB-07 | Huỷ đăng ký lớp |
| 42 | UC-CB-09 | Đăng ký lớp hộ hội viên |
| 43 | UC-CB-10 | Huỷ đăng ký hộ hội viên |
| 44 | UC-CB-16 | Lịch tập cá nhân |
| 45 | UC-CB-11 | Lịch dạy |
| 46 | UC-CB-12 | Danh sách học viên của lớp |

## Bàn giao triển khai

Các module/component chính: ClassFilters, ClassBookingActions, StaffBookingPanel, ScheduleCalendar, ScheduleList, ScheduleToolbar, ClassRosterModal và useScheduleCalendar.

Đăng ký là **toàn lớp**. Backend trả chỗ còn lại, trạng thái đăng ký, canEnroll/canCancel, hạn huỷ và lý do từ chối. Hạn N giờ lấy từ system_settings, mặc định 12; ngoại lệ do đổi lịch chỉ cho hội viên bị xung đột thật, trước buổi xung đột đầu tiên.

Phạm vi lớp/roster kiểm tra ở BE; HLV chỉ thấy lớp phụ trách khi không có class.read_all. FE dùng Ant Design, Axios service, TanStack Query và tải lại lớp/lịch/roster sau thay đổi. UTC ở DB, giờ Việt Nam ở giao diện.

Nhánh origin/khoi không tồn tại tại lúc triển khai; không áp dụng hướng dẫn checkout/copy hoặc co-author từ nhánh đó. Các migration cũ giữ nguyên; chỉ thêm migration 20261005100000_sprint2_class_booking. UC-CB-18 từng buổi thuộc Sprint 3.

## Kiểm tra và tích hợp

Đối chiếu [coverage 18 chức năng](sprint-2-coverage.md), [test cases](../test-cases/TC-F2-class-booking.md), [API và DTO](../sprint-2-api.md).

Tích hợp local theo thứ tự BE Bảo → BE Nhanh → FE Khải → FE Khôi. Main được bảo toàn. Các bước push, PR và merge remote thuộc bàn giao riêng.

Chạy từ nhánh tích hợp sau khi chuyển bằng git switch sprint-2/integration: npm run dev; npm run verify:sprint2; npm run test:e2e; npm run lint; npm run format:check; npm run build. Kết quả cuối và hướng dẫn demo nằm trong coverage.
