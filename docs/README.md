# Tài liệu dự án

`docs/` chỉ chứa **quy luật code** (Markdown) và **tài liệu yêu cầu gốc** (Word). Kế hoạch, lộ trình, test case, báo cáo, thiết kế nằm ngoài `docs/`, trong `outputs/` (Excel và Word).

| Thư mục | Nội dung | Ai đọc |
| --- | --- | --- |
| [huong-dan/](huong-dan/) | Quy luật code và cách làm việc (Markdown) | Mọi người, trước khi code |
| [yeu-cau/](yeu-cau/) | Use case, flow và statechart, business rules (Word) và sơ đồ flow (ảnh PNG, file draw.io) | Cả nhóm, khi cần đối chiếu |

## Quy luật code (huong-dan/)

| File | Nội dung |
| --- | --- |
| [onboarding.md](huong-dan/onboarding.md) | Cài máy, chạy dự án lần đầu, tài khoản mẫu, lỗi hay gặp |
| [quy-tac-code.md](huong-dan/quy-tac-code.md) | **Bắt buộc**: 200 dòng/file, đặt tên, comment, tái sử dụng, không hardcode |
| [cau-truc-du-an.md](huong-dan/cau-truc-du-an.md) | Cấu trúc MVC, luồng request, checklist thêm module BE / trang FE |
| [rbac-dong.md](huong-dan/rbac-dong.md) | Phân quyền động: thiết kế, thêm permission, dùng ở BE/FE |
| [git-workflow.md](huong-dan/git-workflow.md) | Nhánh, commit message, PR, review, hook tự động |
| [api-convention.md](huong-dan/api-convention.md) | Chuẩn URL, response, lỗi, phân trang |
| [viet-test-case.md](huong-dan/viet-test-case.md) | Cách viết test case và test tự động |

## Tài liệu khác (outputs/)

| Loại | Định dạng | Vị trí |
| --- | --- | --- |
| Kế hoạch, task, tiến độ từng sprint | Excel | `outputs/sprint*-*/SWP391_TaskSheet_Sprint<N>.xlsx` |
| Test case | Excel | `outputs/tai-lieu/kiem-thu/SWP391_TestCase.xlsx` |
| Thiết kế: ERD, xếp lớp, API; kịch bản demo | Word | `outputs/tai-lieu/thiet-ke/` |
| Bàn giao sprint, UI/UX | Word | `outputs/tai-lieu/ban-giao/` |
| Báo cáo nghiệm thu kèm ảnh | Word | `outputs/*-nghiem-thu/BAO_CAO_NGHIEM_THU.docx` |

## Tinh thần chung

1. **Người mới đọc được**: file ngắn, tên rõ, comment "tại sao".
2. **Không hardcode**: mọi thứ có thể đổi (URL, số ngày, quyền, vai trò) phải đổi được mà không sửa code.
3. **Tái sử dụng**: copy lần thứ 2 là phải tách ra dùng chung.
4. **Máy kiểm tra thay người**: ESLint, Prettier, commitlint chặn vi phạm ngay khi commit; reviewer chỉ lo logic.
5. **Một nội dung, một chỗ**: không tạo bản sao tài liệu; sửa tại file gốc. Lộ trình và kế hoạch chỉ ghi ở Excel, không ghi thành Markdown.

Quy ước đặt tên tài liệu nộp giảng viên: `SWP391_<Loại>_<Phiên bản>`.
