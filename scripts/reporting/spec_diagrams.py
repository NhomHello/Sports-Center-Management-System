"""Diagrams authored against current services; no diagrams from retired features."""
import json
import subprocess
from pathlib import Path
import cairosvg

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'docs/so-do'
FLOWS = []


def flow(name, title, actors, nodes, edges, source):
    FLOWS.append(dict(name=name, title=title, actors=actors, nodes=nodes, edges=edges, source=source))


flow('01-dang-ky', 'Đăng ký tài khoản và xác minh email', ['Hội viên', 'Hệ thống', 'Lễ tân'], [
 ('a',0,'Nhập thông tin đăng ký'), ('b',1,'Kiểm tra liên hệ duy nhất\nvà vai trò mặc định'),
 ('c',1,'Tạo tài khoản;\nyêu cầu xác minh email'), ('d',0,'Mở liên kết xác minh'),
 ('e',1,'Kiểm tra token và\nxác minh email'), ('f',2,'Đối chiếu danh tính;\nxác minh email hộ'),
 ('g',0,'Đăng nhập'), ('h',1,'Kiểm tra điều kiện\nđăng nhập'),
 ('i',1,'Cấp token và nạp quyền'),('j',1,'Từ chối thao tác;\nbáo lỗi phù hợp'),
], [('a','b',''),('b','c','Hợp lệ'),('c','d','Có email'),('d','e',''),('c','f','Cần hỗ trợ'),('f','e','Đủ quyền, ghi audit'),('e','g',''),('g','h',''),('h','i','Đủ điều kiện'),('b','j','Dữ liệu không hợp lệ'),('e','j','Token không hợp lệ'),('h','j','Không đủ điều kiện')], 'auth/auth.service.js; auth/email-verification.service.js')
flow('02-mua-khoa', 'Đăng ký và thanh toán khóa học', ['Hội viên', 'Hệ thống', 'SePay'], [
 ('a',0,'Chọn khóa và xác nhận giá'),('b',1,'Kiểm tra điều kiện\nđăng ký và chỗ trống'),
 ('c',1,'Hóa đơn PENDING;\ngiữ chỗ chờ tiền'),('d',0,'Chuyển đúng mã,\nsố tiền và thời hạn'),
 ('e',2,'Gửi webhook giao dịch'),('f',1,'Xác thực, chống trùng;\nkiểm tra giao dịch'),
 ('g',1,'Đúng tổng, hợp lệ:\nPAID và BOOKED'),('h',1,'Chưa khớp: phiếu đối soát;\nchưa cấp quyền học'),('w',1,'Hết chỗ: WAITING,\nchưa có hóa đơn'),('z',1,'Từ chối đăng ký;\nkhông tạo hóa đơn'),
], [('a','b',''),('b','c','Còn chỗ'),('b','w','Được vào chờ'),('b','z','Không đủ điều kiện'),('c','d',''),('d','e',''),('e','f',''),('f','g','Đủ điều kiện'),('f','h','Thiếu/thừa/trễ/xung đột')], 'course-order/course-order.service.js; payment/sepay-webhook.service.js')
flow('03-hang-cho', 'Mời đăng ký từ danh sách chờ', ['Hội viên', 'Hệ thống'], [
 ('a',0,'Xin vào hàng chờ khóa đầy'),('b',1,'Kiểm tra hợp lệ;\nxếp hàng chờ FIFO'),
 ('c',1,'Được mời?'),('d',1,'Mời lượt FIFO;\ngiữ chỗ OFFERED'),
 ('e',0,'Xác nhận trong hạn lời mời'),('f',1,'Tạo hóa đơn, giữ chỗ\nPENDING_PAYMENT'),('g',1,'Xác nhận BOOKED\nsau thanh toán'),
 ('h',1,'Quá lời mời: EXPIRED;\nxét người tiếp theo'),('i',1,'Khóa đóng/hết hạn:\nhủy lượt chờ'),('j',1,'Chưa có chỗ:\ntiếp tục WAITING'),
], [('a','b',''),('b','c',''),('c','d','Có'),('c','i','Không còn nhận đăng ký'),('c','j','Chưa có chỗ'),('d','e',''),('e','f','Đúng hạn'),('f','g',''),('d','h','Quá hạn'),('h','c','Xét lượt tiếp theo'),('j','c','Có thay đổi chỗ')], 'class/class-waitlist.service.js')
flow('04-thu-quay', 'Lễ tân đăng ký hộ và thu tiền mặt', ['Hội viên', 'Lễ tân', 'Hệ thống'], [
 ('a',0,'Cung cấp thông tin;\nyêu cầu đăng ký'),('b',1,'Chọn hội viên, khóa\nvà kênh tại quầy'),
 ('c',2,'Kiểm tra đăng ký;\ntạo hóa đơn và giữ chỗ'),('d',1,'Kiểm tra số cần thu;\nnhận đủ tiền mặt'),
 ('e',2,'Kiểm tra hạn, tiền, lịch\nvà chỗ dưới khóa'),('f',2,'Ghi Payment;\nPAID và BOOKED'),
 ('g',1,'In biên lai'),('h',2,'Không hợp lệ: từ chối\nghi nhận thanh toán'),
], [('a','b',''),('b','c',''),('c','d',''),('d','e',''),('e','f','Hợp lệ'),('e','h','Quá hạn/xung đột'),('f','g','')], 'course-order/course-order.controller.js; payment/payment.service.js')
flow('05-huy-hoan', 'Hội viên hủy khóa và nhận hoàn tiền', ['Hội viên', 'Hệ thống', 'Quản lí trung tâm'], [
 ('a',0,'Mở hủy khóa và\nxem số tiền dự kiến'),('b',1,'Tính buổi còn lại,\ngiá trị, phí và số hoàn'),('c',0,'Nhập lý do và xác nhận'),
 ('d',1,'Hủy đăng ký;\nnhả chỗ, lưu lịch sử'),('e',1,'Số hoàn dương: tạo Refund\nPENDING và mã HT'),
 ('f',0,'Tra mã và liên hệ\nQuản lí trung tâm'),('g',2,'Đối chiếu và\nchuyển trả tiền'),('h',2,'Nhập tham chiếu\nxác nhận chuyển trả'),('i',1,'Refund DONE;\nthông báo đã hoàn tiền'),('j',1,'Kết thúc hủy;\nkhông có yêu cầu hoàn'),
], [('a','b',''),('b','c',''),('c','d',''),('d','e','Có tiền hoàn'),('d','j','Số hoàn bằng 0'),('e','f',''),('f','g',''),('g','h',''),('h','i','')], 'cancellation/cancellation.service.js; reconciliation/refund.service.js')
flow('06-doi-soat', 'Đối soát giao dịch và khai báo chuyển tiền', ['Hội viên / SePay', 'Hệ thống', 'Quản lí trung tâm'], [
 ('a',0,'SePay gửi giao dịch\nkhông tự khớp'),('b',1,'Lưu log, phiếu theo lý do;\nkhông cộng trùng ID'),('c',0,'Hội viên báo đã chuyển'),
 ('d',1,'Tạo MEMBER_CLAIM;\nkhông tự PAID'),('e',2,'Đối chiếu chứng cứ,\nghi nhật ký liên hệ'),('f',2,'Chọn gán tiền\nhoặc yêu cầu hoàn'),
 ('g',1,'Kiểm tra và chốt\nkhoản hợp lệ'),('h',2,'Chuyển trả; nhập\ntham chiếu hoàn'),
], [('a','b',''),('b','e',''),('c','d',''),('d','e',''),('e','f',''),('f','g','Gán/xác nhận'),('f','h','Cần hoàn')], 'reconciliation/payment-claim.service.js; reconciliation/reconciliation-resolve.service.js')
flow('07-diem-danh', 'Điểm danh và nhận xét từng buổi', ['Huấn luyện viên', 'Hệ thống', 'Quản lí trung tâm'], [
 ('a',0,'Mở buổi được phụ trách'),('b',1,'Kiểm tra phạm vi buổi\nvà học viên'),('c',0,'Gửi có mặt/vắng'),('d',1,'Kiểm tra hạn sửa\nvà trạng thái xin nghỉ'),
 ('e',2,'Mở hạn sửa;\nnhập lý do'),('f',1,'Lưu Attendance và audit'),('g',0,'Nhập điểm/ghi chú buổi;\ngửi expectedVersion'),
 ('h',1,'Kiểm tra buổi\nvà expectedVersion'),('i',0,'409: tải lại nhận xét;\nkiểm tra bản mới'),('j',1,'Lưu nhận xét\nvà lịch sử chỉnh sửa'),('k',1,'Từ chối ghi;\nbáo lý do'),
], [('a','b',''),('b','c',''),('c','d',''),('d','e','Cần mở hạn sửa'),('e','d','Thử lại trong hạn mở'),('d','f','Được sửa'),('b','g','Nhận xét riêng'),('g','h',''),('h','i','Sai expectedVersion'),('h','j','Hợp lệ'),('i','g','Sửa và gửi lại'),('b','k','Ngoài phạm vi'),('d','k','Chưa bắt đầu/đã hủy')], 'attendance/attendance.service.js; session-feedback/session-feedback.service.js')
flow('08-tong-ket', 'Kết thúc và công bố tổng kết khóa', ['Huấn luyện viên', 'Hệ thống', 'Quản lí trung tâm'], [
 ('a',1,'Kết thúc khóa;\ntạo tổng kết DRAFT'),('b',0,'Nhập kết quả,\ntiến bộ và nhận xét'),('c',1,'Kiểm tra kết quả;\nxác nhận missing'),
 ('d',1,'Công bố; chốt snapshot\nvà tăng revision'),('e',1,'Cho hội viên xem\nkết quả đã công bố'),('f',2,'Quản lí trung tâm\nmở lại với lý do'),('g',1,'Mở DRAFT để sửa\nvà công bố lại'),
], [('a','b',''),('b','c',''),('c','b','Chưa đủ'),('c','d','Đủ'),('d','e',''),('d','f','Cần chỉnh sửa'),('f','g',''),('g','b','')], 'course-summary/course-completion.job.js; course-summary/course-summary.service.js')
flow('09-doi-khoa', 'Đổi khóa và thanh toán chênh lệch', ['Hội viên / Lễ tân', 'Hệ thống'], [
 ('a',0,'Chọn khóa đích\nvà xem trước chênh lệch'),('b',1,'Tính giá trị nguồn\nvà học phí đích'),('c',0,'Xác nhận đổi khóa'),
 ('d',1,'Tạo ADJUSTMENT;\ngiữ chỗ đích'),('e',0,'Thanh toán chênh lệch'),('f',1,'Chốt đổi: hủy nguồn,\nBOOKED đích'),
 ('g',1,'Chốt đổi ngay;\nhoàn phần dư nếu có'),('h',1,'Hủy lần đổi;\ngiữ quyền khóa nguồn'),
], [('a','b',''),('b','c','Hợp lệ'),('c','d','Cần trả thêm'),('d','e',''),('e','f','Đủ điều kiện'),('c','g','Không cần trả thêm'),('d','h','Hết hạn')], 'purchase-change/purchase-change-request.service.js; purchase-change/purchase-change.service.js')

