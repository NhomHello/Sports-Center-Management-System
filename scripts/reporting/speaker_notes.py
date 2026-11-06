"""Spoken Vietnamese narration and source-backed defence questions for four presenters."""
from pathlib import Path
from doc_layout import DOCS, new_document, grid, save, section
from demo_story import WORKFLOWS, SPEAKERS, EXCEPTIONS
from council_data_docs import describe_anchor

INTRO = [
    'Kính chào thầy cô. Nhóm chúng em gồm Nhanh, Bảo, Khôi và Khải. Đề tài là hệ thống quản lý trung tâm thể thao, với sản phẩm kinh doanh hiện hành là khóa học theo lịch. Vấn đề nhóm giải quyết là nối thông tin khóa, học viên, thanh toán và kết quả học tập thành một quá trình có thể kiểm tra được.',
    'Giải pháp phục vụ bốn vai trò: hội viên, huấn luyện viên, quản lí trung tâm và lễ tân. Trong demo, nhóm dùng cùng hội viên M: M đã học xong C, đang theo học B và đăng ký khóa tiếp theo A. Vì vậy chúng em có thể minh họa cả dữ liệu lịch sử, dữ liệu hiện tại và dữ liệu tương lai mà không thay đổi giờ hệ thống.',
    'Về kiến trúc, giao diện React gọi API Express; API kiểm tra đăng nhập, quyền, đầu vào và nghiệp vụ rồi thao tác MySQL qua Prisma. Chỗ học và thanh toán được kiểm tra tại backend trong transaction. Quyền được đọc từ dữ liệu phân quyền; tên vai trò dùng để mô tả trách nhiệm. Các tác vụ hết hạn và thông báo chạy trong ứng dụng backend.',
    'Nhóm sẽ chạy liền mạch bốn flow: chuẩn bị khóa và hồ sơ; mua khóa, thanh toán và đổi cả khóa; điểm danh và phản hồi; cuối cùng tổng kết, đánh giá và báo cáo. Sau hành trình thành công, mỗi thành viên minh họa một exception. Phần ngân hàng dùng webhook mô phỏng và được thông báo rõ; chúng em vẫn đi qua xử lý thanh toán của API.',
]

