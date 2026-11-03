# Thay dữ liệu demo theo mô hình bán khóa học

Script: `core/be/prisma/seed/course-only/refresh.js`. Chạy từ thư mục gốc repo.

## Cách chạy

Chuẩn bị `.env` của BE: `DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
`SEED_MOCK_PASSWORD`. Database phải có tài khoản admin theo email cấu hình.
Áp dụng migration và sinh Prisma Client trước:

```bash
npm run db:deploy -w @scms/be
npm run db:generate
npm run db:refresh:courses
```

Lệnh cuối **chỉ đọc**, in tên database, ID admin được giữ và số dòng dự kiến xóa.
`--dry-run` cũng có cùng hành vi. Kiểm tra đúng database và lưu bản sao dữ liệu cần giữ.
Dừng BE và các worker đang ghi dữ liệu trước khi chạy lệnh thay dữ liệu:

```bash
npm run db:refresh:courses -- --yes
```

`npm run db:demo` là lệnh tắt có **xóa thật**, tương đương lệnh trên.
`npm run db:clean` chỉ xóa nghiệp vụ, không dựng dữ liệu mới.
Các lệnh này từ chối `NODE_ENV=production`; không dùng để chuyển dữ liệu khách hàng thật.

## Dữ liệu được giữ và được thay

Giữ tài khoản admin theo `SEED_ADMIN_EMAIL` (gồm mật khẩu), role, permission, phân quyền,
system settings (bao gồm SePay), khung giờ hoạt động, khóa đồng bộ lịch và lịch sử thay đổi
Role/SystemSetting. Số dư tín dụng admin trở về 0 vì lịch sử giao dịch được thay.
Bước chuẩn bị `seedBase` bổ sung cấu hình/quyền còn thiếu trước transaction nghiệp vụ.

Xóa các tài khoản khác và toàn bộ dữ liệu nghiệp vụ cũ, kể cả gói tập, membership,
hóa đơn, thanh toán, đối soát, hoàn tiền, lịch học và dữ liệu tập luyện cũ.
Đây là dựng lại bộ dữ liệu mẫu có liên kết mới, không phải chuyển đổi lịch sử mua gói thật
thành lịch sử mua khóa học. ID mới được trả trong trường `mapping`; không reset AUTO_INCREMENT,
tránh token hoặc đường dẫn cũ trỏ nhầm sang người dùng mới.

Đọc cấu trúc khóa ngoại từ database và đối chiếu Prisma trước khi xóa. Bảng lạ hoặc quan hệ
không xử lý được làm script dừng. Các liên kết vòng nullable được gỡ trong transaction,
các bảng còn lại xóa theo thứ tự phụ thuộc; không tắt kiểm tra FK.
Xóa, tạo mới, kiểm tra dữ liệu và ghi audit nằm trong **một transaction** dưới khóa lịch.
Nếu bất kỳ bước nào lỗi thì toàn bộ thay đổi nghiệp vụ rollback.

## Bộ dữ liệu mới

- 16 khóa, mỗi khóa 4 buổi: 12 khóa lịch sử, 2 khóa chờ/quá hạn tổng kết, 2 khóa tương lai.
- 44 đăng ký liên kết đúng 44 hóa đơn, 43 thanh toán; giá khóa được snapshot theo số buổi.
- Một khóa tương lai có 1 học viên đã thanh toán, 1 giữ chỗ chờ thanh toán, 1 người chờ FIFO.
- 154 ghi chú/đánh giá theo buổi và 14 bản tổng kết; không có gói tập hay membership mới.
- HLV `s4.coach@scms.test`; học viên `s4.member1@scms.test` đến `s4.member3@scms.test`.
  Mật khẩu lấy từ `SEED_MOCK_PASSWORD`. Admin dùng tài khoản cấu hình sẵn.

Dữ liệu lịch sử là giả lập, bao gồm log SePay đánh dấu demo; script không gọi ngân hàng,
không gửi SMTP. Giữ chỗ sẽ hết hạn theo settings khi worker chạy lại. Lịch tương lai được
kiểm tra với khung hoạt động/phòng/HLV hiện hành; cấu hình không phù hợp sẽ rollback.
Ngày mẫu tính theo múi giờ Việt Nam tại lúc chạy.

## Kiểm thử cách ly

```bash
npm run verify:course-refresh
```

Cần quyền tạo/xóa database. Trình kiểm thử tạo database tạm có tên riêng, chạy toàn bộ migration,
kiểm tra preview không ghi, xóa FK vòng/dữ liệu cũ, rollback khi lỗi giữa chừng, giữ admin/cấu hình,
liên kết dữ liệu mới, ID không tái sử dụng, chặn production và chạy lặp lại; sau đó xóa database tạm.
Không chạy `--yes` trên database đang làm việc để kiểm thử.
