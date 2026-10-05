# Sprint 2 – BE – Bảo

- Nhánh: `sprint-2/be-bao`
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
| 35 | UC-CB-13 | Gửi thông báo thay đổi lớp (hệ thống) | ✅ Khôi đã làm (BE, không có FE) | Gửi CLASS_CHANGED khi đổi lịch / huỷ lớp (class.service, class-session.service). |
| 36 | UC-CB-05 | Danh sách lớp đang mở | ✅ Khôi đã làm (BE+FE) |  |
| 37 | UC-CB-15 | Chi tiết lớp | ✅ Khôi đã làm (BE+FE) |  |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-2/be-bao`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/src/modules/subject/subject.controller.js` |  |
| `core/be/src/modules/subject/subject.routes.js` |  |
| `core/be/src/modules/subject/subject.service.js` |  |
| `core/be/src/modules/subject/subject.validation.js` |  |
| `core/be/src/modules/room/room.controller.js` |  |
| `core/be/src/modules/room/room.routes.js` |  |
| `core/be/src/modules/room/room.service.js` |  |
| `core/be/src/modules/room/room.validation.js` |  |
| `core/be/src/modules/class/class-schedule.service.js` |  |
| `core/be/src/modules/class/class.validation.test.js` |  |
| `docs/test-cases/TC-F2-class-booking.md` | Nhanh bổ sung phần booking |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/prisma/migrations/20260924150000_add_flows_2_4/migration.sql` | Bảng subject, room, class, class_session, enrollment |
| `core/be/prisma/schema.prisma` | Model Flow 2 |
| `core/be/prisma/seed/roles.seed.js` | Quyền subject/room/class |
| `core/shared/src/permissions.js` | SUBJECT_*, ROOM_*, CLASS_* quản lý |
| `core/be/src/routes.js` | Đăng ký /subjects, /rooms, /classes |
| `core/be/src/modules/class/class.service.js` | list, getById, listCoaches, create, update, cancel (có gửi thông báo CB-13) |
| `core/be/src/modules/class/class.controller.js` | CRUD lớp |
| `core/be/src/modules/class/class.routes.js` | GET/POST /, /coaches, GET/PUT/DELETE /:id |
| `core/be/src/modules/class/class.validation.js` | listClassesSchema, createClassSchema, updateClassSchema, classIdSchema |
| `core/be/tests/flows.test.js` | Test tạo / sửa / huỷ lớp |
