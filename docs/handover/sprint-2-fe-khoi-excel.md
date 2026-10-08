# Sprint 2 · FE Khôi đối chiếu TaskSheet Excel

Đối chiếu ngày **08/10/2026**, phạm vi **9 task / 8 UC** giao cho Khôi trong Sprint 2 (06–19/10).
**9/9 task đã hoàn thành trong code và đạt nghiệm thu RBAC/BR/UI**. Trạng thái Excel tại lúc đọc
vẫn là **To Do** cho cả 9 task: workbook được giữ nguyên, không ghi trạng thái vào file nguồn.
Kết quả BE/FE, migration và 26 ca UI hiện tại được ghi ở cuối tài liệu.

## Nguồn và cách tính phạm vi

- File nguồn: `C:\Users\LAPTOPPC\Downloads\SWP391_TaskSheet_Sprint2.xlsx`.
- SHA-256: `B8F7FD7B33CD2D81800CEC74FD8CBFA8032175AA455F007C21856475AF93447E`.
- Snapshot đã đọc: `.cache/sprint2-excel/workbook.json` (artifact local, không commit).
- Sheet `Task Sprint 2`: cột A = Task ID, B = UC, C = Function / Screen, E = Người làm, G = Business Rule.
- `Tổng hợp!C6` dùng `COUNTIF('Task Sprint 2'!$E$5:$E$60,A6)` với `A6 = Khôi`.
  Đếm lại snapshot được **9** dòng: **23, 25, 27, 29, 31, 33, 35, 37, 39**.
- `Ngoài kế hoạch!A9:F9` có X-05 (verify-email, banner, gửi lại; đề xuất Khôi).
  Công thức chỉ tham chiếu `Task Sprint 2`, nên X-05 không nằm trong tổng 9 và không thuộc bàn giao này.

## 9 task → UC → API → UI → BR → test

API dưới prefix `/api/v1`; UI nằm tại `/schedule`. Tên component trong bảng thuộc
`core/fe/src/pages/schedule/`. Mã test rút gọn có prefix **TC-F2-**; vị trí suite ở phần kế tiếp.

