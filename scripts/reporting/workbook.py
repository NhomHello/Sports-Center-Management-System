"""Generate task, commit and data traceability without rewriting Git attribution."""
from collections import Counter
import textwrap
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.chart import BarChart, Reference
from openpyxl.worksheet.table import Table, TableStyleInfo
from evidence import OUT, ROOT, TEAM
from content import DEMO, RULES
from task_sources import rows as task_source_rows


def sheet(book,name,headers,rows,widths=None):
    page=book.create_sheet(name)
    page.append(headers)
    for row in rows:
        page.append([v if isinstance(v,(int,float)) else str(v or '') for v in row])
    page.freeze_panes='A2'
    page.auto_filter.ref=page.dimensions
    page.sheet_view.showGridLines=False
    for cell in page[1]:
        cell.font=Font(name='DejaVu Sans',bold=True,color='FFFFFF',size=11)
        cell.fill=PatternFill('solid',fgColor='163B58')
        cell.alignment=Alignment(wrap_text=True,vertical='center')
    page.row_dimensions[1].height=32
    for row in page.iter_rows(min_row=2):
        for cell in row:
            cell.font=Font(name='DejaVu Sans',size=10)
            cell.alignment=Alignment(wrap_text=True,vertical='top')
            if cell.row%2==0:
                cell.fill=PatternFill('solid',fgColor='EEF5FB')
            if str(cell.value).startswith('https://'):
                cell.hyperlink=cell.value;cell.font=Font(color='176AAD',underline='single',size=10)
        lines=max(sum(max(1,len(textwrap.wrap(part,width=max(12,int((widths or {}).get(cell.column,25)*.85))))) for part in str(cell.value or '').split('\n')) for cell in row)
        page.row_dimensions[row[0].row].height=min(180,max(30,lines*14+8))
    for index in range(1,len(headers)+1):
        page.column_dimensions[page.cell(1,index).column_letter].width=(widths or {}).get(index,25)
    page.print_options.horizontalCentered=True
    page.sheet_properties.pageSetUpPr.fitToPage=True
    page.page_setup.orientation='landscape'
    page.page_setup.paperSize=page.PAPERSIZE_A3
    page.page_setup.fitToWidth=1;page.page_setup.fitToHeight=0
    page.print_title_rows='1:1'
    return page


