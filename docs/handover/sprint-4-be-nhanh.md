# Sprint 4 – BE – Nhanh

- Nhánh: `sprint-4/be-nhanh`
- Thời gian: 03/11 → 16/11
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 70 | UC-AI-01 | AI sinh bản nháp bài tập | ❌ Chưa làm | Flow AI chưa có code. |
| 71 | UC-AI-01 | Sửa / duyệt bản nháp | ❌ Chưa làm | Flow AI chưa có code. |
| 72 | UC-AI-02 | Đánh giá tiến độ học viên | ❌ Chưa làm | Flow AI chưa có code. |
| 73 | UC-AI-04 | Quản lý nhà cung cấp và model AI | ❌ Chưa làm | Flow AI chưa có code. |
| 74 | UC-AI-05 | Gán model và prompt cho tính năng | ❌ Chưa làm | Flow AI chưa có code. |
| 75 | UC-AI-03 | Trợ lý hỏi đáp cho hội viên | ❌ Chưa làm | Flow AI chưa có code. |
| 76 | UC-AI-06 | Nhật ký và chi phí AI | ❌ Chưa làm | Flow AI chưa có code. |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-4/be-nhanh`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File từ nhánh khoi

Chưa có. Phần này nhánh khoi chưa làm, cần code mới từ đầu.

## Việc còn thiếu (phải tự làm thêm)

- #70 UC-AI-01 – AI sinh bản nháp bài tập: Flow AI chưa có code.
- #71 UC-AI-01 – Sửa / duyệt bản nháp: Flow AI chưa có code.
- #72 UC-AI-02 – Đánh giá tiến độ học viên: Flow AI chưa có code.
- #73 UC-AI-04 – Quản lý nhà cung cấp và model AI: Flow AI chưa có code.
- #74 UC-AI-05 – Gán model và prompt cho tính năng: Flow AI chưa có code.
- #75 UC-AI-03 – Trợ lý hỏi đáp cho hội viên: Flow AI chưa có code.
- #76 UC-AI-06 – Nhật ký và chi phí AI: Flow AI chưa có code.
