"""Create the final report, demo runbook and current flow reference in Word."""
from pathlib import Path
from collections import Counter
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
from evidence import ROOT, OUT
from content import FEATURES, RULES, DEMO, QUESTIONS, REVIEW_DATE, TEST_EVIDENCE
from workflows import FLOWS, STATES
from diagrams import DOMAINS


def document(title,subtitle):
    doc=Document()
    doc.core_properties.author='Nhóm SWP391'
    doc.core_properties.title=title
    section=doc.sections[0]
    section.header.paragraphs[0].text='SWP391 FA26  |  SPORTS CENTER MANAGEMENT SYSTEM'
    section.top_margin=Inches(.65);section.bottom_margin=Inches(.6)
    section.left_margin=section.right_margin=Inches(.65)
    section.page_width=Inches(8.27);section.page_height=Inches(11.69)
    style=doc.styles['Normal'];style.font.name='DejaVu Sans';style.font.size=Pt(10)
    style.paragraph_format.space_after=Pt(6)
    for name,size in [('Title',28),('Heading 1',17),('Heading 2',13),('Heading 3',11)]:
        doc.styles[name].font.name='DejaVu Sans';doc.styles[name].font.size=Pt(size)
        doc.styles[name].font.color.rgb=RGBColor.from_string('163B58')
    doc.add_heading(title,0);doc.add_paragraph(subtitle)
    footer=section.footer.paragraphs[0]
    footer.text='Sports Center  •  '+ '/'.join(reversed(REVIEW_DATE.split('-'))) +'  •  '
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');footer._p.append(field)
    return doc


def table(doc,headers,rows):
    t=doc.add_table(rows=1,cols=len(headers));t.style='Light Shading Accent 1'
    if len(headers)==2:
        t.autofit=False
        widths=[1.65,5.2] if headers==['Func','Rule'] else [2.1,4.75]
        for column,width in zip(t.columns,widths):column.width=Inches(width)
    for cell,text in zip(t.rows[0].cells,headers):cell.text=str(text)
    repeat=OxmlElement('w:tblHeader');t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for values in rows:
        cells=t.add_row().cells
        for cell,text in zip(cells,values):cell.text=str(text or '')
    for row in t.rows:
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:run.font.size=Pt(8.5)
    return t


def picture(doc,name,max_height=8.3):
    path=OUT/'so-do'/f'{name}.png'
    width,height=Image.open(path).size
    scale=min(6.85/width,max_height/height)
    doc.add_picture(str(path),width=Inches(width*scale),height=Inches(height*scale))


def page(doc,title):
    doc.add_page_break();doc.add_heading(title,1)