flow('10-doi-lich', 'Đổi giờ buổi học hoặc lịch tuần', ['Quản lí trung tâm', 'Hệ thống'], [
 ('a',0,'Chọn lịch mới và xem trước'),('b',1,'Kiểm tra báo trước ít nhất 48 giờ;\nkiểm tra hội viên, HLV, phòng'),
 ('c',0,'Xác nhận đổi lịch'),('d',1,'Khóa lịch, kiểm tra lại\nvà lưu thông báo/audit'),
], [('a','b',''),('b','c','Hợp lệ'),('c','d','')], 'class/class-reschedule-policy.service.js')

STATES = [
 ('invoice','InvoiceStatus','Hóa đơn', [('PENDING','PAID','Xác nhận thanh toán hợp lệ'),('PENDING','FAILED','Hết hạn/nhả giữ chỗ hợp lệ'),('PAID','REFUNDED','Hoàn toàn bộ hóa đơn theo nghiệp vụ')], 'Thanh toán thiếu/thừa chưa chốt vẫn PENDING. Hủy khóa và yêu cầu hoàn có trạng thái riêng; không đổi mọi hóa đơn PAID thành REFUNDED ngay khi hủy.'),
 ('enrollment','EnrollmentStatus','Đăng ký khóa', [('PENDING_PAYMENT','BOOKED','Thanh toán hợp lệ'),('PENDING_PAYMENT','CANCELLED','Hết hạn/bỏ giữ chỗ chưa nhận tiền'),('BOOKED','CANCELLED','Hủy/đổi/trung tâm hủy'),('CANCELLED','PENDING_PAYMENT','Mua lại đủ điều kiện'),('CANCELLED','BOOKED','Đăng ký lại lớp giá 0 hợp lệ')], 'Lớp giá 0 có API đăng ký trực tiếp BOOKED. Khóa có học phí luôn qua hóa đơn. Mua lại không xóa snapshot lần hủy.'),
 ('class','ClassStatus','Khóa học', [('OPEN','CLOSED','Đóng nhận đăng ký'),('CLOSED','OPEN','Mở lại theo điều kiện'),('OPEN','COMPLETED','Mọi buổi không hủy đã kết thúc'),('CLOSED','COMPLETED','Mọi buổi không hủy đã kết thúc'),('OPEN','CANCELLED','Trung tâm hủy'),('CLOSED','CANCELLED','Trung tâm hủy')], 'ClassStatus và SessionStatus là hai enum riêng. Cần ít nhất một buổi không hủy để tạo tổng kết.'),
 ('waitlist','WaitlistStatus','Danh sách chờ', [('WAITING','OFFERED','Có chỗ và ứng viên hợp lệ'),('OFFERED','ACCEPTED','Xác nhận đăng ký/tạo đơn trong hạn'),('OFFERED','EXPIRED','Quá hạn lời mời'),('WAITING','CANCELLED','Rời/chưa đủ điều kiện/khóa không nhận đăng ký'),('OFFERED','CANCELLED','Rời/khóa không nhận đăng ký'),('EXPIRED','WAITING','Tham gia lại khi đủ điều kiện'),('CANCELLED','WAITING','Tham gia lại khi đủ điều kiện'),('ACCEPTED','WAITING','Đăng ký cũ không còn; đủ điều kiện chờ')], 'ACCEPTED không có nghĩa đã trả tiền; đăng ký khóa có học phí vẫn PENDING_PAYMENT trước khi xác nhận.'),
 ('refund','RefundStatus','Yêu cầu hoàn', [('PENDING','DONE','Quản lí trung tâm xác nhận đã chuyển trả')], 'Chỉ tạo yêu cầu khi có khoản hoàn dương. Mã HT là mã tra cứu từ ID, không phải mã giao dịch ngân hàng.'),
 ('change','PurchaseChangeStatus','Yêu cầu đổi', [('PENDING_PAYMENT','DONE','Trả thêm hợp lệ hoặc không cần trả thêm'),('PENDING_PAYMENT','CANCELLED','Hóa đơn chênh lệch không hoàn tất')], 'Không cần trả thêm thì tạo và chốt đổi ngay. Trong thời gian chờ trả thêm, nguồn chưa bị thu hồi quyền học.'),
 ('summary','CourseSummaryStatus','Tổng kết', [('DRAFT','PUBLISHED','Đủ kết quả, xác nhận và công bố'),('PUBLISHED','DRAFT','Quản lí trung tâm mở lại với lý do')], 'Nhắc hạn/quá hạn không phải trạng thái mới. Đánh giá khóa có cửa sổ riêng từ buổi cuối, không phụ thuộc công bố tổng kết.'),
]


def quote(text):
    return json.dumps(str(text), ensure_ascii=False)


def render_all(snapshot):
    from standard_diagrams import render_all as render_standard
    return render_standard(snapshot,FLOWS,STATES)
