# Tài liệu báo cáo cuối kỳ

Hệ thống quản lý trung tâm thể thao · SWP391 · Nhóm Nhanh, Bảo, Khôi, Khải.

Bộ tài liệu được viết mới theo mã nguồn hiện tại, phục vụ đúng bốn vai trò: **Hội viên, Huấn luyện viên, Quản lí trung tâm, Lễ tân**. Sản phẩm kinh doanh là khóa học theo lịch buổi.

| Phần | Tài liệu |
| --- | --- |
| Báo cáo tổng hợp | [Word](bao-cao/SWP391_BaoCaoCuoiKy.docx) · [PDF](bao-cao/SWP391_BaoCaoCuoiKy.pdf) |
| Thuyết trình | [PowerPoint 5 slide](bao-cao/SWP391_ThuyetTrinh.pptx) · [PDF](bao-cao/SWP391_ThuyetTrinh.pdf) |
| Demo | [Kịch bản 30 phút](bao-cao/SWP391_KichBanDemo.docx) · [Lời thuyết trình 4 người](bao-cao/SWP391_BaiThuyetTrinh4Nguoi.docx) · [Bộ dữ liệu thực theo ngày](bao-cao/SWP391_DemoData.xlsx) |
| Góp ý giảng viên 06/11 | [Bổ sung nghiệp vụ và hội đồng](bao-cao/SWP391_BoSungTheoGopYGiangVien.docx) · [Kết quả kiểm thử](kiem-thu/ket-qua-bo-sung-2026-11-06.json) · [Kiểm tra SePay](huong-dan/sepay-webhook.md) |
| Chức năng | Sơ đồ UML và đặc tả đầy đủ trong báo cáo; [bản tra cứu Use Case](yeu-cau/01_Use_Case_Tong_Hop.docx) · [Đối chiếu UC–code](yeu-cau/SWP391_DoiChieuUseCaseCode.xlsx) |
| Luồng và trạng thái | [Đặc tả sơ đồ](yeu-cau/02_Flow_Va_StateChart.docx) · [Nguồn và ảnh sơ đồ](so-do/) |
| Dữ liệu | [Conceptual model và ERD](yeu-cau/03_Mo_Hinh_Du_Lieu.docx) · [Từ điển dữ liệu](yeu-cau/SWP391_TuDienDuLieu.xlsx) · [ERD vật lý đầy đủ](so-do/erd-vat-ly-day-du.pdf) |
| Business Rules | [Func / Rule](yeu-cau/07_Business_Rules.docx) |
| Sprint 4 | [Hồ sơ, tổng kết, đánh giá, báo cáo](yeu-cau/08_Sprint4_UseCases_BusinessRules.docx) |
| Sprint 1–4 | [Task Sprint 1](ke-hoach/SWP391_TaskSheet_Sprint1.xlsx) · [Sprint 2](ke-hoach/SWP391_TaskSheet_Sprint2.xlsx) · [Sprint 3](ke-hoach/SWP391_TaskSheet_Sprint3.xlsx) · [Sprint 4](ke-hoach/SWP391_TaskSheet_Sprint4.xlsx) |
| Phân công | [Phân chia UC](ke-hoach/SWP391_UCP_Sprint_Role_Split.xlsx) · [Đối chiếu task và Git](ke-hoach/SWP391_DoiChieuTaskGit.xlsx) |
| Kiểm thử | [Test case](kiem-thu/SWP391_TestCase.xlsx) · [Quy ước ghi kết quả](huong-dan/viet-test-case.md) |
| Chạy local | [Khởi động](huong-dan/onboarding.md) · [Dữ liệu demo](huong-dan/refresh-course-data.md) |
| Kỹ thuật | [Cấu trúc](huong-dan/cau-truc-du-an.md) · [Phân quyền](huong-dan/rbac-dong.md) · [API](huong-dan/api-convention.md) |

Sơ đồ được dựng bằng **PlantUML + Graphviz**, có nguồn `.puml` và bản SVG/PNG. Toàn bộ chữ bên trong sơ đồ dùng tiếng Anh: UML Use Case/Activity/State và ERD Information Engineering (Crow's Foot). Báo cáo chọn trang ngang hoặc dọc theo tỷ lệ hình. Các sơ đồ miền tập trung vào những FK được nêu trong chú giải; ERD vật lý đầy đủ giữ tất cả FK trong schema.


Task sheet giữ ID và thông tin phân công/ngày/trạng thái từ task đã lưu trong Git. Nội dung hiện hành đã đối chiếu lại theo khóa học; trạng thái nguồn không chứng nhận rằng mọi thay đổi sau sprint đã được nghiệm thu lại. Công việc không có quy tắc nghiệp vụ riêng để trống BR.

`kiem-tra-tai-lieu.json` ghi kết quả kiểm tra cấu trúc, nguồn tham chiếu và các artifact. Nó không phải kết quả chạy test ứng dụng. Bộ sinh ở `scripts/reporting/build.py`; không sử dụng hoặc tái tạo thư mục `outputs/bao-cao-cuoi-ky`.
