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

## Hồ sơ HLV / hội viên (Khôi)

Nhóm endpoint hồ sơ dùng JWT và kiểm tra permission trên từng đường dẫn, không áp dụng middleware JWT lên các endpoint công khai khác (ví dụ webhook SePay).

| Method | URL | Contract |
| --- | --- | --- |
| GET/PUT | `/me/coach-profile` | `coach_profile.update_own`. PUT chỉ nhận `bio, experienceYears, certifications: string[], publicEmail, publicPhone, zalo, showContact`. GET thêm giới hạn `bioMaxLength`, `avatarMaxBytes`, `hasAvatar`, `avatarUpdatedAt`. |
| PUT | `/me/coach-profile/avatar` | Body binary với Content-Type `image/png` hoặc `image/jpeg`, tối đa 2 MB; kiểm tra chữ ký ảnh, ghi audit cùng thay đổi. |
| GET | `/me/coach-profile/avatar`, `/coaches/:id/avatar` | Ảnh binary cần JWT; endpoint công khai hồ sơ dùng quyền `coach_profile.read` và cùng điều kiện HLV đang hoạt động. |
| GET | `/coaches`, `/coaches/subjects` | `coach_profile.read`. Danh sách hỗ trợ `q, subjectId, page, pageSize`. Chỉ HLV ACTIVE có quyền giảng dạy và chuyên môn hoạt động. Bộ lọc có cả HLV chưa có lớp. |
| GET | `/coaches/:id` | Giới thiệu, chuyên môn, lớp OPEN, trung bình đánh giá và nhận xét tên viết tắt. Khi tắt chia sẻ, không trả `contact` hay các trường liên hệ thô. Không trả role/email đăng nhập/ngày tạo. |
| GET/PUT | `/me/member-profile` | `member_profile.read_own` / `member_profile.update_own`. `birthDate` là `YYYY-MM-DD` hoặc null; kiểm tra tương lai theo ngày lịch Việt Nam. |
| GET/PUT | `/members/:id/profile` | Nhân viên có `member.read` / `member.update` đọc/sửa hộ; thay đổi có audit. |
| GET | `/coach/members`, `/coach/members/:id` | `member_profile.view_assigned`; danh sách hỗ trợ `q, page, pageSize`; ngoài phân công trả 403. |

Hồ sơ tập luyện nhận `birthDate, gender (MALE/FEMALE/OTHER/UNDISCLOSED), heightCm, weightKg, goals, level (BEGINNER/INTERMEDIATE/ADVANCED), healthNotes, emergencyName, emergencyPhone, shareWithCoach`. Các trường ngày sinh/giới tính/số đo/liên hệ khẩn cấp có thể để null. Email/điện thoại/Zalo công khai là thông tin tự nguyện, Zalo dùng số điện thoại. Email công khai mặc định từ email đăng nhập khi tạo hồ sơ và sau đó độc lập với thông tin đăng nhập.

Scope HLV xét buổi thực sự được phân công, thời điểm đăng ký/huỷ và hạn sau buổi cuối không huỷ, đọc `COACH_MEMBER_VIEW_DAYS`. Chỉ trả chuyên cần trong các buổi của HLV đó và tổng kết đã công bố của chính HLV đó. Khi `shareWithCoach=false`, response không có `trainingProfile`; không trả invoice, membership hoặc số dư. Audit hồ sơ lưu tên trường đã thay đổi, không sao chép ghi chú sức khoẻ hoặc blob ảnh vào nhật ký.

## Giao diện tổng kết và đánh giá (Khải)

- `GET /course-summaries?q=&status=&page=&pageSize=`: `course_summary.manage_assigned` lọc theo tác giả của bản tổng kết; `course_summary.view_all` mở phạm vi toàn bộ. Khuôn response phân trang chung, trường công khai của lớp/HLV và số item.
- `GET /classes/:id/ratings/me`: `course_rating.write_own`, chỉ hội viên có item tổng kết của lớp. Trả `{ rating, canRate, deadlineAt, reason }`, deadline tính từ buổi cuối không hủy và cấu hình hiện tại; đánh giá cũ vẫn đọc được khi hết hạn. POST/PUT tiếp tục kiểm tra hạn trong transaction.
- `GET /course-ratings/coaches`: `course_rating.moderate`, danh sách ID/tên HLV đã nhận đánh giá để mở giao diện kiểm duyệt.
- `GET /reports/course-summaries/filters`: `course_summary.view_all`, trả bộ môn/HLV của tổng kết; không yêu cầu `report.view` hoặc quyền danh mục.
- GET tổng kết ở trạng thái PUBLISHED trả `attendance` từ snapshot đã công bố, đồng nhất với kết quả hội viên/PDF/báo cáo. Mở lại DRAFT dùng điểm danh thực tế để HLV điều chỉnh và công bố bản mới.
