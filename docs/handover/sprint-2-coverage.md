# Sprint 2 · Bàn giao bản tích hợp local

Phạm vi: 18 chức năng #29–46, kế hoạch 06–19/10. Bản làm việc: `sprint-2/integration`, nền Sprint 1 tại `origin/main` (`b389a11`). Main được giữ nguyên; chưa push, mở PR hoặc merge remote.

Nguồn yêu cầu: [UseCase Flow 2](https://drive.google.com/file/d/1hzAxrYmU6Zw7dLgmjLZ88O5Z2iFGkK-_/view), [Sheet kế hoạch](https://docs.google.com/spreadsheets/d/1L6NzU_dTrh1Y-FSkfUQC8n4HXEwZDNeYt3T3WOWfZSQ/edit), bốn handover Sprint 2. UC-CB-14–17 lấy từ Sheet; Actor/Role được đối chiếu với mô tả UC và permission. Hướng dẫn lấy code từ `origin/khoi` được thay vì nhánh này không tồn tại tại lúc triển khai.

## 18 chức năng → UC → API → màn hình → bằng chứng

API dưới prefix `/api/v1`; mọi màn hình Flow 2 nằm trong `/schedule`, điều hướng theo permission. Cả 18 chức năng đã đạt kiểm thử nghiệm thu ngày 05/10/2026.

| # | UC | Chức năng | API chính | Màn hình/component | Bằng chứng test | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| 29 | UC-CB-01 | Quản lý bộ môn | GET/POST subjects; PUT/DELETE subjects/:id | Tab Bộ môn · ResourceCatalogPanel/Form | U04; C03; R02; catalog service dùng chung V01 | Đạt |
| 30 | UC-CB-14 | Danh sách phòng | GET rooms | Tab Phòng tập · tìm kiếm, phân trang | V01; R02; R06 | Đạt |
| 31 | UC-CB-14 | Tạo/sửa/ngừng phòng | POST rooms; PUT/DELETE rooms/:id | ResourceFormModal/ResourceCatalogPanel | V01; C03; R06 | Đạt |
| 32 | UC-CB-02 | Tạo lớp | POST classes; GET classes/coaches | Tạo lớp · ClassFormModal | C01–03; R01; V01 | Đạt |
| 33 | UC-CB-03 | Sửa lớp/đổi lịch | PUT classes/:id | Sửa lớp/đổi lịch · form và lịch sử detail | C04–05; B09; U04 | Đạt |
| 34 | UC-CB-04 | Huỷ lớp | DELETE classes/:id | Huỷ lớp · xác nhận toàn lớp | C06; V01 | Đạt |
| 35 | UC-CB-13 | Thông báo thay đổi/huỷ | Outbox → notifications; GET/PATCH notifications | Trang/chuông thông báo Sprint 1; lịch sử lớp | C04/C06; R04; hồi quy notification | Đạt |
| 36 | UC-CB-05 | Lớp đang mở | GET classes?scope=open | Tab Lớp đang mở · ClassListPanel | U01; V03; B03; R02 | Đạt |
| 37 | UC-CB-15 | Chi tiết lớp | GET classes/:id | ClassDetailDrawer · tài nguyên, buổi và thay đổi | C01/C05; U04; R05 | Đạt |
| 38 | UC-CB-17 | Danh sách quản lý | GET classes?scope=management; classes/filters | Quản lý lớp/Lớp phụ trách · ClassFilters | R06; B08; U04 | Đạt |
| 39 | UC-CB-17 | Chi tiết quản lý và học viên | GET classes/:id; classes/:id/roster | Detail + ClassRosterModal · trạng thái/histories | U03/U04; B08; C05; R05 | Đạt |
| 40 | UC-CB-06 | Tự đăng ký toàn lớp | POST classes/:id/enrollments/me | ClassBookingActions · xác nhận đăng ký | B01–04; R03; U01; V03 | Đạt |
| 41 | UC-CB-07 | Tự huỷ | DELETE classes/:id/enrollments/me | Hạn huỷ/lý do/ngoại lệ · BookingControls | B06/B09; P01–03; N01; U01 | Đạt |
| 42 | UC-CB-09 | Đăng ký hộ | GET members?search=…; POST classes/:id/enrollments | Đăng ký/huỷ hộ · StaffBookingPanel | U02; B05; R05 | Đạt |
| 43 | UC-CB-10 | Huỷ hộ | GET members/:id/enrollments; DELETE classes/:id/enrollments/:memberId | Các lớp đã đăng ký · xác nhận huỷ hộ | U02; B05/B06; R03 | Đạt |
| 44 | UC-CB-16 | Lịch tập cá nhân | GET schedule/me | Lịch tập của tôi · ngày/tuần, lịch đã huỷ | U01; B07; N02; FE timezone tests | Đạt |
| 45 | UC-CB-11 | Lịch dạy | GET schedule/teaching | Lịch dạy · ScheduleCalendar | U03; V02; B08 | Đạt |
| 46 | UC-CB-12 | Học viên lớp phụ trách | GET classes/:id/roster | Nút Danh sách học viên từ lịch dạy | U03; B08; R02 | Đạt |

Mã rút gọn trong bảng có prefix `TC-F2-`; tên ca và vị trí code nằm trong [TC-F2](../test-cases/TC-F2-class-booking.md). U/V là luồng UI chạy trên desktop 1366×900 và mobile 320×780, dùng API/DB thật. C/B/R/P/N là các kiểm thử backend.

## Kiến trúc và quyết định đã áp dụng

- Đăng ký toàn lớp trong `class_enrollments`, giữ `enrollments` từng buổi và các bảng/FK cũ. Actor, audit, ngoại lệ huỷ và lịch sử đăng ký được giữ qua huỷ/đăng ký lại.
- Tài nguyên, lớp và booking dùng chung transaction có khoá DB, chống tranh chỗ và trùng giờ khi ghi đồng thời. Buổi sát giờ được phép nếu không có phần giao nhau.
- Đổi lịch giữ các buổi đã diễn ra, huỷ phiên bản buổi tương lai rồi tạo lịch mới. Snapshot phòng/HLV bảo toàn thông tin cũ. Huỷ lớp giữ lịch sử và huỷ phần tương lai/đăng ký liên quan.
- N giờ huỷ đọc từ cấu hình, mặc định 12; đúng mốc được huỷ. Ngoại lệ chỉ cho thành viên bị đổi lịch gây xung đột thật, trước buổi xung đột đầu tiên. Không tự huỷ đăng ký bị ảnh hưởng.
- `class.read_all` cấp phạm vi quản lý. HLV thiếu quyền rộng hơn chỉ thấy lớp/roster phân công. Lịch riêng không nhận memberId từ client. Roster chỉ trả thông tin cần cho lớp.
- Outbox ghi cùng transaction, có retry và khoá/dedupe. Thông báo dùng module Sprint 1. UC-CB-18 sửa/huỷ từng buổi để Sprint 3.
- FE dùng Ant Design, Axios service, TanStack Query; invalidate lớp/lịch/roster/notification sau mutation. Backend trả điều kiện thao tác và lý do. Mobile có select điều hướng đầy đủ các màn hình.

## Nhánh và commit

| Nhánh | Phạm vi | Commit chính |
| --- | --- | --- |
| sprint-2/be-bao | #29–37, danh mục/lớp/buổi/outbox | 7414006; sửa cuối f40e479 |
| sprint-2/be-nhanh | #38–46, booking/phạm vi/lịch/roster | 227cfbe, 8b574b1; sửa cuối d6064a8 |
| sprint-2/fe-khai | #29–34, #36–37, danh mục/quản lý lớp | 0f439fb; sửa cuối bcf615b |
| sprint-2/fe-khoi | #38–46, booking/lịch/học viên | 3845131; sửa cuối 8977f9c |
| sprint-2/integration | BE Bảo → BE Nhanh → FE Khải → FE Khôi, nghiệm thu và tài liệu | 5c9fa60 → 17e3598 → 8d7000b → 106882d; test f680ffd |

Các sửa cuối được commit riêng theo diff: backend, điều hướng mobile, kiểm thử, chuẩn hoá format nền Sprint 1 và bàn giao. Không đổi tác giả/co-author khi không dùng lại code từ nhánh cũ.

## Kết quả kiểm tra cuối

Nghiệm thu ngày **05/10/2026**:

| Kiểm tra | Kết quả |
| --- | --- |
| BE + FE trên DB mới | **139/139 đạt**: BE 87 ca/21 file, FE 52 ca/9 file |
| UI với API/DB thật | **16/16 đạt**: 7 luồng Sprint 2 + 1 hồi quy Sprint 1, mỗi luồng chạy desktop và mobile 320px |
| Huỷ hộ và tải lại UI | Chạy lại U02 ở hai kích thước: 2/2 đạt; số chỗ và nút đăng ký đã cập nhật |
| Migration mới | 8 migration deploy thành công, seed và toàn bộ test đạt |
| Migration nâng cấp | Fixture của 24 bảng lịch sử được giữ; 36 FK cũ không thay đổi; snapshot backfill và FK mới hợp lệ |
| Chất lượng code | lint, format:check, build FE và git diff --check đạt |
| Bản local | FE trả HTTP 200; health trả database: up; đăng nhập lễ tân, hai HLV và member1 thành công |
| Git | Cả bốn nhánh thành viên đã được tích hợp; main/origin/main/remote main giữ b389a11; chưa push/PR |

Các luồng UI kiểm tra loading/empty/error, thông báo từ backend, không có lỗi JavaScript và không tràn ngang ở 320px. Form và bảng Sprint 1 sau khi tách component cũng được kiểm tra qua API thật. Build còn cảnh báo chunk thư viện trên 500 kB có sẵn ở nền; không có lỗi build.

Bằng chứng HTML của lượt đầy đủ nằm ở `.cache/sprint2-acceptance/playwright-report/index.html`; mở bằng `npx playwright show-report .cache/sprint2-acceptance/playwright-report`. Log của 16 ca nằm ở `.cache/sprint2-acceptance/e2e-all.log`. Các artifact này là bản local, không commit vào Git; test/script và bảng truy vết được commit để chạy lại.

Nền Sprint 1 được chuẩn hoá format và tách các component quá giới hạn trong commit e6de092, đưa về nhánh nền bằng b1bed6c. Các nhánh chỉ bổ sung migration, không sửa hoặc reset migration cũ.

### Bổ sung kiểm tra đăng nhập local ngày 05/10/2026

Lỗi người dùng báo đã được tái hiện trên `http://127.0.0.1:5173`: CORS trong `.env` chỉ có
`http://localhost:5173`, nên preflight không trả Access-Control-Allow-Origin và trình duyệt báo
"Không thể kết nối máy chủ". Health và đăng nhập bằng HTTP client không phát hiện được lỗi này;
cấu hình server E2E trước đó tự cấp origin của runner cũng che mất lỗi cấu hình demo.

Đã bổ sung cả hai origin vào `.env` local và `.env.example`, khởi động lại BE, thử HLV Yoga trực tiếp
trên hai URL demo và xác nhận vào lịch dạy thành công. E2E giờ dùng CORS từ cấu hình BE, chỉ đổi cổng
cho server test. Các domain ngoài danh sách tiếp tục không nhận header cho phép CORS.

Kiểm tra bổ sung: 11 test auth đạt; 4 ca TC-LOCAL-AUTH đạt trên desktop/mobile, gồm 16 lượt đăng nhập
độc lập của lễ tân, HLV Yoga, HLV Gym và member1 qua localhost/127.0.0.1. Log nằm ở
`.cache/local-login-e2e.log`; ảnh bản demo HLV ở `.cache/login-127.0.0.1.png` và `.cache/login-localhost.png`.

### Kiểm tra bản bàn giao ngày 06/10/2026

Lượt chạy đầy đủ đạt 139 test BE/FE và 20/20 ca UI trên desktop/mobile 320px, bao gồm đăng nhập
qua cả localhost và 127.0.0.1. Migration mới và nâng cấp đạt; 24 bảng lịch sử và 36 FK cũ được giữ.
Lint, format, build, Prisma validate/migrate status và git diff --check đều đạt.

Bộ UI chạy nhiều lượt đăng nhập từ cùng IP nên vượt ngưỡng auth 20 lượt của cấu hình mặc định.
Playwright đặt ngưỡng request/auth riêng cho server E2E cổng riêng. Log kết quả đầy đủ nằm ở
`.cache/push-sprint2-verify.log` và `.cache/push-sprint2-e2e-final.log`; HTML report nằm ở
`playwright-report/index.html`. Artifact được tạo local; code kiểm thử nằm trong repository.

## Chạy và demo

Nhánh bàn giao trên GitHub là `sprint-2/fe-khoi`, chứa bản Sprint 2 đã tích hợp cùng sửa lỗi đăng nhập.

```bash
git switch sprint-2/fe-khoi
npm run dev
```

Frontend `http://localhost:5173/schedule`; health `http://localhost:3000/api/v1/health` phải trả `database: up`. MySQL Docker giữ dữ liệu trong volume. Ctrl+C dừng server; chạy lại bằng lệnh trên.

| Tài khoản seed | Vai trò demo |
| --- | --- |
| admin@scms.local | Quản lý, danh mục, cấu hình lớp, roster và lịch trung tâm |
| letan@scms.local | Tìm hội viên rồi đăng ký/huỷ hộ |
| coach.yoga@scms.local / coach.gym@scms.local | Lịch dạy và roster được phân công |
| member1@scms.local / member2@scms.local | Lớp mở, đăng ký/huỷ và lịch riêng |

Mật khẩu lấy từ `SEED_ADMIN_PASSWORD`/`SEED_MOCK_PASSWORD` trong .env local. Dữ liệu mẫu `DEMO · …` có buổi đầu vào ngày kế tiếp khi seed; member1/2 được tạo gói mẫu nếu chưa có lịch sử gói. Khi thử huỷ, dùng lớp còn đủ N giờ hoặc ngoại lệ được server xác nhận.

Để chạy nghiệm thu lại: `npm run verify:sprint2` (DB tạm) và `npm run test:e2e` (server riêng); chi tiết trong TC-F2. Không dùng migrate dev/reset trên DB cần giữ lịch sử; áp dụng migration bằng migrate deploy.
