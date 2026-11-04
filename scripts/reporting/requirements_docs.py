"""Update the existing requirement sources; keep historical UC identities and styles."""
import re
from copy import deepcopy
from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table
from evidence import ROOT
from documents import document, table
from content import FEATURES, RULES, REVIEW_DATE, TEST_EVIDENCE

RETIRED = {'UC-UM-03','UC-UM-04','UC-UM-07','UC-UM-08','UC-UM-10','UC-UM-20',
           'UC-TR-01','UC-TR-02','UC-TR-03','UC-TR-04',*[f'UC-AI-{i:02d}' for i in range(1,7)]}
MARKER = '[LỊCH SỬ — NGOÀI PHẠM VI] '
SCOPE = 'Phạm vi hiện hành 05/11/2026: chỉ bán khóa học; không bán gói tự tập, không triển khai AI/kế hoạch tập luyện. Hủy khóa tạo yêu cầu hoàn và mã HT để liên hệ admin, không ghi tiền hủy vào ví. Bảng/chứng từ cũ được giữ lịch sử. Mã UC/task và tác giả Git gốc không bị đổi.'
CASES = {
 'UC-UM-01': ('Đăng ký tài khoản; xác minh email, không tự đăng ký khóa',
   'Email/SĐT chưa tồn tại; role mặc định đã cấu hình.',
   'Nhập tài khoản → chuẩn hóa/kiểm tra trùng → tạo User → gửi xác minh → xác minh và đăng nhập.',
   'Chưa xác minh thì chưa được đăng nhập; lỗi mail có gửi lại. Không tạo Invoice, ClassEnrollment hoặc waitlist.',
   'Tài khoản mới không có khóa tự đăng ký; quyền đọc từ DB.'),
 'UC-CB-05': ('Xem khóa học và trạng thái đăng ký', 'Có quyền xem khóa.',
   'Xem lớp đang mở trong cửa sổ đăng ký; đọc mô tả khóa/buổi, giá trọn khóa và phần còn lại.',
   'BOOKED hiện nút Đã đăng ký bị khóa; PENDING_PAYMENT hiện tiếp tục thanh toán. Đủ chỗ/trùng lịch không bị đổi nhầm thành Đã đăng ký.',
   'Không thay trạng thái hoặc tạo hóa đơn khi chỉ xem danh sách.'),
 'UC-CB-06': ('Đăng ký khóa học có học phí', 'ACTIVE, đúng thời gian, còn buổi, không bị chặn/trùng lịch.',
   'Chọn khóa → xác nhận → khóa lịch và kiểm tra lại sức chứa → snapshot giá/số buổi → Invoice PENDING + enrollment PENDING_PAYMENT → trả đủ hợp lệ → PAID/BOOKED.',
   'Hết chỗ nhưng đủ điều kiện có thể vào WAITING; hết deadline ngừng chuyển, hết grace chưa chốt thì nhả chỗ. Lớp miễn phí legacy đăng ký trực tiếp khi đủ điều kiện.',
   'Chỉ BOOKED là chính thức; bấm lại cùng giữ chỗ không tạo hóa đơn trùng.'),
 'UC-CB-07': ('Hủy khóa đã thanh toán và tra lịch sử', 'BOOKED, có hóa đơn và còn buổi chưa diễn ra.',
   'Hủy khóa → preview học phí/buổi còn lại/phí/số hoàn → lý do → REFUND → CANCELLED và nhả chỗ → xem mã HT trong Hồ sơ → liên hệ admin.',
   'Từ chối CREDIT. Không hoàn buổi tự vắng; không xóa điểm danh/note cũ. Không cho dùng hoàn toàn bộ hóa đơn để bỏ qua phép tính hủy đã chốt.',
   'Giữ PurchaseChange/audit snapshot, Refund PENDING nếu có tiền hoàn; chưa phải đã chuyển trả.'),
 'UC-CB-09': ('Tạo đơn khóa học hộ', 'Có permission hỗ trợ; hội viên hợp lệ.',
   'Chọn hội viên và khóa → cùng luật giữ chỗ/giá/lịch như chính chủ; ghi actor nhân viên → thu đúng phần còn lại trước hạn.',
   'Hết hạn hoặc trùng lịch thì từ chối, không ghi Payment. Nếu khách đã giao tiền mặt, nhân viên trả lại hoặc thống nhất đơn mới.',
   'Không suy quyền từ tên role; thu đủ mới BOOKED.'),
 'UC-CB-10': ('Hủy khóa hộ', 'Có quyền hỗ trợ và đúng đăng ký của hội viên.',
   'Mở đăng ký → đọc preview → lý do → REFUND; hệ thống ghi actor thật và thông báo hội viên, người xử lý hoàn, HLV phù hợp; nhả FIFO nếu còn hạn.',
   'Không cộng tiền hủy vào ví; dữ liệu lịch sử vẫn còn. Bỏ giữ chỗ chưa trả tiền không phát sinh tiền hoàn.',
   'Mã HT thuộc hội viên được hủy, không phải nhân viên thao tác hộ.'),
 'UC-CB-13': ('Thông báo thay đổi/hủy và yêu cầu hoàn', 'Thao tác hủy/thay đổi hợp lệ.',
   'Lưu sự kiện/thông báo cùng transaction. Hội viên nhận xác nhận/mã hoàn; người ACTIVE có payment.refund nhận chi tiết; HLV buổi còn lại biết học viên rút; FIFO mời người kế tiếp đủ điều kiện.',
   'HLV/người chờ không nhận số tiền/mã hoàn. Request lặp không gửi trùng; khi admin xác nhận DONE hội viên mới nhận Đã hoàn tiền.',
   'Thông báo cá nhân được giữ để tra lại; permission được đọc từ DB.'),
 'UC-CB-19': ('Danh sách chờ FIFO trong hạn đăng ký', 'Khóa OPEN còn hạn, hội viên đủ điều kiện khác nhưng hết chỗ.',
   'Vào WAITING → có chỗ → kiểm tra lại điều kiện theo FIFO joinedAt/ID → OFFERED → xác nhận tạo đơn trong hạn → BOOKED sau thanh toán.',
   'offeredUntil không vượt registrationEndAt. Hết hạn đăng ký không mời thêm dù có chỗ; lời mời quá hạn chuyển người tiếp theo theo điều kiện.',
   'OFFERED giữ sức chứa, không tự cho quyền học.'),
 'UC-PAY-01': ('Thanh toán khóa học online SePay', 'Hóa đơn COURSE/ONLINE PENDING, đúng chủ và còn deadline.',
   'Hiện QR và nội dung mã hóa đơn → khách chuyển trong hạn → SePay gửi webhook → kiểm tra ngân hàng/lịch/chỗ → xác nhận đủ tiền.',
   'Mặc định 15 phút chuyển, thêm 120 giây chỉ chờ webhook tiền đúng hạn. Sau deadline ẩn QR, không chuyển thêm; cấu hình đọc DB.',
   'Không có membership mới; không tự nhận học viên khi tiền chưa được xác nhận.'),
 'UC-PAY-02': ('Xử lý webhook khóa học và timestamp ngân hàng', 'Webhook có API key hợp lệ.',
   'Dedupe ID → khóa lịch rồi hóa đơn → kiểm tra transactionDate giờ Việt Nam, deadline/grace và giữ chỗ → áp dụng khoản tiền hợp lệ.',
   'Cùng ID không cộng lại. Tiền trễ/sai mã/trùng lịch lưu NEEDS_REVIEW; giây ranh giới thiếu độ chính xác hoặc thiếu chứng cứ khi trễ phải đối soát.',
   'Ghi log và quyết định trong transaction; không tự hồi sinh chỗ đã nhả.'),
 'UC-PAY-03': ('Theo dõi chỗ và thanh toán', 'Đúng chủ hoặc nhân viên có quyền.',
   'Xem PENDING, deadline và holdReleaseAt → hệ thống tự cập nhật khi chốt → xem PAID/BOOKED hoặc lịch sử hủy/hoàn.',
   'Khoảng chờ webhook không phải thêm thời gian chuyển. Hóa đơn gốc PAID sau hủy chỉ là chứng từ, UI phải báo đăng ký đã hủy.',
   'Phân biệt trạng thái tiền, đăng ký và yêu cầu hoàn.'),
 'UC-PAY-04': ('Hết hạn và nhả chỗ', 'Hóa đơn PENDING và đã qua mốc nhả chỗ.',
   'Worker khóa lịch/hóa đơn → đọc lại trạng thái → nếu chưa PAID thì FAILED, enrollment CANCELLED, nhả FIFO và xử lý tiền đã nhận.',
   'Online chờ hết grace; quầy không có grace. Worker có chu kỳ nên phép ghi vẫn kiểm tra deadline độc lập. Đủ/thừa chưa chấp nhận cũng không giữ chỗ khóa vô hạn.',
   'Không hủy PAID; khoản tiền đã nhận không bị xóa.'),
 'UC-PAY-06': ('Thu tiền mặt tại quầy', 'Nhân viên có quyền thu, hóa đơn còn hạn, khóa còn hợp lệ.',
   'Kiểm tra số cần thu → nhận đủ → server lấy mốc chốt sau khóa → ghi một Payment, PAID và BOOKED trong cùng transaction.',
   'Mốc trước hạn hợp lệ dù commit sau hạn; request chờ khóa qua hạn bị từ chối. Thu lặp trả hóa đơn cũ. Khách chuyển khoản ở quầy dùng hóa đơn ONLINE.',
   'Không ghi lùi giờ theo client, không đánh dấu đã hoàn tiền mặt nếu nhân viên chưa trả.'),
 'UC-PAY-09': ('Hoàn tiền qua admin bằng mã HT', 'Có yêu cầu hoàn PENDING và nhân viên có payment.refund.',
   'Hội viên cung cấp HT… → admin tìm đúng mã/người/số tiền → chuyển trả bên ngoài → nhập tham chiếu → Refund DONE và thông báo Đã hoàn tiền.',
   'Hội viên không tự xác nhận; tạo lệnh chưa phải đã trả. Hai yêu cầu cùng lúc không hoàn hai lần; không tự chuyển ngân hàng bằng API.',
   'Giữ số tiền, lý do, actor, thời điểm và tham chiếu; không ghi khoản hủy vào ví.'),
 'UC-PAY-11': ('Đối soát khoản không tự khớp', 'Có giao dịch cần kiểm tra và đúng permission.',
   'Rà log/chứng cứ, liên hệ, chọn gán hợp lệ hoặc hoàn; chặn khoản đã có lệnh hoàn được dùng lại.',
   'Không bỏ qua khoản đã xác định chủ chỉ để sạch hàng chờ. Quá giữ chỗ phải kiểm tra lớp/lịch/FIFO khi đăng ký lại, không tự giành lại chỗ.',
   'Mỗi khoản được phân bổ một lần; phiếu chỉ đóng theo tiền thực tế được giải quyết.'),
 'UC-PAY-12': ('Cộng dồn chuyển thiếu và chuyển bù', 'Khoản đầu dưới giá hóa đơn, vẫn còn hạn gốc.',
   'Cộng các ID giao dịch khác nhau cùng hóa đơn → đủ thì PAID/BOOKED; bù thành thừa thì đóng phiếu thiếu và giữ phiếu thừa riêng.',
   'Không kéo deadline khóa thêm 48 giờ. Hết giữ chỗ còn thiếu thì hủy và hoàn đúng tổng đã nhận; tiền về trễ là khoản cần đối soát riêng.',
   'Hoàn hết tiền phải khép đúng phiếu thiếu/thừa cũ, không đóng nhầm tiền chưa gán.'),
 'UC-AT-03': ('Xem các buổi của một khóa và một hội viên', 'Chính chủ có schedule.view_own; admin xem người khác cần attendance.manage.',
   'Chọn khóa → lấy đủ Buổi 1–N theo thời gian → trên cùng dòng xem giờ, HLV, điểm danh, đánh giá và note → cập nhật kết quả hoặc quay lại chọn khóa.',
   'Không tự coi null là ABSENT; buổi tương lai/hủy/ngoài thời gian đăng ký có nhãn riêng. Ghép cả memberId/sessionId; dữ liệu sau hủy/mua lại vẫn đọc được.',
   'Không lộ note của học viên khác; toàn bộ buổi kể cả chưa được ghi nhận đều xuất hiện.'),
}


