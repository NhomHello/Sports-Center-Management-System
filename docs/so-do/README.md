# Bộ sơ đồ chuẩn

Công cụ: **PlantUML + Graphviz**. Toàn bộ chữ trong các sơ đồ dùng **tiếng Anh**; phần thuyết minh báo cáo vẫn bằng tiếng Việt. Mỗi hình có nguồn `.puml` để mở bằng PlantUML hoặc chỉnh sửa trong IDE hỗ trợ PlantUML.

- `01-*.puml` đến `09-*.puml`: UML Activity/flowchart, có điểm bắt đầu/kết thúc, xử lý và rẽ nhánh chuẩn. Vai trò được ghi trong từng bước. Luồng dài được tách theo nghiệp vụ, không dùng dây nối A1/A2 tự vẽ.
- `state-*.puml`: UML state chart, dùng trạng thái enum trong code, transition có nhãn điều kiện, điểm khởi tạo/kết thúc và choice pseudostate khi khởi tạo có nhiều nhánh.
- `erd-*.puml`: ERD Information Engineering / Crow's Foot, có thực thể, PK/FK/UQ, quan hệ và lực lượng. Chú giải nêu phạm vi FK của từng miền; các tham chiếu ngoài phạm vi nằm trong bản vật lý đầy đủ.
- `usecase-*.puml`: Use Case UML; tác nhân đứng ngoài biên hệ thống, liên kết với use case bằng đường không có mũi tên.
- `conceptual.puml`: mô hình khái niệm của nghiệp vụ bán khóa học.
- [ERD vật lý đầy đủ](erd-vat-ly-day-du.pdf): bản vector toàn bộ schema để phóng to tra cứu, gồm các bảng còn giữ dữ liệu lịch sử.
- `kiem-tra-so-do.json`: phiên bản PlantUML/Graphviz, kiểm tra cú pháp, nguồn `.puml`, ngôn ngữ và số FK. File này không tuyên bố mọi đường trong poster schema lớn đều không giao nhau.

Nguồn ký pháp chính thức: [Information Engineering](https://plantuml.com/ie-diagram), [State](https://plantuml.com/state-diagram), [Activity](https://plantuml.com/activity-diagram-beta), [Use Case](https://plantuml.com/use-case-diagram).

Dựng tại máy cá nhân: cài Java và Graphviz, tải PlantUML JAR chính thức, đặt `PLANTUML_JAR` tới file đó rồi chạy `python3 scripts/reporting/build.py` trong môi trường Python có các thư viện của dự án. `SWP_LIBREOFFICE` dùng khi LibreOffice không nằm trên PATH. Việc dựng tài liệu không truy cập database hoặc gửi schema lên dịch vụ vẽ trực tuyến.

Xem [báo cáo](../bao-cao/SWP391_BaoCaoCuoiKy.pdf), mục Use Case và Phụ lục A, hoặc [ma trận UC-code](../yeu-cau/SWP391_DoiChieuUseCaseCode.xlsx).
