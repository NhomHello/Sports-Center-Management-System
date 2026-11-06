# Kiểm tra thanh toán SePay không hoàn tất

Chạy từ thư mục gốc: `node scripts/check-sepay.mjs`. Lệnh chỉ đọc và báo máy chủ có truy cập được không, cấu hình đã có hay chưa và thời điểm log webhook mới nhất. Không in API key hoặc tài khoản nhận tiền.

Callback của ứng dụng là `POST <public-backend-origin><API_PREFIX>/payments/sepay/webhook`, mặc định phần đường dẫn `/api/v1/payments/sepay/webhook`. QR tạo nội dung chuyển khoản; QR không tự tạo kết nối webhook từ SePay về backend. URL frontend, localhost hoặc URL chỉ tạo ảnh QR không thay thế URL callback công khai.

Trong tài khoản SePay cần đối chiếu tài khoản ngân hàng đang theo dõi với tài khoản trong QR, webhook đang bật, URL công khai hiện hành và phương thức xác thực API Key. Header mà backend nhận là `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`. Không dán giá trị khóa vào tài liệu/Git. Sau khi đổi cấu hình môi trường, khởi động lại BE.

Đối chiếu một lần chuyển khoản thật theo thời gian và mã hóa đơn:

1. Có giao dịch trong ngân hàng/SePay nhưng không có lịch sử gửi callback: kiểm tra liên kết tài khoản và cấu hình webhook.
2. Có lịch sử gửi nhưng không vào BE: kiểm tra URL, tunnel/reverse proxy và tiến trình BE. HTTP 404 thường cần kiểm tra tiền tố/đường dẫn; 401 cần đối chiếu xác thực; 400 cần đọc lỗi payload; 5xx cần xem lỗi backend và retry. Không chỉ dựa vào ảnh QR.
3. Callback trả HTTP 200 với `success: true`: xem trạng thái log. PROCESSED là đã áp dụng, NEEDS_REVIEW cần mở đối soát; DUPLICATE không cộng tiền lần nữa. Không dùng log thành công gửi HTTP để suy ra mọi hóa đơn đều PAID.
4. Đúng mã, đúng tổng tiền, còn hạn và chỗ/lịch hợp lệ mới PAID/BOOKED. Thiếu/thừa, sai mã, nhiều mã, trễ hoặc mất giữ chỗ phải xử lý đối soát. Giao dịch chênh lệch đổi khóa còn cần quyền nguồn và chỗ đích hợp lệ.

`SEPAY_API_TOKEN` phục vụ đồng bộ REST, khác `SEPAY_WEBHOOK_API_KEY`; thiếu token đồng bộ không tự chứng minh webhook hỏng. `npm run demo:webhook -- <CODE> <TOTAL>` là công cụ mô phỏng, không phải chứng cứ kết nối ngân hàng thật. Không đánh dấu hóa đơn thật thành PAID bằng SQL để xử lý lỗi.

Tài liệu giao thức chính thức: [Tích hợp webhook](https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook), [Xác thực webhook](https://developer.sepay.vn/en/sepay-webhooks/xac-thuc). SePay gửi `transactionDate` theo giờ Việt Nam; backend đọc timestamp này khi xét tiền về đúng hạn và chống gửi lặp theo ID giao dịch.
