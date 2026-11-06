# Chuẩn bị hội đồng theo ngày chạy

Bộ hiện hành gồm kịch bản 30 phút, lời thuyết trình cho bốn người, bộ dữ liệu Excel và manifest ID thực trong `docs/bao-cao`.

Tại thư mục gốc, `npm run demo:prepare` xem trước. `npm run demo:prepare -- --apply` lấy đồng hồ máy theo Asia/Ho_Chi_Minh, thêm một namespace ccl_ riêng và tự sinh lại Word/PDF/Excel/slide. Lệnh giữ dữ liệu cũ và các phiên demo chưa được thực hiện. Không cần gõ ngày cố định hoặc đổi giờ hệ thống.

Backend cần đã migrate/seed nền, có khung hoạt động và tài khoản quản lý từ cấu hình máy. Phần tài liệu cần Python với `scripts/reporting/requirements.txt`, PlantUML/Graphviz và LibreOffice. Chọn Python bằng SWP_REPORT_PYTHON, JAR bằng PLANTUML_JAR khi cần, và LibreOffice bằng SWP_LIBREOFFICE trong cấu hình máy.

Mở `docs/bao-cao/demo-data.json` để lấy namespace, ngày/giờ, các tài khoản, ID lớp/buổi và thời hạn mở điểm danh. Mật khẩu demo lấy SEED_MOCK_PASSWORD; quản lý dùng thông tin đăng nhập hiện có. Các file báo cáo không xuất mật khẩu hoặc API key.

A tạo trực tiếp ở WF1. B/C là lịch sử chuẩn bị; A2 là đích chuyển cả khóa. FULL/OTHER/R/NEAR và các lớp đối chứng dành cho exception. Mã I được tạo trực tiếp ở WF2, không lấy mã của lần kiểm thử trước. Sau khi diễn tập làm đổi trạng thái, chạy lại lệnh để có một bộ mới theo ngày/giờ thực.

Lệnh `node scripts/verify-council-demo.mjs` chạy bốn flow và exception qua HTTP trên DB thử tách riêng rồi xóa DB thử; giữ nguyên dataset hiện hành. Bằng chứng ở `docs/kiem-thu/council-demo-preflight.json`.

Khi demo webhook lặp: `node scripts/replay-demo-webhook.mjs <MA_HOA_DON_I>` phát lại đúng payload và ID của hóa đơn demo đã xử lý, kiểm tra DUPLICATE và số Payment không tăng. `--twice` của công cụ cũ tạo hai giao dịch khác ID, phục vụ ca chuyển tiền hai lần. Phần thanh toán là mô phỏng callback; không tự chuyển tiền ngân hàng thật.
