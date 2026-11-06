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
from doc_layout import ROOT, DOCS, DATE, source_path, new_document, grid, figure, section, save, roles, landscape_figure

def requirements(evidence=None):
    doc=new_document('Đặc tả chức năng và use case','Phạm vi khóa học · '+DATE)
    doc.add_paragraph(SCOPE)
    roles(doc)
    doc.add_heading('Danh mục use case',1)
    grid(doc,['Mã','Tên chức năng','Tác nhân'],[[c['id'],c['title'],c['actors']] for c in CASES])
    from usecase_sections import diagrams, details
    diagrams(doc)
    details(doc,evidence)
    save(doc,Path('yeu-cau/01_Use_Case_Tong_Hop.docx'))
    doc=new_document('Quy tắc nghiệp vụ','Func | Rule · '+DATE)
    doc.add_paragraph('Các quy tắc dưới đây mô tả điều kiện và kết quả của chức năng đang triển khai. Tên tham số cấu hình là khóa đọc từ hệ thống; giá trị ví dụ không thay thế cấu hình đang lưu.')
    grid(doc,['Chức năng (Func)','Quy tắc (Rule)'],[[r['function'],r['id']+' · '+r['text']] for r in RULES])
    doc.add_heading('Ví dụ học phí và hủy khóa',1)
    doc.add_paragraph('Khóa giá 1.000.000 đồng, tổng 20 buổi không hủy, còn 10 buổi chưa bắt đầu: học phí phần còn lại là 500.000 đồng. Hóa đơn chốt số buổi và mức giá tại lần mua.')
    doc.add_paragraph('Nếu lần mua trị giá 1.000.000 đồng cho 20 buổi, còn 10 buổi chưa học và mức phí hủy đang cấu hình là 10%, giá trị còn lại là 500.000 đồng, phí 50.000 đồng, số đề nghị hoàn 450.000 đồng. Nếu hủy trước buổi đầu thuộc lần mua thì phí bằng 0. Các số trên là ví dụ tính toán.')
    doc.add_heading('Nguồn đối chiếu',1)
    grid(doc,['Mã','Mã nguồn'],[[r['id'],'\n'.join(source_path(s) for s in r['sources'])] for r in RULES])
    save(doc,Path('yeu-cau/07_Business_Rules.docx'))
    doc=new_document('Chức năng và quy tắc Sprint 4',DATE)
    doc.add_paragraph('Sprint 4 tập trung vào hồ sơ, tổng kết, đánh giá và báo cáo. Phần này dùng cùng đặc tả và mã BR với tài liệu tổng hợp, không tạo bộ quy tắc riêng cạnh tranh.')
    ids={'UC-UM-22','UC-UM-23','UC-UM-24','UC-UM-25','UC-TR-05','UC-TR-06','UC-TR-07','UC-RPT-01','UC-RPT-02','UC-RPT-03','UC-RPT-04'}
    for c in CASES:
        if c['id'] in ids:
            doc.add_heading(c['id']+' · '+c['title'],1)
            grid(doc,['Mục','Nội dung'],[['Tác nhân',c['actors']],['Điều kiện',c['pre']],['Luồng', '\n'.join(c['steps'])],['Ngoại lệ',c['alternatives']],['Kết quả',c['post']],['BR',', '.join(c['rules'])],['Nguồn',source_path(c['source'])]])
    save(doc,Path('yeu-cau/08_Sprint4_UseCases_BusinessRules.docx'))