NARRATION = {
 'WF1': [
  'Em trình bày flow chuẩn bị khóa học và hồ sơ. Đầu vào là bộ môn, phòng, huấn luyện viên và thời gian nhận đăng ký. Em đang đăng nhập quản lí trung tâm, tạo A bằng tên, giá và lịch trong bộ dữ liệu ngày hôm nay. Khi lưu, backend kiểm tra HLV có chuyên môn, phòng hỗ trợ bộ môn, sức chứa, khung giờ và xung đột. Khóa cùng các buổi được lưu trong một transaction.',
  'Tiếp theo em chuyển sang lễ tân, tìm đúng hồ sơ M đã có lịch sử B và C. Em giữ cùng memberId xuyên suốt. Ở phiên hội viên, M cập nhật mục tiêu và bật chia sẻ với HLV. Mỗi vai trò chỉ thao tác trong phạm vi quyền được cấp. HLV sẽ đọc đúng mục tiêu này ở flow theo dõi buổi học.',
  'Điểm cần phân biệt là tạo khóa chưa làm M có chỗ học. A hiện mới đủ điều kiện mở bán; đăng ký chính thức còn phụ thuộc quy trình mua và thanh toán. Dữ liệu quá khứ đã chuẩn bị trước, còn A là bản ghi em vừa tạo trực tiếp. Sau bốn flow, em sẽ quay lại minh họa trường hợp đổi giờ khi chưa đủ hạn báo trước.',
  'Đến đây, khóa A và hồ sơ M đã sẵn sàng. Em mời bạn trình bày flow mua khóa, để chứng minh từ cấu hình khóa đến quyền học được nối bằng dữ liệu thực.',
 ],
 'WF2': [
  'Em tiếp tục với chính M và khóa A vừa tạo. M xem lịch, giá và xác nhận mua online. Backend tự tính giá từ các buổi còn lại và tạo hóa đơn COURSE ở trạng thái PENDING, đồng thời giữ chỗ PENDING_PAYMENT. Em mở mã hóa đơn và QR. Nội dung chuyển khoản chứa mã hóa đơn, nên backend có thể đối chiếu giao dịch về đúng đơn.',
  'Nhóm gửi một webhook mô phỏng đúng tổng tiền ở hậu trường. API xác thực khóa SePay, chống trùng ID giao dịch, kiểm tra hóa đơn, thời gian và chỗ giữ. Khi đúng tổng tiền và đủ điều kiện, hệ thống ghi Payment, chuyển hóa đơn PAID và đăng ký BOOKED trong transaction. Em mở cùng mã ở phiên lễ tân và xuất biên lai; đây là cùng hóa đơn I, không tạo thêm đơn tiền mặt.',
  'Tiếp theo, M muốn thay toàn bộ lịch khóa chưa học. Em mở đổi khóa và chọn A2 cùng bộ môn, còn chỗ, lịch phù hợp và có cùng giá trị còn lại. Preview cho biết chênh lệch bằng không. Sau xác nhận, đăng ký A chuyển CANCELLED và A2 thành BOOKED. Đây là chuyển cả đăng ký khóa. Nếu có tiền trả thêm, quyền khóa cũ còn giữ trong lúc chờ thanh toán; phần dư dương đi qua yêu cầu hoàn theo quy tắc hiện hành.',
  'Em giữ mã I để cuối lượt đối chiếu báo cáo. Việc đổi đăng ký không xóa chứng từ thanh toán A. Sau đây, bạn tiếp theo quay về B, khóa M đang học, để trình bày theo dõi buổi học.',
 ],
 'WF3': [
  'Em trình bày flow học tập của cùng M. B là khóa M đã mua trước buổi đầu; buổi được thao tác là buổi gần nhất trong bộ dữ liệu theo ngày chạy. Nếu buổi đã kết thúc hoặc gần hết giờ, bước chuẩn bị đã dùng quyền quản lý để mở hạn điểm danh và có audit. Em kiểm tra lại mốc hạn mở trước khi thao tác, rồi dùng phiên HLV phụ trách đúng buổi.',
  'HLV mở roster của B, xem mục tiêu M vừa chia sẻ và ghi PRESENT cho M. Backend kiểm tra HLV có phạm vi lớp, M có trong danh sách phù hợp và buổi đã bắt đầu, chưa hủy, còn quyền ghi. Sau khi lưu điểm danh, HLV nhập điểm và nhận xét. Attendance và SessionFeedback là hai bản ghi phục vụ hai mục đích khác nhau.',
  'Ở phiên hội viên, M mở lịch sử của B và nhìn thấy đúng buổi, trạng thái có mặt cùng nhận xét vừa lưu. Luồng này cho thấy dữ liệu không chỉ nằm ở màn hình HLV mà đã đến đúng chủ sở hữu. Hội viên khác không có quyền đọc nhận xét riêng của M. Khi hai người chỉnh nhận xét đồng thời, expectedVersion giúp phát hiện bản cũ và trả lỗi thay vì ghi đè im lặng.',
  'M đã xem được tiến bộ của buổi học. Em mời bạn cuối cùng mở C, khóa M đã hoàn tất, để trình bày cách dữ liệu học tập trở thành tổng kết và báo cáo.',
 ],
 'WF4': [
  'Em trình bày flow kết quả học tập và báo cáo. C đã kết thúc trước thời điểm demo, M có đăng ký từ trước và dữ liệu nền đủ bốn buổi. Tổng kết đang DRAFT; M chưa có đánh giá. Em đăng nhập HLV là tác giả tổng kết, xem số chuyên cần do backend tính, cập nhật kết quả, mức tiến bộ và nhận xét, rồi công bố.',
  'Khi công bố, backend yêu cầu đủ kết quả và mức tiến bộ của mọi học viên, kiểm tra điều kiện kết quả và việc xác nhận dữ liệu điểm danh còn thiếu. Khi hợp lệ, hệ thống chuyển PUBLISHED và chốt attendanceSnapshot. Snapshot giúp bản kết quả đã công bố và phiếu PDF phản ánh cùng một lần công bố, kể cả dữ liệu điểm danh về sau có chỉnh sửa.',
  'M mở kết quả C, tải PDF và đánh giá khóa cùng HLV trong cửa sổ cho phép. Thời hạn đánh giá được tính từ buổi cuối theo cấu hình, nên chúng em đã map C gần thời điểm thực tế. Sau đó quản lí trung tâm mở báo cáo tổng kết và báo cáo doanh thu, lọc A, M và kỳ chứa I để đối chiếu khoản thu vừa tạo. Dù M đã chuyển sang A2, chứng từ I của lần mua A vẫn được giữ và được giải thích đúng.',
  'Nhóm đã hoàn tất hành trình chính trên một hội viên. Bây giờ bốn thành viên lần lượt minh họa exception gắn với flow của mình. Phần này kiểm tra khả năng bảo vệ dữ liệu khi điều kiện nghiệp vụ không thỏa, sau đó nhóm đối chiếu task, Git và trả lời câu hỏi của thầy cô.',
 ],
}