CASES.update({
 'UC-UM-06': ('Tìm kiếm hội viên để hỗ trợ khóa học','Có quyền đọc hội viên.','Tìm theo tên/email/SĐT, lọc trạng thái đăng ký; chọn hồ sơ để xem lịch sử khóa, hủy và hoàn theo permission.','Không dùng tìm kiếm để lộ dữ liệu người khác ngoài quyền hoặc khôi phục luồng mua/gia hạn gói đã nghỉ dùng.','Chỉ đọc hồ sơ; không tự tạo đăng ký hoặc thay học phí.'),
 'UC-CB-02': ('Tạo/cấu hình khóa và nội dung buổi','Có permission tạo lớp và tài nguyên phù hợp.','Chọn môn/HLV/phòng/khung giờ, giá trọn khóa, cửa sổ đăng ký, mô tả khóa và buổi; kiểm tra xung đột rồi tạo lịch trong transaction.','Sai chuyên môn, phòng, khung giờ hoặc lịch trùng thì từ chối.','Khóa có lịch buổi, mô tả và học phí để bán theo khóa.'),
 'UC-CB-04': ('Trung tâm hủy khóa','Có quyền hủy, khóa chưa hoàn thành.','Hủy lớp/buổi hợp lệ; giữ dữ liệu cũ, tính phần chưa học không phí và tạo yêu cầu hoàn HT; thông báo hội viên/nhân viên xử lý.','Gọi lặp không hoàn hai lần; hủy một buổi không làm đổi đơn giá buổi còn lại hoặc cộng vào ví.','Đăng ký/lịch đổi trạng thái tương ứng, yêu cầu hoàn PENDING chờ admin chuyển trả.'),
 'UC-PAY-05': ('Rà soát giao dịch bất thường','Có payment.reconcile.','Đọc log và phiếu theo lý do/trạng thái; đối chiếu người/mã/tiền; liên hệ, gán hợp lệ hoặc tạo hoàn.','Không dùng lại khoản đã có lệnh hoàn; phiếu chỉ đóng theo kết quả tiền thực tế.','Giữ audit, không bỏ qua khoản có chủ để làm sạch hàng chờ.'),
 'UC-PAY-13': ('Giao dịch chuyển lặp khác ID','Hóa đơn đã PAID và có một giao dịch ngân hàng mới.','Mở DUPLICATE_TRANSFER, liên hệ hội viên; hoàn khoản mới hoặc gán theo thỏa thuận/điều kiện, không nhận vào lớp lần hai.','Webhook lặp cùng ID là DUPLICATE kỹ thuật, không tạo tiền/lệnh hoàn mới.','Khoản chuyển lặp chưa gán độc lập với tiền đã áp dụng vào hóa đơn cũ.'),
 'UC-PAY-14': ('Hội viên báo đã chuyển','Đúng chủ, hóa đơn trong cửa sổ được báo chuyển.','Gửi thông tin giao dịch để mở MEMBER_CLAIM; nhân viên đối chiếu sao kê/webhook và xử lý theo quyền.','Lời khai không phải chứng cứ giờ ngân hàng; không tự PAID hoặc kéo dài giữ chỗ.','Phiếu chờ kiểm tra có lịch sử liên hệ; nhận hoặc từ chối có lý do.'),
 'UC-AT-01': ('Check-in theo khóa đã đăng ký','Có quyền thao tác và hội viên/khóa hợp lệ.','Ghi nhận đến trung tâm dựa trên đăng ký khóa đã thanh toán; việc check-in và điểm danh buổi là hai bản ghi/điều kiện riêng.','Không dùng gói tự tập đã nghỉ bán để cấp quyền học; vẫn kiểm tra thời gian và đăng ký.','Giữ lịch sử check-in, không thay đổi payment hoặc tạo đăng ký mới.'),
})


