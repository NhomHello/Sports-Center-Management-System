# Phân chia lại theo sprint

Nhánh `khoi` chứa code Flow 1–4 do Khôi làm trước. Code được tách lại theo sprint và theo người để mỗi thành viên nhận, đọc hiểu, hoàn thiện và commit phần của mình. Chi tiết từng nhánh nằm trong file `docs/handover/<nhánh>.md` trên chính nhánh đó.

Phân vai: BE = Nhanh + Bảo, FE = Khôi + Khải, mỗi sprint đủ 4 người.

| Sprint | Vai | Người | Nhánh | Số function | Còn thiếu | Số file lấy từ khoi |
|---|---|---|---|---|---|---|
| 1 | BE | Nhanh | `sprint-1/be-nhanh` | 11 | 0 | 43 |
| 1 | BE | Bảo | `sprint-1/be-bao` | 9 | 0 | 19 |
| 1 | FE | Khôi | `sprint-1/fe-khoi` | 11 | 0 | 32 |
| 1 | FE | Khải | `sprint-1/fe-khai` | 9 | 0 | 11 |
| 2 | BE | Bảo | `sprint-2/be-bao` | 9 | 0 | 21 |
| 2 | BE | Nhanh | `sprint-2/be-nhanh` | 9 | 0 | 15 |
| 2 | FE | Khải | `sprint-2/fe-khai` | 8 | 0 | 7 |
| 2 | FE | Khôi | `sprint-2/fe-khoi` | 9 | 0 | 6 |
| 3 | BE | Nhanh | `sprint-3/be-nhanh` | 7 | 0 | 19 |
| 3 | BE | Bảo | `sprint-3/be-bao` | 8 | 3 | 23 |
| 3 | FE | Khải | `sprint-3/fe-khai` | 6 | 0 | 8 |
| 3 | FE | Khôi | `sprint-3/fe-khoi` | 6 | 3 | 8 |
| 4 | BE | Bảo | `sprint-4/be-bao` | 8 | 1 | 23 |
| 4 | BE | Nhanh | `sprint-4/be-nhanh` | 7 | 7 | 0 |
| 4 | FE | Khải | `sprint-4/fe-khai` | 8 | 1 | 8 |
| 4 | FE | Khôi | `sprint-4/fe-khoi` | 7 | 7 | 0 |

Thứ tự merge vào `main`: Sprint 1 → 2 → 3 → 4; trong mỗi sprint merge BE trước FE.

Commit dùng lại code của Khôi phải có dòng `Co-authored-by: kitter <longhuy0078@gmail.com>` để ghi nhận đúng người viết.
