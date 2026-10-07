# Sprint 2 · API của BE Nhanh (US 38–46)

Prefix `/api/v1`, mọi route cần đăng nhập. Phản hồi theo `docs/05-api-convention.md`.

| US | Method + đường dẫn | Permission | Ghi chú |
| --- | --- | --- | --- |
| 38 | `GET /class-management/classes?date&status&subjectId&coachId&search&page&pageSize` | `class.read_all` hoặc `class.view_roster` | Có `class.read_all`: mọi lớp. Không có: chỉ lớp mình phụ trách; lọc coach khác → 403 |
| 39 | `GET /class-management/classes/:id` | như trên | Từng buổi, `bookedCount`, hội viên + trạng thái booking, người đăng ký/huỷ hộ. Email/SĐT chỉ cho `class.read_all` |
| 40 | `POST /sessions/:sessionId/enrollments/me` | `class.enroll_self` | Đặt chỗ một buổi |
| 41 | `DELETE /sessions/:sessionId/enrollments/me` | `class.cancel_self` | Huỷ khi còn ≥ `CLASS_CANCEL_MIN_HOURS_BEFORE` giờ (mặc định 12) |
| 42 | `POST /sessions/:sessionId/enrollments` body `{ memberId }` | `class.enroll_for_member` | Ghi `enrolledBy` |
| 43 | `DELETE /sessions/:sessionId/enrollments/:memberId` | `class.enroll_for_member` | Ghi `cancelledBy`; cùng mốc N giờ |
| 44 | `GET /schedule/me?from&to` | `schedule.view_own` | Ngày `YYYY-MM-DD` giờ VN, mặc định 7 ngày, tối đa 62 ngày |
| 45 | `GET /schedule/teaching?from&to&coachId` | `schedule.view_teaching` | `coachId` khác mình cần `class.read_all` |
| 46 | `GET /class-management/sessions/:sessionId/roster` | `class.view_roster` hoặc `class.read_all` | Chỉ tên + trạng thái booking |

Quy tắc đặt chỗ (kiểm trong một transaction, khoá hàng buổi `SELECT … FOR UPDATE`):
đã đăng ký → 409 · lớp không OPEN / ngoài thời gian đăng ký / buổi đã qua hoặc bị huỷ → 422 · không có gói còn hiệu lực → 422 ·
hết chỗ → 409 · trùng giờ buổi khác đang BOOKED → 409 (buổi sát giờ không giao nhau vẫn được).

Thay đổi dữ liệu: bảng `enrollments` thêm `enrolled_by`, `cancelled_by`, `cancelled_at`; thêm model Prisma
`Subject`, `Room`, `GymClass`, `ClassSession`, `Enrollment` cho các bảng đã có từ migration `20260924150000`.
Thêm permission `class.read_all` (chạy `npm run db:seed` để đồng bộ; Center Manager tự có).
