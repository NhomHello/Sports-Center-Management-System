# Sprint 3 – Khôi: bàn giao để review

- Nhánh: `sprint-3/fe-khoi`.
- Nền: `main` tại `611aaee6b2bbb09e154bbddda06ebf3da1952053`, đã tích hợp BE Nhanh/Bảo.
- Tác giả commit: `KhoitdnSE196407 <longhuy0078@gmail.com>`.
- TaskSheet: chỉ chuyển các dòng có người làm Khôi sang `Review`; chưa tự đánh dấu đã được nhóm duyệt.

## Phạm vi

| Task | Kết quả / nơi review |
| --- | --- |
| S3-11, S3-13, S3-83 | Đổi giờ, huỷ từng buổi và đổi HLV từ ngày chọn trong chi tiết lớp; thông báo số hội viên ảnh hưởng, giữ lịch sử và hiển thị xung đột từ API. |
| S3-49 | Điểm danh từng buổi, chưa mặc định vắng; HLV có thể ghi Có mặt/Vắng mặt trong giờ học, hết buổi tự khóa; quản lý mở lại có lý do theo permission. |
| S3-50, S3-51 | `GET /attendance/me`: lọc ngày/lớp/trạng thái, phân trang, giới hạn chính chủ theo JWT; UI `/attendance` chỉ đọc. |
| S3-23 | Tạo yêu cầu hoàn cho PAID, giải thích tác động ngày gói, xác nhận chuyển trả bằng mã tham chiếu; có bảng tiếp tục xử lý yêu cầu đang chờ. Theo contract Nhanh, hoàn invoice và chuyển trả thực tế là hai bước. |
| S3-25, S3-27 | `/reports` theo permission `report.view`: doanh thu/hoàn/thực thu, payment, membership, lớp; chọn hội viên/gói theo tên nếu có quyền đọc danh mục; xuất CSV/XLSX/PDF với đúng bộ lọc đã áp dụng. |
| S3-55 | QR chuyển bù do server tính từ tổng payment đã nhận; dùng cùng mã invoice và hạn server trả, không hardcode 48 giờ. |
| S3-63 | Form báo đã chuyển có thời điểm, số tiền, ngân hàng, tham chiếu và ghi chú; chỉ mở phiếu, không tự PAID; giữ form khi lỗi mạng. |
| S3-68 | E2E SePay dùng API key test: sai mã/map, thiếu/chuyển bù/PAID/in, thừa/lặp/liên hệ/hoàn, claim/duyệt; các bước quản lý đối soát gọi API Nhanh, vì màn đối soát thuộc Khải. |
| S3-69, S3-70 | Bộ đếm bền vững theo tài khoản, email/SĐT dùng chung; khoá theo cấu hình, hết hạn cho thử lại, reset mở khoá, FE hiện lỗi và thời gian còn lại. Định danh chưa tồn tại cũng có phản hồi khoá cùng mẫu. |
| S3-74 | Xem trước booking khi khoá, xác nhận huỷ đăng ký tương lai; HLV có lớp mở bị chặn và có đường dẫn sang đổi HLV. |
| S3-85 | Xem trước buổi bảo trì/phòng thay thế từ API, chọn chuyển hoặc huỷ từng buổi và áp dụng cùng đợt. |
| UI-F1-01/02/03 | Đăng nhập trực tiếp mặc định vào tổng quan, giữ deep link được phép; widget theo permission; sidebar mở nhóm trang hiện tại, cuộn được, trang cá nhân ở avatar; bỏ nhãn lặp và phụ đề cố định. |
| UI-F1-12/13/14 | Tên tài khoản không vỡ dòng, lọc trạng thái, xác nhận đổi vai trò; cấu hình Tabs/suffix/thanh Lưu sticky/chọn tiền tệ; kiểm tra reset link trước form, gửi lại xác minh và lỗi đăng nhập trong form. |
| UI-F2-01/02/04/09/10/11/13 | Tuần 7 cột từ vùng nội dung 900px; gợi ý hội viên khi gõ và tab đăng ký hộ; roster tên người thực hiện/vai trò, chọn buổi, in; tag trạng thái chung; lọc phòng/HLV/bộ môn; tuần trống có lối sang lớp mở; ẩn tab cá nhân dư ở quản lý. |

## Chạy và kiểm tra

```bash
npm run dev -- --prepare-only
npm run lint
npm run build
npm test
npx playwright test tests/e2e/sprint3-khoi.spec.mjs tests/e2e/sprint3-khoi-ui.spec.mjs tests/e2e/local-login.spec.mjs tests/e2e/sprint1-regression.spec.mjs
```

- Migration mới: `20261014150000_khoi_login_lock`; không reset hoặc xoá DB.
- Seed thêm `LOGIN_MAX_FAILED_ATTEMPTS`, `LOGIN_LOCK_MINUTES` qua cấu hình shared.
- `npm test`: 169 test BE và 71 test FE pass.
- E2E: kết quả chi tiết trong báo cáo nghiệm thu và `playwright-report/index.html` sau khi chạy.
- Chạy unit/integration và E2E lần lượt: test Role cũ dọn theo tiền tố chung, không chạy đồng thời hai bộ trên cùng DB.
- QR dùng tài khoản nhận tiền cấu hình ở hệ thống. E2E tạm dùng số tài khoản giả rồi khôi phục; không gửi tiền thật, không cần ngrok.
- `window.print()` được kiểm tra bằng stub để xác nhận nút gọi in đúng; chưa kiểm tra hộp thoại in của hệ điều hành. Báo cáo PDF tải trực tiếp từ API đã được E2E kiểm tra.
- Build có cảnh báo chunk >500 kB từ bundle hiện tại; không chặn build.

## Báo cáo có ảnh

`docs/ban-giao/SWP391_NghiemThu_Sprint3_Khoi.docx` chứa ảnh nghiệm thu SePay ở 1366×900. Ảnh riêng và trace là artifact trong `test-results/`, không commit.
