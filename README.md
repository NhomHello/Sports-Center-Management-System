# Sports Center Management System

SWP391 FA26 · Đề tài 4 · Nhóm Nhanh, Bảo, Khôi, Khải.

Hệ thống quản lý trung tâm thể thao kinh doanh **khóa học theo lịch buổi**, phục vụ **Hội viên, Huấn luyện viên, Quản lí trung tâm và Lễ tân**. Phạm vi gồm tài khoản/hội viên, tài nguyên và lịch học, đăng ký/giữ chỗ, thanh toán SePay hoặc tiền mặt, đối soát/hoàn tiền, điểm danh/nhận xét, hồ sơ, tổng kết/đánh giá và báo cáo.

## Chạy local

Yêu cầu Node.js từ 22, npm từ 10 và Docker có Compose v2. Từ thư mục dự án:

```bash
npm run dev
```

Script chuẩn bị môi trường và chạy backend/frontend. Hướng dẫn từng bước, cấu hình và dữ liệu demo ở [hướng dẫn khởi động](docs/huong-dan/onboarding.md) và [dữ liệu khóa học](docs/huong-dan/refresh-course-data.md). Mật khẩu và khóa tích hợp lấy từ cấu hình trên máy, không lưu trong tài liệu.

## Tài liệu hiện hành

- [Mục lục tài liệu](docs/README.md)
- [Báo cáo cuối kỳ Word](docs/bao-cao/SWP391_BaoCaoCuoiKy.docx) · [PDF](docs/bao-cao/SWP391_BaoCaoCuoiKy.pdf)
- [Slide PowerPoint](docs/bao-cao/SWP391_ThuyetTrinh.pptx) · [Kịch bản demo](docs/bao-cao/SWP391_KichBanDemo.docx)
- [Đặc tả use case](docs/yeu-cau/01_Use_Case_Tong_Hop.docx) · [Business Rules](docs/yeu-cau/07_Business_Rules.docx)
- [Task Sprint 1–4 và đối chiếu Git](docs/ke-hoach/)
- [Test case](docs/kiem-thu/SWP391_TestCase.xlsx)

## Cấu trúc và công nghệ

| Phần | Nội dung |
| --- | --- |
| `core/fe` | React 19, Vite 8, Ant Design 6, Router, Query, Axios, Zustand |
| `core/be` | Node.js, Express 5, Zod 4, JWT, Prisma 7, MySQL |
| `core/shared` | Permission, cấu hình và hằng số dùng chung |
| `tests/e2e` | Playwright |
| `docs` | Bộ tài liệu hiện hành |
| `scripts/reporting` | Nguồn sinh tài liệu từ đặc tả đã đối chiếu và schema |

Xem [cấu trúc](docs/huong-dan/cau-truc-du-an.md), [phân quyền](docs/huong-dan/rbac-dong.md), [API](docs/huong-dan/api-convention.md) và [quy ước kiểm thử](docs/huong-dan/viet-test-case.md).

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Các lệnh kiểm thử ứng dụng có yêu cầu môi trường riêng, nhất là MySQL và browser Playwright. Kết quả kiểm tra tài liệu không thay thế kết quả chạy các lệnh này.

## Dựng lại tài liệu

Cài các thư viện trong `scripts/reporting/requirements.txt` vào môi trường Python riêng, LibreOffice có Writer/Impress, Java và Graphviz. Dùng PlantUML JAR chính thức để dựng UML/ERD từ nguồn `.puml`; chữ trong sơ đồ là tiếng Anh. Chạy:

```bash
PLANTUML_JAR=/path/to/plantuml.jar python3 scripts/reporting/build.py
```

Nếu LibreOffice nằm ngoài đường dẫn mặc định, đặt `SWP_LIBREOFFICE` tới executable tương ứng. Bộ sinh chỉ đọc nguồn/Git và ghi vào `docs`; không truy cập DB hoặc đọc `.env`. Thông tin phân công nguồn được ghim tại commit trong `new_plan.py`, còn timeline đọc lịch sử Git hiện tại.

Dữ liệu gói tự tập cũ được giữ trong DB để bảo toàn tham chiếu; hệ thống không còn luồng bán/gia hạn/bảo lưu gói. Tài liệu bán hàng dùng khóa học. AI/kế hoạch tập luyện bằng AI không thuộc phạm vi hiện hành.
