# Sprint 4 – BE – Bảo

- Nhánh: `sprint-4/be-bao`
- Thời gian: 03/11 → 16/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 62 | UC-AT-01 | Check-in tại quầy | ✅ Khôi đã làm (BE+FE) | module check-in + CheckInPanel |
| 63 | UC-AT-02 | Điểm danh buổi học | ✅ Khôi đã làm (BE+FE) | module attendance (điểm danh theo buổi) |
| 64 | UC-AT-03 | Lịch sử điểm danh của tôi | ✅ Khôi đã làm (BE+FE) | GET /attendance/me + TrainingHistoryPanels |
| 65 | UC-TR-01 | Tạo / sửa kế hoạch tập luyện | ✅ Khôi đã làm (BE+FE) | module training-plan + TrainingPlanModal |
| 66 | UC-TR-02 | Ghi kết quả buổi tập | ✅ Khôi đã làm (BE+FE) | module training-result + TrainingResultModal |
| 67 | UC-TR-03 | Xem kế hoạch và nhận xét | ✅ Khôi đã làm (BE+FE) | GET /training-plans/me, /training-results/me + TrainingPlanCard |
| 68 | UC-TR-03 | Đánh dấu hoàn thành bài tập | ✅ Khôi đã làm (BE+FE) | POST /training-plans/exercises/:id/completions |
| 69 | UC-TR-04 | Gửi bài tập / thông báo cho học viên | 🟡 Khôi làm một phần | Công bố kế hoạch tập có gửi thông báo cho học viên; chưa có gửi tự do, giới hạn lượt/ngày, retry queue. |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-4/be-bao`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/src/modules/attendance/attendance.controller.js` |  |
| `core/be/src/modules/attendance/attendance.routes.js` |  |
| `core/be/src/modules/attendance/attendance.service.js` |  |
| `core/be/src/modules/attendance/attendance.validation.js` |  |
| `core/be/src/modules/check-in/check-in.controller.js` |  |
| `core/be/src/modules/check-in/check-in.routes.js` |  |
| `core/be/src/modules/check-in/check-in.service.js` |  |
| `core/be/src/modules/check-in/check-in.validation.js` |  |
| `core/be/src/modules/training/training-plan.controller.js` |  |
| `core/be/src/modules/training/training-plan.routes.js` |  |
| `core/be/src/modules/training/training-plan.service.js` |  |
| `core/be/src/modules/training/training-result.controller.js` |  |
| `core/be/src/modules/training/training-result.routes.js` |  |
| `core/be/src/modules/training/training-result.service.js` |  |
| `core/be/src/modules/training/training-scope.js` |  |
| `core/be/src/modules/training/training.validation.js` |  |
| `docs/test-cases/TC-F4-training-attendance.md` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/prisma/migrations/20260924150000_add_flows_2_4/migration.sql` | Bảng check-in, attendance, training |
| `core/be/prisma/schema.prisma` | Model Flow 4 |
| `core/be/prisma/seed/roles.seed.js` | Quyền attendance/check-in/training |
| `core/shared/src/permissions.js` | ATTENDANCE_*, CHECK_IN_*, TRAINING_* |
| `core/be/src/routes.js` | Đăng ký /attendance, /check-ins, /training-* |
| `core/be/tests/flows.test.js` | Test check-in / điểm danh / training |

## Việc còn thiếu (phải tự làm thêm)

- #69 UC-TR-04 – Gửi bài tập / thông báo cho học viên: Công bố kế hoạch tập có gửi thông báo cho học viên; chưa có gửi tự do, giới hạn lượt/ngày, retry queue.
