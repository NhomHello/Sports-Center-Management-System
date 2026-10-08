# Bàn giao tối ưu UI/UX desktop — 08/10/2026

Nhánh: `sprint-2/fe-khoi`. Bản chạy local: <http://localhost:5173>.
Đây là lần tinh chỉnh tiếp theo của [bản nâng cấp UI/UX](ui-ux-refresh-2026-10-08.md),
tập trung vào lớp/lịch và xác thực trên desktop theo các ảnh phản hồi.

## Thay đổi và cách sử dụng

| Khu vực | Kết quả |
| --- | --- |
| Không gian lớp/lịch | Nội dung tối đa 1600px để tận dụng màn hình desktop rộng. Các trang khác giữ giới hạn hiện có. |
| Lịch tuần desktop | Khi vùng nội dung lớn hơn 1180px, lịch thành một bảng 7 cột có ngày/đường phân cách thẳng hàng. Vùng hẹp hơn hiển thị từng hàng ngày và các buổi cạnh nhau. Hôm nay được đánh dấu riêng. |
| Thẻ buổi học | Giữ giờ, tên lớp, trạng thái, phòng và HLV. Trong lịch tuần desktop, dùng **Chi tiết lớp** để mở thông tin đầy đủ và thao tác toàn lớp; không lặp lại nút huỷ/hạn huỷ hoặc roster trên mọi buổi. Chế độ ngày và mobile tiếp tục có thao tác trên thẻ. |
| Chi tiết từ lịch | Hiển thị **Buổi bạn đang xem** với thời gian/phòng/HLV lấy từ phản hồi chi tiết mới nhất. Hiển thị rõ đăng ký/huỷ áp dụng cho toàn bộ các buổi còn lại; giữ danh sách buổi và lịch sử thay đổi. |
| Điều hướng lịch | Gộp tiêu đề khoảng ngày, số buổi và điều khiển vào một thanh. Nhóm trước/ngày/sau/Hôm nay ở trái; ngày/tuần và hiện lịch huỷ ở phải, tự xuống dòng khi thiếu chỗ. |
| Số buổi trong ngày | Chỉ đếm các buổi thuộc ngày đang chọn, thay vì lấy tổng cả tuần. Tuần/ngày tiếp tục theo giờ Việt Nam. |
| Danh sách lớp trống | Phân biệt **Hiện chưa có lớp mở đăng ký** với **Không tìm thấy lớp phù hợp**. Trường hợp chưa mở đăng ký có hướng dẫn và nút **Xem lịch tập** khi tài khoản có permission xem lịch cá nhân. Không hiện phân trang khi tổng bằng 0. |
| Tìm kiếm/lọc | Nút **Xoá tìm kiếm và bộ lọc** đặt lại cả từ khóa đang hiển thị, điều kiện API và trang hiện tại; giữ phạm vi quản lý/hội viên đang chọn. Tách thanh tìm kiếm và state thành component/hook dùng chung. |
| Đăng nhập/đăng ký | Desktop chia hai cột 44/56; form tối đa 480px, input/nút 52px, chữ nhập 16px. Tiêu đề và khoảng cách cân đối hơn; nội dung giới thiệu có ba lợi ích dễ đọc. Form đăng ký thu gọn khoảng cách, vẫn cuộn được trên màn hình thấp. Mobile giữ một cột và điều khiển 48px. |

Permission, điều kiện đăng ký/huỷ, hạn huỷ và lý do từ chối tiếp tục lấy từ backend.
Không thay đổi API, migration hoặc nghiệp vụ đăng ký toàn lớp.

