# Danh mục endpoint từ router

Đường dẫn dưới đây chưa thêm `API_PREFIX`. Quyền ở cột này được trích từ khối route; middleware chung và kiểm tra chủ sở hữu/phạm vi phải đọc ở file nguồn. Không bao gồm đường dẫn bán/gia hạn/bảo lưu gói đã bị router nghỉ dùng chặn. Các endpoint số dư là khả năng hỗ trợ dữ liệu tài chính còn trong mã, không phải lựa chọn hoàn hủy khóa.

| Method | Đường dẫn | Quyền tại route | Nguồn |
| --- | --- | --- | --- |
| DELETE | `/classes/:id` | CLASS_DELETE | `core/be/src/modules/class/class.routes.js` |
| DELETE | `/classes/:id/enrollments/:memberId` | CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/class/class.routes.js` |
| DELETE | `/classes/:id/enrollments/me` | CLASS_CANCEL_SELF | `core/be/src/modules/class/class.routes.js` |
| DELETE | `/classes/:id/waitlist/me` | CLASS_ENROLL_SELF | `core/be/src/modules/sprint3/sprint3.routes.js` |
| DELETE | `/classes/sessions/:id/excuse` | CLASS_CANCEL_SELF, CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/attendance/attendance-excuse.routes.js` |
| DELETE | `/roles/:id` | ROLE_DELETE | `core/be/src/modules/role/role.routes.js` |
| DELETE | `/rooms/:id` | ROOM_DELETE | `core/be/src/modules/room/room.routes.js` |
| DELETE | `/subjects/:id` | SUBJECT_DELETE | `core/be/src/modules/subject/subject.routes.js` |
| GET | `/attendance/courses` | SCHEDULE_VIEW_OWN | `core/be/src/modules/course-history/course-history.routes.js` |
| GET | `/attendance/courses/:classId` | SCHEDULE_VIEW_OWN | `core/be/src/modules/course-history/course-history.routes.js` |
| GET | `/attendance/feedback/me` | SCHEDULE_VIEW_OWN | `core/be/src/modules/session-feedback/session-feedback.routes.js` |
| GET | `/attendance/me` | SCHEDULE_VIEW_OWN | `core/be/src/modules/attendance/attendance-history.routes.js` |
| GET | `/audit-logs` | Xem middleware chung/service | `core/be/src/modules/audit/audit.routes.js` |
| GET | `/auth/me` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| GET | `/auth/support-contacts` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| GET | `/classes` | CLASS_READ, CLASS_READ_ALL | `core/be/src/modules/class/class.routes.js` |
| GET | `/classes/:id` | CLASS_READ, CLASS_READ_ALL | `core/be/src/modules/class/class.routes.js` |
| GET | `/classes/:id/ratings/me` | COURSE_RATING_WRITE_OWN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/classes/:id/roster` | CLASS_VIEW_ROSTER, CLASS_READ_ALL | `core/be/src/modules/class/class.routes.js` |
| GET | `/classes/:id/summary` | COURSE_SUMMARY_MANAGE_ASSIGNED, COURSE_SUMMARY_VIEW_ALL | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/classes/:id/waitlist/me` | CLASS_ENROLL_SELF | `core/be/src/modules/sprint3/sprint3.routes.js` |
| GET | `/classes/coaches` | CLASS_CREATE, CLASS_UPDATE, CLASS_READ_ALL | `core/be/src/modules/class/class.routes.js` |
| GET | `/classes/filters` | CLASS_READ, CLASS_READ_ALL | `core/be/src/modules/class/class.routes.js` |
| GET | `/classes/sessions/:id/attendance` | ATTENDANCE_RECORD, ATTENDANCE_MANAGE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| GET | `/classes/sessions/:id/feedback` | ATTENDANCE_RECORD, ATTENDANCE_MANAGE | `core/be/src/modules/session-feedback/session-feedback.routes.js` |
| GET | `/coach/members` | MEMBER_PROFILE_VIEW_ASSIGNED | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/coach/members/:id` | MEMBER_PROFILE_VIEW_ASSIGNED | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/coaches` | COACH_PROFILE_READ | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/coaches/:id` | COACH_PROFILE_READ | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/coaches/:id/avatar` | COACH_PROFILE_READ | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/coaches/:id/ratings` | COACH_PROFILE_READ, COURSE_SUMMARY_MANAGE_ASSIGNED, COURSE_RATING_MODERATE | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/coaches/subjects` | COACH_PROFILE_READ | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/course-cancellations` | INVOICE_READ_ALL, CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/cancellation-history/cancellation-history.routes.js` |
| GET | `/course-cancellations/:id` | INVOICE_READ_OWN, SCHEDULE_VIEW_OWN, CLASS_CANCEL_SELF, INVOICE_READ_ALL, CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/cancellation-history/cancellation-history.routes.js` |
| GET | `/course-cancellations/me` | INVOICE_READ_OWN, SCHEDULE_VIEW_OWN, CLASS_CANCEL_SELF | `core/be/src/modules/cancellation-history/cancellation-history.routes.js` |
| GET | `/course-ratings/coaches` | COURSE_RATING_MODERATE | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/course-summaries` | COURSE_SUMMARY_MANAGE_ASSIGNED, COURSE_SUMMARY_VIEW_ALL | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/enrollments/:id/cancel-preview` | Xem middleware chung/service | `core/be/src/modules/cancellation/cancellation.routes.js` |
| GET | `/enrollments/:id/change-preview` | Xem middleware chung/service | `core/be/src/modules/purchase-change/purchase-change.routes.js` |
| GET | `/health` | Xem middleware chung/service | `core/be/src/modules/health/health.routes.js` |
| GET | `/invoices` | INVOICE_READ_ALL | `core/be/src/modules/payment/invoice.routes.js` |
| GET | `/invoices/:id` | INVOICE_READ_OWN, INVOICE_READ_ALL | `core/be/src/modules/payment/invoice.routes.js` |
| GET | `/invoices/:id/receipt` | INVOICE_READ_OWN, INVOICE_EXPORT_OWN, INVOICE_EXPORT | `core/be/src/modules/payment/invoice.routes.js` |
| GET | `/invoices/:id/receipt.pdf` | INVOICE_EXPORT, INVOICE_EXPORT_OWN, INVOICE_READ_OWN | `core/be/src/modules/payment/invoice.routes.js` |
| GET | `/invoices/me` | INVOICE_READ_OWN, INVOICE_READ_ALL | `core/be/src/modules/payment/invoice.routes.js` |
| GET | `/me/coach-profile` | COACH_PROFILE_UPDATE_OWN | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/me/coach-profile/avatar` | COACH_PROFILE_UPDATE_OWN | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/me/course-results` | COURSE_SUMMARY_READ_OWN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/me/course-results/:id/pdf` | COURSE_SUMMARY_READ_OWN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/me/credit` | PAYMENT_READ_OWN, PAYMENT_READ_ALL | `core/be/src/modules/credit/credit.routes.js` |
| GET | `/me/member-profile` | MEMBER_PROFILE_READ_OWN | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/members` | MEMBER_READ | `core/be/src/modules/member/member.routes.js` |
| GET | `/members/:id` | MEMBER_READ | `core/be/src/modules/member/member.routes.js` |
| GET | `/members/:id/credit` | PAYMENT_READ_ALL | `core/be/src/modules/credit/credit.routes.js` |
| GET | `/members/:id/enrollments` | CLASS_ENROLL_FOR_MEMBER, CLASS_READ_ALL | `core/be/src/modules/member/member.routes.js` |
| GET | `/members/:id/profile` | MEMBER_READ | `core/be/src/modules/profile/profile.routes.js` |
| GET | `/members/:memberId/course-history` | ATTENDANCE_MANAGE | `core/be/src/modules/course-history/course-history.routes.js` |
| GET | `/members/:memberId/course-history/:classId` | ATTENDANCE_MANAGE | `core/be/src/modules/course-history/course-history.routes.js` |
| GET | `/members/me` | Xem middleware chung/service | `core/be/src/modules/member/member.routes.js` |
| GET | `/members/summary` | MEMBER_READ | `core/be/src/modules/member/member.routes.js` |
| GET | `/notifications` | Xem middleware chung/service | `core/be/src/modules/notification/notification.routes.js` |
| GET | `/operating-frames` | ROOM_READ, CLASS_CREATE, CLASS_UPDATE, MEMBERSHIP_PLAN_READ, SETTING_READ | `core/be/src/modules/operating-frame/operating-frame.routes.js` |
| GET | `/payments` | PAYMENT_READ_ALL | `core/be/src/modules/payment/payment.routes.js` |
| GET | `/payments/me` | PAYMENT_READ_OWN, PAYMENT_READ_ALL | `core/be/src/modules/payment/payment.routes.js` |
| GET | `/permissions` | ROLE_READ | `core/be/src/modules/permission/permission.routes.js` |
| GET | `/reconciliations` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| GET | `/reconciliations/:id` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| GET | `/reconciliations/summary` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| GET | `/refunds` | PAYMENT_REFUND | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| GET | `/refunds/me` | INVOICE_READ_OWN, SCHEDULE_VIEW_OWN | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| GET | `/reports/course-summaries` | COURSE_SUMMARY_VIEW_ALL | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/reports/course-summaries/export` | COURSE_SUMMARY_VIEW_ALL | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/reports/course-summaries/filters` | COURSE_SUMMARY_VIEW_ALL | `core/be/src/modules/course-summary/course-summary.routes.js` |
| GET | `/reports/dashboard` | Xem middleware chung/service | `core/be/src/modules/report/report.routes.js` |
| GET | `/reports/export` | Xem middleware chung/service | `core/be/src/modules/report/report.routes.js` |
| GET | `/reports/members` | Xem middleware chung/service | `core/be/src/modules/report/report.routes.js` |
| GET | `/reports/members/export` | Xem middleware chung/service | `core/be/src/modules/report/report.routes.js` |
| GET | `/reports/revenue` | Xem middleware chung/service | `core/be/src/modules/report/report.routes.js` |
| GET | `/roles` | ROLE_READ | `core/be/src/modules/role/role.routes.js` |
| GET | `/roles/:id` | ROLE_READ | `core/be/src/modules/role/role.routes.js` |
| GET | `/room-types` | ROOM_READ, CLASS_CREATE, CLASS_UPDATE, MEMBERSHIP_PLAN_CREATE, MEMBERSHIP_PLAN_UPDATE, ATTENDANCE_CHECK_IN | `core/be/src/modules/room-type/room-type.routes.js` |
| GET | `/rooms` | ROOM_READ | `core/be/src/modules/room/room.routes.js` |
| GET | `/rooms/:id/maintenance-preview` | ROOM_UPDATE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| GET | `/schedule/me` | SCHEDULE_VIEW_OWN | `core/be/src/modules/schedule/schedule.routes.js` |
| GET | `/schedule/teaching` | SCHEDULE_VIEW_TEACHING | `core/be/src/modules/schedule/schedule.routes.js` |
| GET | `/schedule/week` | CLASS_READ_ALL | `core/be/src/modules/schedule/schedule.routes.js` |
| GET | `/settings` | SETTING_READ | `core/be/src/modules/setting/setting.routes.js` |
| GET | `/subjects` | SUBJECT_READ | `core/be/src/modules/subject/subject.routes.js` |
| GET | `/users` | USER_READ | `core/be/src/modules/user/user.routes.js` |
| GET | `/users/:id` | USER_READ | `core/be/src/modules/user/user.routes.js` |
| GET | `/users/:id/lock-preview` | USER_DELETE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| PATCH | `/classes/:id/coach` | CLASS_UPDATE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| PATCH | `/classes/sessions/:id` | CLASS_UPDATE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| PATCH | `/classes/sessions/:id/description` | CLASS_UPDATE, SCHEDULE_VIEW_TEACHING | `core/be/src/modules/session-feedback/session-feedback.routes.js` |
| PATCH | `/course-ratings/:id/moderation` | COURSE_RATING_MODERATE | `core/be/src/modules/course-summary/course-summary.routes.js` |
| PATCH | `/members/me` | Xem middleware chung/service | `core/be/src/modules/member/member.routes.js` |
| PATCH | `/notifications/:id/read` | Xem middleware chung/service | `core/be/src/modules/notification/notification.routes.js` |
| PATCH | `/notifications/read` | Xem middleware chung/service | `core/be/src/modules/notification/notification.routes.js` |
| PATCH | `/roles/:id/default` | ROLE_UPDATE | `core/be/src/modules/role/role.routes.js` |
| PATCH | `/users/:id/role` | USER_ASSIGN_ROLE | `core/be/src/modules/user/user.routes.js` |
| PATCH | `/users/:id/status` | USER_UPDATE, USER_DELETE | `core/be/src/modules/user/user.routes.js` |
| POST | `/auth/email-verifications` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/email-verifications/confirm` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/login` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/password-changes` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/password-resets` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/password-resets/confirm` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/password-resets/validate` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/auth/register` | Xem middleware chung/service | `core/be/src/modules/auth/auth.routes.js` |
| POST | `/check-ins` | ATTENDANCE_CHECK_IN | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/classes` | CLASS_CREATE | `core/be/src/modules/class/class.routes.js` |
| POST | `/classes/:id/enrollments` | CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/class/class.routes.js` |
| POST | `/classes/:id/enrollments/me` | CLASS_ENROLL_SELF | `core/be/src/modules/class/class.routes.js` |
| POST | `/classes/:id/orders` | CLASS_ENROLL_SELF, CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/course-order/course-order.routes.js` |
| POST | `/classes/:id/ratings` | COURSE_RATING_WRITE_OWN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| POST | `/classes/:id/summary/publish` | COURSE_SUMMARY_MANAGE_ASSIGNED | `core/be/src/modules/course-summary/course-summary.routes.js` |
| POST | `/classes/:id/summary/reopen` | COURSE_SUMMARY_REOPEN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| POST | `/classes/:id/update-preview` | CLASS_UPDATE | `core/be/src/modules/class/class.routes.js` |
| POST | `/classes/:id/waitlist/me` | CLASS_ENROLL_SELF | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/classes/sessions/:id/attendance-unlock` | ATTENDANCE_MANAGE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/classes/sessions/:id/cancellation` | CLASS_DELETE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/classes/sessions/:id/excuse` | CLASS_CANCEL_SELF, CLASS_ENROLL_FOR_MEMBER | `core/be/src/modules/attendance/attendance-excuse.routes.js` |
| POST | `/classes/sessions/:id/reschedule-preview` | CLASS_UPDATE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/enrollments/:id/cancel` | Xem middleware chung/service | `core/be/src/modules/cancellation/cancellation.routes.js` |
| POST | `/enrollments/:id/change` | Xem middleware chung/service | `core/be/src/modules/purchase-change/purchase-change.routes.js` |
| POST | `/invoices/:id/apply-credit` | PAYMENT_CHECKOUT, PAYMENT_RECORD_CASH | `core/be/src/modules/credit/credit.routes.js` |
| POST | `/invoices/:id/claims` | PAYMENT_CHECKOUT | `core/be/src/modules/payment/invoice.routes.js` |
| POST | `/invoices/:id/refund` | PAYMENT_REFUND | `core/be/src/modules/payment/invoice.routes.js` |
| POST | `/members` | MEMBER_CREATE | `core/be/src/modules/member/member.routes.js` |
| POST | `/members/:id/booking-unblock` | CLASS_UNBLOCK | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/operating-frames` | SETTING_UPDATE | `core/be/src/modules/operating-frame/operating-frame.routes.js` |
| POST | `/payments/invoices/:invoiceId/cash` | PAYMENT_RECORD_CASH | `core/be/src/modules/payment/payment.routes.js` |
| POST | `/payments/sepay/webhook` | Xem middleware chung/service | `core/be/src/modules/payment/sepay.routes.js` |
| POST | `/reconciliations/:id/accept` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/confirm` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/contacts` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/ignore` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/map` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/refund` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/reject` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/:id/renew` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/reconciliations/sync` | Xem middleware chung/service | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/refunds/:id/complete` | PAYMENT_REFUND | `core/be/src/modules/reconciliation/reconciliation.routes.js` |
| POST | `/roles` | ROLE_CREATE | `core/be/src/modules/role/role.routes.js` |
| POST | `/room-types` | ROOM_CREATE | `core/be/src/modules/room-type/room-type.routes.js` |
| POST | `/rooms` | ROOM_CREATE | `core/be/src/modules/room/room.routes.js` |
| POST | `/rooms/:id/maintenance` | ROOM_UPDATE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| POST | `/subjects` | SUBJECT_CREATE | `core/be/src/modules/subject/subject.routes.js` |
| POST | `/users` | USER_CREATE | `core/be/src/modules/user/user.routes.js` |
| POST | `/users/:id/email-verification` | USER_VERIFY_EMAIL | `core/be/src/modules/user/user.routes.js` |
| PUT | `/classes/:id` | CLASS_UPDATE | `core/be/src/modules/class/class.routes.js` |
| PUT | `/classes/:id/ratings` | COURSE_RATING_WRITE_OWN | `core/be/src/modules/course-summary/course-summary.routes.js` |
| PUT | `/classes/:id/summary/items/:itemId` | COURSE_SUMMARY_MANAGE_ASSIGNED | `core/be/src/modules/course-summary/course-summary.routes.js` |
| PUT | `/classes/sessions/:id/attendance` | ATTENDANCE_RECORD, ATTENDANCE_MANAGE | `core/be/src/modules/sprint3/sprint3.routes.js` |
| PUT | `/classes/sessions/:id/feedback/:memberId` | ATTENDANCE_RECORD, ATTENDANCE_MANAGE | `core/be/src/modules/session-feedback/session-feedback.routes.js` |
| PUT | `/me/coach-profile` | COACH_PROFILE_UPDATE_OWN | `core/be/src/modules/profile/profile.routes.js` |
| PUT | `/me/coach-profile/avatar` | COACH_PROFILE_UPDATE_OWN | `core/be/src/modules/profile/profile.routes.js` |
| PUT | `/me/member-profile` | MEMBER_PROFILE_UPDATE_OWN | `core/be/src/modules/profile/profile.routes.js` |
| PUT | `/members/:id` | MEMBER_UPDATE | `core/be/src/modules/member/member.routes.js` |
| PUT | `/members/:id/profile` | MEMBER_UPDATE | `core/be/src/modules/profile/profile.routes.js` |
| PUT | `/operating-frames/:id` | SETTING_UPDATE | `core/be/src/modules/operating-frame/operating-frame.routes.js` |
| PUT | `/roles/:id` | ROLE_UPDATE | `core/be/src/modules/role/role.routes.js` |
| PUT | `/room-types/:id` | ROOM_UPDATE | `core/be/src/modules/room-type/room-type.routes.js` |
| PUT | `/rooms/:id` | ROOM_UPDATE | `core/be/src/modules/room/room.routes.js` |
| PUT | `/settings` | SETTING_UPDATE | `core/be/src/modules/setting/setting.routes.js` |
| PUT | `/subjects/:id` | SUBJECT_UPDATE | `core/be/src/modules/subject/subject.routes.js` |
| PUT | `/users/:id/subjects` | USER_UPDATE | `core/be/src/modules/user/user.routes.js` |
