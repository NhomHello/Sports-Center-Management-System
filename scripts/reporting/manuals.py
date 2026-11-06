"""Current repository guides; no imported text from removed documentation."""
import re
from pathlib import Path
from catalog import ROLES, SCOPE

ROOT=Path(__file__).resolve().parents[2]


def write(path,text):
    dest=ROOT/path;dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(text.strip()+'\n')


from api_inventory import api_inventory


def build():
    write('docs/README.md','''# Tài liệu báo cáo cuối kỳ

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
''')
    write('docs/so-do/README.md',"""# Bộ sơ đồ chuẩn

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
""")
    write('docs/huong-dan/onboarding.md','''# Chạy hệ thống tại máy cá nhân

Yêu cầu: Node.js từ 22, npm từ 10, Git và Docker có Compose v2. Cấu hình engine nằm trong `package.json`; Docker dùng cho MySQL trong `docker-compose.yml` của dự án.

Từ thư mục chứa `package.json`:

```bash
npm run dev
```

`scripts/dev.mjs` và `scripts/setup.mjs` chuẩn bị dependency, file môi trường từ mẫu, MySQL, Prisma/migration và seed trước khi chạy frontend/backend. Mặc định frontend ở cổng 5173 và backend ở cổng 3000; cấu hình thực tế có thể đổi bằng môi trường. Dùng `npm run dev -- --prepare-only` nếu chỉ cần chuẩn bị.

Quy trình từng bước khi môi trường đã được cấu hình:

```bash
npm install
npm run db:up
npm run db:deploy -w @scms/be
npm run db:generate
npm run db:seed
npm run dev:be
```

Mở terminal khác để chạy `npm run dev:fe`. Không đưa `.env`, mật khẩu hoặc khóa SePay lên Git/tài liệu. Các giá trị bắt buộc được mô tả trong `.env.example` và `core/be/src/config/env.js`.

Bốn vai trò mặc định nằm ở `core/be/prisma/seed/roles.seed.js`. Tài khoản Quản lí trung tâm do seed tạo theo `SEED_ADMIN_EMAIL`; đây là tên biến cấu hình, không phải vai trò thứ năm. Tài khoản mẫu khóa học theo seed hiện tại; mật khẩu lấy từ cấu hình trên máy.

Nếu trình duyệt không kết nối được nhưng API health hoạt động, kiểm tra `CORS_ORIGINS` có đúng origin đang mở, gồm `localhost` hoặc `127.0.0.1` tương ứng. Kiểm tra database bằng health theo cấu hình `API_PREFIX`/`HEALTH_PATH`, không suy ra CORS đã đúng chỉ vì health trả thành công.

Nguồn: `package.json`, `scripts/dev.mjs`, `scripts/setup.mjs`, `core/be/package.json`, `core/be/src/app.js` và `core/be/src/config/env.js`.
''')
    write('docs/huong-dan/cau-truc-du-an.md','''# Cấu trúc và kiến trúc

| Thư mục | Trách nhiệm |
| --- | --- |
| `core/shared/src` | Permission registry, khóa cấu hình và hằng số dùng chung |
| `core/be/src` | Express API, middleware, module nghiệp vụ và tác vụ nền |
| `core/be/prisma` | Schema, migration và seed |
| `core/fe/src` | Trang React, component, service gọi API, hook và store |
| `tests/e2e` | Kiểm thử luồng trình duyệt bằng Playwright |
| `docs` | Báo cáo, đặc tả, kế hoạch, kiểm thử và hướng dẫn hiện hành |
| `scripts/reporting` | Nguồn sinh bộ tài liệu hiện hành |

Luồng API: router → xác thực → kiểm tra quyền → validation → controller → service → Prisma/MySQL. Mã cụ thể có thể thêm kiểm tra phạm vi trong service; router dùng `authorize` với ít nhất một quyền trong danh sách.

Backend tổ chức theo module: tài khoản, hội viên, khóa/lịch, course-order, payment, reconciliation/refund, cancellation/purchase-change, attendance/session-feedback, profile, course-summary, report. Frontend gọi các API này; không tự quyết định giá hoặc chuyển trạng thái thanh toán.

Worker khởi tạo trong vòng đời server để hết hạn hóa đơn, xử lý hàng chờ, kết thúc/tổng kết khóa và thông báo/email. Tài liệu không giả định có broker hoặc microservice độc lập. Nguồn: `core/be/src/server.js`, `routes.js`, từng module và `core/fe/package.json`.
''')
    role_rows='\n'.join(f'| {r[0]} | `{r[1]}` | {r[2]} |' for r in ROLES)
    write('docs/huong-dan/rbac-dong.md','''# Vai trò và quyền

| Vai trò của đề tài | Mã seed | Trách nhiệm |
| --- | --- | --- |
'''+role_rows+'''

Quyền là điều kiện cho một thao tác, không phải tên vai trò. `RolePermission` liên kết vai trò và permission; `User.roleId` là vai trò hiện tại. Ma trận mặc định nằm ở `core/be/prisma/seed/roles.seed.js`. Quản lí trung tâm có thể cấu hình ma trận; API không quyết định quyền chỉ bằng nhãn menu.

`authenticate` kiểm tra token, trạng thái tài khoản và tokenVersion. `authorize(...codes)` đọc quyền từ cơ sở dữ liệu qua service/cache và cho qua khi có ít nhất một mã phù hợp. Service tiếp tục kiểm tra chủ sở hữu, lớp/buổi được giao và thời gian truy cập.

Một số phạm vi quan trọng:

- Hội viên chỉ đọc hóa đơn, kết quả và nhận xét của chính mình.
- Huấn luyện viên điểm danh/nhận xét buổi phụ trách; hồ sơ học viên còn phụ thuộc buổi thực dạy và đồng ý chia sẻ.
- Lễ tân có quyền tạo/đọc hội viên, đăng ký hộ, thu tiền mặt và check-in theo ma trận mặc định. Quyền hủy hộ không tự cấp quyền xác nhận hoàn tiền.
- Quản lí trung tâm xử lý đối soát/hoàn, báo cáo và mở lại tổng kết theo quyền tương ứng.

Các API trả lỗi khi thiếu token, thiếu quyền hoặc nằm ngoài phạm vi. Không coi việc ẩn nút trên frontend là biện pháp phân quyền đầy đủ.

Nguồn: `common/middlewares/auth.middleware.js`, `authorize.middleware.js`, `permission/permission.service.js`, `profile/coach-member-scope.service.js`, `common/utils/session-access.js`.
''')
    write('docs/huong-dan/api-convention.md','''# Quy ước API

Prefix lấy từ `API_PREFIX`; router tổng ở `core/be/src/routes.js`. Controller dùng `sendSuccess`, `sendCreated` hoặc `sendNoContent`.

Thành công thông thường:

```json
{"success": true, "message": "OK", "data": {}, "meta": {}}
```

`meta` chỉ xuất hiện khi có dữ liệu phân trang/metadata. HTTP 201 dùng khi tạo mới, 204 không có body. Lỗi được xử lý qua middleware lỗi, có mã và thông báo; validation không cho client tự quyết định các trường số tiền/quyền học do server tính.

Các nhóm API được liệt kê trong [danh mục trích từ router](api-hien-hanh.md). Danh mục ghi điều kiện quyền nhìn thấy tại từng route; một số quyền nằm ở middleware chung và phạm vi nằm trong service, nên phải đọc cả nguồn trước khi sửa quyền.

Phân biệt các luồng:

- Mua khóa có học phí dùng `POST /classes/:id/orders`, tạo hóa đơn và PENDING_PAYMENT.
- API enrollment trực tiếp chỉ phục vụ lớp giá 0; không dùng để bỏ qua thanh toán khóa có học phí.
- Hủy/đổi khóa đã trả tiền dùng `/enrollments/:id/cancel-preview`, `/cancel`, `/change-preview`, `/change`.
- Khai báo đã chuyển chỉ tạo phiếu cần kiểm tra. Webhook nhận tiền và đối soát có điều kiện riêng.
- Các đường dẫn `/memberships` và `/membership-plans` được router nghỉ dùng chặn bằng HTTP 410 sau xác thực; các hàm cũ còn trong code không có nghĩa luồng bán gói vẫn mở.
- API số dư còn để xử lý dữ liệu tài chính; hủy/đổi khóa không cho chọn CREDIT trong validation hiện hành.

Nguồn: `core/be/src/common/utils/api-response.js`, `common/middlewares/error.middleware.js`, `modules/course-order`, `modules/cancellation`, `modules/purchase-change`, `modules/membership/retired-membership.routes.js`.
''')
    inventory=api_inventory()
    rows='\n'.join(f'| {method} | `{path}` | {perms} | `{source}` |' for method,path,perms,source in inventory)
    write('docs/huong-dan/api-hien-hanh.md','''# Danh mục endpoint từ router

Đường dẫn dưới đây chưa thêm `API_PREFIX`. Quyền ở cột này được trích từ khối route; middleware chung và kiểm tra chủ sở hữu/phạm vi phải đọc ở file nguồn. Không bao gồm đường dẫn bán/gia hạn/bảo lưu gói đã bị router nghỉ dùng chặn. Các endpoint số dư là khả năng hỗ trợ dữ liệu tài chính còn trong mã, không phải lựa chọn hoàn hủy khóa.

| Method | Đường dẫn | Quyền tại route | Nguồn |
| --- | --- | --- | --- |
'''+rows)
    write('docs/huong-dan/refresh-course-data.md','''# Dữ liệu khóa học phục vụ demo

Từ thư mục gốc dự án, xem trước:

```bash
npm run db:refresh:courses
```

Chỉ khi đã kiểm tra cấu hình đang trỏ tới cơ sở dữ liệu demo và chấp nhận thay dữ liệu nghiệp vụ:

```bash
npm run db:refresh:courses -- --yes
```

`npm run db:demo` là lệnh gọi chế độ thực hiện ngay. Script có bước kiểm tra và transaction; không chạy giữa buổi báo cáo. Nó giữ các dữ liệu nền/tài khoản quản lý theo logic trong seed; không dùng số lượng mẫu trong tài liệu làm điều kiện đúng nếu seed đã được sửa.

Nguồn kiểm tra: `core/be/prisma/seed/course-only/refresh.js`, các file cùng thư mục, `core/be/package.json`. Seed mẫu có khóa/học viên phục vụ thanh toán, điểm danh và tổng kết. Sau khi chạy cần chọn đúng khóa đang mở, không trùng lịch và đúng hạn theo thời gian máy hiện tại.

Tạo dữ liệu demo không chứng minh đã kiểm thử ngân hàng hoặc gửi email thật. Không đưa mật khẩu, token hoặc nội dung `.env` vào báo cáo.
''')
    write('docs/huong-dan/viet-test-case.md','''# Ghi nhận kiểm thử và nghiệm thu

`SWP391_TestCase.xlsx` là danh mục tình huống đối chiếu chức năng. Kết quả thực chạy bổ sung ngày 06/11 nằm trong `docs/kiem-thu/ket-qua-bo-sung-2026-11-06.json` cùng các log riêng. Mỗi ca gồm use case, điều kiện/tình huống, kết quả mong đợi và file test liên quan. Trạng thái danh mục phản ánh việc đối chiếu từng ca, tách với kết quả chạy toàn bộ BE/FE. Các ca bổ sung TC-21–24 chỉ được ghi Passed khi bằng chứng chạy và hash mã nguồn còn khớp; các ca khác chưa được nghiệm thu riêng theo danh mục. Sinh Word/PDF không tự tạo kết quả Passed.

Các lệnh có trong dự án:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Test backend cần MySQL và môi trường kiểm thử thích hợp. Playwright cần browser được cài và cấu hình trong `playwright.config.mjs`; xem file thực tế trước khi đổi cổng/DB. Chỉ chạy kiểm thử làm thay dữ liệu trên cơ sở dữ liệu thử nghiệm.

Khi ghi kết quả, lưu commit, ngày giờ, phiên bản môi trường, lệnh và exit code/log; phân biệt BE, FE và từng file E2E. Giao dịch mô phỏng không được mô tả là đã chuyển khoản/hoàn tiền thật. Một file test có tên phù hợp chưa tự chứng minh mọi ngoại lệ của use case đã có assertion.

Các nhóm cần kiểm tra: mua giữa khóa, tranh chỗ/bấm lặp, FIFO, chuyển thiếu/thừa/lặp/trễ, thu quầy sát hạn, hủy và mã hoàn, xin nghỉ/điểm danh/nhận xét, phạm vi hồ sơ, tổng kết và báo cáo.
''')
    write('docs/huong-dan/git-workflow.md','''# Đối chiếu công việc và Git

Task được giao, tác giả commit và trạng thái nghiệm thu là ba dữ liệu khác nhau. Task sheet ghi ID/UC/người/nhánh/ngày/trạng thái nguồn; workbook đối chiếu ghi riêng author date và committer date.

Khi thực hiện một task, tạo nhánh theo quy ước nhóm đang dùng, commit thay đổi thực tế và ghi ID task trong message nếu phù hợp. Trước khi yêu cầu review, kiểm tra diff và chạy kiểm tra liên quan. Không sửa lịch sử tác giả hoặc tạo commit giả để làm đẹp timeline.

Khi review, mở commit/diff, file triển khai và kết quả kiểm thử. Commit có ID chỉ chứng minh message nhắc task; commit chạm file chỉ chứng minh file đã thay đổi. Không tự đánh dấu Done vì đã merge và không dùng số commit làm tỷ lệ đóng góp.

`docs/ke-hoach/SWP391_DoiChieuTaskGit.xlsx` được tạo từ task sheet nguồn trong Git `10e050b` và lịch sử Git HEAD; các task đã loại khỏi phạm vi kinh doanh hiện hành được ghi rõ trong bảng phân chia UC, không tính thành chức năng đang bán.
''')
    write('docs/huong-dan/quy-tac-code.md','''# Hướng dẫn thay đổi mã nguồn

Đọc quy ước gốc trong `CLAUDE.md`, cấu hình ESLint và các module lân cận trước khi sửa. Giữ controller gọn, nghiệp vụ trong service, validation tại đầu vào và hằng số dùng chung trong `core/shared` khi cần cho cả backend/frontend.

Không dùng nhãn vai trò để bỏ qua middleware quyền; không nhận số tiền, trạng thái PAID/BOOKED hoặc ID chủ sở hữu từ client như dữ liệu đã được tin cậy. Tái sử dụng policy học phí, thời gian thanh toán, phạm vi buổi và builder báo cáo hiện có.

Thay schema cần migration phù hợp; giữ dữ liệu đã tham chiếu. Thay tiền/giữ chỗ cần xem lại transaction, idempotency, hạn thanh toán và race. Không sao chép bình luận cũ về gói thành luật khóa học nếu điều kiện trong service khác.

Lệnh chuẩn: `npm run lint`, `npm test`, `npm run build`; chạy các kiểm tra thích hợp với thay đổi và ghi đúng kết quả thực tế. Không ghi `.env`, mật khẩu hay API key vào log hoặc tài liệu.
''')
    write('docs/huong-dan/demo-hoi-dong.md', """# Chuẩn bị hội đồng theo ngày chạy

Bộ hiện hành gồm kịch bản 30 phút, lời thuyết trình cho bốn người, bộ dữ liệu Excel và manifest ID thực trong `docs/bao-cao`.

Tại thư mục gốc, `npm run demo:prepare` xem trước. `npm run demo:prepare -- --apply` lấy đồng hồ máy theo Asia/Ho_Chi_Minh, thêm một namespace ccl_ riêng và tự sinh lại Word/PDF/Excel/slide. Lệnh giữ dữ liệu cũ và các phiên demo chưa được thực hiện. Không cần gõ ngày cố định hoặc đổi giờ hệ thống.

Backend cần đã migrate/seed nền, có khung hoạt động và tài khoản quản lý từ cấu hình máy. Phần tài liệu cần Python với `scripts/reporting/requirements.txt`, PlantUML/Graphviz và LibreOffice. Chọn Python bằng SWP_REPORT_PYTHON, JAR bằng PLANTUML_JAR khi cần, và LibreOffice bằng SWP_LIBREOFFICE trong cấu hình máy.

Mở `docs/bao-cao/demo-data.json` để lấy namespace, ngày/giờ, các tài khoản, ID lớp/buổi và thời hạn mở điểm danh. Mật khẩu demo lấy SEED_MOCK_PASSWORD; quản lý dùng thông tin đăng nhập hiện có. Các file báo cáo không xuất mật khẩu hoặc API key.

A tạo trực tiếp ở WF1. B/C là lịch sử chuẩn bị; A2 là đích chuyển cả khóa. FULL/OTHER/R/NEAR và các lớp đối chứng dành cho exception. Mã I được tạo trực tiếp ở WF2, không lấy mã của lần kiểm thử trước. Sau khi diễn tập làm đổi trạng thái, chạy lại lệnh để có một bộ mới theo ngày/giờ thực.

Lệnh `node scripts/verify-council-demo.mjs` chạy bốn flow và exception qua HTTP trên DB thử tách riêng rồi xóa DB thử; giữ nguyên dataset hiện hành. Bằng chứng ở `docs/kiem-thu/council-demo-preflight.json`.

Khi demo webhook lặp: `node scripts/replay-demo-webhook.mjs <MA_HOA_DON_I>` phát lại đúng payload và ID của hóa đơn demo đã xử lý, kiểm tra DUPLICATE và số Payment không tăng. `--twice` của công cụ cũ tạo hai giao dịch khác ID, phục vụ ca chuyển tiền hai lần. Phần thanh toán là mô phỏng callback; không tự chuyển tiền ngân hàng thật.
""")
    write('docs/huong-dan/sepay-webhook.md' , """# Kiểm tra thanh toán SePay không hoàn tất

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
""")
    return inventory