QA = {
 'WF1': [
  ('WHAT / WHO: Flow này giải quyết gì, ai dùng?', 'Chuẩn bị khóa, lịch và hồ sơ trước bán. Quản lí trung tâm tạo/sửa khóa; lễ tân tra hồ sơ; hội viên sửa hồ sơ của mình. Mỗi thao tác còn kiểm tra permission và phạm vi tại backend.'),
  ('HOW: Luồng tạo khóa đi qua những lớp nào?', 'Route → authenticate/authorize → Zod validation → controller → service → Prisma/MySQL. Service kiểm tra tài nguyên và sinh buổi; transaction giữ khóa và buổi nhất quán. FE kiểm tra form để hỗ trợ người dùng, API vẫn phải tự xác thực dữ liệu.'),
  ('WHY: Vì sao lưu GymClass và ClassSession riêng?', 'Khóa lưu cấu hình và giá; từng buổi có thời gian, trạng thái và snapshot phòng/HLV. Có thể đổi/hủy một buổi hoặc đổi HLV mà vẫn giữ được lịch sử các buổi khác. Sửa lịch không được xóa dữ liệu buổi đã qua.'),
  ('HOW: Kiểm tra trùng lịch bằng cách nào?', 'Hai khoảng giao nhau khi startA < endB và startB < endA; kết thúc đúng lúc buổi khác bắt đầu được phép. Backend xét cả snapshot tài nguyên của buổi và tài nguyên mặc định của lớp, cùng trạng thái còn hiệu lực.'),
  ('WHY: Vì sao đổi giờ phải đủ hạn cho cả lịch cũ và mới?', 'Báo trước cho lịch cũ ngăn đổi sát buổi; kiểm tra lịch mới ngăn dời một buổi xa thành buổi sắp diễn ra. Mốc lấy CLASS_RESCHEDULE_MIN_HOURS_BEFORE, mặc định 48 và không được cấu hình thấp hơn. Đúng ranh giới được phép trong kiểm thử có đồng hồ cố định.'),
  ('WHAT IF: Preview hợp lệ nhưng lúc lưu bị trùng?', 'Preview hỗ trợ người quản lý xem ảnh hưởng. Phép lưu khóa lịch và kiểm tra lại; điều kiện thay đổi thì trả lỗi và rollback. Không dựa vào kết quả preview cũ để bỏ qua kiểm tra.'),
  ('HOW: Ai được chia sẻ/xem hồ sơ tập luyện?', 'M chọn shareWithCoach; backend kiểm tra quyền và mối quan hệ HLV–lớp–hội viên. Không suy ra chỉ cần là một HLV bất kỳ thì xem được mọi hồ sơ. Phần công khai của hồ sơ HLV tách với thông tin đăng nhập.'),
  ('WHY: Vì sao bốn vai trò mà lại có nhiều permission?', 'Vai trò là nhóm trách nhiệm; permission mô tả từng hành động. Quyền lưu ở DB và có thể cấu hình. Backend không so sánh tên vai trò để cho qua một nghiệp vụ; thông tin tác giả đóng góp phải tra task và Git riêng.'),
 ],
 'WF2': [
  ('WHAT: QR, Invoice, Payment và Enrollment khác nhau thế nào?', 'QR là chỉ dẫn chuyển khoản. Invoice là khoản phải thu; Payment là khoản thực tế ghi nhận; Enrollment là quyền/chỗ học. Chỉ hiển thị QR không làm hóa đơn PAID và cũng không tự cấp BOOKED.'),
  ('HOW: Giá mua giữa khóa tính thế nào?', 'Giá trọn khóa × số buổi SCHEDULED chưa bắt đầu / tổng số buổi không hủy, làm tròn theo settlement.js tới 1.000đ gần nhất. Ví dụ 1.200.000đ, còn 3/4 buổi thì 900.000đ. Backend chốt số buổi và giá vào invoice; không nhận giá client làm nguồn quyết định.'),
  ('WHY: Vì sao giữ chỗ trước khi nhận tiền?', 'Để khách có cơ hội hoàn tất thanh toán mà không bán vượt sức chứa. BOOKED, chỗ thanh toán còn hiệu lực và lời mời OFFERED được tính theo policy. Tạo giữ chỗ nằm trong transaction có khóa lịch; không chỉ nhìn số chỗ còn trên giao diện.'),
  ('HOW: Webhook được tin cậy và chống lặp thế nào?', 'Middleware xác thực API key; ID giao dịch được lưu unique. Gửi lại cùng ID không tạo khoản thu lần hai. Khi code do SePay trích khác tiền tố dự án, tìm mã cấu hình trong nội dung ngân hàng; có nhiều mã khác nhau thì đưa đối soát.'),
  ('WHAT IF: Tiền thiếu, thừa hoặc đến muộn?', 'Thiếu giữ PENDING và mở xử lý bù; đúng tổng mới tự PAID. Thừa cần người có quyền xử lý. Tiền muộn hoặc mất giữ chỗ/lịch phù hợp đi đối soát, không tự phục hồi quyền học. COURSE/ONLINE có grace cho thông báo đến chậm; grace không cho khách chuyển tiền sau deadline.'),
  ('HOW: Đổi cả khóa xử lý quyền và tiền ra sao?', 'Đích phải cùng bộ môn, còn nhận đăng ký, còn chỗ và không trùng lịch ngoài nguồn đang rời. So giá trị nguồn chưa sử dụng với giá đích. Chênh dương tạo ADJUSTMENT và giữ chỗ đích; nguồn còn BOOKED đến khi chốt. Chốt đổi kiểm tra lại nguồn, bộ môn, hạn invoice, chỗ và lịch; không dương thì hoàn tất ngay và phần dư dương tạo Refund.'),
  ('WHY: Chuyển khóa mà vẫn thấy tiền khóa A trong báo cáo?', 'I là chứng từ thu cho giao dịch đã phát sinh; đổi enrollment là thay đổi quyền tham gia. Lịch sử thu không bị xóa vì khách đổi lịch. Chênh lệch và hoàn có chứng từ riêng; đối chiếu cùng memberId, invoiceId và kỳ lọc để tránh tính hoặc hiểu sai.'),
  ('WHAT IF: Đã chuyển ngân hàng mà giao diện vẫn chờ?', 'Kiểm tra lịch sử gửi callback, HTTP status và log đối soát. Phân biệt chưa giao callback với đã nhận nhưng NEEDS_REVIEW. Kiểm thử mô phỏng chứng minh logic ứng dụng; kết nối và chuyển tiền ngân hàng thật cần bằng chứng riêng. Không sửa PAID bằng SQL để kết luận thành công.'),
 ],
 'WF3': [
  ('WHAT: Check-in, điểm danh và nhận xét có giống nhau không?', 'Check-in là lượt đến trung tâm. Attendance gắn học viên với một buổi cụ thể. SessionFeedback lưu điểm/ghi chú của buổi đó. Check-in không thay thế điểm danh; ghi nhận xét không tự suy ra có mặt.'),
  ('WHO: HLV nào được thao tác?', 'HLV có permission tương ứng và phụ trách buổi/lớp theo phạm vi backend. Khi buổi có coachId riêng thì phải xét phân công của buổi; không chỉ đọc HLV mặc định của khóa. Hội viên chỉ xem dữ liệu học của chính mình.'),
  ('HOW: Roster lấy đúng học viên bằng cách nào?', 'Theo class/session, đăng ký và thời điểm enrolledAt phù hợp; có xử lý lịch sử điểm danh để không làm mất bản ghi cũ sau hủy/đăng ký lại. Demo phải dùng M đã đăng ký trước buổi bắt đầu, không tạo người mới rồi trình bày như đã học trong quá khứ.'),
  ('WHEN: Khi nào được điểm danh?', 'Buổi đã bắt đầu, không bị hủy, và còn đang diễn ra hoặc có attendanceUnlockedUntil còn hiệu lực. Buổi tương lai bị từ chối. Quản lý dùng quyền mở hạn với lý do; HLV không tự bỏ qua hạn ở API ghi điểm danh.'),
  ('HOW: expectedVersion ngăn mất cập nhật thế nào?', 'Client gửi phiên bản bản ghi đã đọc. Backend chỉ lưu khi expectedVersion khớp phiên bản hiện tại; bản cũ trả 409 và yêu cầu tải lại. Điều này ngăn hai người sửa nhận xét ghi đè nội dung của nhau mà không biết.'),
  ('WHY: Vì sao kiểm tra quyền ở API khi FE đã ẩn nút?', 'Người gọi có thể gửi HTTP trực tiếp hoặc đổi ID. UI giúp hướng dẫn, còn API phải kiểm tra quyền và quyền truy cập bản ghi trước khi đọc/ghi dữ liệu riêng. Trả lỗi không được tạo bản ghi một phần.'),
  ('WHAT IF: Buổi đã kết thúc khi nhóm tới phần WF3?', 'Bộ chuẩn bị đã gọi nghiệp vụ quản lý mở hạn điểm danh và ghi audit. Kiểm tra mốc hạn trong manifest. Đây là quyền được cấp theo policy, giữ nguyên thời gian buổi; không thay đồng hồ hoặc bỏ validation.'),
  ('WHY: Dữ liệu này liên quan gì tới tổng kết?', 'Attendance dùng tính chuyên cần và trường hợp thiếu dữ liệu; nhận xét giúp mô tả tiến bộ. Tổng kết còn yêu cầu result/progress do HLV cập nhật và các điều kiện công bố; không tự biến tất cả điểm buổi thành kết quả PASS.'),
 ],
 'WF4': [
  ('WHAT: DRAFT và PUBLISHED khác nhau thế nào?', 'DRAFT cho HLV tác giả cập nhật theo quyền. Khi công bố hợp lệ, PUBLISHED có attendanceSnapshot và revision. Muốn sửa kết quả đã công bố cần quản lý mở lại với lý do; công bố lại tăng revision và tạo sự kiện tương ứng.'),
  ('HOW: Chuyên cần tính ở đâu, EXCUSED có ảnh hưởng gì?', 'Backend đếm buổi phù hợp sau ngày đăng ký, bỏ buổi hủy; tính PRESENT trên tổng số buổi trừ EXCUSED theo course-attendance.service.js. Buổi còn thiếu ghi nhận được đếm riêng; không được mặc nhiên xem là có mặt. Ngưỡng gợi ý PASS lấy từ settings.'),
  ('WHY: Vì sao phải chốt snapshot khi công bố?', 'Để kết quả đã công bố, màn hình hội viên và PDF phản ánh cùng một trạng thái lịch sử. Nếu luôn tính lại theo Attendance hiện tại, sửa một buổi sau này có thể làm kết quả công bố thay đổi mà không có lần công bố mới.'),
  ('WHAT IF: Có học viên thiếu kết quả hoặc thiếu điểm danh?', 'Thiếu result/progress của bất kỳ item nào thì từ chối công bố. Nếu đủ kết quả nhưng có missing Attendance thì còn cần acknowledgeMissingAttendance. HLV chọn kết quả khác gợi ý phải đáp ứng điều kiện ghi lý do trong service; không thể tự coi missing là đã đầy đủ.'),
  ('WHEN: Khi nào hội viên được đánh giá?', 'Phải có item tổng kết của hội viên, buổi cuối đã kết thúc và còn COURSE_RATING_WINDOW_DAYS tính từ giờ kết thúc buổi cuối. Một hội viên/khóa có một bản đánh giá và có thể sửa trong hạn. Policy hiện tại không buộc tổng kết phải PUBLISHED mới đánh giá; demo vẫn công bố trước cho mạch trình bày dễ hiểu.'),
  ('HOW: Vì sao quản lý và HLV thấy dữ liệu khác nhau?', 'Quản lý có quyền phạm vi toàn bộ; HLV xem các tổng kết được phân công và dữ liệu trong phạm vi. Đánh giá có cơ chế ẩn nội dung và ẩn định danh theo màn hình/quyền; backend không trả nguyên user vào mọi response.'),
  ('HOW: Báo cáo lấy giá niêm yết hay số đã thu?', 'Theo builder của báo cáo, bộ lọc và các chứng từ tiền đã nhận/hoàn; không dùng một tổng giá khóa để suy ra doanh thu. Khi demo lọc A/M và đúng kỳ của I, mở số liệu và file xuất cùng bộ lọc. Hoàn tiền được trình bày theo số đã hoàn và trạng thái chứng từ thực tế.'),
  ('WHY: Hoàn PENDING có nghĩa đã chuyển tiền chưa?', 'Chưa. PENDING là yêu cầu cần xử lý; người có quyền thực hiện chuyển trả bên ngoài rồi xác nhận tham chiếu để DONE. Ứng dụng không tự chuyển tiền ngân hàng chỉ vì tạo Refund hoặc bấm xác nhận nghiệp vụ.'),
 ],
}

