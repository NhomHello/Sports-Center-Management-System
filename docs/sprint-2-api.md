# Sprint 2 · Hợp đồng lớp học và lịch

Prefix và response giữ theo [chuẩn API](05-api-convention.md). Các endpoint dưới đây yêu cầu Bearer token. Ngày là `YYYY-MM-DD`; thời điểm ISO 8601 có offset. Backend lưu UTC; giao diện hiển thị giờ Việt Nam.

## Danh mục và cấu hình lớp

| Endpoint | Permission | Kết quả |
| --- | --- | --- |
| `GET /subjects`, `GET /rooms` | `subject.read`, `room.read` | Phân trang; `search`, `isActive` |
| `POST /subjects`, `POST /rooms` | Quyền `create` tương ứng | 201; tên duy nhất; phòng có sức chứa nguyên dương |
| `PUT /subjects/:id`, `PUT /rooms/:id` | Quyền `update` tương ứng | 200; giữ ID và lịch sử |
| `DELETE /subjects/:id`, `DELETE /rooms/:id` | Quyền `delete` tương ứng | 200; ngừng hoạt động; chặn nếu còn lớp sử dụng |
| `GET /classes/coaches` | `class.create` / `class.update` / `class.read_all` | HLV hoạt động có `schedule.view_teaching`; chỉ ID và họ tên |
| `POST /classes` | `class.create` | 201; tạo lớp và buổi học trong cùng transaction |
| `PUT /classes/:id` | `class.update` | 200; body đầy đủ; đổi lịch chỉ thay buổi tương lai |
| `DELETE /classes/:id` | `class.delete` | 200; huỷ lớp và đăng ký liên quan; gọi lại không tạo thêm sự kiện |

Body tạo/sửa lớp:

```json
{
  "name": "Yoga buổi tối",
  "description": "Lớp nhóm",
  "subjectId": 1,
  "roomId": 2,
  "coachId": 3,
  "capacity": 15,
  "startsOn": "2026-10-06",
  "endsOn": "2026-10-27",
  "weeklySchedule": [{ "dayOfWeek": 2, "startTime": "18:00", "endTime": "19:00" }],
  "registrationStartAt": "2026-10-05T08:00:00+07:00",
  "registrationEndAt": "2026-10-06T17:00:00+07:00",
  "status": "OPEN"
}
```

`dayOfWeek`: Chủ nhật = 0, thứ Hai = 1, …, thứ Bảy = 6. `status` cho tạo/sửa là `OPEN` hoặc `CLOSED`; huỷ dùng DELETE. Backend kiểm tra khoảng thời gian, tài nguyên hoạt động, sức chứa và xung đột phòng/HLV; hai buổi kết thúc/bắt đầu cùng một mốc được phép. Giới hạn xử lý lịch là 366 ngày, tối đa 7 slot/tuần. Khi hết buổi tương lai, không tạo lại buổi quá khứ.

## Đọc lớp, đăng ký và roster

| Endpoint | Permission và phạm vi |
| --- | --- |
| `GET /classes` | `class.read` / `class.read_all`; mặc định chỉ lớp OPEN trong cửa sổ đăng ký |
| `GET /classes?scope=management` | `class.read_all`: toàn trung tâm; `schedule.view_teaching`: lớp được phân công; còn lại 403 |
| `GET /classes/filters` | Cùng phạm vi quản lý; bộ môn và HLV lấy từ các lớp được phép xem |
| `GET /classes/:id` | Quản lý, HLV phụ trách, người đã đăng ký hoặc lớp OPEN; HLV không có quyền rộng hơn bị chặn ở lớp ngoài phân công |
| `POST /classes/:id/enrollments/me` | `class.enroll_self`; memberId luôn lấy từ token |
| `DELETE /classes/:id/enrollments/me` | `class.cancel_self`; cùng chính sách huỷ với huỷ hộ |
| `POST /classes/:id/enrollments` | `class.enroll_for_member`; body `{ "memberId": 5 }` |
| `DELETE /classes/:id/enrollments/:memberId` | `class.enroll_for_member`; lưu nhân viên thực hiện |
| `GET /members/:id/enrollments` | `class.enroll_for_member` / `class.read_all`; có cả đăng ký đã huỷ |
| `GET /classes/:id/roster` | `class.view_roster` + phân công HLV, hoặc `class.read_all` |

Danh sách lớp hỗ trợ `page`, `pageSize`, `search`, `date`, `status`, `subjectId`, `coachId`. `date` lọc buổi chưa huỷ theo ngày Việt Nam. `pageSize` tối đa 100.

