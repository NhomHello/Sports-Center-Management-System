# Sprint 2 – FE – Khải

- Nhánh: `sprint-2/fe-khai`
- Thời gian: 06/10 → 19/10
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 29 | UC-CB-01 | Sửa danh sách bộ môn | ✅ Khôi đã làm (BE+FE) | module subject + ResourceCatalogPanel |
| 30 | UC-CB-14 | Danh sách phòng tập | ✅ Khôi đã làm (BE+FE) | module room + ResourceCatalogPanel |
| 31 | UC-CB-14 | Tạo / sửa / ngừng hoạt động phòng | ✅ Khôi đã làm (BE+FE) | module room + ResourceCatalogPanel |
| 32 | UC-CB-02 | Tạo lớp | ✅ Khôi đã làm (BE+FE) | module class + ClassFormModal |
| 33 | UC-CB-03 | Sửa lớp / đổi lịch | ✅ Khôi đã làm (BE+FE) | module class + ClassFormModal |
| 34 | UC-CB-04 | Huỷ lớp | ✅ Khôi đã làm (BE+FE) | DELETE /classes/:id, có gửi thông báo |
| 36 | UC-CB-05 | Danh sách lớp đang mở | ✅ Khôi đã làm (BE+FE) |  |
| 37 | UC-CB-15 | Chi tiết lớp | ✅ Khôi đã làm (BE+FE) |  |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-2/fe-khai`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/schedule/ResourceCatalogPanel.jsx` |  |
| `core/fe/src/pages/schedule/ResourceFormModal.jsx` |  |
| `core/fe/src/pages/schedule/ClassFormModal.jsx` |  |
| `core/fe/src/pages/schedule/ClassSessionsTable.jsx` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/pages/schedule/SchedulePage.jsx` | Phần quản lý lớp và danh mục |
| `core/fe/src/services/schedule.service.js` | subjects, rooms, classes CRUD |
| `core/fe/src/router/routeRegistry.jsx` | Route schedule |
