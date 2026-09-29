# Sprint 4 – FE – Khải

- Nhánh: `sprint-4/fe-khai`
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

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-4/fe-khai`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/training/TrainingPage.jsx` |  |
| `core/fe/src/pages/training/CheckInPanel.jsx` |  |
| `core/fe/src/pages/training/TrainingHistoryPanels.jsx` |  |
| `core/fe/src/pages/training/TrainingPlanCard.jsx` |  |
| `core/fe/src/pages/training/TrainingPlanModal.jsx` |  |
| `core/fe/src/pages/training/TrainingResultModal.jsx` |  |
| `core/fe/src/services/training.service.js` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/router/routeRegistry.jsx` | Route training |

## Việc còn thiếu (phải tự làm thêm)

- #69 UC-TR-04 – Gửi bài tập / thông báo cho học viên: Công bố kế hoạch tập có gửi thông báo cho học viên; chưa có gửi tự do, giới hạn lượt/ngày, retry queue.
