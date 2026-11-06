"""Rebuild plan and traceability workbooks from Git facts and reviewed scope."""
import io
import re
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from catalog import BY_CASE, BY_RULE, CASES, RULES

ROOT=Path(__file__).resolve().parents[2]
PLAN_SOURCE='10e050b25a1ba99663abe07bf82a4c5c94256564'
RETIRED={'UC-UM-03','UC-UM-04','UC-UM-07','UC-UM-08','UC-UM-10','UC-UM-20',*[f'UC-TR-{i:02}' for i in range(1,5)],*[f'UC-AI-{i:02}' for i in range(1,7)]}


def tab(book,name,headers,rows,widths=None):
    page=book.create_sheet(name)
    page.append(headers)
    for row in rows:page.append([str(v) if v is not None else '' for v in row])
    for row in page:
        for cell in row:
            cell.alignment=Alignment(wrap_text=True,vertical='top')
            cell.font=Font(name='DejaVu Sans',size=10,bold=cell.row==1,color='FFFFFF' if cell.row==1 else '202830')
            if cell.row==1:cell.fill=PatternFill('solid',fgColor='163B58')
        page.row_dimensions[row[0].row].height=30 if row[0].row==1 else 85
    for i in range(1,len(headers)+1):page.column_dimensions[page.cell(1,i).column_letter].width=(widths or {}).get(i,25)
    page.freeze_panes='A2';page.auto_filter.ref=page.dimensions
    page.print_title_rows='1:1';page.sheet_properties.pageSetUpPr.fitToPage=True
    page.page_setup.orientation='landscape';page.page_setup.paperSize=page.PAPERSIZE_A3
    page.page_setup.fitToWidth=1;page.page_setup.fitToHeight=0
    return page


def original_book(number):
    path=f'docs/ke-hoach/SWP391_TaskSheet_Sprint{number}.xlsx'
    raw=subprocess.check_output(['git','show',f'{PLAN_SOURCE}:{path}'],cwd=ROOT)
    buffer=io.BytesIO()
    with ZipFile(io.BytesIO(raw)) as source,ZipFile(buffer,'w',ZIP_DEFLATED) as dest:
        for name in source.namelist():dest.writestr(name,source.read(name).replace(b'<v>NaN</v>',b'<v></v>'))
    return load_workbook(buffer,data_only=False)


def task_rules(case, title):
    if case['id']=='UC-UM-09':return ['BR-01','BR-03'] if 'Tạo' in title else ['BR-02','BR-03'] if 'Khoá' in title else ['BR-03']
    if case['id']=='UC-UM-02':return ['BR-03'] if 'Xem' in title else ['BR-01','BR-03']
    if case['id']=='UC-UM-11':return ['BR-03'] if 'Đăng xuất' in title else ['BR-02']
    if case['id']=='UC-CB-02':return ['BR-05','BR-08']
    if case['id']=='UC-TR-05':
        if 'Kết thúc' in title:return ['BR-30']
        if 'Công bố' in title:return ['BR-32']
        return ['BR-31','BR-32']
    return case['rules']


