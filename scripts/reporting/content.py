"""Reviewed current scope; historical packages are retained data, not current sales."""
REVIEW_DATE = "2026-11-05"
RUNTIME_BASELINE = "801f9e6"
TEST_EVIDENCE = "Đã kiểm tra tại main 801f9e6 ngày 04/11/2026: 282 test BE và 172 test FE đạt; lint/build đạt. Hai E2E course-only và course-session-history đạt theo từng file; đây không phải tuyên bố toàn bộ bộ E2E đã chạy lại. Giao dịch ngân hàng trong kiểm thử là mô phỏng, không chuyển tiền thật."
FEATURES = [('F01',
  'Tài khoản và phân quyền',
  'Đăng ký, xác minh email, đăng nhập bằng email/SĐT, đổi/đặt lại mật khẩu, khoá tài khoản; role/permission đọc từ DB. Tạo '
  'tài khoản không tự đăng ký khóa hay tạo hóa đơn.',
  'Tất cả; quản lý',
  'auth, user, role, permission',
  'auth.test.js; rbac.test.js; email-flows.spec.mjs'),
 ('F02',
  'Hội viên và hồ sơ',
  'Tìm/sửa hội viên; hồ sơ tập luyện và chia sẻ; danh bạ HLV, ảnh, liên hệ công khai.',
  'Hội viên, HLV, lễ tân',
  'member, profile',
  'sprint4-member-profile.test.js; sprint4-profiles.spec.mjs'),
 ('F03',
  'Danh mục khóa học',
  'Bán khóa học theo giá trọn khóa; học phí giữa khóa tính theo số buổi còn lại. API bán gói tự tập đã nghỉ sử dụng, dữ '
  'liệu cũ chỉ giữ đối chiếu.',
  'Hội viên, lễ tân, quản lý',
  'class, course-order',
  'course-checkout-race.test.js; course-only.spec.mjs'),
 ('F04',
  'Nguồn lực và cấu hình lớp',
  'Bộ môn, chuyên môn HLV, loại phòng, phòng, khung giờ; tạo lớp và các buổi; kiểm tra xung đột.',
  'Quản lý',
  'subject, room, room-type, operating-frame, class',
  'sprint2-class-rules.test.js; sprint2-management.spec.mjs'),
 ('F05',
  'Đăng ký và danh sách chờ',
  'Giữ PENDING_PAYMENT, BOOKED sau khi xác nhận đủ tiền. FIFO chỉ mời khi khóa OPEN và còn hạn đăng ký; nút đã mua hiện Đã '
  'đăng ký bị khóa.',
  'Hội viên, nhân viên hỗ trợ',
  'class, course-order',
  'course-checkout-race.test.js; course-session-history.spec.mjs'),
 ('F06',
  'Lịch và thông báo thay đổi',
  'Lịch trung tâm/cá nhân/lịch dạy; đổi HLV/giờ/phòng; bảo trì; huỷ lớp/buổi và thông báo qua outbox.',
  'Quản lý, HLV, hội viên',
  'schedule, class, notification',
  'sprint3-khoi-ui.spec.mjs; sprint2-khoi-excel.spec.mjs'),
 ('F07',
  'Điểm danh và nhận xét theo khóa',
  'Chọn khóa của hội viên để xem đủ Buổi 1–N: giờ, HLV, điểm danh, đánh giá và note trên cùng dòng, kể cả chưa có kết quả.',
  'Hội viên chính chủ; admin; HLV ghi tại buổi phụ trách',
  'attendance, session-feedback, course-history',
  'course-history.test.js; course-session-history.spec.mjs'),
 ('F08',
  'Thanh toán và biên lai',
  'Thu tiền mặt tại quầy hoặc online SePay; snapshot giá; webhook chống trùng; deadline và khoảng chờ thông báo ngân hàng; '
  'chốt chỗ dưới khóa DB.',
  'Hội viên, nhân viên thu tiền',
  'payment, course-order',
  'sepay-webhook.test.js; course-payment-deadline.test.js; payment-deadline.spec.mjs'),
 ('F09',
  'Đối soát và hoàn tiền',
  'Cộng các giao dịch cùng hóa đơn, xử lý thiếu/thừa/sai mã/tiền muộn/trùng lịch; tiền phải được phân bổ hoặc hoàn xong, '
  'không bỏ phiếu có tiền để làm sạch danh sách.',
  'Nhân viên có permission; hội viên khai báo',
  'reconciliation',
  'course-payment-resolution.test.js; course-refund-closure.test.js'),
 ('F10',
  'Hủy khóa và lịch sử hoàn',
  'Preview buổi chưa diễn ra, phí và số được hoàn. Hủy tạo mã HT… để hội viên liên hệ admin chuyển trả, không ghi tiền hủy '
  'vào ví; lưu snapshot lịch sử và thông báo đúng phạm vi.',
  'Hội viên; nhân viên có quyền hoàn/hỗ trợ',
  'cancellation, cancellation-history, refund',
  'course-cancellation-history.test.js; course-cancellation-history.spec.mjs'),
 ('F11',
  'Tổng kết và kết quả khóa',
  'Job kết thúc lớp; nháp, công bố, mở lại; snapshot chuyên cần, revision; hội viên xem kết quả và PDF.',
  'HLV phụ trách; quản lý; hội viên',
  'course-summary',
  'sprint4-course.test.js; sprint4-courses.spec.mjs'),
 ('F12',
  'Đánh giá và kiểm duyệt',
  'Một đánh giá mỗi học viên/lớp trong hạn; HLV thấy tên viết tắt; quản lý ẩn nhận xét kèm lý do.',
  'Hội viên; HLV; quản lý',
  'course-summary',
  'sprint4-rating-report.test.js; sprint4-courses.spec.mjs'),
 ('F13',
  'Báo cáo và xuất dữ liệu',
  'Doanh thu thu–hoàn–thuần, cơ cấu, kỳ trước, nhóm ngày/tuần/tháng/quý/năm; hội viên và báo cáo tổng kết.',
  'Người có report.view hoặc quyền tổng kết riêng',
  'report, course-summary',
  'sprint4-reports.test.js; sprint4-reports.spec.mjs'),
 ('F14',
  'Cấu hình, audit và tái tạo dữ liệu',
  'Phí hủy ở Cấu hình → Lớp học; hạn/grace đọc settings. Script refresh mặc định preview; --yes mới thay dữ liệu nghiệp vụ '
  'trong transaction, giữ admin/cấu hình.',
  'Quản lý; tài khoản chính chủ',
  'setting, audit, notification; prisma/seed/course-only',
  'verify:course-refresh; settings.test.js')]

