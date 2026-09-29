# Sprint 2 – FE – Khôi

- Nhánh: `sprint-2/fe-khoi`
- Thời gian: 06/10 → 19/10
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 38 | UC-CB-17 | Danh sách lớp (quản lý) | ✅ Khôi đã làm (BE+FE) |  |
| 39 | UC-CB-17 | Chi tiết lớp và học viên (quản lý) | ✅ Khôi đã làm (BE+FE) |  |
| 40 | UC-CB-06 | Đăng ký lớp | ✅ Khôi đã làm (BE+FE) |  |
| 41 | UC-CB-07 | Huỷ đăng ký lớp | ✅ Khôi đã làm (BE+FE) |  |
| 42 | UC-CB-09 | Đăng ký lớp hộ hội viên | ✅ Khôi đã làm (BE+FE) |  |
| 43 | UC-CB-10 | Huỷ đăng ký hộ hội viên | ✅ Khôi đã làm (BE+FE) |  |
| 44 | UC-CB-16 | Lịch tập cá nhân | ✅ Khôi đã làm (BE+FE) |  |
| 45 | UC-CB-11 | Lịch dạy | ✅ Khôi đã làm (BE+FE) |  |
| 46 | UC-CB-12 | Danh sách học viên của lớp | ✅ Khôi đã làm (BE+FE) |  |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-2/fe-khoi`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/schedule/ScheduleCalendar.jsx` |  |
| `core/fe/src/pages/schedule/ScheduleList.jsx` |  |
| `core/fe/src/pages/schedule/useScheduleCalendar.js` |  |
| `core/fe/src/pages/schedule/ClassRosterModal.jsx` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/pages/schedule/SchedulePage.jsx` | Lịch tuần, đăng ký / huỷ, lịch dạy |
| `core/fe/src/services/schedule.service.js` | enroll, cancel, schedule/me, schedule/week, roster |