| Excel / Task | UC / màn | API chính | UI hiện có | BR và hành vi cần nghiệm thu | Test hiện có |
| --- | --- | --- | --- | --- | --- |
| Row 23 · S2-19 | UC-CB-17 · S25 · Danh sách quản lý | `GET /classes?scope=management`; `GET /classes/filters` | `SchedulePage` → Quản lý lớp / Lớp phụ trách; `ClassListPanel`, `ClassFilters` | `class.read_all` xem phạm vi quản lý; coach thiếu quyền rộng chỉ xem lớp được phân công. Lọc ngày, status, bộ môn, coach; phân trang không vượt phạm vi. | B08; R06; U04 |
| Row 25 · S2-21 | UC-CB-17 · S26 · Chi tiết và học viên | `GET /classes/:id`; `GET /classes/:id/roster` | `ClassDetailDrawer`, `ClassSessionsTable`, `ClassRosterModal` | Người quản lý / coach phụ trách xem từng buổi, học viên, BOOKED/CANCELLED và thay đổi lịch. Giữ lịch sử đăng ký / huỷ; không truy cập lớp ngoài phạm vi. | B08; C04–06; R05; U03/U04; X03 |
| Row 27 · S2-23 | UC-CB-06 · màn 9 · Tự đăng ký | `POST /classes/:id/enrollments/me` | `ClassBookingActions`, `BookingControls` trong Lớp đang mở / chi tiết | BR-2.1/1.5: membership còn hiệu lực; BR-2.6: lớp OPEN trong cửa sổ đăng ký; BR-2.2/2.3/2.8: còn chỗ, không trùng lịch. Tranh chỗ cuối chỉ một thành công; đăng ký trùng trả 409. | B01–04; R03; U01; V03; X01 |
| Row 29 · S2-25 | UC-CB-07 · màn 10 · Tự huỷ | `DELETE /classes/:id/enrollments/me` | `ClassBookingActions`, `BookingControls` từ lớp / lịch cá nhân | BR-2.5/2.14: chỉ booking của mình; buổi tương lai gần nhất còn ≥ N giờ, N lấy từ cấu hình, mặc định 12. Hiện hạn / lý do theo server; quá hạn giữ booking. | B06/B09; P01–03; N01; U01; X02 |
| Row 31 · S2-27 | UC-CB-09 · S23 · Đăng ký hộ | `GET /members?search=…`; `GET /classes?memberId=…`; `POST /classes/:id/enrollments` body `{memberId}` | Đăng ký / huỷ hộ → `StaffBookingPanel`, `ClassListPanel`, `ClassBookingActions` | Permission `class.enroll_for_member`; cùng kiểm tra membership, OPEN/cửa sổ, sức chứa, trùng lịch như tự đăng ký. Lưu `enrolled_by` là nhân viên; đánh giá DTO đúng hội viên được chọn. | B01–05; R03/R05; U02 |
| Row 33 · S2-29 | UC-CB-10 · S23 · Huỷ hộ | `GET /members/:id/enrollments`; `DELETE /classes/:id/enrollments/:memberId` | `StaffBookingPanel` → Các lớp đã đăng ký; `ClassBookingActions`, `BookingControls` | BR-2.5/2.14 áp dụng như tự huỷ; nhân viên không bỏ qua hạn. Lưu `cancelled_by` và audit; quá hạn từ chối, không thay đổi booking. | B05/B06; R03; P01–03; N01; U02 |
| Row 35 · S2-31 | UC-CB-16 · màn 10 · Lịch cá nhân | `GET /schedule/me?weekStart=…` | Lịch tập của tôi → `ScheduleCalendar`, `ScheduleList`, `ScheduleToolbar`, `useScheduleCalendar` | Chỉ lịch chủ token; ngày/tuần Việt Nam, phòng/coach/buổi, trạng thái booking và lịch đã huỷ. BR-1.5/1.12: membership hết hạn giữa kỳ vẫn giữ booking cũ; chặn đăng ký mới. | B07; N02; U01; X02; FE timezone tests |
| Row 37 · S2-33 | UC-CB-11 · màn 11 · Lịch dạy | `GET /schedule/teaching?weekStart=…` | Lịch dạy → `ScheduleCalendar`, `ScheduleList`, `ScheduleToolbar` | Coach chỉ xem lớp được phân công; hiển thị lịch mới và trạng thái đổi/huỷ. Không đọc/sửa lịch người khác bằng cách đổi query hoặc ID. | B08; R02; N02; U03; V02; X03 |
| Row 39 · S2-35 | UC-CB-12 · màn 11 · Học viên lớp | `GET /classes/:id/roster` | Nút Danh sách học viên → `ClassRosterModal` từ lịch dạy / lớp phụ trách | Coach phụ trách có `class.view_roster`, hoặc người có `class.read_all`. Chỉ trả ID/họ tên/email/điện thoại và booking/audit; lớp ngoài phân công trả 403. | B08; R02; U03; X03 |

## Hợp đồng dùng chung cần giữ

- Booking Sprint 2 là **toàn lớp**. UC-CB-18 đổi / huỷ từng buổi thuộc Sprint 3 theo
  [handover FE Khôi](sprint-2-fe-khoi.md); không bổ sung sessionId vào các endpoint booking trên.
- Backend trả `enrollment`, `canEnroll/enrollReason`, `canCancel/cancelReason`, `cancelDeadline`,
  `cancellationExceptionUntil`, `enrolledCount`, `seatsRemaining`; FE kết hợp với permission.
  Nhân viên truyền `memberId` khi đọc list/detail; tự thao tác lấy memberId từ token.
- Khoá `schedule_locks.id=1` bảo vệ tranh chỗ và xung đột; actor/audit ghi cùng transaction.
  Ngoại lệ huỷ chỉ do đổi lịch gây xung đột thật, còn hiệu lực trước buổi xung đột đầu tiên.
- Đổi/huỷ lớp giữ lịch sử buổi và booking. Outbox gửi thông báo cho hội viên với retry/dedupe;
  chi tiết lớp có `events`, roster có `{items, history}`. Mutation tải lại lớp/lịch/roster/thông báo.
- `/schedule/me` và `/schedule/teaching` nhận thứ Hai `weekStart`, lấy tuần UTC+7;
  query thêm userId/memberId bị từ chối. `/schedule/week` yêu cầu `class.read_all`.

