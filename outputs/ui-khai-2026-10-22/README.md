# UI Sports Center — 22/10/2026

Nhánh: feature/khai-ui-theme-classes. Nền: khai / 31b4324.

## Thay đổi

- Sáng / Tối / Theo hệ thống; lưu lựa chọn, đồng bộ tab và thiết bị; áp dụng cả xác thực và popup.
- Thẻ lớp theo thứ tự thông tin thống nhất; tách số đã đăng ký và đang giữ chỗ; footer không bị thông báo đè.
- Thanh công cụ, số kết quả API, drawer và trạng thái tải/lỗi/rỗng được đồng bộ.
- Bảo lưu thành thẻ luôn mở, form và lịch sử chia hai cột trên desktop; danh mục có khoảng đệm cho ribbon.

## Giới hạn API được giữ nguyên

- Kỳ gói tiếp tục lấy từ /memberships/me/current.
- Backend khai chưa trả ngân sách bảo lưu: không hiển thị số mặc định giả.
- Không thêm hủy/đổi gói khi API tương ứng chưa có.
- Không đổi API, permission, giá hoặc quy tắc đăng ký/thanh toán. Công thức FE mới chỉ tính chiều dài thanh sức chứa để minh họa.

## Nguồn ảnh

- before-real-local: API thật / database scms trước chỉnh sửa; trang chưa hỗ trợ dark mode nên chỉ có ảnh sáng trước thay đổi.
- after-real-local: cùng database local để so sánh.
- after-demo-test: API thật với database test riêng, dữ liệu qua npm run db:demo.
- fixtures-only: phản hồi giả lập có ghi nhãn để kiểm tra tên dài/nhiều khung giờ/giữ chỗ; không phải nghiệm thu API.

## Ghi chú kiểm thử

Bộ kiểm thử review UI riêng (`ui-khai-*`, runner và helper liên quan) đã được xoá theo yêu cầu.
Ảnh và [verification.json](./verification.json) được giữ lại như hồ sơ tham chiếu của lần bàn giao
trước, không phải lệnh kiểm thử còn được duy trì trong nhánh hiện tại.

## Bổ sung sau góp ý mới

Xem [bàn giao UI bổ sung](./HANDOVER-refinement.md), nội dung gói hiện tại và kết quả kiểm thử mới trong nhóm refinement. Báo cáo verification.json phía trên là hồ sơ của lần trước.
