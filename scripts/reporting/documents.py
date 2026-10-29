"""Create the final report, demo runbook and current flow reference in Word."""
from pathlib import Path
from collections import Counter
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
from evidence import ROOT, OUT
from content import FEATURES, RULES, DEMO, QUESTIONS
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
    footer.text='Sports Center  •  29/10/2026  •  '
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
    baseline=snapshot['baseline'];commits=snapshot['commits'];tasks=snapshot['tasks']
    doc=document('Báo cáo đồ án phần mềm','Thiết kế, triển khai và bằng chứng đóng góp • Bản v1 • Nhóm Nhanh, Bảo, Khôi, Khải')
    doc.add_paragraph('Hệ thống quản lý trung tâm thể thao kết nối tài khoản, gói tự tập, lớp học, thanh toán và đánh giá kết quả. Bản nộp giải thích vì sao cần hệ thống, từng vai trò thao tác gì, dữ liệu được bảo vệ và chuyển trạng thái thế nào, cùng bằng chứng mã nguồn và kiểm thử.')
    table(doc,['Hạng mục','Nội dung'],[['Môn / đề tài','SWP391 FA26 • Đề tài 4 • GV MinhTTH5'],['Mã nguồn kiểm chứng',baseline],['Kho Git',snapshot['repo']],['Phạm vi triển khai','Tài khoản, gói tự tập, lớp/lịch, điểm danh, thanh toán/đối soát, hồ sơ, tổng kết, đánh giá, báo cáo.'],['Bộ trình bày','5 slide; kịch bản nói + demo 28 phút. Số 5 là giả định chuẩn bị theo ảnh bảng; cần tuân theo yêu cầu cuối cùng của giảng viên.']])
    doc.add_heading('Nội dung báo cáo',1)
    for text in ['1. Bối cảnh, giải pháp và vai trò','2. Chức năng và swimlane theo trách nhiệm','3. State chart theo đối tượng nghiệp vụ','4. Conceptual model, ERD và ràng buộc dữ liệu','5. Business Rules với bảng Func | Rule','6. Kiến trúc, chất lượng và kiểm thử','7. Đóng góp, task và lịch sử Git','8. Danh mục nộp và giới hạn cần trình bày']:
        doc.add_paragraph(text)
    page(doc,'1. Bối cảnh, giải pháp và vai trò')
    doc.add_paragraph('Trung tâm cần theo dõi nhiều loại quyền lợi: kỳ tự tập, chỗ trong lớp, các buổi đã học và giao dịch thanh toán. Quản lý riêng trên bảng tính/tin nhắn dễ tạo lịch trùng, xác nhận tiền không khớp, hoặc thiếu lịch sử khi đổi lịch/hoàn tiền. Đây là bài toán vận hành giả định của đồ án; không gán số liệu khảo sát hay khách hàng thực tế khi chưa có bằng chứng.')
    table(doc,['Vai trò nghiệp vụ','Việc cần hoàn thành','Điểm kiểm soát'],[['Hội viên','Mua gói/khóa, đăng ký, xem lịch/kết quả, chia sẻ hồ sơ, đánh giá','Chỉ dữ liệu chính chủ; không tự xác nhận thanh toán'],['Lễ tân','Tìm hội viên, mua/đăng ký hộ, thu tiền, hỗ trợ hồ sơ','Ghi đúng người thực hiện; không tự đổi giá sản phẩm'],['HLV','Xem lịch/roster, điểm danh, hồ sơ được chia sẻ, lập tổng kết','Đúng buổi thực dạy/phạm vi; không xem dữ liệu tài chính'],['Quản lý','Danh mục/tài nguyên/quyền, đối soát, mở lại, moderation, báo cáo','Permission riêng, audit và lý do cho thao tác quan trọng']])
    doc.add_paragraph('Tên vai trò trên là cách diễn giải nghiệp vụ. API kiểm tra permission và phạm vi bản ghi, không so chuỗi tên role. Gói tự tập và khóa học là hai sản phẩm độc lập: không áp dụng điều kiện membership cũ để chặn đăng ký lớp.')
    page(doc,'2. Chức năng hiện có')
    table(doc,['ID và chức năng','Hành vi triển khai / người dùng'],[[f'{i} • {name}',f'{description}\nTác nhân: {actors}'] for i,name,description,actors,_,_ in FEATURES])
    doc.add_heading('Ánh xạ mã nguồn và kiểm thử',2)
    table(doc,['Nhóm','Module và bằng chứng tiêu biểu'],[[f[0],f'Module BE: {f[4]}\n{f[5]}'] for f in FEATURES])
    for flow in FLOWS:
        page(doc,'2.1 Swimlane • '+flow[1]);picture(doc,flow[0],8.4)
        doc.add_paragraph('Mỗi cột là một lane trách nhiệm. Mũi tên ghi điều kiện chuyển; hình thoi là điểm quyết định. Luồng thể hiện đường chính và ngoại lệ quan trọng, còn validation chi tiết xem bảng Business Rules.')
    for index in range(0,len(STATES),2):
        page(doc,'3. State chart • trạng thái và điều kiện chuyển')
        for state in STATES[index:index+2]:
            doc.add_heading(state[1],2);picture(doc,state[0],3.3)
            doc.add_paragraph(state[4]);doc.add_paragraph('Nguồn service: '+state[5])
    page(doc,'4. Mô hình khái niệm')
    picture(doc,'conceptual',7)
    doc.add_paragraph('User là tài khoản chung, không tách bảng Member/Coach riêng chỉ theo tên vai trò. Membership biểu diễn kỳ gói; ClassEnrollment biểu diễn đăng ký lớp; Invoice/Payment/Refund biểu diễn nghĩa vụ và dòng tiền. Conceptual model diễn tả khái niệm, còn ERD bên dưới giữ tên model thực tế.')
    doc.add_paragraph(f'Phạm vi trình bày có 42 model đang dùng và 72 quan hệ có FK khai báo qua @relation(fields, references). ERD đầy đủ nằm ở SWP391_ERD_DayDu_v1.pdf và so-do/erd-full.svg; bảng DataDictionary/ForeignKeys trong Excel giữ toàn bộ trường và liên kết. Các hình miền dưới đây lược bớt trường thường để đọc cấu trúc; không thay thế schema.')
    for name,(title,_) in DOMAINS.items():
        page(doc,'4.1 ERD theo miền • '+title);picture(doc,name,8.25)
        doc.add_paragraph('Mũi tên đi từ bảng con giữ FK tới bảng cha. Nhãn đầu cha 1/0..1 biểu diễn FK bắt buộc/nullable; nhãn phía con 0..*/0..1 biểu diễn nhiều/một theo unique. Một cột tên ...Id chỉ được vẽ là FK khi schema khai báo quan hệ.')
    page(doc,'4.2 Ràng buộc dữ liệu cần bảo vệ')
    table(doc,['Ràng buộc','Ý nghĩa'],[['RolePermission(roleId, permissionId)','Một quyền không gán trùng cho cùng role.'],['ClassEnrollment(classId, memberId)','Một bản ghi đăng ký/lớp/hội viên; đăng ký lại cập nhật trạng thái/thời điểm.'],['CourseSummary.classId unique','Mỗi lớp một tổng kết; job chạy lại không tạo thêm tổng kết.'],['CourseSummaryItem(summaryId, memberId)','Mỗi học viên có tối đa một item trong tổng kết.'],['CourseRating(classId, memberId)','Một đánh giá trên một khóa cho mỗi học viên.'],['Membership.activeUserId unique nullable','Đồng bộ đúng một kỳ đang hiệu lực; kỳ mua trước không tự cho quyền tự tập.'],['Transaction và khóa DB','Đồng bộ kiểm tra sức chứa/ghi chỗ; ghi thanh toán và trao quyền lợi cùng giao dịch.'],['Snapshot và sổ giao dịch','Giữ tên/giá hóa đơn; giữ chuyên cần đã công bố; hoàn/số dư có dòng riêng.']])
    doc.add_paragraph('Mô hình và bảng quy tắc tương ứng với các service đang được sử dụng; bảng DataDictionary và ModelConstraints giữ chi tiết trường và ràng buộc để đối chiếu.')
    page(doc,'5. Business Rules hiện hành')
    doc.add_paragraph('Bảng Func | Rule áp dụng theo mã nguồn hiện có. Những số ngày/ngưỡng nêu trong đặc tả là giá trị seed mặc định; nghiệp vụ đọc cấu hình DB. Quy tắc đã sửa thay thế nội dung cũ trong bảng lịch sử Trước/Sau.')
    table(doc,['Func','Rule'],RULES)
    page(doc,'6. Công nghệ và kiến trúc')
    picture(doc,'architecture',6)
    table(doc,['Tầng','Triển khai'],[['Frontend','React 19, Vite 8, Ant Design 6, Router, TanStack Query, Axios, Zustand.'],['Backend','Node 24 theo README; Express 5, JWT, Zod, Pino; module routes/controller/service/validation.'],['Dữ liệu','Prisma 7 và MySQL 8; migration được quản lý trong Git, FK/unique/transaction và khoá DB.'],['Tác vụ nền','Worker trong vòng đời server: hóa đơn hết hạn, danh sách chờ, tổng kết, thông báo/email retry. Không mô tả là một hệ thống queue độc lập nếu chưa triển khai.'],['Tích hợp và xuất file','SePay webhook; SMTP theo cấu hình; PDF/Excel/CSV từ builder theo bộ lọc.']])
    doc.add_heading('Kết quả kiểm thử tại mã nguồn snapshot',2)
    doc.add_paragraph('Phiên kiểm tra 29/10/2026: 238 backend + 160 frontend tests đạt; lint/build/format đạt. Sau sửa lỗi, 65 E2E liên quan đạt, 5 bỏ qua theo cấu hình; kiểm tra riêng tạo lớp desktop/mobile thêm 2 ca đạt. e2e-summary.json trích thống kê của lần 70 test (65 đạt, 5 skip, 0 lỗi). Đây không phải tuyên bố đã chạy lại toàn bộ E2E sau bản sửa.')
    doc.add_paragraph('Hai lỗi đã tái hiện và sửa: tên hội viên dài làm tràn 320px; test tìm phòng chưa render trong Select ảo. Cập nhật API Ant Design cho List/Modal và range picker; bổ sung E2E thông báo đọc đơn/lần nhiều trên desktop/mobile. Build còn cảnh báo kích thước chunk, không phải lỗi biên dịch.')
    page(doc,'7. Đóng góp, task và timeline')
    table(doc,['Thành viên','Phân công hiện hành Sprint 4'],[['Bảo','Toàn bộ task trước đây giao Nhanh; nền dữ liệu, BE tổng kết/đánh giá, báo cáo BE/FE, seed, tài liệu/demo.'],['Khôi','Hồ sơ HLV/hội viên full-stack; phạm vi học viên; kiểm thử hồ sơ.'],['Khải','FE tổng kết/kết quả/đánh giá/báo cáo tổng kết; kiểm thử và test case.'],['Nhanh','Không còn task riêng của Sprint 4; đóng góp các sprint trước giữ theo task sheet và Git.']])
    doc.add_paragraph(f'Có {len(commits)} commit reachable từ main và {len(tasks)} task trong bốn task sheet. {sum(bool(t["commits"]) for t in tasks)} task có ID xuất hiện trực tiếp trong commit message. Không có ID không có nghĩa chưa làm; sheet TaskFileEvidence nối toàn bộ task với nhóm file triển khai và lịch sử chạm file để đối chiếu nội dung/hàm/test. Workbook giữ riêng người được phân công, author Git, co-author trailer, ngày kế hoạch và thời gian commit.')
    doc.add_paragraph('Đã đồng bộ task sheet Sprint 4 và bảng phân chia UC: bổ sung #110–126 cho phạm vi hiện hành và loại các hàng phạm vi đã huỷ khỏi tổng hợp công việc thực hiện. Trạng thái Review giữ nghĩa chờ review; S4-34 còn diễn tập trực tiếp. Không tạo lại lịch sử hoặc đổi tác giả để hợp thức hóa phân công.')
    doc.add_heading('Cách chứng minh một chức năng khi hỏi đáp',2)
    doc.add_paragraph('Mở TaskTraceability theo ID → đọc mô tả/quy tắc và nguồn → mở commit có ID hoặc xác nhận qua file → mở service/test → chạy UI và chỉ ra dữ liệu/audit. Đọc cả tác giả và thay đổi thực tế; không dùng số dòng/commit làm điểm đóng góp.')
    page(doc,'8. Bộ nộp và việc cần hoàn tất bởi nhóm')
    table(doc,['Tệp','Mục đích'],[['SWP391_BaoCaoDoAn_v1.docx / .pdf','Báo cáo thiết kế và hiện trạng triển khai.'],['SWP391_ThuyetTrinh_v1.pptx / .pdf','5 slide thuyết trình; PowerPoint có speaker notes.'],['SWP391_KichBanDemo_v1.docx / .pdf','Chuẩn bị, kịch bản 28 phút, expected result, fallback và hỏi đáp.'],['SWP391_TaskTraceability_v1.xlsx','Task gốc, timeline Git, phân công, data dictionary, liên kết và checklist.'],['SWP391_ERD_DayDu_v1.pdf; so-do/','ERD đầy đủ, SVG/PNG và nguồn DOT để sửa.'],['evidence.json; reconciliation.json; e2e-summary.json','Snapshot và sổ đối chiếu thay đổi tài liệu/phân công; không chứa .env.']])
    doc.add_paragraph('Trước nộp: cả nhóm diễn tập trực tiếp và xác nhận tác giả/alias, bổ sung liên kết cho task thiếu ID, kiểm tra giới hạn slide theo yêu cầu giảng viên. SMTP và SePay ngoài môi trường local chỉ được nói đã hoạt động nếu đã thực sự kiểm tra; dữ liệu seed phải được giới thiệu là dữ liệu giả.')
    doc.save(OUT/'SWP391_BaoCaoDoAn_v1.docx')
    return doc