def prepare_styles(doc):
    # Một số DOCX nguồn dùng tên Heading viết hoa khiến lookup chuẩn của python-docx không khớp.
    template=Document()
    wanted={'Normal','Heading1','Heading2','Heading3','LightShading-Accent1','LightShadingAccent1'}
    for style in template.styles:
        if style.style_id not in wanted:continue
        found=next((s for s in doc.styles if s.style_id==style.style_id),None)
        if found is None:doc.styles.element.append(deepcopy(style.element))
        else:found.element.find(qn('w:name')).set(qn('w:val'),style.element.find(qn('w:name')).get(qn('w:val')))


def replace_fields(table_obj, values):
    for row in table_obj.rows:
        if len(row.cells)>1 and row.cells[0].text in values:
            row.cells[1].text=values[row.cells[0].text]


def update_usecases():
    path=ROOT/'docs/yeu-cau/01_Use_Case_Tong_Hop.docx'
    doc=Document(path)
    prepare_styles(doc)
    current=None
    for element in doc.element.body:
        if element.tag==qn('w:p'):
            p=Paragraph(element,doc);text=p.text.strip()
            match=re.search(r'^(?:\[.*?\]\s*)?(UC-[A-Z]+-\d+)\s*[–-]',text)
            if match:
                current=match.group(1)
                if current in RETIRED and not text.startswith(MARKER):p.text=MARKER+text
            if text.startswith('Phạm vi hiện hành'):p.text=SCOPE
            if text=='Flow 1 – Quản lý tài khoản & Membership':p.text='Flow 1 – Tài khoản; các UC membership bên dưới chỉ giữ lịch sử'
        elif element.tag==qn('w:tbl'):
            t=Table(element,doc)
            if t.rows[0].cells[0].text=='Actor':
                if current in RETIRED:
                    replace_fields(t,{key:'Ngoài phạm vi hiện hành từ 03/11/2026. Giữ ID UC để đối chiếu lịch sử; không triển khai/demo bán gói tự tập, AI hoặc kế hoạch tập luyện. Dùng luồng khóa học/điểm danh và nhận xét hiện hành.' for key in ['Mô tả','Tiền điều kiện','Hậu điều kiện','Luồng chính','Luồng thay thế','Ngoại lệ','BR liên quan']})
                elif current in CASES:
                    title,pre,main,alt,post=CASES[current]
                    if current=='UC-AT-03':replace_fields(t,{'Actor':'Hội viên chính chủ; nhân viên có attendance.manage'})
                    replace_fields(t,{'Mô tả':title,'Tiền điều kiện':pre,'Luồng chính':main,'Luồng thay thế':alt,'Ngoại lệ':'Dữ liệu sai trả lỗi; không ghi nửa giao dịch. Ngoài quyền/phạm vi trả 401/403/404 theo endpoint.','Hậu điều kiện':post,'BR liên quan':'07_Business_Rules.docx — Func | Rule và đường dẫn service hiện hành.'})
            for row in t.rows:
                key=row.cells[0].text
                uc=re.match(r'(UC-[A-Z]+-\d+)',key)
                if len(row.cells)>1 and uc and uc.group(1) in RETIRED and not row.cells[1].text.startswith(MARKER):row.cells[1].text=MARKER+row.cells[1].text
                if len(row.cells)>1 and key.startswith('Flow 1') and 'Membership' in key:row.cells[0].text='Flow 1 – Tài khoản (thống kê UC gốc, có UC đã nghỉ dùng)'
                replacements={
                    'BR-GY-11':'Hủy khóa chỉ tạo REFUND/mã HT để hội viên liên hệ admin; không có lựa chọn ghi tiền hủy vào ví. PENDING chưa phải đã chuyển trả.',
                    'BR-GY-12':'Chức năng số dư trong hợp đồng cũ không còn là phương thức hoàn hủy khóa. Dữ liệu/sổ cũ giữ để đối chiếu, không dùng làm ca demo hủy mới.',
                    'BR-GY-14':'Đổi khóa: preview, giữ quyền cũ khi chờ chênh lệch; phần trả lại tạo yêu cầu REFUND qua admin, không ghi tiền đổi lớp vào ví.',
                    'BR-GY-15':'Không sửa giá/số buổi đã mua trên chứng từ đã thanh toán. Hủy/đổi có snapshot, người thực hiện, lý do, thời điểm và liên kết yêu cầu hoàn.',
                    'BR-GY-17':'Trung tâm hủy lớp/buổi tạo yêu cầu hoàn phần chưa học tương ứng, không tự cộng số dư; giữ dữ liệu buổi cũ và thông báo đúng phạm vi.',
                }
                if key in replacements and len(row.cells)>1:row.cells[1].text=replacements[key]
                if key in {'BR-1.3 / BR-1.4','BR-1.16'}:row.cells[0].text='[Lịch sử] '+key
                if key=='UC-PAY-20' and len(row.cells)>3:
                    row.cells[1].text='Hủy khóa đã thanh toán';row.cells[3].text='Preview → lý do → REFUND → mã HT → liên hệ admin → xác nhận chuyển trả. Không ghi vào ví.'
                if key=='UC-PAY-21' and len(row.cells)>3:
                    row.cells[1].text=MARKER+'Xem/dùng số dư cũ';row.cells[3].text='Giữ dữ liệu cũ; không còn bước Hồ sơ → Số dư trong luồng hủy khóa hiện hành.'
                if key.startswith('UC-CB-04 (sửa)') and len(row.cells)>3:row.cells[3].text='Hủy lớp/buổi → tạo yêu cầu hoàn → admin chuyển trả và nhập tham chiếu; không bù vào ví.'
    for key,title,desc in [
        ('UC-AT-04','HLV nhận xét từng buổi','HLV/manager đúng phạm vi ghi note/rating sau khi buổi bắt đầu, expectedVersion chống ghi đè; lưu Feedback không đổi Attendance. Hội viên chỉ đọc note của mình.'),
        ('UC-CB-21','Tra lịch sử hủy khóa học','Hội viên vào Hồ sơ → Lịch sử hủy; admin xem trong chi tiết hội viên hoặc Hóa đơn. Snapshot tên/giá/buổi/phí/lý do, mã HT và trạng thái hoàn không bị ghi đè khi mua lại.'),
    ]:
        if not any(p.text.startswith(key+' –') for p in doc.paragraphs):
            doc.add_heading(key+' – '+title,2)
            table(doc,['Trường','Đặc tả'],[['Mô tả',desc],['Nguồn','course-history; session-feedback; cancellation-history; refund.service.js'],['Kiểm thử','course-history.test.js; course-cancellation-history.test.js; course-session-history.spec.mjs']])
    doc.core_properties.subject='Phạm vi khóa học cập nhật '+REVIEW_DATE
    doc.save(path)