RULES = [('Tài khoản và quyền',
  'BR-1.1, BR-1.10: email/SĐT chuẩn hoá và duy nhất; đăng nhập sai dùng thông báo chung. Nguồn: auth/auth.service.js; '
  'common/utils/account-contacts.js.'),
 ('Đăng nhập và phiên',
  'Tài khoản có email phải xác minh email trước khi đăng nhập; ACTIVE mới được truy cập. Khoá tài khoản/đổi mật khẩu thu '
  'hồi hiệu lực phiên theo tokenVersion. Nguồn: auth/auth.service.js; common/middlewares/auth.middleware.js.'),
 ('Phân quyền động',
  'Menu chỉ hỗ trợ trải nghiệm; API kiểm tra permission và phạm vi bản ghi. Một user có một role; role có nhiều permission '
  'qua RolePermission. Nguồn: schema.prisma; common/middlewares/authorize.middleware.js.'),
 ('Lịch sử dữ liệu',
  'BR-0.1/0.2: dữ liệu nghiệp vụ đã tham chiếu giữ lịch sử; thay đổi quan trọng có audit. Không dùng xoá danh mục để xoá '
  'giao dịch. Nguồn: các service class, membership-plan, audit.'),
 ('Tạo lịch lớp',
  'HLV đúng chuyên môn, loại phòng hỗ trợ bộ môn; buổi nằm trong một khung hoạt động; không trùng phòng/HLV; lịch lớp và '
  'buổi được tạo trong transaction. Nguồn: class/class-schedule.service.js.'),
 ('Đăng ký lớp',
  'Tài khoản ACTIVE, đúng cửa sổ đăng ký, còn buổi tương lai, không bị chặn và không trùng lịch. Cùng luật cho tự đăng ký '
  'và nhân viên làm hộ. Nguồn: class/class-booking-policy.service.js.'),
 ('Sức chứa và giữ chỗ',
  'BOOKED cộng giữ chỗ thanh toán/lời mời còn hạn không vượt capacity; khoá giao dịch chống hai người lấy chỗ cuối. Nguồn: '
  'class/class-member-eligibility.service.js; common/utils/schedule-transaction.js.'),
 ('Danh sách chờ',
  'FIFO theo joinedAt/ID; chỉ mời khi khóa OPEN và còn hạn đăng ký. offeredUntil không vượt registrationEndAt; lời mời giữ '
  'sức chứa nhưng chưa BOOKED. Hết hạn đăng ký không tự mời dù có người hủy. Nguồn: class/class-waitlist.service.js.'),
 ('Huỷ đăng ký miễn phí',
  'Mốc huỷ do backend trả; phải trước hạn hoặc có ngoại lệ hợp lệ. Đăng ký khóa đã trả tiền dùng luồng huỷ khóa để tính '
  'quyền lợi. Nguồn: class/class-booking-policy.service.js.'),
 ('Điểm danh',
  'Buổi chưa bắt đầu/đã hủy/đã kết thúc bị khóa theo điều kiện; sửa sau kết thúc cần quyền ngoại lệ. Bản xin nghỉ cũ không '
  'cấp lại quyền ghi điểm danh cho buổi sau khi đã rút khóa. Nguồn: attendance/attendance.service.js.'),
 ('Xin nghỉ',
  'Hạn xin nghỉ riêng do backend tính; không dùng hạn huỷ cả khóa để suy ra. EXCUSED không tính vào mẫu số chuyên cần. '
  'Nguồn: attendance/attendance-excuse.service.js; course-summary/course-attendance.service.js.'),
 ('Mua khóa giữa kỳ',
  'Học phí = làm tròn tới nghìn (giá khóa × buổi còn lại / tổng buổi); tạo PENDING_PAYMENT và giữ chỗ, chỉ BOOKED khi đủ '
  'tiền. Nguồn: cancellation/settlement.js; course-order/course-order.service.js.'),
 ('Hóa đơn',
  'Mã duy nhất, snapshot giá và số buổi tại lúc mua. Hạn chuyển tiền mặc định 15 phút; quầy không có grace ngân hàng. Nhả '
  'chỗ thực hiện bằng worker, nhưng mọi phép ghi vẫn kiểm tra hạn dưới khóa DB. Nguồn: payment/invoice-create.service.js; '
  'invoice-expiry.job.js.'),
 ('Webhook thanh toán',
  'Xác thực API key, idempotent theo ID SePay. transactionDate theo giờ Việt Nam; tiền đúng hạn có thể được nhận trong '
  'grace. Thiếu timestamp hoặc giây ranh giới không đủ chứng cứ khi đến trễ thì đối soát. Nguồn: payment/sepay-time.js; '
  'sepay-course-policy.service.js.'),
 ('Thiếu hoặc thừa tiền',
  'Chỉ tổng đúng giá mới tự PAID. Chuyển thiếu không kéo hạn khóa học thêm 48 giờ. Bù thành thừa đóng phiếu thiếu, còn '
  'phiếu thừa chờ duyệt; hết giữ chỗ chưa được chấp nhận thì nhả chỗ và hoàn cả số đã nhận. Nguồn: '
  'payment/payment-apply.service.js; payment-case-closure.service.js.'),
 ('Hoàn tiền',
  'Refund PENDING chỉ DONE khi nhân viên thực sự chuyển trả và nhập tham chiếu. Mã HT… là mã tra cứu sinh từ ID, khác tham '
  'chiếu ngân hàng. Không có API tự chuyển tiền ngân hàng. Nguồn: reconciliation/refund-reference.js; refund.service.js.'),
 ('Hủy khóa đã thanh toán',
  'Hủy khóa đã thanh toán: đơn giá từ hóa đơn/số buổi đã mua × số buổi chưa diễn ra; loại khoản chuyển thừa và các buổi đã '
  'trả riêng. Trước buổi đã mua đầu tiên phí 0, sau đó trừ % CANCELLATION_FEE_PERCENT. Chỉ REFUND qua admin, từ chối '
  'CREDIT. Nguồn: cancellation/purchase-value.service.js; settlement.js; cancellation.validation.js.'),
 ('Đổi khóa học',
  'Đổi khóa dùng preview của đích; nếu phải trả thêm tạo ADJUSTMENT và giữ quyền học cũ đến khi đủ tiền. Phần trả lại của '
  'đổi lớp đi qua yêu cầu hoàn REFUND. API bán/đổi gói tự tập không thuộc luồng hiện hành. Nguồn: '
  'purchase-change/purchase-change-request.service.js; purchase-change.validation.js.'),
 ('Hồ sơ HLV',
  'BR-S4-01/02: publicEmail khác email đăng nhập; chỉ công khai liên hệ khi bật showContact; danh bạ chỉ HLV ACTIVE đủ '
  'chuyên môn. Nguồn: profile/profile.service.js; coach-directory.service.js.'),
 ('Hồ sơ học viên',
  'BR-S4-03/04: phạm vi theo các buổi thực dạy và thời gian được xem; ngoài phạm vi 403. shareWithCoach=false không trả '
  'trainingProfile; không trả dữ liệu tài chính. Nguồn: profile/coach-member-scope.service.js; coach-members.service.js.'),
 ('Kết thúc lớp',
  'BR-S4-05/10: OPEN/CLOSED chỉ COMPLETED khi có ít nhất một buổi không huỷ và mọi buổi đó đã qua; CANCELLED không tổng '
  'kết. Snapshot học viên theo trạng thái tại lúc kết thúc, kể cả huỷ sau đó. Nguồn: '
  'course-summary/course-completion.job.js.'),
 ('Chuyên cần',
  'BR-S4-06: PRESENT / (buổi đã diễn ra từ ngày đăng ký − EXCUSED); buổi huỷ bị loại; mẫu số 0 trả 0. Chưa điểm danh được '
  'đếm missing. Nguồn: course-summary/course-attendance.service.js.'),
 ('Nháp tổng kết',
  'BR-S4-08: chỉ HLV phụ trách sửa nháp. Gợi ý đạt theo ngưỡng cấu hình; chọn khác gợi ý bắt buộc nhận xét. Nguồn: '
  'course-summary/course-summary.service.js.'),
 ('Công bố tổng kết',
  'BR-S4-09: mọi học viên đủ kết quả và tiến bộ; phải xác nhận khi thiếu điểm danh. Snapshot, revision, trạng thái và '
  'outbox ghi cùng transaction. Nguồn: course-summary/course-summary.service.js.'),
 ('Mở lại tổng kết',
  'Quản lý có permission riêng, bắt buộc lý do; PUBLISHED → DRAFT; công bố lại tăng revision. Kết quả đã công bố giữ '
  'snapshot tới khi mở lại/công bố lại. Nguồn: course-summary/course-summary.service.js.'),
 ('Đánh giá khóa',
  'BR-S4-11: học viên có item tổng kết, một đánh giá/lớp, sao 1–5; hạn theo buổi cuối không huỷ, không theo ngày công bố. '
  'Moderation ẩn nhận xét, không xoá điểm sao. Nguồn: course-summary/course-rating*.service.js.'),
 ('Thông báo và email',
  'In-app chống trùng theo sự kiện/người nhận; SMTP thiếu/lỗi không được báo đã gửi. Email có retry theo cơ chế '
  'at-least-once nên không cam kết gửi đúng một lần. Nguồn: class/class-event.service.js; '
  'course-summary/course-email.service.js.'),
 ('Báo cáo doanh thu',
  'BR-S4-12: thu theo invoice.paidAt, hoàn hợp lệ DONE theo completedAt; phần CREDIT không tính thu lần hai; thuần = thu − '
  'hoàn được ghi nhận. Nguồn: report/report-finance.service.js.'),
 ('Kỳ và cơ cấu báo cáo',
  'BR-S4-13/14/15: giờ Việt Nam, tuần thứ Hai; kỳ trước cùng số ngày; mẫu số 0 trả null. Cơ cấu gồm nhóm khác/chênh lệch để '
  'khớp thuần; giới hạn khoảng đọc cấu hình. Nguồn: report/report-periods.js; report-breakdown.service.js.'),
 ('Xuất báo cáo',
  'Bảng/biểu đồ và CSV/XLSX/PDF dùng cùng bộ lọc, grouping và builder; quyền báo cáo tổng kết tách report.view. Nguồn: '
  'report/report-export.service.js; course-summary/course-report.service.js.'),
 ('Giao diện và dữ liệu dài',
  'Lịch sử chọn khóa rồi xem mọi buổi theo thứ tự thời gian, không giới hạn cứng 20. Kết quả null hiển thị Chưa điểm '
  'danh/Chưa có nhận xét, không suy thành ABSENT. Nguồn: course-history; pages/course-history; utils/courseHistory.js.'),
 ('Phạm vi bán hàng',
  'Chỉ bán khóa học; MembershipPlan/Membership và các bảng cũ còn trong DB để giữ FK/chứng từ, không phải chức năng đang '
  'mở. /memberships và /membership-plans trả 410. Nguồn: membership/retired-membership.routes.js.'),
 ('Giờ chuyển tiền và grace',
  'Mặc định 15 phút chuyển tiền + 120 giây chờ webhook, đọc PAYMENT_ONLINE_TIMEOUT_MINUTES và '
  'PAYMENT_WEBHOOK_GRACE_SECONDS. Grace không phải thời gian khách được chuyển thêm. Nguồn: '
  'payment/course-payment-window.service.js.'),
 ('Mốc chốt transaction',
  'Giờ server chốt lấy sau khi có khóa và giữ nguyên trong transaction. Thu quầy trước hạn được chấp nhận dù commit sau '
  'hạn; request chờ khóa quá hạn bị từ chối. Nguồn: payment/payment-apply.service.js; payment.service.js.'),
 ('Tiền đúng hạn nhưng webhook trễ',
  'Ngân hàng ghi nhận trước deadline và webhook trong grace thì được xét nhận nếu giữ chỗ/lịch còn hợp lệ. Quá grace hoặc '
  'đã nhả chỗ thì đối soát, không tự giành lại chỗ. Nguồn: payment/sepay-course-policy.service.js; '
  'course-payment-window.service.js.'),
 ('Trùng lịch trong lúc thanh toán',
  'Kiểm tra BOOKED và PENDING_PAYMENT của cùng hội viên khi checkout và khi áp dụng tiền. Tiền đã vào nhưng trùng lịch mở '
  'SCHEDULE_CONFLICT, không ghi nhận vào lớp xung đột. Nguồn: class/class-member-conflicts.service.js; '
  'course-hold-policy.service.js.'),
 ('Tổng tiền thiếu/thừa',
  'Nhiều giao dịch khác ID cùng mã được cộng dồn; cùng ID không cộng lại. Sau khi bù đủ thì phiếu thiếu đóng, kể cả phát '
  'sinh phần thừa cần xử lý riêng. Nguồn: payment/payment-case-closure.service.js.'),
 ('Kết thúc nghĩa vụ hoàn',
  'Khi tiền đã áp dụng được hoàn hết và không còn lệnh đang chờ, khép các phiếu thiếu/thừa cũ. Không đóng nhầm khoản tiền '
  'muộn/chuyển lặp chưa gán. Nguồn: reconciliation/refund-case-closure.service.js.'),
 ('Mã hoàn và UI',
  'Hội viên xem Hồ sơ cá nhân → Lịch sử hủy khóa học hoặc Hóa đơn → Yêu cầu hoàn tiền của tôi; admin tìm mã tại Theo dõi '
  'hoàn tiền. Mã HT tra chính xác, không làm thay đổi số tiền khi tìm. Nguồn: cancellation-history; '
  'reconciliation/refund-history.service.js.'),
 ('Thông báo khi hủy',
  'Hội viên nhận xác nhận/mã hoàn; người ACTIVE có payment.refund nhận yêu cầu; HLV các buổi còn lại chỉ nhận việc rút lớp; '
  'người đủ điều kiện tiếp theo nhận mời FIFO. Sau DONE hội viên mới nhận Đã hoàn tiền. Nguồn: '
  'cancellation/cancellation-record.service.js; reconciliation/refund-notification.service.js.'),
 ('Lịch sử không bị ghi đè',
  'Hủy chỉ đổi trạng thái, giữ Invoice/Payment/Attendance/Feedback. Snapshot trong audit và PurchaseChange giữ '
  'tên/giá/buổi/lý do; mua lại cùng lớp không ghi đè lần hủy cũ. Nguồn: cancellation-history; '
  'cancellation/cancellation-record.service.js.'),
 ('Riêng tư lịch sử buổi',
  'Own API lấy memberId từ JWT; staff cần attendance.manage. Ghép cả sessionId và memberId; đoán khóa ngoài phạm vi trả '
  '404, không JWT 401, thiếu quyền 403. Nguồn: course-history/course-history.routes.js; course-history.service.js.'),
 ('Khóa đã đăng ký',
  'Enrollment BOOKED hiển thị Đã đăng ký và khóa nút mua, giữ thao tác hủy/đổi riêng. PENDING_PAYMENT không bị trình bày '
  'thành đã vào lớp. Nguồn: pages/schedule/CourseOrderControls.jsx.'),
 ('Reset dữ liệu có kiểm soát',
  'npm run db:refresh:courses chỉ preview; -- --yes mới clear + map + validate trong một transaction. Giữ '
  'admin/settings/SePay/phân quyền, không reset AUTO_INCREMENT; lỗi rollback; từ chối production. Nguồn: '
  'prisma/seed/course-only.')]

