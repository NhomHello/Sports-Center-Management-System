# Tài liệu dự án

| #   | File                                                   | Nội dung                                                                 | Ai đọc              |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------- |
| 0   | [06-onboarding.md](06-onboarding.md)                   | Cài máy, chạy dự án lần đầu, tài khoản mẫu, lỗi hay gặp                  | Người mới, ngày 1   |
| 1   | [01-quy-tac-code.md](01-quy-tac-code.md)               | **Quy tắc bắt buộc**: 200 dòng/file, đặt tên, comment, tái sử dụng, không hardcode | Tất cả, trước khi code |
| 2   | [02-cau-truc-du-an.md](02-cau-truc-du-an.md)           | Cấu trúc MVC, luồng request, checklist thêm module BE / trang FE          | Tất cả              |
| 3   | [03-rbac-dynamic.md](03-rbac-dynamic.md)               | Phân quyền động: thiết kế, thêm permission, dùng ở BE/FE                  | Tất cả              |
| 4   | [04-git-workflow.md](04-git-workflow.md)               | Nhánh, commit message, PR, review, hook tự động                           | Tất cả              |
| 5   | [05-api-convention.md](05-api-convention.md)           | Chuẩn URL, response, lỗi, phân trang                                      | BE + FE             |
| 6   | [test-cases/README.md](test-cases/README.md)           | Cách viết test case & test tự động                                        | Tất cả              |
| -   | [plan/](plan/)                                         | Kế hoạch tuần, biên bản họp (nhóm tự bổ sung)                             | Leader              |

Quy ước đặt tên tài liệu nộp GV: `SWP391_<Loại>_<Phiên bản>` (theo kế hoạch tuần 1).

## Tinh thần chung

1. **Người mới đọc được** – file ngắn, tên rõ, comment "tại sao".
2. **Không hardcode** – mọi thứ có thể đổi (URL, số ngày, quyền, vai trò) phải đổi được mà không sửa code.
3. **Tái sử dụng** – copy lần thứ 2 là phải tách ra dùng chung.
4. **Máy kiểm tra thay người** – ESLint/Prettier/commitlint chặn vi phạm ngay khi commit; reviewer chỉ lo logic.