def build_rules():
    doc=document('Business Rules — phạm vi hiện hành','05/11/2026 • '+str(len(RULES))+' quy tắc đối chiếu mã nguồn')
    doc.add_paragraph(SCOPE)
    doc.add_paragraph('Quy tắc dưới đây thay nội dung cũ về membership bắt buộc, bán gói hoặc trả tiền hủy vào ví. Số mặc định đọc settings; ví dụ không phải thay đổi cấu hình của máy đang chạy.')
    table(doc,['Func','Rule'],RULES)
    doc.add_heading('Ví dụ hủy và các mốc thời gian',1)
    table(doc,['Ví dụ','Kết quả'],[['1.000.000đ / 20 buổi; còn 10 buổi','Giá trị 500.000đ. Nếu phí 10% thì hoàn 450.000đ; phí 0% thì hoàn 500.000đ. Buổi tự vắng không tự được hoàn.'],['Deadline 10:15, grace đến 10:17','Ngân hàng ghi trước 10:15 và webhook trong grace mới được xét tự chốt. Sau 10:17 không lấy lại chỗ đã nhả.'],['Quầy chốt sát hạn','Mốc server sau khóa quyết định, không lấy timestamp do nhân viên gửi để ghi lùi.'],['PENDING hoàn','Hội viên liên hệ admin bằng mã HT; chỉ DONE khi admin chuyển trả và nhập tham chiếu.']])
    doc.add_heading('Phân biệt dữ liệu và chức năng đã nghỉ dùng',1)
    table(doc,['Mục cũ','Cách xử lý'],[['BR về mua/gia hạn/bảo lưu gói','Chỉ lịch sử; endpoint bán gói 410'],['AI/kế hoạch tập luyện','Ngoài phạm vi; không dùng làm tiêu chí demo'],['CreditTransaction / Membership trong ERD','Bảng vật lý còn để giữ dữ liệu và liên kết cũ; không phải lựa chọn hoàn hủy trên UI mới'],['Bàn giao Sprint 3','Giữ là tài liệu lịch sử tại ngày bàn giao, không viết lại thành trạng thái mới']])
    note=doc.add_paragraph('Kiểm tra runtime 801f9e6 ngày 04/11/2026: 282 BE + 172 FE đạt; 2 E2E đạt theo từng file. Dựng tài liệu không chạy lại test hoặc chuyển tiền thật.')
    for run in note.runs:run.font.size=Pt(8)
    for grid in doc.tables:
        for row in grid.rows:
            for cell in row.cells:
                for p in cell.paragraphs:p.paragraph_format.space_after=Pt(3)
    doc.save(ROOT/'docs/yeu-cau/07_Business_Rules.docx')