API/DTO chi tiết: [sprint-2-api](../sprint-2-api.md). Code BE chính:
[class-read.service.js](../../core/be/src/modules/class/class-read.service.js),
[class-booking-policy.service.js](../../core/be/src/modules/class/class-booking-policy.service.js),
[class-enrollment.service.js](../../core/be/src/modules/class/class-enrollment.service.js),
[class-roster.service.js](../../core/be/src/modules/class/class-roster.service.js),
[schedule.service.js](../../core/be/src/modules/schedule/schedule.service.js) và
[schedule-transaction.js](../../core/be/src/common/utils/schedule-transaction.js).

## Sửa FE sau đối chiếu Excel ngày 08/10

- `vietnamCalendarDate` giữ ngày người dùng chọn trong DatePicker theo lịch Việt Nam,
  kể cả trình duyệt ở `Asia/Tokyo` hoặc `Pacific/Auckland`; chuyển ngày/tuần không lùi sang Chủ nhật.
  Code: `core/fe/src/utils/schedule.js`, `core/fe/src/pages/schedule/useScheduleCalendar.js`.
- `useLiveScheduleQuery` tải lại mỗi **30 giây** khi đang xem và khi quay lại cửa sổ.
  Áp dụng cho lớp, bộ lọc, chi tiết, roster, lớp của hội viên, lịch và thông báo để thấy đổi/huỷ
  từ tài khoản khác. Code: `core/fe/src/hooks/useLiveScheduleQuery.js` và các container trong bảng.
- `useScheduleMutation.onSettled` invalidate lớp/lịch/roster dưới `QUERY_KEYS.SCHEDULE`
  và `QUERY_KEYS.NOTIFICATIONS` cả khi ghi bị từ chối. Sau khi người khác giữ chỗ cuối,
  UI tải lại số chỗ và disable đăng ký thay vì giữ điều kiện cũ.
- Chuông thông báo refetch khi mở. Ở màn hình 320px, phép đo trước sửa cho thấy meta/message
  rộng **0px** và popup có **x = -93px**, làm nội dung khó đọc. Đã cho meta stretch/width 100%,
  đặt popup `bottom` ở màn hình nhỏ và giới hạn chiều cao với cuộn. Phép đo sau sửa cho thấy
  nội dung nhìn được, meta/message rộng **260px**, popup **x = 8px**.
  Code: `core/fe/src/components/common/NotificationBell.jsx`, `core/fe/src/styles/polish.css`.
  Bằng chứng local: `.cache/sprint2-excel/notification-layout-{baseline,fixed}.json` và các ảnh
  `notification-{baseline,fixed}-{320,390,1366}.png` trong cùng thư mục.

## Vị trí kiểm thử

| Nhóm ID | File thật |
| --- | --- |
| B01–B09 | `core/be/tests/sprint2-booking.test.js` |
| C01–C06 | `core/be/tests/sprint2-class.test.js` |
| R01–R06 | `core/be/tests/sprint2-resilience.test.js` |
| P01–P03 | `core/be/src/modules/class/class-booking-policy.service.test.js` |
| N01–N02 | `core/be/tests/sprint2-policy-config.test.js` |
| U01–U04 | `tests/e2e/sprint2.spec.mjs` |
| V01–V03 | `tests/e2e/sprint2-management.spec.mjs` |
| X01–X03 | `tests/e2e/sprint2-khoi-excel.spec.mjs` |
| FE timezone tests · 6 ca | `core/fe/src/utils/schedule.test.js` |

Tên ca và mục tiêu: [TC-F2](../test-cases/TC-F2-class-booking.md). Các suite trong bảng đã được chạy
trong lượt nghiệm thu ngày 08/10; kết quả và log bên dưới.
X01 kiểm tra tải lại sau khi mất chỗ cuối; X02 kiểm tra lịch ngoài múi giờ VN và booking cũ khi gói hết hạn;
X03 kiểm tra lịch dạy tự cập nhật khi huỷ lớp, thông báo và roster được giữ. Bộ X dùng
`Pacific/Auckland`, chạy desktop và mobile 320px; sáu test timezone thuần có thêm `Asia/Tokyo`.