def build(snapshot):
    book=Workbook();book.remove(book.active)
    commits=snapshot['commits'];tasks=snapshot['tasks'];baseline=snapshot['baseline']
    sheet(book,'HuongDan',['Mục','Giá trị'],[
      ['Snapshot mã nguồn',baseline],['Nguồn Git',snapshot['repo']],['Phạm vi','Chỉ commit reachable từ main; không dùng commit orphan để tăng số lượng.'],
      ['Ý nghĩa liên kết','ID trực tiếp chứng minh commit nhắc task, không tự chứng minh hoàn tất. Liên kết theo file chỉ chứng minh có thay đổi file; cần review nội dung.'],
      ['Phân công Sprint 4','Bảo nhận toàn bộ task trước đây của Nhanh; Khôi hồ sơ, Khải FE tổng kết và kiểm thử. Không đổi author Git.'],
      ['Ngày kế hoạch','Bắt đầu/Hạn từ task sheet là dự kiến; GitTimeline giữ riêng author date và committer date.'],
      ['Trạng thái','Giữ Review/In Progress từ nguồn; việc đã merge không tự biến thành nghiệm thu Done. S4-34 cần diễn tập thật.'],
      ['Đánh giá cá nhân','Số commit chỉ mô tả lịch sử, không là tỷ lệ công sức, chất lượng hoặc điểm thành viên.'],
      ['Alias','Gộp email theo Git/tài liệu bàn giao; TeamIdentity giữ alias để từng thành viên xác nhận.'],
      ['Dữ liệu','DataDictionary giữ tất cả trường schema; ERD chỉ các quan hệ có @relation(fields,references), không suy ra FK từ hậu tố Id.'],
      ['Tái tạo','Xem quy trình trong SWP391_KichBanDemo_v1.docx; generator scripts/reporting; không cần đọc .env để dựng bộ báo cáo.']
    ],{1:30,2:110})
    sheet(book,'TeamIdentity',['Thành viên','Email Git','Tên author quan sát','Ghi chú'],[[member,email,' / '.join(sorted({c['author'] for c in commits if c['email']==email})),'Nhận diện theo email; không thay đổi tác giả commit'] for email,member in TEAM.items()],{1:15,2:55,3:45,4:60})
    members=['Nhanh','Bảo','Khôi','Khải']
    sheet(book,'Contributions',['Thành viên','Commit thường','Merge commit','Author date đầu','Author date cuối','Task Sprint 4 được phân công','Lưu ý'],[
      [m,sum(c['member']==m and not c['merge'] for c in commits),sum(c['member']==m and c['merge'] for c in commits),min((c['authored'] for c in commits if c['member']==m),default=''),max((c['authored'] for c in commits if c['member']==m),default=''),sum(t['owner']==m and t['id'].startswith('S4') for t in tasks),'Theo author Git, không phải đánh giá khối lượng thực tế'] for m in members],{1:14,4:30,5:30,6:25,7:60})
    sheet(book,'GitTimeline',['SHA','Author date','Committer date','Author','Email','Thành viên','Merge','Subject','Task ID trong message','Co-authored-by trailer','Commit URL'],[
      [c['hash'],c['authored'],c['committed'],c['author'],c['email'],c['member'],'Có' if c['merge'] else 'Không',c['subject'],', '.join(c['tasks']),'; '.join(c['coauthors']),c['url']] for c in commits],{1:45,2:29,3:29,5:45,8:95,10:55,11:90})
    sheet(book,'TaskTraceability',['Task ID','UC','Function / Screen','Loại','Người được phân công','Bắt đầu dự kiến','Hạn dự kiến','Trạng thái nguồn','Nhánh phân công','Commit có ID trực tiếp','Mức bằng chứng','Nguồn','Sheet','Hàng','Ghi chú nguồn'],[
      [t['id'],t['uc'],t['function'],t['type'],t['owner'],t['start'],t['due'],t['status'],t['branch'],'; '.join(t['commits']),t['evidence'],t['source'],t['sheet'],t['row'],t['notes']] for t in tasks],{1:13,2:20,3:105,5:22,10:60,11:55,12:58,15:100})
    sheet(book,'TaskFileEvidence',['Task ID','UC','Người được phân công','File triển khai trong nhóm UC','Commit chạm file','Ý nghĩa'],list(task_source_rows(tasks)),{1:14,2:20,3:22,4:105,5:60,6:100})
    sheet(book,'CanDoiChieu',['Task ID','Người nhận','Nội dung','Hành động cần làm'],[[t['id'],t['owner'],t['function'],'Mở task và file/test tương ứng; xác nhận commit triển khai. Không sửa message/author để tạo bằng chứng giả.'] for t in tasks if not t['commits']],{1:14,2:18,3:110,4:95})
    dictionary=[]
    for name,model in snapshot['models'].items():
        if not name[0].isupper():
            continue
        for field in model['fields']:
            relational=field['type'].rstrip('?[]') in snapshot['models']
            dictionary.append([name,model['table'],field['name'],field['column'] if not relational else 'Quan hệ Prisma',field['type'],'Có' if field['type'].endswith('?') else 'Không',field['attributes'],'' if name[0].islower() else 'Xem module nghiệp vụ / bảng kỹ thuật'])
    sheet(book,'DataDictionary',['Model','Bảng','Field','Cột DB / quan hệ','Kiểu Prisma','Nullable','Ràng buộc','Phạm vi'],dictionary,{1:27,2:32,3:30,4:30,5:27,7:100,8:50})
    sheet(book,'ModelConstraints',['Model','Ràng buộc cấp model'],[[name,c] for name,model in snapshot['models'].items() if name[0].isupper() for c in model['constraints']],{1:32,2:135})
    sheet(book,'ForeignKeys',['Bảng con','Quan hệ','FK','Bảng cha','Tham chiếu','Mỗi con có cha','Mỗi cha có con'],[[r['from'],r['field'],','.join(r['keys']),r['to'],','.join(r['references']),'0..1' if r['optional'] else '1','0..1' if r['unique'] else '0..*'] for r in snapshot['relations'] if r['from'][0].isupper() and r['to'][0].isupper()],{1:30,2:30,3:34,4:30,5:25})
    sheet(book,'Enums',['Enum','Các giá trị'],[[name,', '.join(values)] for name,values in snapshot['enums'].items()],{1:35,2:130})
    sheet(book,'FuncRule',['Func','Rule'],RULES,{1:32,2:145})
    sheet(book,'Demo28Phut',['Mốc','Phút','Người đề xuất','Màn hình','Thao tác / kết quả','Điều kiện / dự phòng'],DEMO,{1:22,2:10,3:25,4:42,5:105,6:100})
    months=Counter(c['authored'][:7] for c in commits if not c['merge'])
    page=sheet(book,'GitTheoThang',['Tháng author date','Commit thường'],sorted(months.items()),{1:27,2:24})
    chart=BarChart();chart.title='Commit thường theo tháng';chart.y_axis.title='Số commit';chart.x_axis.title='Tháng (author date)'
    chart.add_data(Reference(page,min_col=2,min_row=1,max_row=len(months)+1),titles_from_data=True)
    chart.set_categories(Reference(page,min_col=1,min_row=2,max_row=len(months)+1));page.add_chart(chart,'D2')
    sheet(book,'ChecklistNop',['Yêu cầu','Artifact','Bằng chứng / việc còn lại'],[
      ['Features + flow','SWP391_BaoCaoDoAn_v1.docx','14 nhóm tính năng, 7 swimlane theo actor'],['State chart','Báo cáo + so-do/state-*.svg','7 sơ đồ; tách enum với trạng thái suy diễn'],['Conceptual + ERD','Báo cáo; ERD_DayDu PDF; DataDictionary','42 model đang dùng, 72 quan hệ có FK; schema là nguồn'],['Func | Rule','Báo cáo; FuncRule','35 quy tắc hiện hành và nguồn kiểm chứng'],['Slide ≤5','SWP391_ThuyetTrinh_v1.pptx','5 slide có speaker notes; giả định giới hạn 5 slide'],['Demo 25–30 phút','KichBanDemo; Demo28Phut','28 phút; cần diễn tập trực tiếp, không đánh dấu đã diễn tập'],['Git + task + timeline','GitTimeline; TaskTraceability','Giữ SHA, author, ngày và trạng thái gốc'],['Phân công S4','Task sheet S4 + role split','Bảo nhận toàn bộ phần Nhanh; lịch sử Git giữ nguyên']
    ],{1:30,2:70,3:110})
    book.save(OUT/'SWP391_TaskTraceability_v1.xlsx')
