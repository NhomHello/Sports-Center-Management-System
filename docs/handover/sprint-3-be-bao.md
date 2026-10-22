# Sprint 3 – Backend – Bảo

Nhánh: `sprint-3/be-bao`. Đã pull `main` trước khi thực hiện. Nguồn phân công hiện tại là `docs/ke-hoach/SWP391_TaskSheet_Sprint3.xlsx` (13 task của Bảo); tài liệu bàn giao cũ đã được thay bằng danh sách dưới đây.

| Task | Kết quả | API / kiểm thử |
| --- | --- | --- |
| S3-07 | Job nhắc gia hạn theo ngày Việt Nam, chuyển gói quá hạn sang EXPIRED, thông báo chống trùng; kết thúc bảo lưu tự động | `notification.job.js`, `sprint3-bao.test.js` |
| S3-10 | Đổi giờ buổi tương lai, kiểm tra phòng/HLV; xung đột hội viên trả cảnh báo và ngoại lệ tự huỷ | `PATCH /classes/sessions/:id` |
| S3-12 | Huỷ một buổi giữ lịch sử, chặn điểm danh, outbox gửi một lần | `POST /classes/sessions/:id/cancellation` |
| S3-24 | Báo cáo doanh thu, hoàn tiền, payment, membership, lớp | `GET /reports/dashboard`, `/reports/revenue` |
| S3-26 | Xuất cùng dữ liệu báo cáo CSV, Excel, PDF có font tiếng Việt | `GET /reports/export` |
| S3-46 | Check-in tại quầy, từ chối tài khoản khoá/gói bảo lưu; gói hết hạn theo policy kèm cảnh báo | `POST /check-ins` |
| S3-48 | Điểm danh từng buổi theo HLV snapshot, kiểm tra đăng ký, hạn sửa và quyền mở lại | `GET/PUT /classes/sessions/:id/attendance`, `POST /classes/sessions/:id/attendance-unlock` |
| S3-73 | Xem trước tác động khoá; khoá HLV trả 409 kèm lớp; hội viên có lịch cần xác nhận huỷ và nhả chỗ | `GET /users/:id/lock-preview`, `PATCH /users/:id/status` |
| S3-75 | Bảo lưu có giới hạn cấu hình, chặn nếu còn booking; kết thúc sớm cộng ngày thực dừng | `POST /memberships/:id/freezes`, `POST /memberships/:id/freezes/resume` |
| S3-78 | Hàng chờ FIFO, giữ chỗ có hạn, hết hạn chuyển người kế tiếp, sức chứa bảo vệ trong transaction | `GET/POST/DELETE /classes/:id/waitlist/me`; xác nhận bằng API enroll hiện có |
| S3-82 | Đổi HLV toàn bộ buổi tương lai hoặc từ ngày chỉ định, giữ lịch sử HLV cũ; thông báo các bên | `PATCH /classes/:id/coach` |
| S3-84 | Xem trước buổi ảnh hưởng/phòng gợi ý, áp dụng đợt chuyển/huỷ toàn bộ trong transaction | `GET /rooms/:id/maintenance-preview`, `POST /rooms/:id/maintenance` |
| S3-86 | Chặn đăng ký khi đủ số buổi ABSENT hợp lệ, giữ booking cũ; gỡ chặn có lý do và audit | `POST /members/:id/booking-unblock` |

Bổ sung bộ lọc `roomId`, `coachId`, `subjectId` cho lịch tuần để FE nối UI-F2-10. Lịch dạy xét HLV theo từng buổi sau khi đổi HLV.

## Hợp đồng API cho FE