def trim_revision(doc,marker):
    body=list(doc.element.body)
    start=next((i for i,e in enumerate(body) if e.tag==qn('w:p') and Paragraph(e,doc).text==marker),None)
    if start is not None:
        for e in body[start:]:
            if e.tag!=qn('w:sectPr'):doc.element.body.remove(e)


def update_sprint4():
    path=ROOT/'docs/yeu-cau/08_Sprint4_UseCases_BusinessRules.docx'
    doc=Document(path);prepare_styles(doc);marker='Cập nhật nghiệp vụ 05/11/2026'
    trim_revision(doc,marker)
    doc.paragraphs[1].text=SCOPE+' Phân công Sprint 4: Bảo nhận phần trước đây giao Nhanh, Khôi hồ sơ full-stack, Khải FE tổng kết/đánh giá và kiểm thử; giữ trạng thái task gốc.'
    replacements={
        'Tích hợp: Job đăng ký cùng chỗ':'Tích hợp: worker kết thúc khóa cùng vòng đời server; không dùng job membership làm chức năng bán hàng hiện hành.',
        'BE – So sánh kỳ trước và cơ cấu doanh thu:':'BE – So sánh kỳ trước và cơ cấu doanh thu khóa học/chênh lệch/kênh/bộ môn. Dữ liệu gói cũ chỉ có thể xuất hiện khi đối chiếu lịch sử, không có luồng mua mới.',
        'BE – Báo cáo hội viên và đăng ký theo thời gian':'BE – Báo cáo hội viên và đăng ký khóa theo kỳ: mới, đã đăng ký, chưa đăng ký và hàng chờ; không coi kỳ gói là sản phẩm đang bán.',
        'Tích hợp: compare=previous':'Tích hợp: compare=previous, các cơ cấu hiện có dùng chung bộ lọc; phân biệt chứng từ lịch sử với nguồn bán khóa mới.',
        'Điều kiện và quy tắc: BR-S4-09:':'Điều kiện và quy tắc: mọi học viên đủ kết quả/tiến bộ; xác nhận cảnh báo missing; công bố/mở lại có audit và revision. Tập học viên lấy snapshot tại lúc kết thúc, không chỉ kiểm tra BOOKED hiện tại.',
        'Model: CoachProfile':'Model: CoachProfile, MemberProfile, CourseSummary, CourseSummaryItem, CourseRating, SessionFeedback. Lịch sử hủy dùng PurchaseChange/audit/Refund; không thêm cột mã HT vào schema.',
        'Kịch bản demo: docs/huong-dan':'Kịch bản demo theo bộ cuối kỳ và các hướng dẫn course-*.md. Mã đã tích hợp main; cả nhóm vẫn cần diễn tập trực tiếp.',
    }
    for p in doc.paragraphs:
        for prefix,value in replacements.items():
            if p.text.startswith(prefix):p.text=value;break
    doc.add_heading(marker,1)
    doc.add_paragraph('Các thay đổi sau thay thế luồng bán gói, hoàn hủy vào ví và lịch sử điểm danh/nhận xét tách bảng. Không thay đổi ID hay kế hoạch task Sprint 4.')
    table(doc,['Nhóm','Hành vi hiện hành'],[[x[1],x[2]+'\nNguồn: '+x[4]] for x in FEATURES if x[0] in {'F03','F05','F07','F08','F09','F10','F14'}])
    table(doc,['Func','Rule'],[r for r in RULES if r[0] in {'Giờ chuyển tiền và grace','Mốc chốt transaction','Mã hoàn và UI','Thông báo khi hủy','Lịch sử không bị ghi đè','Riêng tư lịch sử buổi','Khóa đã đăng ký'}])
    doc.add_paragraph(TEST_EVIDENCE)
    doc.save(path)


def build():
    update_usecases();build_rules();update_sprint4()
