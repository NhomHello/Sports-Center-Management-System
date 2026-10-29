# Sprint 4 – Bảo (nhận cả task Nhanh)

Nhánh `sprint-4/be-bao`, author `ptbao29 <phamthaibao29072004@gmail.com>`. Đã pull main trước khi làm.
Nguồn phân công là `docs/ke-hoach/SWP391_TaskSheet_Sprint4.xlsx`, chốt không làm AI/kế hoạch tập luyện.
Bảo nhận 17 task của Bảo và Nhanh theo phân công 29/10; phần hồ sơ vẫn thuộc Khôi, FE tổng kết/đánh giá thuộc Khải.

| Nhóm | Task | Bàn giao |
| --- | --- | --- |
| Nền dữ liệu | S4-00 | 5 bảng mới, enum COMPLETED, quyền/cấu hình, API contract; dùng lại bản nền Khôi có ghi đồng tác giả, sửa MySQL TEXT defaults |
| Tổng kết | S4-11/12/14 | Job kết thúc khoá, nhắc/quá hạn chống trùng; chuyên cần server tính; nháp/công bố/mở lại; outbox email retry |
| Kết quả & đánh giá | S4-16/18 | Kết quả cá nhân, PDF chung khung hoá đơn; đánh giá trong hạn, ẩn danh/moderation có audit |
| Báo cáo khoá | S4-20 | Quyền riêng course_summary.view_all, màn hình/API và Excel cùng builder |
| Doanh thu | S4-22/24/28 | 5 nhóm thời gian, kỳ trước, cơ cấu 5 chiều, CREDIT không tính lại, xuất CSV/XLSX/PDF cùng dữ liệu |
| Hội viên | S4-26 | Chung bucket thời gian, kỳ gói, huỷ/đăng ký, lấp đầy lớp |
| FE báo cáo | S4-23/25/27 | Khoảng nhanh, nhóm kỳ, so sánh, biểu đồ tương tác, bảng cơ cấu/top, tab hội viên, tải file đúng bộ lọc |
| Tài liệu | S4-32 | Đặc tả UC/BR Word, ERD bổ sung, API contract |
| Demo | S4-33/34 | Seed bổ sung idempotent, doanh thu 12 tháng và 3 tình huống tổng kết; kịch bản demo, phần chạy nhóm trực tiếp chưa diễn tập |

## Chạy và nối API

1. `npm run db:deploy -w @scms/be`
2. `npm run db:generate`
3. `npm run db:seed`
4. Tuỳ chọn dữ liệu giả: `npm run db:seed:sprint4` (không reset DB).

Hợp đồng chi tiết: `docs/huong-dan/api-sprint4.md`. Khôi/Khải dùng đúng schema và contract này trước khi tích hợp;
không chạy lại bản migration cũ chưa sửa TEXT defaults. Quyền mới được seed theo cơ chế backfill quyền mới hiện có.

Các job chạy trong vòng đời server. Email không cấu hình SMTP vẫn giữ outbox chờ gửi, in-app không bị rollback.
Email chưa gửi tăng attempt và được xếp lịch công bằng, không chặn thông báo lớp mới. Email có bảo vệ nhiều worker và receipt từng người; nếu SMTP đã nhận nhưng kết nối/commit chết trước khi ghi receipt,
email có thể được gửi lại (at-least-once). Mỗi sự kiện chỉ có một in-app cho mỗi người nhờ dedupeKey.

## Giải thích số liệu

- Ngày Việt Nam, tuần thứ Hai. Kỳ trước có cùng số ngày liền trước khoảng chọn. Mẫu số 0 trả null, UI hiện “—”.
- Doanh thu tiền ngoài số dư ở paidAt; hoàn ở completedAt. Mỗi chiều cơ cấu có bucket “khác” khi không thuộc sản phẩm đó để tổng bằng net. Chênh lệch ADJUSTMENT giữ nhóm riêng.
- Membership báo cáo theo phần khoảng hiệu lực giao với bucket; bucket bị bảo lưu phủ toàn phần không tính kỳ hiệu lực.
- Đăng ký mới/huỷ dùng `enrolledAt/cancelledAt` của bản ghi đăng ký lớp hiện tại. Đăng ký lại đã ghi đè ngày cũ không được khôi phục thành sự kiện riêng từ dữ liệu hiện có. Lấp đầy tính hội viên có khoảng đăng ký giao bucket / sức chứa các lớp có buổi trong bucket, không cộng PENDING_PAYMENT.
- Tổng kết theo số buổi thực học từ ngày đăng ký, trừ EXCUSED ở mẫu số; mẫu số 0 trả 0. Chưa điểm danh cần xác nhận trước khi công bố.
- Nhận xét bị ẩn không hiển thị công khai; sao vẫn tính trung bình. Hạn đánh giá lấy buổi cuối không huỷ, không lấy ngày công bố.

## Kiểm tra

- Kết quả cuối: 224 BE + 158 FE test đạt; 2 E2E desktop/mobile, lint và build đạt. Ảnh và số liệu ở `outputs/sprint4-bao/`.
- Baseline trước thay đổi: 206 BE + 156 FE test đạt.
- Thêm test cho job/idempotence, scope HLV, công bố đồng thời, SMTP retry, kết quả cá nhân/PDF, rating/moderation,
  công thức chuyên cần, báo cáo/biên thời gian/CREDIT/cơ cấu/giới hạn và bộ lọc FE.
- E2E báo cáo desktop và mobile 320px: chọn năm, nhóm tháng, cơ cấu top lớp, chuyển tab hội viên, tải Excel.
- Migration replay từ DB trống đủ 16 migration; không DROP bảng. Seed chạy lại giữ 36 hoá đơn, 37 payment, 4 hoàn và 3 tổng kết.
- Excel dùng Review cho phần đã làm, để nhóm nối UI và review trước Done. S4-34 vẫn cần buổi diễn tập trực tiếp của nhóm.