- Các đường dẫn trên nằm dưới prefix API hiện có; response/lỗi giữ format chung của dự án. Body và query được validate bằng Zod; không nhận role hoặc số tiền báo cáo từ client.
- Đổi giờ: body `{ startAt, endAt }` là datetime có offset. Response có `conflicts: [{ memberId, exceptionUntil }]`; thông tin huỷ cho từng hội viên vẫn lấy từ DTO lớp (`canCancel`, `cancellationExceptionUntil`).
- Huỷ buổi / mở hạn điểm danh / gỡ chặn: body `{ reason }` bắt buộc không rỗng.
- Đổi HLV: `{ coachId, from? }`, `from` là `YYYY-MM-DD` Việt Nam. Buổi đã bắt đầu không đổi HLV.
- Check-in: `{ memberId }`; nếu policy cho phép gói hết hạn thì response có `warning`. Không tạo/kích hoạt gói từ check-in.
- Điểm danh: `{ entries: [{ memberId, status: 'PRESENT' | 'ABSENT' }] }`. HLV được ghi và sửa Có mặt/Vắng mặt trong giờ buổi học; kết thúc buổi sẽ khóa sửa. Quản lý có thể mở lại thủ công bằng `attendance.manage`.
- Khoá tài khoản: giữ `{ status }`, thêm `cancelFutureBookings: true` sau khi người dùng xác nhận. Thiếu xác nhận trả 409 với `details.bookings`; HLV có lớp OPEN trả `details.classes`.
- Bảo lưu: `{ from, to }` là ngày Việt Nam, **to là biên loại trừ**. Ví dụ 20/10 đến trước 27/10 = 7 ngày. Kết thúc sớm chỉ cộng số ngày lịch đã trôi qua; huỷ lịch chưa bắt đầu cộng 0 ngày. Trạng thái gói trả thêm `isFrozen`, `freezes`.
- Hàng chờ: vào/rời/xem bằng endpoint `/waitlist/me`; xác nhận chỗ bằng `POST /classes/:id/enrollments/me` hiện có. DTO lớp thêm `waitlist`, `heldSeats`; `seatsRemaining` đã trừ chỗ giữ. Job chạy mỗi phút; mọi phép enroll/cancel xử lý lại hàng chờ trước khi ghi.
- Bảo trì: query/body `{ startAt, endAt }` là khoảng datetime có offset. Preview trả buổi và `suggestions`. POST thêm `{ reason, assignments: [{ sessionId, roomId }] }`; `roomId: null` nghĩa là quản lý chọn huỷ buổi. Phải gửi đúng mỗi buổi ảnh hưởng một lần; dữ liệu đổi trong lúc xác nhận trả 409, toàn đợt rollback.
- Báo cáo: query bắt buộc `from`, `to` (`YYYY-MM-DD`, bao gồm cả ngày cuối), tuỳ chọn `memberId`, `planId`; xuất thêm `format=csv|xlsx|pdf`. Giới hạn 366 ngày để kiểm soát kích thước xuất. Doanh thu theo `paidAt`, bao gồm hoá đơn đã PAID rồi REFUNDED; chỉ hoàn invoice đã DONE mới trừ vào ngày `completedAt`. Hoàn tiền thừa/thiếu thuộc phiếu đối soát không giảm doanh thu bán gói. Payment phản ánh tiền nhận trong kỳ, bao gồm chuyển bù. Membership đếm gói giao với khoảng ngày, phân loại theo trạng thái hiện tại; lớp đếm buổi trong kỳ của phạm vi hội viên/gói được lọc.
- Thông báo hết hạn/nhắc gia hạn có `action: { type: 'RENEW_MEMBERSHIP', label, membershipId }` để FE hiện nút gia hạn. FE của các thành viên khác nối UI theo hợp đồng này.

## Database, cấu hình và quyền

1. `npm run db:deploy -w @scms/be`
2. `npm run db:generate`
3. `npm run db:seed`

Migration `20261014143000_bao_sprint3` mở rộng bảng check-in cũ, thêm bảo lưu/điểm danh/hàng chờ/bảo trì và snapshot ID phòng/HLV trên buổi. Không xoá dữ liệu cũ. Mọi phép thay đổi lịch, chỗ giữ, bảo lưu, khoá tài khoản, kích hoạt gói và rút ngày do hoàn tiền dùng schedule lock để tránh ghi đè nhau.

Quyền mới: `membership.freeze_self`, `membership.freeze_all`, `attendance.check_in`, `attendance.record`, `attendance.manage`, `class.unblock`. Role quản lý nhận quyền qua seed. Với role đã tồn tại, seed giữ nguyên quyền đã cấu hình: quản lý cấp thêm qua màn phân quyền; role tạo mới dùng danh sách mặc định đã cập nhật.

Các setting mới: `MEMBERSHIP_FREEZE_MIN_DAYS`, `MEMBERSHIP_FREEZE_MAX_DAYS`, `MEMBERSHIP_FREEZE_MAX_TIMES`, `CLASS_WAITLIST_HOLD_HOURS`, `CLASS_NO_SHOW_LIMIT`, `CLASS_NO_SHOW_WINDOW_DAYS`, `CLASS_NO_SHOW_BLOCK_DAYS`, `ATTENDANCE_EDIT_HOURS`, `CHECKIN_ALLOW_EXPIRED`.

## Kiểm thử

- `npm run lint` và `npm test` cho toàn workspace.
- 21 test tích hợp mới trong `sprint3-bao.test.js`, `sprint3-attendance-room.test.js`, `sprint3-report.test.js`: tranh chấp chỗ giữ, hết hạn offer, xung đột lịch và ngoại lệ huỷ, khoá tài khoản, snapshot HLV, bảo lưu/kết thúc sớm/job hết hạn/gia hạn ngay sau bảo lưu, phạm vi điểm danh/hạn sửa, no-show, rollback bảo trì và ba định dạng báo cáo.
- Đã replay đủ 12 migration trên database tạm mới và xoá database tạm sau kiểm tra.
- Excel chuyển 13 task của Bảo sang **Review**; cần các thành viên FE nối giao diện và nhóm review trước khi đánh dấu Done.
