"""Build current documentation from the reviewed catalog."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPoints
from pptx.dml.color import RGBColor as PColor
from catalog import ROLES, ROLE_SOURCE, SCOPE, RULES, BY_RULE, CASES, BY_CASE
from spec_diagrams import FLOWS, STATES, DIRECTORY
from new_plan import tab
from openpyxl import Workbook
from doc_layout import ROOT, DOCS, DATE, source_path, new_document, grid, figure, section, save, roles

def testcases_and_trace(tasks, snapshot):
    directory=DOCS/'kiem-thu';directory.mkdir(exist_ok=True)
    cases=[
        ('TC-01','UC-UM-01','Đăng ký liên hệ mới','Tạo tài khoản; không có hóa đơn hoặc đăng ký khóa tự sinh','tests/e2e/course-only.spec.mjs'),
        ('TC-02','UC-UM-11','Email chưa xác minh, mật khẩu đúng','Không đăng nhập, có hướng dẫn xác minh','tests/e2e/email-flows.spec.mjs'),
        ('TC-03','UC-CB-06','Khóa có học phí, còn chỗ','PENDING_PAYMENT và hóa đơn COURSE, chưa BOOKED','core/be/tests/course-checkout-race.test.js'),
        ('TC-04','UC-CB-06','Bấm lại cùng hội viên/khóa/kênh','Tái sử dụng hóa đơn đang chờ','core/be/tests/course-checkout-race.test.js'),
        ('TC-05','UC-CB-19','Khóa đầy, hội viên đủ điều kiện khác','Vào WAITING, không tạo hóa đơn','core/be/tests/course-checkout-race.test.js'),
        ('TC-06','UC-PAY-02','Webhook lặp cùng ID','Không ghi thêm Payment','core/be/tests/sepay-webhook.test.js'),
        ('TC-07','UC-PAY-12','Thiếu rồi bù đúng tổng trong hạn','PAID/BOOKED; phiếu thiếu được khép','core/be/tests/course-payment-resolution.test.js'),
        ('TC-08','UC-PAY-02','Tiền đúng hạn, webhook trong grace','Xét chốt theo timestamp ngân hàng và điều kiện chỗ/lịch','core/be/tests/course-payment-deadline.test.js'),
        ('TC-09','UC-PAY-02','Tiền hoặc webhook quá điều kiện nhận','Đối soát; không giành lại chỗ đã nhả','core/be/tests/course-payment-deadline.test.js'),
        ('TC-10','UC-PAY-06','Thu quầy sau hạn, worker chưa chạy','Từ chối ghi thu','core/be/tests/course-payment-deadline.test.js'),
        ('TC-11','UC-CB-07','Hủy trước/sau buổi đầu đã mua','Tính đúng giá trị/phí; REFUND nếu có số hoàn dương','core/be/tests/course-cancellation-history.test.js'),
        ('TC-12','UC-PAY-09','Xác nhận hoàn hai lần','Không tạo khoản trả thứ hai','core/be/tests/course-refund-closure.test.js'),
        ('TC-13','UC-AT-01','Hội viên ACTIVE chưa có khóa','Vẫn lưu check-in và cảnh báo','core/be/tests/sprint3-attendance-room.test.js'),
        ('TC-14','UC-AT-02','Ghi điểm danh buổi đã kết thúc chưa mở hạn','Từ chối; nhận xét có điều kiện thời gian riêng','core/be/tests/session-feedback.test.js'),
        ('TC-15','UC-AT-03','Học viên khác đoán classId','Không lộ điểm/note của người khác','tests/e2e/course-session-history.spec.mjs'),
        ('TC-16','UC-UM-25','Huấn luyện viên ngoài phạm vi học viên','Từ chối xem hồ sơ','core/be/tests/sprint4-member-profile.test.js'),
        ('TC-17','UC-TR-05','Còn missing nhưng chưa xác nhận khi công bố','Từ chối công bố; đủ dữ liệu/xác nhận mới PUBLISHED','core/be/tests/sprint4-course.test.js'),
        ('TC-18','UC-TR-07','Có item tổng kết trong hạn đánh giá','Đánh giá theo điều kiện cửa sổ, không phụ thuộc PUBLISHED','core/be/tests/sprint4-rating-report.test.js'),
        ('TC-19','UC-RPT-02','Kỳ trước 0, có hoàn và giao dịch lịch sử','Tỷ lệ null; công thức doanh thu theo builder','core/be/tests/sprint4-reports.test.js'),
        ('TC-21','UC-PAY-19','Chuyển cả khóa: khác bộ môn hoặc hết chỗ','Từ chối và giữ nguồn BOOKED','core/be/tests/lecturer-course-changes.test.js'),
        ('TC-22','UC-CB-18','Đổi giờ đúng/thiếu 48 giờ','Đúng ranh giới được phép; thiếu 1 ms bị từ chối','core/be/src/modules/class/class-reschedule-policy.service.test.js'),
        ('TC-23','UC-CB-03','Trùng học viên giữ chỗ khi đổi một buổi/lịch tuần','Preview và ghi đều 409; lịch cũ giữ nguyên','core/be/tests/lecturer-course-changes.test.js'),
        ('TC-24','UC-PAY-02','SePay code khác tiền tố nhưng nội dung có mã đúng; out gửi lặp đồng thời','Khớp mã đúng; giao dịch lặp không lỗi và chỉ một log','core/be/tests/sepay-webhook.test.js'),
        ('TC-20','UC-RPT-04','Đăng ký chờ tiền trong kỳ','Không dùng PENDING_PAYMENT để tính số đã chiếm chỗ học chính thức','core/be/tests/sprint4-reports.test.js'),
    ]
    evidence_path = DOCS / 'kiem-thu/ket-qua-bo-sung-2026-11-06.json'
    evidence = json.loads(evidence_path.read_text()) if evidence_path.exists() else {}
    verified = bool(evidence.get('runtimeSources')) and all((ROOT / p).is_file() and hashlib.sha256((ROOT / p).read_bytes()).hexdigest() == digest for p, digest in evidence.get('runtimeSources', {}).items())
    status = lambda case_id: 'Passed — log/hash 06/11/2026' if verified and case_id in {'TC-21','TC-22','TC-23','TC-24'} else 'Chưa nghiệm thu riêng theo ca'
    book=Workbook();book.remove(book.active)
    tab(book,'Test cases',['ID','Use case','Tình huống','Kết quả mong đợi','File liên quan','Trạng thái lần biên soạn'],[[*r,status(r[0])] for r in cases],{3:65,4:110,5:90,6:35})
    tab(book,'Huong dan',['Mục','Giải thích'],[['Ý nghĩa','Đây là danh mục nghiệm thu; file liên quan là nơi cần mở kiểm tra, không tự chứng minh từng tình huống đã có assertion đầy đủ.'],['Ghi kết quả','Sau khi chạy ghi thời gian, môi trường, lệnh và kết quả thực tế. Danh mục không tự đổi Passed theo log; kết quả thực chạy ghi riêng với thời gian, môi trường và lệnh.']],{1:30,2:140})
    book.save(directory/'SWP391_TestCase.xlsx')
    records=[]
    raw=subprocess.check_output(['git','log','HEAD','--format=%H%x1f%aI%x1f%cI%x1f%an%x1f%s%x1f%b%x1e'],cwd=ROOT,text=True)
    for record in raw.split('\x1e'):
        v=record.strip('\n').split('\x1f',5)
        if len(v)==6:records.append(v)
    book=Workbook();book.remove(book.active)
    tab(book,'Tasks',['Task ID','UC','Nội dung hiện hành','Người được giao','Sprint','Bắt đầu kế hoạch','Hạn kế hoạch','Trạng thái nguồn','Nhánh nguồn','Commit nhắc ID'],[
        [t['id'],t['uc'],t['title'],t['owner'],t['sprint'],t['start'],t['due'],t['status'],t['branch'],
         '\n'.join(v[0] for v in records if re.search(r'(?<![\w-])'+re.escape(t['id'])+r'(?![\w-])',v[4]+'\n'+v[5]))] for t in tasks],{3:70,9:35,10:70})
    tab(book,'Git timeline',['SHA','Author date','Committer date','Author','Subject'],[v[:5] for v in records],{1:50,2:33,3:33,4:35,5:110})
    tab(book,'Doi chieu',['Mục','Giải thích'],[['Phân công và tác giả','Người được giao lấy task nguồn; author và ngày commit lấy Git. Hai khái niệm được giữ riêng.'],['Không có ID trong commit','Cần review diff/file tương ứng; không gán commit bằng suy đoán từ tên nhánh.'],['Dữ liệu nguồn','Task sheet nguồn trong Git 10e050b và git log HEAD; tên nhiệm vụ hiện hành theo mã nguồn đang biên soạn.'],['Giới hạn','Có commit nhắc ID chưa đủ kết luận nghiệm thu; không đổi trạng thái nguồn chỉ vì code được merge.']],{1:35,2:140})
    book.save(DOCS/'ke-hoach/SWP391_DoiChieuTaskGit.xlsx')
    return cases