def build_report(snapshot):
    baseline=snapshot['baseline']
    models,relations=len(snapshot['models']),len(snapshot['relations'])
    doc=document('Báo cáo đồ án phần mềm','Bản cập nhật 05/11/2026 • Chỉ bán khóa học • Nhóm Nhanh, Bảo, Khôi, Khải')
    doc.add_paragraph('Hệ thống quản lý tài khoản, khóa học theo buổi, thanh toán, hủy và hoàn tiền qua admin, hồ sơ, điểm danh/nhận xét, tổng kết và báo cáo. Gói tự tập đã dừng bán; bảng và chứng từ cũ được giữ để đối chiếu, không phải luồng bán hàng hiện hành.')
    table(doc,['Hạng mục','Hiện trạng'],[['Mã runtime main',baseline],['Ngày rà soát',REVIEW_DATE],['Kho Git',snapshot['repo']],['Giữ chỗ','Mặc định 15 phút chuyển tiền; online thêm 120 giây chờ webhook đúng hạn. Các giá trị đọc system_settings.'],['Hủy và hoàn','Hội viên cung cấp mã HT… cho admin; admin chuyển trả và xác nhận tham chiếu. Không ghi tiền hủy vào ví.'],['Kiểm thử',TEST_EVIDENCE],['Bộ trình bày','5 slide; kịch bản nói và demo 28 phút, cần nhóm diễn tập trực tiếp.']])
    page(doc,'1. Bối cảnh và trách nhiệm')
    doc.add_paragraph('Bài toán vận hành của đồ án: nhiều người cùng đăng ký chỗ cuối, tiền ngân hàng về sát hạn, chuyển thiếu/thừa và nhu cầu tra lại dữ liệu học sau khi hủy. Không sử dụng số liệu khảo sát, khách hàng hay tiền ngân hàng thật khi chưa có bằng chứng.')
    table(doc,['Vai trò nghiệp vụ','Trách nhiệm','Giới hạn'],[['Hội viên','Chọn khóa, thanh toán, xem từng buổi, hủy và tra mã hoàn','Chỉ dữ liệu của mình; không tự xác nhận đã hoàn'],['Nhân viên hỗ trợ','Tìm hội viên, tạo đơn/đăng ký hộ, thu quầy','Không tự đổi giá; mốc chốt do server'],['HLV','Điểm danh/nhận xét buổi phụ trách, hồ sơ chia sẻ, tổng kết','Không nhận số tiền/mã hoàn khi học viên rút'],['Admin theo permission','Đối soát, tra HT và xác nhận chuyển trả, cấu hình, báo cáo','Quyền API và phạm vi bản ghi; không so tên role trong code']])
    page(doc,'2. Chức năng hiện hành')
    table(doc,['Nhóm chức năng','Hành vi và người sử dụng'],[[f'{i} • {name}',description+'\nTác nhân: '+actors] for i,name,description,actors,_,_ in FEATURES])
    table(doc,['Nhóm','Mã nguồn và kiểm thử'],[[f[0],f[4]+'\n'+f[5]] for f in FEATURES])
    doc.add_heading('Những thay đổi thay thế tài liệu cũ',2)
    table(doc,['Trước đây','Hiện hành'],[['Bán gói tự tập, gia hạn/bảo lưu','Chỉ bán khóa; dữ liệu gói cũ được giữ lịch sử, API bán gói 410'],['Thiếu tiền kéo hạn chuyển bù/giữ chỗ dài','Khóa giữ deadline gốc; hết grace nhả chỗ và xử lý tiền đã nhận'],['Hủy chọn CREDIT/ví','Hủy tạo REFUND và mã HT để liên hệ admin'],['Hai bảng điểm danh và nhận xét tách rời','Chọn khóa → đủ Buổi 1–N; ghép đúng sessionId/memberId'],['Hóa đơn PAID được hiểu luôn còn quyền học','Sau hủy giữ chứng từ nhưng UI báo đăng ký đã hủy'],['Nhắc lại chức năng AI/kế hoạch tập luyện','Ngoài phạm vi; không dùng làm ca demo hoặc tiêu chí đã hoàn tất']])
    for flow in FLOWS:
        page(doc,'3. Swimlane • '+flow[1]);picture(doc,flow[0],8.1)
        doc.add_paragraph('Các lane là trách nhiệm; mũi tên ghi điều kiện. Chi tiết validation và nguồn service được đối chiếu trong bảng Func | Rule.')
    for index in range(0,len(STATES),2):
        page(doc,'4. Trạng thái và điều kiện chuyển')
        for state in STATES[index:index+2]:
            doc.add_heading(state[1],2);picture(doc,state[0],3.15)
            doc.add_paragraph(state[4]);doc.add_paragraph('Nguồn: '+state[5])
    page(doc,'5. Mô hình khái niệm và ERD')
    picture(doc,'conceptual',6.7)
    doc.add_paragraph(f'Schema hiện có {models} model và {relations} quan hệ FK khai báo. Có {sum(n[0].isupper() for n in snapshot["models"])} model PascalCase và 7 bảng legacy chữ thường; tên model tồn tại không đồng nghĩa chức năng còn được mở. SessionFeedback là nhận xét theo buổi, khác CourseRating là hội viên đánh giá khóa.')
    doc.add_paragraph('ERD vật lý đầy đủ ở SWP391_ERD_DayDu_v1.pdf / so-do/erd-full.svg. Workbook DataDictionary và ForeignKeys giữ mọi model/FK; các ERD miền dưới đây giúp đọc chi tiết.')
    for name,(title,_) in DOMAINS.items():
        page(doc,'5.1 ERD • '+title);picture(doc,name,8.1)
    table(doc,['Ràng buộc','Ý nghĩa'],[['ClassEnrollment(classId,memberId)','Một bản ghi hiện tại; hủy/mua lại không xóa snapshot PurchaseChange/audit'],['Attendance / SessionFeedback(sessionId,memberId)','Chỉ dữ liệu đúng học viên, không ghép theo lớp đơn thuần'],['Invoice và Payment','Snapshot học phí; webhook ID chống trùng; áp dụng tiền và trao chỗ cùng transaction'],['Refund','PENDING → DONE sau chuyển trả; HT là mã trình bày từ id'],['CourseSummary / CourseSummaryItem / CourseRating','Tổng kết một lớp, snapshot/revision và một đánh giá mỗi học viên/khóa'],['Dữ liệu lịch sử','Không xóa chứng từ, điểm danh/nhận xét khi hủy; bảng gói và CreditTransaction cũ còn để đối chiếu']])
    page(doc,'6. Business Rules • Func | Rule')
    doc.add_paragraph('Giá trị mặc định là cấu hình, không phải hằng cố định trong nghiệp vụ. Nội dung mới thay quy tắc bán gói và hoàn hủy vào ví của tài liệu cũ.')
    table(doc,['Func','Rule'],RULES)
    page(doc,'7. Kiến trúc và kiểm chứng')
    picture(doc,'architecture',5.8)
    table(doc,['Tầng','Hiện trạng'],[['Frontend','React, Ant Design, Router, TanStack Query, Axios, Zustand; menu theo permission'],['Backend','Express; JWT → permission → Zod → controller/service; service dùng Prisma'],['Database','MySQL, FK/unique và transaction; schedule lock trước invoice lock'],['Worker','Hết hạn, FIFO, tổng kết, outbox/email trong vòng đời server; không mô tả thành dịch vụ queue riêng'],['Tích hợp','SePay webhook xác thực; hoàn ngân hàng do admin thực hiện bên ngoài; SMTP có cấu hình/retry']])
    doc.add_paragraph(TEST_EVIDENCE)
    doc.add_paragraph('Các ca mới đã chứng minh: không tự đăng ký lớp khi tạo tài khoản; webhook sát hạn; thu quầy quá hạn; thiếu→đủ/thừa; hoàn không trùng; lịch sử hủy/nhận xét còn sau mua lại; bảng 20 buổi và quyền riêng tư giữa hai học viên.')
    page(doc,'8. Đóng góp và bằng chứng Git')
    table(doc,['Thành viên','Phân công Sprint 4'],[['Bảo','Toàn bộ phần trước đây giao Nhanh; nền dữ liệu, BE, báo cáo BE/FE, seed và tài liệu/demo'],['Khôi','Hồ sơ HLV/hội viên full-stack, phạm vi hồ sơ và E2E'],['Khải','FE tổng kết/đánh giá/báo cáo tổng kết và kiểm thử'],['Nhanh','Giữ đóng góp và author các sprint trước; không gán lại lịch sử Git']])
    doc.add_paragraph(f'Có {len(snapshot["commits"])} commit reachable từ main và {len(snapshot["tasks"])} task trong các task sheet. Workbook phân biệt người được giao, author, committer date, kế hoạch và liên kết bằng chứng. Review không tự đổi thành Done; không dùng số commit/dòng làm điểm đóng góp.')
    doc.add_paragraph('Không sửa task sheet hoặc đổi author khi dựng bộ tài liệu. Snapshot runtime là main '+baseline+'; hash nguồn tài liệu/generator được ghi ở evidence.json. Tài liệu bàn giao Sprint 3 giữ đúng thời điểm lịch sử.')
    page(doc,'9. Danh mục nộp và vận hành demo')
    table(doc,['Artifact','Nội dung'],[['Báo cáo DOCX/PDF','Chức năng, swimlane, trạng thái, ERD, Func | Rule và bằng chứng'],['Use Case / Business Rules / Sprint 4 DOCX','Đặc tả hiện hành và các mục đã nghỉ dùng được đánh dấu'],['Slide v1/v2 PPTX/PDF','Mỗi bản 5 slide, speaker notes và kịch bản 28 phút'],['Kịch bản DOCX/PDF','Thao tác UI, dữ liệu, kết quả mong đợi và dự phòng'],['TaskTraceability XLSX','Task gốc, Git, nguồn, model/FK và enum'],['verification.json','Kiểm tra artifact và hash; không phải kết quả chạy lại mọi E2E']])
    doc.add_paragraph('Không chép .env, mật khẩu hoặc token vào tài liệu. Dữ liệu seed và tham chiếu chuyển trả trên sân khấu là giả lập. Cả nhóm cần diễn tập; bộ tài liệu không thay thế kiểm chứng ngân hàng/SMTP thật.')
    doc.save(OUT/'SWP391_BaoCaoDoAn_v1.docx')
    return doc