SOURCES = {
 'WF1': ['class/class.service.js','class/class-schedule.service.js','class/class-reschedule-policy.service.js','class/class-schedule-change-policy.service.js','profile/profile.service.js'],
 'WF2': ['course-order/course-order.service.js','payment/sepay-webhook.service.js','payment/payment-apply.service.js','purchase-change/purchase-change-request.service.js','purchase-change/course-change-policy.service.js'],
 'WF3': ['attendance/attendance.service.js','session-feedback/session-feedback.service.js','profile/coach-member-scope.service.js'],
 'WF4': ['course-summary/course-summary.service.js','course-summary/course-attendance.service.js','course-summary/course-rating.service.js','report/report-finance.service.js'],
}


def build():
    for paths in SOURCES.values():
        for source in paths: assert (DOCS.parent/'core/be/src/modules'/source).is_file(), source
    doc = new_document('Bài thuyết trình và hỏi đáp cho nhóm 4 người', 'Lời nói trực tiếp · WHAT / WHO / HOW / WHY · 4 flow và exception')
    doc.add_paragraph('Phân công nói đề xuất: Khôi–WF1, Nhanh–WF2, Bảo–WF3, Khải–WF4. Đây là phân công người dẫn; đóng góp mã nguồn vẫn đối chiếu task và Git thực tế. Mỗi người tập cả flow của mình và đầu vào/đầu ra nối với hai flow bên cạnh.')
    describe_anchor(doc)
    doc.add_heading('Cách trả lời hội đồng', 1)
    grid(doc, ['Câu hỏi', 'Cách trả lời'], [
        ['WHAT', 'Chức năng giải quyết việc gì? Đầu vào, đầu ra, trạng thái và đối tượng dữ liệu nào?'],
        ['WHO', 'Ai thực hiện? Permission nào? Vì sao có quyền trên bản ghi này?'],
        ['HOW', 'Nêu route → validation → service → transaction/DB; mở đúng đoạn code hoặc dữ liệu để chứng minh.'],
        ['WHY', 'Nêu vấn đề thực tế, lý do chọn thiết kế, rủi ro nếu bỏ kiểm tra và giới hạn của cách đang dùng.'],
        ['WHEN / WHAT IF', 'Điều kiện thời gian nào? Khi thiếu tiền, hết chỗ, trùng lịch, dữ liệu cũ hoặc hai người thao tác cùng lúc thì sao?'],
    ])
    doc.add_paragraph('Mẫu trả lời: “Điều kiện của nghiệp vụ là …; backend kiểm tra tại …, dưới …; kết quả là … . Nhóm chọn cách này để …; ca kiểm thử/dữ liệu minh họa là …”. Khi chưa chắc, mở nguồn kiểm chứng hoặc nhờ người phụ trách bổ sung; không tự đặt thêm tính năng hoặc con số.')
    doc.add_heading('00–04 phút · Mở đầu, mỗi người khoảng một phút', 1)
    for i, text in enumerate(INTRO, 1):
        doc.add_heading('Người '+str(i), 2); doc.add_paragraph(text)
    for flow in WORKFLOWS:
        fid = flow['id']; section(doc, SPEAKERS[fid]+' · '+fid+' · '+flow['title'])
        doc.add_paragraph('Thời gian: '+flow['time']+' phút. Đầu vào: '+flow['inputs'])
        doc.add_heading('Lời nói và thứ tự thao tác', 2)
        for text in NARRATION[fid]: doc.add_paragraph(text)
        grid(doc, ['Vai trò trên màn hình', 'Thao tác cần thực hiện'], flow['steps'])
        doc.add_heading('Câu hỏi sâu cần tự trả lời được', 2)
        for q, answer in QA[fid]: doc.add_heading(q, 3); doc.add_paragraph(answer)
        e = next(e for e in EXCEPTIONS if e['flow'] == fid)
        doc.add_heading(e['time']+' · Exception người này trình bày', 2)
        doc.add_paragraph(e['action']+' Chỉ ra kết quả: '+e['expected'])
        doc.add_paragraph('Lời nói mẫu: “Chúng em đã hoàn tất luồng thành công. Trường hợp này không thỏa điều kiện '+e['title'].lower()+'. Sau thao tác, hệ thống chặn yêu cầu và giữ dữ liệu cũ. Điều đó cho thấy quy tắc được thực thi, không chỉ ghi trong tài liệu.”')
        doc.add_heading('Nguồn phải biết cách mở', 2)
        for path in SOURCES[fid]: doc.add_paragraph('core/be/src/modules/'+path)
    section(doc, 'Hỏi đáp chung và phối hợp nhóm')
    grid(doc, ['Câu hỏi', 'Ý trả lời cần nắm'], [
        ['Conceptual model khác ERD?', 'Conceptual nêu đối tượng/quan hệ nghiệp vụ; ERD chi tiết thực thể, khóa, quan hệ, nullable/unique theo schema. Đọc đúng FK của dữ liệu đang demo.'],
        ['Flowchart khác state chart?', 'Flowchart mô tả bước và nhánh xử lý; state chart mô tả trạng thái và điều kiện chuyển của một đối tượng. Invoice và Enrollment có state riêng, không gộp PAID với BOOKED.'],
        ['Vì sao transaction và khóa lịch?', 'Giữ bất biến khi nhiều thao tác đăng ký/thanh toán/đổi lịch cùng lúc. Khóa lịch chung đơn giản hóa nhất quán nhưng giảm khả năng chạy song song; đây là trade-off của triển khai hiện tại.'],
        ['Thiếu mạng hoặc lỗi gửi thông báo?', 'Tách kết quả nghiệp vụ đã commit với thông báo; tra audit/outbox và trạng thái thật. Không hứa có broker, offline mode hoặc tự chuyển tiền nếu mã nguồn chưa triển khai.'],
        ['Ai làm phần nào?', 'Mở đúng task ID, commit tác giả và diff. Người thuyết trình flow không tự được coi là tác giả toàn bộ flow; số commit không phải tỷ lệ công sức.'],
        ['Đã kiểm thử những gì?', 'Mở bằng chứng lần chạy, môi trường và dữ liệu tương ứng. Phân biệt kiểm thử API, giao diện và callback mô phỏng với kết nối ngân hàng thật.'],
    ])
    doc.add_heading('Diễn tập bắt buộc', 1)
    doc.add_paragraph('Chạy 30 phút trọn lượt; một người bấm giờ, mỗi người nói đúng đoạn và dùng đúng namespace. Đổi vai trò bằng cửa sổ đã đăng nhập. Ghi lại I và enrollment A2 ngay sau WF2. Sau đó mỗi người tự trả lời tám câu hỏi của mình không nhìn đáp án, và giải thích được ít nhất đầu ra flow trước/đầu vào flow sau. Cuối cùng đổi người hỏi chéo để kiểm tra hiểu cơ chế thay vì học thuộc lời thoại.')
    save(doc, Path('bao-cao/SWP391_BaiThuyetTrinh4Nguoi.docx'))
