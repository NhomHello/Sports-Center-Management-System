# Kịch bản demo cuối kỳ – Sprint 4

Phần bổ sung cho lộ trình demo hiện có; không thay thế các luồng thanh toán/đăng ký đã nghiệm thu Sprint 1–3.

## Chuẩn bị

- Áp dụng migration, generate client, seed quyền/cấu hình. Chạy `npm run db:seed:sprint4` để bổ sung dữ liệu giả, không reset.
- Đăng nhập quản lý bằng tài khoản seed đã cấu hình; HLV `s4.coach@scms.test`, hội viên `s4.member1@scms.test`
  đến `s4.member3@scms.test`, mật khẩu `SEED_MOCK_PASSWORD`. Không ghi mật khẩu hoặc secret vào tài liệu/ảnh.
- Chọn năm hiện tại hoặc 12 tháng qua ở Báo cáo. Có 36 hoá đơn rải 12 tháng, 4 khoản hoàn, một payment CREDIT để giải thích chống tính trùng.
- Bật SMTP sandbox nếu cần trình diễn email. Chưa cấu hình SMTP: in-app vẫn có, outbox chờ retry; không nói email đã gửi.

## Trình tự 15 phút

| Phút | Người / thao tác | Kết quả cần trình diễn |
| --- | --- | --- |
| 0–2 | Khôi: hồ sơ HLV và học viên | Tìm HLV theo bộ môn, liên hệ bật/tắt, HLV chỉ xem học viên đúng phạm vi, tắt chia sẻ sức khoẻ |
| 2–5 | Bảo giải thích job; Khải mở UI tổng kết | 3 lớp S4 Demo: đã công bố, chờ HLV nộp, quá hạn. Lớp CANCELLED không có tổng kết |
| 5–7 | HLV mở lớp “Chờ HLV nộp” | Chuyên cần có mặt/vắng/xin nghỉ/chưa điểm danh; chọn khác gợi ý cần nhận xét; thiếu học viên không công bố |
| 7–9 | HLV công bố, hội viên mở kết quả | In-app/email qua outbox, chỉ thấy kết quả mình, tải PDF có mã tra cứu |
| 9–10 | Hội viên đánh giá; quản lý moderation | Sao 1–5, mỗi người một đánh giá, HLV thấy tên viết tắt; quản lý thấy danh tính và ẩn nhận xét có lý do |
| 10–11 | Quản lý mở lại tổng kết | Có audit và lý do; HLV sửa/công bố lại, revision tăng; hội viên nhận bản cập nhật |
| 11–14 | Bảo: trang Báo cáo | Năm nay/nhóm tháng; thu–hoàn–thuần; cơ cấu tổng khớp net; top gói/lớp/bộ môn; kỳ trước 0 hiện “—”; tab hội viên |
| 14–15 | Bảo: xuất và kết luận nghiệm thu | File Excel/CSV/PDF giữ bộ lọc/nhóm/so sánh/cơ cấu; trình bày kiểm thử và các phần cần nhóm review |

## Diễn tập và bằng chứng

Báo cáo FE đã chạy E2E trên desktop và mobile 320px, kiểm tra query nhóm tháng và tải Excel. Backend tổng kết/đánh giá
được kiểm tra bằng integration test (quyền, công thức, công bố đồng thời, retry). Giao diện tổng kết/đánh giá và hồ sơ do
Khải/Khôi tích hợp; sau khi các nhánh merge, cả nhóm cần chạy một vòng đầy đủ bảng trên. Chưa tổ chức diễn tập trực tiếp.

Giữ một lớp chờ nộp để demo trực tiếp; sau khi đã công bố, quản lý có thể mở lại kèm lý do. Seed không ghi đè tổng kết
đã công bố hoặc hồ sơ đã sửa. Không dùng reset toàn DB chỉ để khôi phục tình huống demo.
