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

def report(snapshot,tasks):
    doc=new_document('BÁO CÁO ĐỒ ÁN PHẦN MỀM','Hệ thống quản lý trung tâm thể thao\nSWP391 · Nhóm Nhanh, Bảo, Khôi, Khải\n'+DATE)
    doc.add_paragraph('Phạm vi: quản lý và kinh doanh khóa học thể thao theo lịch buổi.')
    doc.add_heading('Nội dung báo cáo',1)
    for title in ['1. Bối cảnh, vấn đề và mục tiêu','2. Phạm vi và bốn vai trò','3. Chức năng và luồng nghiệp vụ','4. Trạng thái đối tượng','5. Mô hình dữ liệu','6. Quy tắc nghiệp vụ','7. Công nghệ và kiến trúc','8. Kế hoạch sprint và đóng góp','9. Kiểm chứng và giới hạn','10. Kế hoạch thuyết trình và demo','Phụ lục A. Đặc tả Use Case và đối chiếu mã nguồn']:
        doc.add_paragraph(title)
    section(doc,'1. Bối cảnh, vấn đề và mục tiêu')
    doc.add_paragraph('Trung tâm thể thao tổ chức nhiều khóa học với bộ môn, phòng, huấn luyện viên và thời gian khác nhau. Một hội viên có thể tham gia nhiều khóa; người đăng ký giữa khóa chỉ mua các buổi còn lại. Lễ tân cần hỗ trợ tại quầy, trong khi hội viên có thể tự đăng ký và chuyển khoản online.')
    doc.add_paragraph('Các vấn đề cần giải quyết gồm xung đột lịch, giới hạn chỗ, trạng thái chuyển tiền không khớp, hủy/đổi khóa và nhu cầu theo dõi học tập. Hệ thống cần kết nối trạng thái thanh toán với quyền học, đồng thời giữ được lịch sử để giải thích khoản thu và hoàn.')
    doc.add_paragraph('Mục tiêu của đồ án là hỗ trợ quy trình từ tạo khóa đến đăng ký, thanh toán, học tập, tổng kết và báo cáo trong một hệ thống; phân định trách nhiệm của bốn vai trò và kiểm soát dữ liệu theo quyền. Báo cáo không sử dụng số liệu khảo sát hoặc hiệu quả kinh doanh chưa được đo lường.')
    section(doc,'2. Phạm vi và bốn vai trò');doc.add_paragraph(SCOPE);roles(doc)
    doc.add_heading('Đầu vào và đầu ra nghiệp vụ',2)
    grid(doc,['Đầu vào','Đầu ra'],[['Thông tin tài khoản/hội viên','Hồ sơ và quyền truy cập'],['Bộ môn, phòng, huấn luyện viên, lịch, giá','Khóa và các buổi có thể nhận đăng ký'],['Yêu cầu mua và giao dịch thanh toán','Hóa đơn, giữ chỗ, đăng ký chính thức hoặc phiếu đối soát'],['Điểm danh, nhận xét, kết quả khóa','Lịch sử từng buổi, tổng kết/PDF và đánh giá'],['Kỳ và bộ lọc báo cáo','Thu/hoàn/thuần, đăng ký, lấp đầy và báo cáo tổng kết']])
    section(doc,'3. Chức năng và luồng nghiệp vụ')
    groups=[('Tài khoản và hội viên','UC-UM-',1,19),('Hồ sơ và Tổng quan','UC-UM-',22,26),('Khóa học, lịch và đăng ký','UC-CB-',1,99),('Thanh toán và đối soát','UC-PAY-',1,99),('Điểm danh và nhận xét','UC-AT-',1,99),('Tổng kết và đánh giá','UC-TR-',5,7),('Báo cáo','UC-RPT-',1,99)]
    for title,prefix,lo,hi in groups:
        doc.add_heading(title,2)
        grid(doc,['Mã','Chức năng','Tác nhân'],[[c['id'],c['title'],c['actors']] for c in CASES if c['id'].startswith(prefix) and lo<=int(c['id'].split('-')[-1])<=hi])
    doc.add_paragraph('Sơ đồ Use Case UML nằm ngay trong phần này. Đặc tả đầy đủ từng use case và endpoint/hàm đối chiếu được ghép ở Phụ lục A của chính báo cáo; file đặc tả riêng là bản tra cứu cùng nội dung.')
    from usecase_sections import diagrams, details
    diagrams(doc,'3.1 · ')
    for f in FLOWS:
        for index,view in enumerate(f.get('views',[f['name']]),1):
            landscape_figure(doc,'Luồng: '+f['title']+f' · phần {index}',view);doc.add_paragraph('Đối chiếu: '+f['source'])
    section(doc,'4. Trạng thái đối tượng')
    doc.add_paragraph('Trạng thái tiền, quyền học và hoàn tiền được quản lý riêng. Ví dụ, hóa đơn vẫn là chứng từ đã thanh toán sau một lần hủy có hoàn một phần, trong khi đăng ký đã CANCELLED và yêu cầu hoàn vẫn PENDING.')
    from state_sections import add_state
    for state in STATES:add_state(doc,state)
    landscape_figure(doc,'5. Mô hình dữ liệu · Conceptual model','conceptual')
    doc.add_paragraph('Các thực thể trung tâm gồm Người dùng, Vai trò, Khóa học, Buổi học, Đăng ký, Hóa đơn, Thanh toán, Yêu cầu hoàn, Điểm danh, Nhận xét buổi, Tổng kết và Đánh giá khóa. Tên bảng/model là tên kỹ thuật; không suy ra chức năng đang bán chỉ từ việc bảng tồn tại.')
    from plantuml_erd import DOMAINS
    for name,(title,models) in DOMAINS.items():
        landscape_figure(doc,'ERD · '+title,name)
    doc.add_paragraph('03_Mo_Hinh_Du_Lieu.docx giải thích quan hệ; SWP391_TuDienDuLieu.xlsx ghi toàn bộ trường/FK/enum; erd-vat-ly-day-du.pdf thể hiện schema vật lý đầy đủ bằng Crow’s Foot, gồm bảng giữ dữ liệu lịch sử. Sơ đồ được sinh bằng PlantUML + Graphviz; chữ trong sơ đồ dùng tiếng Anh.')
    section(doc,'6. Quy tắc nghiệp vụ')
    grid(doc,['Chức năng (Func)','Quy tắc (Rule)'],[[r['function'],r['id']+' · '+r['text']] for r in RULES])
    doc.add_paragraph('07_Business_Rules.docx chứa cùng bộ quy tắc và đường dẫn service đối chiếu. Task chỉ tham chiếu quy tắc áp dụng; công việc kỹ thuật, giao diện hoặc tài liệu không có BR riêng thì để trống.')
    section(doc,'7. Công nghệ và kiến trúc')
    grid(doc,['Thành phần','Công nghệ và trách nhiệm'],[['Giao diện','React 19, Vite 8, Ant Design 6, React Router, TanStack Query, Axios và Zustand; hiển thị chức năng và kết quả API.'],['API','Node.js, Express 5, Zod 4, JWT; router → middleware xác thực/phân quyền/validation → controller → service.'],['Dữ liệu','Prisma 7 và MySQL; FK, unique và transaction dùng cho tính nhất quán.'],['Tác vụ nền','Hết hạn hóa đơn, hàng chờ, tổng kết và thông báo/email chạy theo vòng đời tiến trình server.'],['Tích hợp','SePay nhận thông tin giao dịch, SMTP gửi email nếu được cấu hình; hoàn tiền được Quản lí trung tâm thực hiện bên ngoài rồi xác nhận.'],['Quản lý mã nguồn','Git, npm workspaces, ESLint, Vitest và Playwright.']])
    doc.add_paragraph('Frontend không quyết định số tiền thanh toán hoặc tự cấp quyền học. Backend tính học phí, kiểm tra điều kiện và ghi các thay đổi liên quan trong giao dịch. Quyền được kiểm tra tại API và tại phạm vi bản ghi; giao diện dùng quyền để hiển thị thao tác.')
    doc.add_paragraph('Kiến trúc hiện tại gồm frontend và backend theo module dùng chung thư viện core/shared; không mô tả thành microservices hay hệ thống hàng đợi độc lập khi mã nguồn không triển khai như vậy.')
    section(doc,'8. Kế hoạch sprint và đóng góp')
    grid(doc,['Sprint','Phạm vi hiện hành'],[[1,'Tài khoản, hội viên, phân quyền, thông báo/cấu hình và nền tảng hóa đơn/thu quầy.'],[2,'Bộ môn, tài nguyên, khóa/lịch, đăng ký, hủy và thao tác hộ.'],[3,'SePay, đối soát, điểm danh/xin nghỉ, hàng chờ, xử lý ngoại lệ, hủy/đổi và UI.'],[4,'Hồ sơ, tổng kết, đánh giá, báo cáo theo thời gian, kiểm thử và demo.']])
    grid(doc,['Thành viên','Phân công Sprint 4 theo nguồn task'],[['Bảo','Nền dữ liệu, backend tổng kết/đánh giá, báo cáo, seed và tài liệu/demo theo các task được giao.'],['Khôi','Hồ sơ huấn luyện viên/hội viên và kiểm thử hồ sơ.'],['Khải','Frontend tổng kết/đánh giá, báo cáo tổng kết và kiểm thử.'],['Nhanh','Đóng góp ở các sprint trước được giữ theo lịch sử Git; phân công Sprint 4 đã chuyển theo nguồn task.']])
    doc.add_paragraph('Task sheet mới chỉ liệt kê phạm vi còn dùng. ID, người nhận, nhánh, ngày kế hoạch và trạng thái nguồn được lấy từ task sheet đã lưu trong Git; tên/phạm vi task được đối chiếu lại theo mô hình khóa học. Trạng thái nguồn không tự chứng nhận phần thay đổi sau sprint đã được nghiệm thu lại.')
    doc.add_paragraph('SWP391_DoiChieuTaskGit.xlsx tách task được giao, commit có nhắc ID và lịch sử tác giả. Có commit chạm file chưa đủ kết luận một người hoàn tất toàn bộ chức năng; không dùng số commit làm tỷ lệ công sức.')
    section(doc,'9. Kiểm chứng và giới hạn')
    doc.add_paragraph('Bản tài liệu này được đối chiếu tĩnh với router, service, validation, schema, quyền mặc định và cấu hình trong mã nguồn. Quá trình sinh Word/PDF/Excel/slide không chạy lại kiểm thử nghiệp vụ hoặc xác nhận kết nối ngân hàng thật.')
    doc.add_paragraph('SWP391_TestCase.xlsx liệt kê tình huống, kết quả mong đợi và file kiểm thử liên quan. Bằng chứng chạy bổ sung ngày 06/11 lưu tại docs/kiem-thu/ket-qua-bo-sung-2026-11-06.json cùng log: BE/FE, lint/build và tạo đơn online–QR–webhook mô phỏng. Các ca TC-21–24 chỉ ghi Passed khi hash mã nguồn còn khớp; các ca còn lại chưa được nghiệm thu riêng theo danh mục. Xem thêm SWP391_BoSungTheoGopYGiangVien.docx; không diễn giải mô phỏng thành chuyển khoản ngân hàng thật.')
    doc.add_paragraph('Giới hạn cần phân biệt: email phụ thuộc cấu hình SMTP; đồng bộ SePay phụ thuộc cấu hình API; xác nhận hoàn tiền không tự chuyển tiền ngân hàng. Phân quyền mặc định có thể được Quản lí trung tâm thay đổi; tài liệu mô tả bốn vai trò của đề tài và kiểm tra quyền của từng thao tác.')
    section(doc,'10. Kế hoạch thuyết trình và demo')
    from demo_story import WORKFLOWS, STORY, CALENDAR_NOTE, PAYMENT_SCOPE
    doc.add_paragraph('Kịch bản hiện hành gồm 4 workflow chính chạy liền mạch, sau đó bốn exception gắn với business rule. Tổng 30 phút: 4 phút trình bày, 17 phút happy path, 6 phút exception và 3 phút đối chiếu/hỏi đáp. Ngày và ID dữ liệu lấy demo-data.json theo đồng hồ máy lúc chuẩn bị. Lời thuyết trình, câu hỏi WHAT/WHO/HOW/WHY và nguồn code cho từng người ở SWP391_BaiThuyetTrinh4Nguoi.docx; bộ dữ liệu thực ở SWP391_DemoData.xlsx.')
    doc.add_paragraph(STORY)
    grid(doc,['Workflow / thời gian','Vai trò chuyển tiếp','Đầu ra nối sang chặng tiếp'],[[w['id']+' · '+w['title']+' ('+w['time']+')',w['actors'],w['outputs']] for w in WORKFLOWS])
    doc.add_paragraph(CALENDAR_NOTE)
    doc.add_paragraph(PAYMENT_SCOPE)
    doc.add_paragraph('Mã hóa đơn I được tạo ở WF2 và đối chiếu lại trong báo cáo cuối WF4. Lễ tân mở cùng hóa đơn để xuất biên lai; điểm danh/nhận xét B và tổng kết/đánh giá C đều thuộc chính hội viên M. Kịch bản chi tiết, dữ liệu chuẩn bị và lời dẫn chuyển chặng ở SWP391_KichBanDemo.docx.')
    grid(doc,['Nguồn','Giá trị'],[['Commit mã nguồn main',snapshot['baseline']],['Commit đang biên soạn',snapshot['head']],['Ngày tài liệu',DATE],['Nguồn vai trò',ROLE_SOURCE],['Nguồn dữ liệu','core/be/prisma/schema.prisma'],['Nguồn đặc tả','scripts/reporting/catalog.py; đường dẫn triển khai tại từng use case/BR']])
    section(doc,'Phụ lục A · Đặc tả Use Case và đối chiếu mã nguồn')
    doc.add_paragraph('Mỗi UC dưới đây có tác nhân, điều kiện, luồng, ngoại lệ, hậu điều kiện, BR và endpoint/hàm thật. Bảng tra cứu đầy đủ nằm ở SWP391_DoiChieuUseCaseCode.xlsx; đây là đối chiếu tĩnh, không phải kết quả chạy nghiệm thu.')
    details(doc,snapshot.get('useCaseEvidence'))
    save(doc,Path('bao-cao/SWP391_BaoCaoCuoiKy.docx'))