def data_model(snapshot,groups):
    doc=new_document('Mô hình dữ liệu','Mô hình khái niệm và ERD · '+DATE)
    landscape_figure(doc,'1. Mô hình khái niệm','conceptual')
    doc.add_paragraph('Người dùng có vai trò; hội viên đăng ký khóa học, khóa gồm các buổi. Hóa đơn chốt lần mua, các lần thanh toán gắn vào hóa đơn. Điểm danh và nhận xét được ghi theo từng hội viên/từng buổi. Tổng kết và đánh giá khóa là dữ liệu riêng với nhận xét buổi học.')
    section(doc,'2. Quan hệ chính')
    grid(doc,['Quan hệ','Ràng buộc'],[
        ['User – Role','Mỗi User có một roleId; RolePermission biểu diễn quyền của vai trò.'],
        ['GymClass – ClassSession','Một khóa có nhiều buổi; mỗi buổi có thể có phân công phòng/huấn luyện viên riêng.'],
        ['ClassEnrollment','Unique(classId, memberId): một bản ghi đăng ký hiện tại cho hội viên/khóa; invoiceId liên kết lần mua hiện tại.'],
        ['Attendance / SessionFeedback','Unique(sessionId, memberId) riêng cho từng bảng; nhận xét và điểm danh không tự tạo lẫn nhau.'],
        ['Invoice – Payment – Refund','Một hóa đơn có nhiều lần nhận tiền và có thể nhiều yêu cầu hoàn. PaymentWebhookLog phục vụ chống trùng/đối soát.'],
        ['CourseSummary – CourseSummaryItem','Một tổng kết/khóa, nhiều kết quả hội viên. Snapshot chuyên cần được chốt khi công bố.'],
        ['CourseRating','Một đánh giá/hội viên/khóa; sao khóa, sao huấn luyện viên và nhận xét.'],
        ['PurchaseChange','Lưu hủy/đổi và giá trị tại thời điểm xử lý; không dùng bản ghi đăng ký hiện tại để thay lịch sử hủy.'],
    ])
    for name,title in groups.items():
        landscape_figure(doc,'ERD · '+title,name)
    section(doc,'3. Schema vật lý và dữ liệu lịch sử')
    doc.add_paragraph(f'Schema hiện có {len(snapshot["models"])} model và {len(snapshot["relations"])} quan hệ FK được khai báo. ERD dùng Crow’s Foot (Information Engineering), sinh bằng PlantUML + Graphviz; sơ đồ miền chỉ vẽ liên kết trong miền, ERD vật lý đầy đủ ở docs/so-do/erd-vat-ly-day-du.pdf. Từ điển dữ liệu có mọi trường và ràng buộc trong workbook đi kèm.')
    doc.add_paragraph('Các bảng MembershipPlan, Membership, MembershipFreeze, các bảng lịch sử cũ và dữ liệu tài chính liên quan còn trong schema. Sự tồn tại của bảng không đồng nghĩa chức năng bán gói/AI vẫn đang mở. Tài liệu không đề xuất xóa các bảng này hoặc làm mất tham chiếu chứng từ.')
    save(doc,Path('yeu-cau/03_Mo_Hinh_Du_Lieu.docx'))
    book=Workbook();book.remove(book.active)
    tab(book,'Fields',['Model','Bảng DB','Field','Kiểu','Thuộc tính'],[[name,m['table'],f['name'],f['type'],f['attributes']] for name,m in snapshot['models'].items() for f in m['fields']],{1:30,2:35,3:35,4:30,5:120})
    tab(book,'FK',['Bảng con','FK','Bảng cha','Khóa tham chiếu','Cho phép không có cha','Unique'],[[r['from'],', '.join(r['keys']),r['to'],', '.join(r['references']),r['optional'],r['unique']] for r in snapshot['relations']],{1:35,2:40,3:35,4:35})
    tab(book,'Constraints',['Model','Ràng buộc'],[[name,c] for name,m in snapshot['models'].items() for c in m['constraints']],{1:35,2:130})
    tab(book,'Enums',['Enum','Giá trị'],[[name,', '.join(vals)] for name,vals in snapshot['enums'].items()],{1:35,2:130})
    book.save(DOCS/'yeu-cau/SWP391_TuDienDuLieu.xlsx')

def flow_document():
    doc=new_document('Sơ đồ luồng và trạng thái','Luồng phân vai theo chức năng đang triển khai · '+DATE)
    doc.add_paragraph('Các nhóm trong sơ đồ luồng xác định bên thực hiện. SePay và Hệ thống là tác nhân kỹ thuật, không phải vai trò người dùng thứ năm. Tên trạng thái lấy từ enum Prisma; nhãn trên mũi tên là điều kiện chuyển. Sơ đồ được dựng bằng PlantUML + Graphviz theo UML Activity/State, với nhánh quyết định và đường nối liên tục. Toàn bộ chữ trong sơ đồ là tiếng Anh; phần giải thích bên ngoài vẫn dùng tiếng Việt.')
    for i,f in enumerate(FLOWS,1):
        for index,view in enumerate(f.get('views',[f['name']]),1):
            landscape_figure(doc,f'{i}. '+f['title']+f' · phần {index}',view);doc.add_paragraph('Nguồn: '+f['source'])
    from state_sections import add_state
    for state in STATES:add_state(doc,state)
    save(doc,Path('yeu-cau/02_Flow_Va_StateChart.docx'))