TASK_TITLE={
 'S1-21':'BE – Xem hồ sơ cá nhân và số khóa đã đăng ký',
 'S1-22':'FE – Xem hồ sơ cá nhân và số khóa đã đăng ký',
 'S1-29':'BE – Tìm hội viên theo tên/email/SĐT và trạng thái đăng ký khóa',
 'S1-30':'FE – Tìm hội viên theo tên/email/SĐT và trạng thái đăng ký khóa',
 'S1-31':'BE – Xem chi tiết hội viên và các đăng ký khóa học',
 'S1-32':'FE – Xem chi tiết hội viên và các đăng ký khóa học',
 'S1-43':'BE – Đọc tham số vận hành đang dùng của hệ thống',
 'S1-44':'FE – Hiển thị các nhóm cấu hình đang dùng',
 'S1-51':'BE – Thu tiền mặt cho khóa học hoặc bù hóa đơn online đã chuyển thiếu',
 'S1-52':'FE – Thu tiền mặt và hiển thị kết quả đăng ký khóa',
 'S1-53':'BE – Xuất PDF biên lai từ dữ liệu hóa đơn đã thanh toán',
 'S1-54':'FE – Tải và in biên lai hóa đơn',
 'S1-55':'BE – Đọc chi tiết hóa đơn và các lần thanh toán',
 'S1-56':'FE – Chi tiết hóa đơn, hạn thanh toán và đăng ký liên quan',
 'S2-07':'BE – Tạo khóa học có học phí, cửa sổ đăng ký và lịch buổi',
 'S2-08':'FE – Nhập thông tin, giá trọn khóa và lịch từng buổi',
 'S2-22':'BE – Tạo hóa đơn khóa học và giữ chỗ PENDING_PAYMENT',
 'S2-23':'FE – Xác nhận học phí, tạo đơn hoặc vào hàng chờ',
 'S2-24':'BE – Hủy khóa có tính giá trị còn lại/phí/yêu cầu hoàn',
 'S2-25':'FE – Xem trước và xác nhận hủy khóa học',
 'S2-26':'BE – Tạo đơn khóa học hộ, ghi đúng người thực hiện',
 'S2-27':'FE – Chọn hội viên và khóa để đăng ký hộ',
 'S2-28':'BE – Hủy khóa hộ theo quyền và ghi lịch sử',
 'S2-29':'FE – Xác nhận hủy khóa hộ và xem kết quả hoàn',
 'S3-17':'BE – Hết hạn hóa đơn, nhả giữ chỗ và chuyển tiền đã nhận sang xử lý đối soát',
 'S3-37':'BE – Phân biệt kênh ONLINE/COUNTER của hóa đơn khóa',
 'S3-38':'FE – Hiển thị kênh, hạn và tác động lên đăng ký khóa',
 'S3-46':'BE – Lưu check-in hội viên ACTIVE, cảnh báo nếu chưa có khóa BOOKED',
 'S3-47':'FE – Check-in và cảnh báo đăng ký khóa học',
 'S3-50':'BE – Lịch sử từng khóa, ghép điểm danh và nhận xét đúng hội viên/buổi',
 'S3-51':'FE – Chọn khóa, xem đủ Buổi 1–N với điểm danh và nhận xét',
 'S3-52':'BE – Gán giao dịch sai mã vào hóa đơn/đăng ký khóa hợp lệ',
 'S3-53':'FE – Chọn hội viên, hóa đơn khóa và ghi quyết định gán tiền',
 'S3-54':'BE – Cộng chuyển bù trong hạn gốc của hóa đơn khóa',
 'S3-55':'FE – Hiển thị đã nhận/còn thiếu và ngừng chuyển sau hạn',
 'S3-56':'BE – Chấp nhận tiền thừa và tạo hoàn phần thừa theo điều kiện',
 'S3-57':'FE – Xác nhận tiền thừa và theo dõi hoàn tiền',
 'S3-58':'BE – Mở phiếu giao dịch chuyển lặp khác ID sau PAID',
 'S3-59':'FE – Cảnh báo chuyển lặp và trạng thái xử lý',
 'S4-11':'BE – Kết thúc khóa theo chu kỳ worker và snapshot học viên tại thời điểm kết thúc',
 'S4-24':'BE – So kỳ trước và cơ cấu doanh thu khóa/chênh lệch/giao dịch lịch sử',
 'S4-25':'FE – Hiển thị so sánh và cơ cấu doanh thu cùng bộ lọc',
 'S4-26':'BE – Báo cáo theo kỳ: hội viên mới, khóa có lịch, đăng ký/hủy và lấp đầy',
 'S4-27':'FE – Bảng/biểu đồ báo cáo hội viên và đăng ký theo kỳ',
 'S3-43':'Docs – Mô hình dữ liệu khóa học và kịch bản demo cuối kỳ',
 'S3-45':'Test – E2E desktop thanh toán SePay, quầy, email và đăng ký khóa; ghi nghiệm thu',
 'S3-68':'Test – E2E sai mã, thiếu/bù, thừa, chuyển lặp, khai báo và hoàn tiền',
 'S3-88':'Test – Ngoại lệ đăng nhập, trùng liên hệ, hàng chờ, đổi huấn luyện viên, bảo trì và chặn vắng',
 'S3-89':'Docs – Đặc tả đối soát, hàng chờ và chặn vắng; sơ đồ và BR khóa học',
 'S4-29':'Test – E2E tổng kết, đánh giá, doanh thu theo thời gian và xuất file',
 'S4-30':'Test – E2E hồ sơ huấn luyện viên/hội viên, chia sẻ và phạm vi truy cập',
 'S4-31':'Test – Bổ sung test case Sprint 4 và ghi kết quả chạy thực tế',
 'S4-32':'Docs – Đặc tả hồ sơ, tổng kết/đánh giá, báo cáo và ERD hiện hành',
 'S4-33':'Docs – Dữ liệu demo khóa học, tổng kết, đánh giá, hồ sơ và doanh thu theo kỳ',
 'S4-34':'Docs – Viết kịch bản demo cuối kỳ và diễn tập cả nhóm',
}
UI_TITLE={
 'UI-F1-01':'FE – Tổng quan theo bốn vai trò và đăng ký khóa học',
 'UI-F1-04':'FE – Bảng hội viên: mở chi tiết và đăng ký khóa hộ',
 'UI-F1-05':'FE – Tìm/lọc hội viên theo trạng thái tài khoản và đăng ký khóa',
 'UI-F1-07':'FE – Việt hóa nhãn, thống nhất tên hệ thống và khóa học',
 'UI-F1-09':'FE – Bộ lọc hóa đơn cá nhân và trạng thái không có dữ liệu',
 'UI-F1-11':'FE – Tạo đơn khóa tại quầy: chọn hội viên/khóa, học phí và lý do từ chối',
 'UI-F1-16':'FE – Hồ sơ, khóa đăng ký, lịch sử hủy/hoàn và thông báo',
}


