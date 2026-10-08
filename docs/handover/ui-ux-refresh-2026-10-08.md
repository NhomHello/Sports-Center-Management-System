# Bàn giao nâng cấp UI/UX — 08/10/2026

Nhánh: `sprint-2/fe-khoi`. Phạm vi: giao diện lớp/lịch, đăng ký hộ, tổng quan,
đăng nhập/đăng ký và các ô tìm kiếm tương tự. Bản chạy local: <http://localhost:5173>.

## Thay đổi

| Khu vực | Hành vi sau nâng cấp |
| --- | --- |
| Ô tìm kiếm | Dùng `SearchInput` chung ở lớp, hội viên, tài khoản, danh mục và hoá đơn. Wrapper và nút tìm kiếm cùng cao 44px; input con không bị cộng chiều cao. Giữ Enter, xoá từ khoá và các callback hiện có. |
| Form/nhận diện | Điều khiển 44px, input xác thực 48px; bo góc điều khiển 10px, thẻ 16px. Chữ phụ và placeholder dễ đọc hơn; focus bàn phím rõ. Đồng nhất tên Sports Center. |
| Lịch | Nội dung rộng hơn 1180px hiển thị 7 cột; vùng hẹp chuyển thành các hàng ngày; mobile xếp thẻ theo chiều dọc. Ngày trống gọn, đánh dấu hôm nay, giờ dạng HH:mm, thông tin phòng/HLV và trạng thái dễ quét. |
| Điều hướng lịch | Ngày DD/MM/YYYY, nút Hôm nay, trước/sau, ngày/tuần và hiện lịch huỷ. Giữ tính tuần/ngày theo giờ Việt Nam; nút có tên truy cập rõ, chiều cao thao tác tối thiểu 44px. |
| Lớp/quản lý | Thẻ thống nhất bộ môn, HLV, phòng, chỗ còn lại và hạn đăng ký. Bộ lọc có nhãn riêng, nút xoá bộ lọc và bố cục tự xuống dòng. Tên dài không làm tràn màn hình. |
| Đăng ký/huỷ hộ | Luồng chọn hội viên có hướng dẫn; lớp đã đăng ký và lớp mới dùng cùng thẻ lớp. Email/tên dài vẫn vừa màn hình 320px. Xác nhận huỷ nói rõ áp dụng cho các buổi còn lại của toàn lớp. |
| Tổng quan | Lối tắt từ route registry theo permission, ưu tiên lớp/lịch. Tóm tắt buổi còn lại trong tuần và thông báo chưa đọc từ API thật; có loading, empty, error/retry. Quyền quản lý rộng chọn lịch trung tâm, quyền HLV chọn lịch được phân công, hội viên chọn lịch riêng. |
| Xác thực | Hai cột gọn trên desktop, bố cục một cột trên mobile. Nhãn dễ đọc, placeholder hữu ích và autocomplete phù hợp đăng nhập/đăng ký. |
| Hoá đơn | Thanh chọn phạm vi, tìm kiếm, trạng thái, xoá lọc và làm mới tự xuống dòng; mobile xếp dọc, không chồng lên nhau. |

Quyền thao tác và hạn huỷ tiếp tục lấy từ backend. Các API, transaction, dữ liệu
đăng ký toàn lớp, migration và phân quyền backend được giữ nguyên. Chi tiết/roster
tiếp tục dùng luồng hiện có và nhận theme dùng chung.

## Kiểm chứng

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Unit frontend | **60/60 đạt**, gồm 5 ca mới cho phạm vi API tổng quan, quyền OR của lối tắt, buổi đang diễn ra, đăng ký huỷ và bảo toàn dữ liệu cache. `npm run test -w @scms/fe`. |
| UI hồi quy | **26/26 đạt**: desktop và mobile 320px; đăng nhập hai local origin, Sprint 1, tạo/sửa/huỷ lớp và tài nguyên, đăng ký/huỷ, đăng ký hộ có audit, membership hết hạn, tranh chỗ cuối, lịch cập nhật, thông báo và roster ngoài phân công. `npm run test:e2e`. |
| Bố cục | 56 lượt chụp/đo: hội viên, HLV, lễ tân, quản lý; rộng 320, 390, 768, 1366, 1920px. Không tràn ngang trang hoặc lỗi JavaScript. Xác nhận lịch 7 cột ở 1920px, hàng ngày ở các vùng nội dung hẹp. |
| Tìm kiếm | Đo wrapper/input/nút đều 44px và cùng trục. Hoá đơn kiểm tra riêng 5 độ rộng: không chồng điều khiển; Enter gọi API, xoá từ khoá khôi phục dữ liệu, chuyển phạm vi riêng trả HTTP 200. |
| Chất lượng | `npm run lint`, `npm run format:check`, `npm run build` và `git diff --check` đạt. |
| Local | FE trả HTTP 200; `GET /api/v1/health` trả `status: ok`, `database: up`. |

Ảnh và log kiểm tra local nằm ở `.cache/ui-experience/` (được Git ignore):

- `final-layout.json`, `payments-layout.json`: số đo và lỗi trình duyệt.
- `final-member-schedule-1920.png`, `final-member-schedule-1366.png`,
  `final-member-schedule-320.png`: lịch tuần desktop/mobile.
- `final-member-dashboard-1366.png`, `final-login-1366.png`,
  `final-register-320.png`, `final-payments-320.png`: tổng quan, xác thực và hoá đơn.
- `unit.log`, `e2e-final.log`, `lint-final.log`, `format-final.log`, `build-final.log`.

Các ảnh/log này là bằng chứng trên máy bàn giao, không đi kèm khi clone nhánh.
Kiểm thử UI tự tạo fixture và dọn dữ liệu của nó; các tài khoản/dữ liệu demo đang
chạy local được giữ lại.

Code được lưu bằng các commit local `ea16e2a` (control/tìm kiếm), `a884854`
(lớp/lịch), `3b0e851` (xác thực/tổng quan). Chưa push remote; các ref `main`
local và remote không thay đổi trong lần bàn giao này.

## Tự kiểm tra giao diện

1. Mở bản local, đăng nhập từng vai trò; mở Tổng quan để kiểm tra lối tắt và dữ liệu đúng phạm vi.
2. Vào Lớp học và lịch tập; thử tìm kiếm, chi tiết, ngày/tuần, Hôm nay và hiện lịch đã huỷ.
3. Lễ tân chọn hội viên rồi thử đăng ký/huỷ hộ; HLV mở roster từ lớp được phân công.
4. Quản lý kiểm tra bộ lọc, form lớp và danh mục. Thu viewport xuống 320px để kiểm tra nút/form/modal.
5. Mở Hoá đơn; tìm kiếm bằng Enter, xoá từ khoá, đổi trạng thái/phạm vi và làm mới.

Đối chiếu nghiệp vụ/UC với [bàn giao Excel Sprint 2](sprint-2-fe-khoi-excel.md)
và [phạm vi FE Khôi](sprint-2-fe-khoi.md).
