# Phân chia lại theo sprint

Các handover ban đầu mô tả việc tách code từ nhánh `khoi`. **Sprint 2 hiện triển khai trên nền Sprint 1 từ origin/main**, vì origin/khoi không tồn tại lúc triển khai. Bản chạy local nằm trên `sprint-2/integration`; xem [coverage 18 chức năng](sprint-2-coverage.md). Các dòng Sprint 1/3/4 bên dưới giữ thông tin phân công ban đầu; số file lấy từ khoi không phải bằng chứng triển khai hiện tại.

Phân vai: BE = Nhanh + Bảo, FE = Khôi + Khải, mỗi sprint đủ 4 người.

| Sprint | Vai | Người | Nhánh | Số function | Còn thiếu | Số file lấy từ khoi |
|---|---|---|---|---|---|---|
| 1 | BE | Nhanh | `sprint-1/be-nhanh` | 11 | 0 | 43 |
| 1 | BE | Bảo | `sprint-1/be-bao` | 9 | 0 | 19 |
| 1 | FE | Khôi | `sprint-1/fe-khoi` | 11 | 0 | 32 |
| 1 | FE | Khải | `sprint-1/fe-khai` | 9 | 0 | 11 |
| 2 | BE | Bảo | `sprint-2/be-bao` | 9 | Xem coverage | 0 |
| 2 | BE | Nhanh | `sprint-2/be-nhanh` | 9 | Xem coverage | 0 |
| 2 | FE | Khải | `sprint-2/fe-khai` | 8 | Xem coverage | 0 |
| 2 | FE | Khôi | `sprint-2/fe-khoi` | 9 | Xem coverage | 0 |
| 3 | BE | Nhanh | `sprint-3/be-nhanh` | 7 | 0 | 19 |
| 3 | BE | Bảo | `sprint-3/be-bao` | 8 | 3 | 23 |
| 3 | FE | Khải | `sprint-3/fe-khai` | 6 | 0 | 8 |
| 3 | FE | Khôi | `sprint-3/fe-khoi` | 6 | 3 | 8 |
| 4 | BE | Bảo | `sprint-4/be-bao` | 8 | 1 | 23 |
| 4 | BE | Nhanh | `sprint-4/be-nhanh` | 7 | 7 | 0 |
| 4 | FE | Khải | `sprint-4/fe-khai` | 8 | 1 | 8 |
| 4 | FE | Khôi | `sprint-4/fe-khoi` | 7 | 7 | 0 |

Thứ tự Sprint 2 đã áp dụng vào nhánh tích hợp local: BE Bảo → BE Nhanh → FE Khải → FE Khôi. Main được bảo toàn; push/PR/merge remote là bước bàn giao riêng.

Commit dùng lại code của Khôi phải có dòng `Co-authored-by: kitter <longhuy0078@gmail.com>` để ghi nhận đúng người viết.
