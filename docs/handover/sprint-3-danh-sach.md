# Sprint 3 · Danh sách chức năng (cập nhật 14/10/2026)

Thời gian: 20/10 → 02/11. Gồm **15 chức năng đã có trong kế hoạch (#47–#61)** và **11 chức năng bổ sung (#62–#72)**: phần Nhanh đã làm trong
sprint bổ sung giữa Sprint 2 và 3 mà chưa thuộc sprint nào. Nhánh làm việc hiện tại: `feature/f3-sepay-online-payment` (PR #3 vào `main`).

Kí hiệu: ✅ xong và đã kiểm thử · 🟡 làm một phần · ❌ chưa làm.

## A. Chức năng đã có trong kế hoạch Sprint 3

| # | UC | Chức năng | Trạng thái | Hiện có trong code / việc còn thiếu | Phụ trách theo kế hoạch |
| --- | --- | --- | --- | --- | --- |
| 47 | UC-UM-12 | Gửi link đặt lại mật khẩu | ✅ | `POST /auth/password-resets`, `ForgotPasswordPage`; token dùng chung bảng `email_verification_tokens` (`purpose = RESET_PASSWORD`), hạn link lấy từ `PASSWORD_RESET_TTL_MINUTES` | BE Bảo (Nhanh đã làm; Bảo review) |
| 48 | UC-UM-12 | Đặt lại mật khẩu | ✅ | `POST /auth/password-resets/confirm`, `ResetPasswordPage`; link dùng một lần, đăng xuất phiên cũ | FE Khôi (Nhanh đã làm; Khôi review) |
| 49 | UC-UM-04 | Chọn gói, tạo hoá đơn online | ✅ | `POST /memberships/me/orders` tạo hoá đơn kênh `ONLINE`, tái sử dụng hoá đơn chờ cùng kênh | BE Nhanh, FE Khải |
| 50 | UC-UM-10 | Job nhắc gia hạn | ❌ | Chưa có job nền. Cần chạy định kỳ, nhắc trước `MEMBERSHIP_EXPIRY_REMINDER_DAYS` ngày, mỗi gói nhắc đúng một lần (dùng `createForUsers` và `eventKey` để chống trùng) | BE Bảo |
| 51 | UC-UM-15 | Xem nhật ký thao tác | 🟡 | Bảng `audit_logs` đã được ghi ở hoá đơn, lớp, đăng ký. Chưa có `GET /audit-logs` và màn xem (cần lọc theo thực thể, người làm, thời gian) | BE Bảo, FE Khải |
| 52 | UC-CB-18 | Đổi giờ một buổi | ❌ | Chưa có `PATCH /classes/sessions/:id`. Phải dùng cùng khoá `ScheduleLock` và kiểm tra trùng giờ như lúc sửa lớp | BE Bảo, FE Khôi |
| 53 | UC-CB-18 | Huỷ một buổi | ❌ | Chưa có API chuyển một buổi sang `CANCELLED`; thông báo học viên qua outbox `ClassEvent` | BE Bảo, FE Khôi |
| 54 | UC-PAY-01 | Màn QR và theo dõi trạng thái | ✅ | `OnlinePaymentPanel`: QR `qr.sepay.vn`, đồng hồ hạn, tự chuyển "Đã thanh toán" khi webhook về | FE Khải (Nhanh đã làm) |
| 55 | UC-PAY-02 | Xử lý webhook SePay | ✅ | `POST /payments/sepay/webhook`: xác thực `Authorization: Apikey`, idempotent theo mã giao dịch, sai tiền / không có hoá đơn → log `NEEDS_REVIEW` (HTTP 200), đúng tiền → `PAID` và kích hoạt gói | BE Nhanh |
| 56 | UC-PAY-04 | Job hết hạn hoá đơn | 🟡 | Hoá đơn quá hạn chỉ bị đánh dấu khi hội viên tạo hoá đơn mới (`expireStalePendingInvoices`). Cần job định kỳ theo `PAYMENT_ONLINE_TIMEOUT_MINUTES` để chuyển `FAILED` (BR-3.4) | BE Nhanh |
| 57 | UC-PAY-05 | Xác nhận thanh toán thủ công | 🟡 | Giao dịch lệch đã lưu ở `payment_webhook_logs` trạng thái `NEEDS_REVIEW`. Chưa có API và màn để lễ tân / quản lý đối soát, gán vào hoá đơn | BE Nhanh, FE Khải |
| 58 | UC-PAY-08 | Lịch sử giao dịch | 🟡 | Có danh sách hoá đơn (lọc theo kênh, trạng thái, chi tiết, biên lai). Chưa có bảng lịch sử thanh toán (`payments`) cho hội viên và quản lý | BE Nhanh, FE Khải |
| 59 | UC-PAY-09 | Hoàn tiền | ❌ | Chưa có. Hoá đơn đã có trạng thái `REFUNDED`; cần quy tắc: hoàn thì gói bị thu hồi như thế nào (rút ngày đã cộng) | BE Nhanh, FE Khải |
| 60 | UC-RPT-01 | Dashboard báo cáo | ❌ | Chưa có `GET /reports/*`. Quyền `report.view` chỉ dành cho Center Manager (BR-3.5). Chỉ số: doanh thu, hoàn tiền, membership mới / gia hạn, lớp và tỉ lệ lấp đầy | BE Bảo, FE Khôi |
| 61 | UC-RPT-01 | Xuất tệp báo cáo | ❌ | Chưa có xuất CSV / Excel / PDF | BE Bảo, FE Khôi |

Ghi chú: các nhánh `sprint-3/*` trên GitHub được dựng từ nhánh `khoi` cũ và còn hướng dẫn `git checkout origin/khoi`. Phần #47–49, #54, #55 đã được
viết lại trong sprint bổ sung với thiết kế khác (token email dùng chung, cấu hình tài khoản nhận tiền trong `system_settings`), nên **không chép lại từ `khoi`**.

## B. Chức năng bổ sung, thêm vào Sprint 3 (chưa thuộc sprint nào)

Tất cả do Nhanh làm trong sprint bổ sung (BE + FE), đã kiểm thử và commit trên `feature/f3-sepay-online-payment`.

| # | UC | Chức năng | Trạng thái | Nội dung và bằng chứng |
| --- | --- | --- | --- | --- |
| 62 | UC-UM-01 mở rộng | Bắt xác minh email trước khi vào hệ thống | ✅ | Đăng nhập đúng mật khẩu nhưng chưa xác minh → `403 EMAIL_NOT_VERIFIED`; gửi và xác nhận link `/auth/email-verifications[/confirm]`, trang `VerifyEmailPage`. Tài khoản chỉ có SĐT hoặc do nhân viên tạo thì coi là đã xác minh |
| 63 | UC-UM-02 mở rộng | Đổi email có xác nhận | ✅ | Email mới chỉ có hiệu lực sau khi bấm link gửi tới địa chỉ mới (`pendingEmail`); trang Hồ sơ cá nhân |
| 64 | UC-UM-19 mở rộng | Nhân viên xác minh email thủ công | ✅ | Quyền mới `user.verify_email` (admin và lễ tân), nút "Xác minh email" trong hồ sơ hội viên, có nhật ký |
| 65 | UC-UM-12 hỗ trợ | Liên hệ trung tâm khi không nhận được email | ✅ | `GET /auth/support-contacts`, hiển thị Zalo / Facebook / điện thoại ở màn "Hãy kiểm tra email"; cấu hình ở Cài đặt → Trung tâm (`CENTER_SUPPORT_*`) |
| 66 | UC-UM-16 mở rộng | Cấu hình tài khoản nhận tiền SePay động | ✅ | `PAYMENT_BANK_CODE`, `PAYMENT_BANK_ACCOUNT_NUMBER`, `PAYMENT_BANK_ACCOUNT_NAME` trong `system_settings`, mỗi thành viên nhập tài khoản test riêng; chỉ `SEPAY_WEBHOOK_API_KEY` ở `.env` |
| 67 | UC-PAY-06 / UC-PAY-10 mở rộng | Phân biệt kênh hoá đơn ONLINE / COUNTER | ✅ | Sửa lỗi hoá đơn mua online bị hiện như tại quầy: cột và bộ lọc kênh, nhãn nhà cung cấp, hộp thu tiền hiện trước "tác động lên gói" (cộng dồn hay bắt đầu mới) |
| 68 | UC-UM-03 / UC-UM-08 mở rộng | Gói tập là thời hạn, giảm giá theo thời hạn | ✅ | Giao diện Gói tập thiết kế lại; thẻ hiện đơn giá mỗi ngày và % tiết kiệm tính từ giá thật; banner hạn dùng và số lần thanh toán đã cộng dồn (`paidInvoiceCount`); quyền lợi của mọi gói như nhau |
| 69 | UC-CB-06/07/09/10 làm sâu | Xếp lớp: luật nghiệp vụ và thông báo lý do | ✅ | Bộ test K01–K09, lý do chặn cụ thể (tài khoản bị khoá…), thông báo thành công riêng cho đăng ký / huỷ / đăng ký hộ, mô tả lịch tuần dễ đọc; xem `docs/08-xep-lop-hoc.md` |
| 70 | Tài liệu | ERD bản 2, mô phỏng "1 user nhiều membership", kịch bản demo 15 phút | ✅ | `docs/09-erd-va-demo.md`, `docs/assets/erd-v2*` |
| 71 | Phi chức năng | Vá lỗ hổng phụ thuộc | ✅ | `npm audit --omit=dev` = 0 lỗ hổng (nâng `proxy-addr`, `mariadb`, `mysql2`…); còn 3 cảnh báo ở công cụ lint chưa có bản vá |
| 72 | Kiểm thử | E2E Playwright desktop và ảnh nghiệm thu | ✅ | 19 ca e2e (SePay, quầy, email, xếp lớp) chỉ chạy desktop 1366×900; BE 130, FE 71 test |

## C. Việc còn lại và gợi ý chia (nhóm chốt)

Bảng dưới là đề xuất để cân tải, dựa trên phân công gốc. Vì Nhanh đã làm trọn #47, #48, #49, #54, #55, các bạn còn lại có thời gian cho phần chưa có.

| Người | Việc |
| --- | --- |
| Bảo (BE) | #50 job nhắc gia hạn; #52 và #53 đổi giờ / huỷ một buổi; #51 API nhật ký; #60 và #61 API báo cáo |
| Nhanh (BE) | #56 job hết hạn hoá đơn; #57 API đối soát; #58 lịch sử thanh toán; #59 hoàn tiền; review PR |
| Khải (FE) | #51 màn nhật ký; #57 màn đối soát; #58 lịch sử giao dịch; #59 hộp thoại hoàn tiền |
| Khôi (FE) | #52 và #53 giao diện đổi giờ / huỷ buổi; #60 dashboard; #61 nút xuất báo cáo |

Điều kiện mọi PR: `npm run lint`, `npm test`, e2e desktop của tính năng; commit tiếng Anh theo Conventional Commits, không `Co-Authored-By` (xem `CLAUDE.md`).

## D. Việc nhóm cần làm khi nhận bản Nhanh

1. `git pull`, `npm install`, `npm run db:migrate` (có migration `email_token_purpose`), `npm run db:seed`.
2. Nếu lễ tân không thấy nút "Xác minh email", vào Phân quyền cấp `user.verify_email` cho role Lễ tân (seed có khai báo nhưng DB dựng từ trước có thể chưa được cập nhật).
3. Mỗi người nhập tài khoản SePay test riêng ở Cài đặt → Thanh toán và đặt `SEPAY_WEBHOOK_API_KEY` trong `core/be/.env`.
4. Sửa câu trong file Word `07_Business_Rules`: "không xác định được *quyền lợi nào* đang áp dụng" thành "không xác định được *thời hạn nào* đang áp dụng" (xem mục 4.1 của `09-erd-va-demo.md`).