DEMO = [('00:00–02:00',
  2,
  'Khải',
  'Slide 1–2',
  'Giới thiệu bốn thành viên, vấn đề vận hành và phạm vi đã làm.',
  'Không đọc liệt kê tính năng; nêu một ca tiền về nhưng lớp chưa được đăng ký.'),
 ('02:00–05:00',
  3,
  'Bảo / Khôi',
  'Slide 3–4',
  'Mô hình chỉ bán khóa học; API/transaction/worker và phạm vi bốn vai trò.',
  'Nêu dữ liệu gói cũ chỉ giữ lịch sử, không demo mua gói hoặc ví.'),
 ('05:00–06:00',
  1,
  'Nhanh',
  'Slide 5',
  'Mở kịch bản demo, tình huống lỗi và tiêu chí thành công.',
  'Chuyển sang bốn browser profile đã đăng nhập sẵn.'),
 ('06:00–10:00',
  4,
  'Bảo',
  'Hội viên → Hóa đơn',
  'Chọn khóa, giữ chỗ, QR; giả lập chuyển thiếu rồi bù đủ trong hạn; hiện PAID và nút Đã đăng ký bị khóa.',
  'Không chuyển tiền thật; nêu 15 phút + grace 120 giây và bằng chứng test biên, không chờ 17 phút trên sân khấu.'),
 ('10:00–13:00',
  3,
  'Bảo / Khải',
  'Hủy khóa → mã HT… → admin',
  'Xem preview buổi còn lại/phí; hủy REFUND, lấy mã HT; admin tìm mã và xác nhận chuyển trả giả lập; xem lịch sử và thông '
  'báo.',
  'Không ghi vào ví. Nói rõ tham chiếu demo, không gọi đó là chuyển trả ngân hàng thật.'),
 ('13:00–16:00',
  3,
  'Khôi / Khải',
  'Điểm danh & nhận xét / Hồ sơ',
  'Chọn khóa của một hội viên, xem Buổi 1–N cùng giờ/điểm/note; sau đó kiểm tra chia sẻ hồ sơ theo quyền.',
  'Dữ liệu trống không tự là vắng; HLV không nhận thông tin tài chính khi hội viên hủy.'),
 ('16:00–21:00',
  5,
  'Bảo + Khải',
  'Tổng kết khóa học',
  'Chọn khóa nháp đã kết thúc, sửa/công bố; hội viên xem kết quả/PDF và đánh giá; quản lý mở lại có lý do.',
  'Chuẩn bị dữ liệu demo trước buổi diễn tập; không reset để phục hồi giữa demo.'),
 ('21:00–24:00',
  3,
  'Bảo',
  'Báo cáo',
  'Chọn khoảng có dữ liệu, nhóm tháng, so sánh kỳ trước, xuất Excel; phân biệt doanh thu khóa và tiền hoàn.',
  'Giới thiệu số liệu giả lập; trạng thái chờ hoàn chưa phải tiền đã chuyển trả.'),
 ('24:00–26:00',
  2,
  'Cả nhóm',
  'Repo + Excel bằng chứng',
  'Mở commit liên quan, task gốc, timeline, test; nêu một lỗi mobile đã tái hiện và sửa.',
  'Không gọi task Review là Done; không dùng số commit làm điểm đánh giá cá nhân.'),
 ('26:00–28:00',
  2,
  'Cả nhóm',
  'Hỏi đáp và dự phòng',
  'Trả lời về giao dịch đồng thời, quyền riêng tư, snapshot và báo cáo.',
  'Nếu kéo dài, bỏ thao tác tải file lần hai; không bỏ điểm kiểm soát nghiệp vụ.')]