Nhân viên có `class.enroll_for_member` hoặc quản lý có `class.read_all` được truyền `memberId` vào GET danh sách/chi tiết lớp để lấy điều kiện của người được chọn. Người dùng khác truyền `memberId` nhận 403. Nhân viên mở lớp đã đóng được khi hội viên đó có lịch sử đăng ký; quyền này không mở roster.

DTO lớp gồm tài nguyên công khai, lịch từng buổi, `enrolledCount`, `seatsRemaining` và các field sau:

| Field | Ý nghĩa |
| --- | --- |
| `enrollment` | Đăng ký của người được đánh giá; `BOOKED` / `CANCELLED`, actor và các mốc thao tác |
| `canEnroll`, `enrollReason` | Có thể đăng ký; lý do cụ thể khi bị chặn |
| `canCancel`, `cancelReason` | Có thể huỷ; backend xác minh lại khi ghi |
| `cancelDeadline` | Buổi tương lai gần nhất trừ N giờ cấu hình |
| `cancellationExceptionUntil` | Ngoại lệ do đổi lịch gây xung đột, còn hiệu lực trước buổi xung đột đầu tiên |
| `events` | Có trong chi tiết: lịch sử đổi/huỷ lớp, không lộ danh sách người nhận hoặc lỗi nội bộ |

Roster trả `{ items, history }`. Mỗi học viên chỉ có ID, họ tên, email, điện thoại cùng trạng thái/mốc đăng ký. Không trả mật khẩu, token hoặc hồ sơ gói tập. History chứa audit đăng ký/huỷ, giúp giữ dấu vết qua nhiều lần đăng ký lại.

## Lịch

| Endpoint | Permission | Phạm vi |
| --- | --- | --- |
| `GET /schedule/me?weekStart=2026-10-05` | `schedule.view_own` | Người đăng nhập, kể cả lịch đăng ký đã huỷ |
| `GET /schedule/teaching?weekStart=2026-10-05` | `schedule.view_teaching` | Các lớp được phân công cho người đăng nhập |
| `GET /schedule/week?weekStart=2026-10-05` | `class.read_all` / `schedule.view_teaching` | Toàn trung tâm hoặc phạm vi phân công |

`weekStart` bắt buộc là thứ Hai theo ngày Việt Nam. Khoảng lấy dữ liệu là `[thứ Hai 00:00, thứ Hai tuần sau 00:00)` theo UTC+7. Query truyền thêm userId/memberId bị từ chối 400. Mỗi event chứa snapshot phòng/HLV của buổi, DTO lớp và trạng thái đăng ký. FE chọn ngày/tuần và bật hiển thị lịch đã huỷ từ dữ liệu đã được BE lọc quyền.

## Chính sách ghi và lỗi

- Đăng ký **toàn lớp**, kiểm tra membership hiệu lực tại lúc đăng ký và tất cả buổi còn lại. Membership hết hạn sau đó giữ nguyên đăng ký có trước.
- Khoá hàng `schedule_locks.id=1` trong transaction để tuần tự hoá thay đổi lịch/tài nguyên/booking, chống tranh chỗ cuối và xung đột giữa hai lớp. Cách này phù hợp quy mô hiện tại; khi mở rộng cần đánh giá thời gian chờ khoá.
- `CLASS_CANCEL_MIN_HOURS_BEFORE` lấy từ `system_settings`, mặc định 12. Đúng mốc N giờ được huỷ. Ngoại lệ chỉ tạo bởi đổi lịch và được kiểm tra lại bằng xung đột thật; không tự động huỷ hội viên bị ảnh hưởng.
- Audit và sự kiện thông báo được ghi cùng transaction. Worker gửi sự kiện chưa hoàn tất; lỗi giữ `attempts/lastError` để thử lại. Khoá event và `dedupeKey` tránh gửi trùng khi worker chạy lại.
- 400: input sai; 401: thiếu token; 403: thiếu quyền/ngoài phạm vi; 404: không có lớp/đăng ký; 409: đăng ký trùng, tên danh mục trùng, phòng/HLV trùng lịch; 422: hết hạn gói, hết chỗ, ngoài cửa sổ, trùng lịch hội viên, quá hạn huỷ hoặc tài nguyên còn đang dùng.

Migration `20261005100000_sprint2_class_booking` chỉ bổ sung bảng/cột; giữ bảng `enrollments` từng buổi, điểm danh và các FK lịch sử. Các đăng ký mới đi vào `class_enrollments`; không tự chuyển dữ liệu cũ thành đăng ký toàn lớp. Dùng **migrate deploy** để nâng cấp, giữ nguyên các migration cũ.
