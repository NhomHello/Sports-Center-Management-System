# API Sprint 4

Phạm vi chốt 26/10: hồ sơ HLV/hội viên, tổng kết khoá, đánh giá và báo cáo. Ngày 29/10, Bảo nhận thêm toàn bộ task của Nhanh, gồm nền dữ liệu và báo cáo full-stack, trên `sprint-4/be-bao`. Khôi giữ phần hồ sơ, Khải giữ giao diện tổng kết/đánh giá. Không triển khai AI hoặc kế hoạch tập luyện đã huỷ.

## Nền dữ liệu và tích hợp

Dùng chung migration `20261029073309_sprint4_profiles_summaries_ratings` và các model trong bản nền hồ sơ của Khôi: `CoachProfile`, `MemberProfile`, `CourseSummary`, `CourseSummaryItem`, `CourseRating`. Giữ nguyên tên/cột để hai nhánh tích hợp được; migration chỉ thêm bảng và enum COMPLETED, không xoá bảng legacy. Nguồn nền: worktree `SWP309-sprint4-khoi`, ghi đồng tác giả trong commit nền.

Chạy `npm run db:deploy -w @scms/be`, `npm run db:generate`, `npm run db:seed`. Quyền role đang có vẫn do quản lý cấu hình; không so sánh tên role trong nghiệp vụ. Hồ sơ do Khôi nối các API `/me/coach-profile`, `/coaches`, `/coaches/:id`, `/me/member-profile`, `/members/:id/profile`, `/coach/members`, `/coach/members/:id`.

## Tổng kết và đánh giá (Bảo)

Tất cả URL nằm dưới API prefix hiện tại. Response JSON dùng envelope chung, controller chỉ đọc `req.validated`.

| Method | URL | Quyền / dữ liệu |
| --- | --- | --- |
| GET | `/classes/:id/summary` | `course_summary.manage_assigned` và đúng HLV bản tổng kết, hoặc `course_summary.view_all` chỉ đọc |
| PUT | `/classes/:id/summary/items/:itemId` | HLV phụ trách; `{ result: PASS\|NOT_PASSED, progress: 1..5, comment, nextCourse }` |
| POST | `/classes/:id/summary/publish` | HLV phụ trách; `{ acknowledgeMissingAttendance?: boolean }` |
| POST | `/classes/:id/summary/reopen` | `course_summary.reopen`; `{ reason }` không rỗng |
| GET | `/me/course-results` | `course_summary.read_own`; chỉ kết quả của token, đã công bố |
| GET | `/me/course-results/:id/pdf` | `id` của summary item; chỉ chủ kết quả đã công bố |
| POST/PUT | `/classes/:id/ratings` | `course_rating.write_own`; `{ courseStars: 1..5, coachStars: 1..5, comment }` |
| GET | `/coaches/:id/ratings` | `coach_profile.read` hoặc quyền lập/xem tổng kết; phân trang, tên viết tắt; quản lý có `course_rating.moderate` xem danh tính |
| PATCH | `/course-ratings/:id/moderation` | `course_rating.moderate`; `{ hidden: boolean, reason }` |
| GET | `/reports/course-summaries` | `course_summary.view_all` riêng biệt với `report.view`; `from,to,subjectId?,coachId?` |
| GET | `/reports/course-summaries/export` | Cùng quyền/bộ lọc; Excel lấy cùng hàm build |

Một summary/lớp, một item/hội viên BOOKED tại thời điểm kết thúc. `summary.coachId` là HLV chịu trách nhiệm khi kết thúc. Tổng chuyên cần loại buổi huỷ, đếm buổi học từ lúc đăng ký; `present/(total-excused)`; mẫu số 0 trả 0, chưa điểm danh là cảnh báo. Cấu hình ngưỡng gợi ý Đạt từ DB; chọn khác phải có nhận xét. Công bố cần đủ kết quả/tiến bộ và xác nhận cảnh báo chưa điểm danh. Bản công bố khoá sửa; mở lại có audit; công bố lại tăng revision và gửi thông báo cập nhật. PDF có mã tra cứu nhưng không mở endpoint tra cứu công khai.

Hạn đánh giá tính từ thời điểm lớp kết thúc (buổi cuối không huỷ), không từ ngày công bố. Mỗi hội viên một đánh giá/lớp, ngoài hạn trả lỗi nghiệp vụ. Ẩn nhận xét giữ nguyên điểm số để không sửa trung bình bằng moderation; nội dung ẩn không xuất hiện trên hồ sơ công khai.

## Báo cáo theo thời gian (Bảo nhận từ Nhanh)

`GET /reports/dashboard`, `/reports/revenue`, `/reports/export` giữ API cũ. Query bắt buộc `from,to` (ngày Việt Nam, gồm cả ngày cuối), tuỳ chọn `memberId,planId,groupBy=day|week|month|quarter|year,compare=previous`. Export thêm `format=csv|xlsx|pdf`. Mặc định groupBy=day. `REPORT_MAX_DAYS_BY_GROUP` giới hạn độ dài; tuần bắt đầu thứ Hai. Trả `rows` theo kỳ và `comparison` với kỳ liền trước có cùng số ngày (nếu yêu cầu). Kỳ trước bằng 0 trả phần trăm `null`, UI hiện “—”.

`breakdown` có `byKind`, `byChannel`, `byPlan`, `byClass`, `bySubject`; từng chiều tổng net bằng net toàn báo cáo. Nhóm `ADJUSTMENT` giữ riêng chênh lệch, không cộng vào doanh thu sản phẩm gốc. Phần trả bằng CREDIT không tính lại. Hoàn tiền thực tế theo completedAt, tối đa phần tiền ngoài số dư đã được tính doanh thu của invoice. Không tính khoản hoàn chuyển thừa/sai mã vào doanh thu bán gói.

`GET /reports/members` và `/reports/members/export` dùng cùng groupBy/ngày/giới hạn; quyền `report.view`. Trả số hội viên mới, kỳ gói hiệu lực giao với từng kỳ, đăng ký khoá mới, huỷ gói/huỷ đăng ký và tỉ lệ lấp đầy lớp. Xuất dùng cùng builder với màn hình.