def build():
    directory=ROOT/'docs/ke-hoach';directory.mkdir(parents=True,exist_ok=True)
    all_tasks=[];removed=[]
    for n in range(1,5):
        original=original_book(n)[f'Task Sprint {n}']
        tasks=[];ui=[]
        for row in list(original.values)[4:]:
            if not isinstance(row[0],str) or not re.fullmatch(r'(?:S[1-4]-[\w-]+|UI-F[12]-\d+)',row[0]):continue
            values=list(row)+[None]*12
            task_id,uc,old,kind,owner,level,old_rules,branch,start,due,status,notes=values[:12]
            if uc in RETIRED or task_id in {'S3-80','S3-81','UI-F1-08'}:
                removed.append([task_id,uc,n,'Loại khỏi phạm vi hiện hành: gói tự tập/AI/cảnh báo hạn gói'])
                continue
            is_ui=task_id.startswith('UI-')
            case=BY_CASE.get(uc)
            title=TASK_TITLE.get(task_id,UI_TITLE.get(task_id,str(old).split(':',1)[0]))
            refs=task_rules(case,title) if case and not is_ui else []
            source=case['source'] if case else 'Đối chiếu từng file/test trong phạm vi task; không gán BR kỹ thuật'
            record=dict(id=task_id,uc=uc,title=title,type=kind,owner=owner,branch=branch,start=start,due=due,status=status,rule_ids=refs,source=source,sprint=n)
            all_tasks.append(record)
            rendered=[task_id,uc,title,kind,owner,branch,start,due,status,', '.join(refs),source]
            (ui if is_ui else tasks).append(rendered)
        book=Workbook();book.remove(book.active)
        tab(book,'Huong dan',['Mục','Nội dung'],[
            ['Phạm vi',f'Sprint {n}: chỉ các task còn dùng trong mô hình khóa học; không có task bán/gia hạn/bảo lưu gói.'],
            ['Nguồn phân công','ID, người, nhánh, ngày và trạng thái lấy từ task sheet đã lưu trong Git '+PLAN_SOURCE+'; lịch sử commit được đối chiếu riêng.'],
            ['Trạng thái nguồn','Done/Review/In Progress mô tả trạng thái đã ghi trong task sheet nguồn, không chứng nhận rằng phần thay đổi khóa học đã được nghiệm thu lại.'],
            ['Nội dung hiện hành','Tên task đã sửa theo chức năng hiện tại. Các thay đổi sau sprint được xem là cập nhật phạm vi; không đổi thời gian commit hay tạo lịch sử thực hiện giả.'],
            ['Business rule','Chỉ ghi mã quy tắc áp dụng. Task UI/kỹ thuật/tài liệu không có quy tắc riêng để trống. Nội dung ở tab Business Rules.'],
        ],{1:25,2:125})
        headers=['Task ID','Use case','Nội dung hiện hành','Loại','Người được giao','Nhánh nguồn','Bắt đầu kế hoạch','Hạn kế hoạch','Trạng thái nguồn','BR áp dụng','Nguồn triển khai']
        tab(book,f'Task Sprint {n}',headers,tasks,{3:65,6:30,10:34,11:65})
        if ui:tab(book,'UI',headers,ui,{3:65,6:30,10:34,11:65})
        used={code for t in all_tasks if t['sprint']==n for code in t['rule_ids']}
        tab(book,'Business Rules',['Mã','Chức năng','Quy tắc'],[[r['id'],r['function'],r['text']] for r in RULES if r['id'] in used],{1:14,2:35,3:135})
        book.save(directory/f'SWP391_TaskSheet_Sprint{n}.xlsx')
    book=Workbook();book.remove(book.active)
    tab(book,'Phan chia UC',['UC','Chức năng','Vai trò','Sprint nguồn có task','BE được giao','FE được giao','BR áp dụng','Nguồn'],[
        [c['id'],c['title'],c['actors'],', '.join(str(s) for s in sorted({t['sprint'] for t in all_tasks if t['uc']==c['id']})) or 'Phần mở rộng khóa học',
         ', '.join(sorted({str(t['owner']) for t in all_tasks if t['uc']==c['id'] and t['type']=='BE'})),
         ', '.join(sorted({str(t['owner']) for t in all_tasks if t['uc']==c['id'] and t['type']=='FE'})),', '.join(c['rules']),c['source']]
        for c in CASES],{2:45,3:45,8:65})
    tab(book,'Pham vi',['Sprint','Trọng tâm hiện hành','Quy ước'],[
        [1,'Tài khoản, quyền, hội viên, cấu hình/thông báo; các thành phần hóa đơn/thu quầy dùng lại cho khóa học','Chức năng gói tự tập cũ không còn nằm trong danh sách task hiện hành.'],
        [2,'Bộ môn, phòng, khóa học/lịch, đăng ký/hủy hộ, lịch học/lịch dạy, roster','Đăng ký khóa có học phí phải qua đơn khóa; giữ chỗ chưa là BOOKED.'],
        [3,'SePay, đối soát, hủy/đổi khóa, điểm danh/xin nghỉ, hàng chờ, xử lý ngoại lệ và UI','Giữ hạn thanh toán gốc của khóa, không dùng thời hạn chuyển bù gói cũ.'],
        [4,'Hồ sơ huấn luyện viên/hội viên, tổng kết/đánh giá, báo cáo, kiểm thử và demo','Phân công lấy nguồn: Bảo phần nền/BE/báo cáo; Khôi hồ sơ; Khải FE tổng kết/đánh giá và kiểm thử.'],
    ],{1:15,2:110,3:100})
    tab(book,'UC da loai',['Task ID nguồn','UC nguồn','Sprint','Lý do'],removed,{1:20,2:20,3:15,4:110})
    book.save(directory/'SWP391_UCP_Sprint_Role_Split.xlsx')
    return all_tasks