## Nhánh đã đối chiếu ngày 08/10/2026

Fetch ghi nhận remote `origin/sprint-2/fe-khoi` bị **forced update** về `68d03ba`.
`git pull --ff-only` trả `Already up to date`: tại lúc đối chiếu, local `sprint-2/fe-khoi`
ở `8e0a8f5`, ahead **74**, behind **0**. Remote lùi không làm mất code local;
không reset theo remote hoặc loại bỏ bản tích hợp đã có.

Các sửa ngày 08/10 được bàn giao bằng commit local trên `sprint-2/fe-khoi`; chưa push các commit mới.
Main được giữ nguyên trong lượt làm việc: local `main = b389a11`, remote `main = 4734719`.
Remote `sprint-2/fe-khoi` vẫn ở `68d03ba`; xác minh bằng `git ls-remote`, không cập nhật nhánh remote.
Phân loại diff: hai commit `fix` cho lịch/timezone và thông báo mobile; một commit `test` cho
X01–X03; một commit `docs` cho hợp đồng/truy vết/nghiệm thu.

Ba commit code/kiểm thử đã tạo local và hooks đạt; bản code nghiệm thu ở **`4000e62`**.
Tài liệu được commit riêng sau ba commit này.

| Commit local | Phân loại / nội dung |
| --- | --- |
| `a0de78f` | `fix(schedule): keep class bookings and calendars up to date` — ngày Việt Nam, tải lại lớp/lịch/roster và phục hồi điều kiện sau lỗi ghi |
| `5897698` | `fix(notifications): refresh class changes and fit mobile popover` — cập nhật thông báo, refetch khi mở và layout popup mobile |
| `4000e62` | `test(sprint2): verify Khoi task sheet acceptance` — bổ sung X01–X03 cho desktop/mobile Auckland |

## Nghiệm thu ngày 08/10/2026

| Kiểm tra | Kết quả hiện tại | Log / bằng chứng |
| --- | --- | --- |
| 9 task Excel, RBAC và hành vi BR | **9/9 đạt trong code** | Bảng truy vết trên; BE/FE và UI dưới đây |
| BE/FE tests trên DB kiểm thử | **142/142 đạt**: BE 87 ca/21 file, FE 55 ca/9 file | `.cache/sprint2-excel/verify.log` |
| Migration mới và nâng cấp | Đạt; giữ **24 bảng lịch sử / 36 FK cũ** | `.cache/sprint2-excel/verify.log` |
| UI desktop và mobile 320px | **26/26 đạt (4.4 phút)**: 13 desktop + 13 mobile; X01–X03 đạt trên cả hai | `.cache/sprint2-excel/e2e-final.log`; `playwright-report/index.html` |
| Layout chuông thông báo | Phép đo sau sửa: nội dung hiện, không tràn ngang ở 320/390/1366px | `.cache/sprint2-excel/notification-layout-fixed.json` và ảnh trong cùng thư mục |
| Lint, format, build FE, Prisma validate | Đạt sau sửa mobile | `npm run lint`; `npm run format:check`; `npm run build`; `npx prisma validate` tại BE |
| Git diff check | Đạt | `git diff --check` |
| Bản local | FE HTTP 200; API `status: ok`, `database: up` | `http://localhost:5173/schedule`; `http://127.0.0.1:3000/api/v1/health` |
| Main được bảo toàn; nhánh đích | Local main `b389a11`; remote main `4734719`; remote đích `68d03ba` giữ nguyên | `git rev-parse refs/heads/main`; `git ls-remote origin refs/heads/main refs/heads/sprint-2/fe-khoi` |
| Kết luận / trạng thái task | **Done trong code cho 9 task**; workbook vẫn To Do | Không thay file Excel hoặc đưa X-05 vào tổng Sprint 2 |

## Chạy bản local

Server đang chạy: mở **http://localhost:5173/schedule**. Kiểm tra API bằng
**http://127.0.0.1:3000/api/v1/health**, trường `data.database` phải là `up`.
Nếu đã dừng server, từ nhánh `sprint-2/fe-khoi` chạy `npm run dev`; MySQL cần sẵn sàng.
Tài khoản demo dùng cấu hình seed local; không ghi mật khẩu trong tài liệu bàn giao.