QUESTIONS = [('Bây giờ còn bán gói tập không?',
  'Không. Bán khóa học theo giá trọn khóa/số buổi còn lại; bảng gói cũ chỉ giữ FK và lịch sử, endpoint bán gói đã trả 410.'),
 ('Đăng ký tài khoản có tự đăng ký lớp?',
  'Không. Tạo tài khoản/xác minh/đăng nhập không tạo Invoice hay ClassEnrollment; phải có thao tác chọn và mua khóa.'),
 ('Chuyển ở 14:59.999 nhưng webhook sau 15 phút?',
  'Có khoảng chờ mặc định 120 giây để nhận tiền ngân hàng đã ghi trước hạn. SePay chỉ có độ chính xác giây; thiếu chứng cứ '
  'ở giây ranh giới hoặc quá grace phải đối soát, không tự giành lại chỗ.'),
 ('Thu tại quầy sát hạn thì sao?',
  'Server chốt sau khi có khóa; trước hạn hợp lệ dù commit sau hạn, chờ khóa qua hạn thì từ chối. Nếu đã giao tiền mặt mà '
  'chưa xác nhận được, nhân viên trả lại hoặc thống nhất đơn mới sau khi kiểm tra chỗ.'),
 ('Chuyển thiếu rồi hết hạn?',
  'Chỉ bù trong hạn gốc; hết giữ chỗ nhả FIFO và hoàn đúng tổng đã nhận. Hai giao dịch khác ID khác với một webhook gửi '
  'lặp.'),
 ('Hủy học nửa khóa được hoàn bao nhiêu?',
  'Khóa 1.000.000đ/20 buổi, còn 10 buổi: giá trị 500.000đ; nếu phí cấu hình là 10% thì hoàn 450.000đ. Phí 0% mới hoàn '
  '500.000đ. Buổi tự vắng không tự được hoàn.'),
 ('Hội viên nhận hoàn như thế nào?',
  'Lấy mã HT… trong lịch sử, liên hệ admin; admin chuyển trả bên ngoài rồi nhập tham chiếu. Không ghi khoản hủy vào ví và '
  'không có API tự thực hiện chuyển ngân hàng.'),
 ('Hủy rồi dữ liệu cũ đi đâu?',
  'Giữ hóa đơn, thanh toán, điểm danh, nhận xét và snapshot lần hủy. Đăng ký lại không ghi đè lịch sử, quyền học buổi sau '
  'hủy bị dừng.'),
 ('Xem điểm danh và note của một lớp?',
  'Chọn khóa trong Điểm danh & nhận xét, hiện đủ Buổi 1–N; admin chọn hội viên trước. Dữ liệu trống không bị đổi thành '
  'ABSENT; ghi chú chỉ đúng memberId/sessionId.'),
 ('Hai người cùng lấy chỗ cuối thì sao?',
  'Service kiểm tra lại dưới transaction và schedule lock; chỗ BOOKED, giữ thanh toán và lời mời còn hạn cùng chiếm sức '
  'chứa. E2E và integration có ca tranh chấp.'),
 ('Tại sao kết quả cũ không đổi khi sửa điểm danh?',
  'Khi công bố, chụp attendanceSnapshot; bản đã công bố và PDF đọc snapshot. Muốn cập nhật kết quả phải mở lại và công bố '
  'revision mới.'),
 ('HLV có xem mọi hồ sơ sức khoẻ không?',
  'Không. API xét các buổi thực dạy/phạm vi thời gian và shareWithCoach. Không trả hóa đơn, số dư, gói tự tập trong payload '
  'học viên.'),
 ('Gửi email có đảm bảo đúng một lần?',
  'Không cam kết exactly-once SMTP. Có outbox, retry và receipt; trường hợp SMTP đã nhận nhưng lưu receipt thất bại có thể '
  'gửi lại.'),
 ('Nhóm chứng minh đóng góp thế nào?',
  'Giữ task sheet gốc, commit nguyên bản, thời gian author/committer và liên kết file/test; task thiếu ID commit được đánh '
  'dấu cần đối chiếu, không sửa lịch sử để làm đẹp.')]