## Kiểm chứng

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Unit frontend | **60/60 đạt**; `npm run test -w @scms/fe`. |
| UI hồi quy | **30/30 đạt**; `npm run test:e2e`, desktop và mobile 320px. Bao gồm huỷ từ chi tiết, HLV xem roster, đăng ký/huỷ hộ có audit, quyền riêng tư, tranh chỗ cuối, membership hết hạn, lịch/thông báo cập nhật và hồi quy Sprint 1. |
| Hành vi bổ sung | U04 xác nhận tìm kiếm không có kết quả, không hiện phân trang và xoá lọc khôi phục ô nhập/dữ liệu. U05/U06 xác nhận hướng dẫn danh sách trống và lối tắt lịch đúng permission. X02 xác nhận ngày trống đếm `0 buổi học`. |
| Bố cục lớp/lịch | **25 lượt chụp/đo**, bốn vai trò hội viên/HLV/lễ tân/quản lý ở 1920, 1440, 1366 và 320px; thêm chi tiết lớp, trạng thái trống, tìm kiếm và danh mục. Không tràn ngang trang hoặc thẻ buổi, không lỗi JavaScript. Bảng 7 ngày cùng chiều cao/đường đầu ngày ở màn hình rộng. |
| Xác thực | Login/register ở 1366, 1440, 1920 và 320px: không tràn ngang/lỗi JavaScript, kiểm tra required field. Kiểm tra thêm 1366×768 và 1280×720: phần đầu form không bị cắt, nút gửi tới được bằng cuộn và Tab, không bị phần tử khác che. Form đăng ký trên màn hình thấp có cuộn dọc. |
| Chất lượng | Lint toàn workspace, format check, build FE và `git diff --check` đạt. Hook ESLint/Prettier/commitlint chạy khi commit. |
| Bản chạy local | FE HTTP 200; `GET /api/v1/health` trả `status: ok`, `database: up`. |

Hai trường hợp danh sách trống U05/U06 dùng phản hồi API giả lập để xác nhận UI
và permission; các luồng ghi dữ liệu/kiểm tra audit vẫn chạy với API và database thật.
Probe ảnh lớp/lịch dùng dữ liệu demo local sau khi fixture E2E đã được dọn.

Bằng chứng trên máy bàn giao nằm trong `.cache/ui-experience/` (Git ignore):

- `desktop-layout.json`, `desktop-*-schedule-{1920,1440,1366,320}.png`:
  số đo và ảnh lớp/lịch theo vai trò.
- `desktop-member-detail-1920.png`, `desktop-coach-detail-1920.png`,
  `desktop-member-open-1920.png`, `desktop-member-filtered-empty-1920.png`:
  chi tiết và các trạng thái danh sách.
- `desktop-auth-report.json`, `desktop-auth-{login,register}-*.png`,
  `desktop-auth-short-report.json`, `desktop-auth-short-*.png`: xác thực.
- `desktop-unit.log`, `desktop-e2e.log`, `desktop-lint.log`,
  `desktop-format.log`, `desktop-build.log`: log kiểm tra.

Ảnh/log không đi kèm khi clone nhánh. Có thể chạy lại kiểm thử UI bằng lệnh nêu trên.

## Commit và tự kiểm tra

- `e285349`: sửa số buổi của ngày đang chọn.
- `86693e5`: lịch tuần desktop, chi tiết từ buổi, danh sách trống và kiểm thử liên quan.
- `3e0ed76`: cân đối giao diện xác thực desktop.

Các commit lưu local trên `sprint-2/fe-khoi`; chưa push remote trong lần bàn giao này.
Ref `main` local và remote không thay đổi.

1. Mở bản local; dùng Ctrl+F5 nếu trình duyệt đang giữ giao diện cũ.
2. Hội viên vào **Lịch tập của tôi**, chọn **Chi tiết lớp** từ lịch tuần rồi kiểm tra
   hạn huỷ/xác nhận huỷ toàn lớp. Thử Ngày/Tuần và Hôm nay.
3. HLV vào **Lịch dạy**, mở chi tiết một lớp được phân công rồi **Danh sách học viên**.
4. Tại **Lớp đang mở**, thử tìm kiếm không có kết quả và xoá lọc. Nếu chưa mở đăng ký,
   dùng **Xem lịch tập** khi tài khoản có quyền.
5. Quản lý kiểm tra lịch trung tâm/quản lý lớp; lễ tân kiểm tra đăng ký và huỷ hộ.
6. Mở login/register ở 1366/1440/1920px và desktop thấp 1280×720; dùng Tab qua form.

Đối chiếu nghiệp vụ với [bàn giao Excel Sprint 2](sprint-2-fe-khoi-excel.md)
và [phạm vi FE Khôi](sprint-2-fe-khoi.md).
