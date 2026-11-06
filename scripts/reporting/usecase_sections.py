"""Use-case UML views and complete specifications embedded in the report."""
import json
from catalog import CASES
from doc_layout import DOCS, grid, section, figure
from usecase_bindings import BINDINGS, NOTES


def diagrams(doc,prefix=''):
    data=json.loads((DOCS/'so-do/kiem-tra-so-do.json').read_text())
    doc.add_paragraph('Sơ đồ Use Case UML dùng liên kết liền không mũi tên giữa tác nhân và mục tiêu trong biên hệ thống. Các hình được chia thành từng phần để đọc rõ. Với UC tổng hợp, nhãn trong hình ghi đúng thao tác của tác nhân đó nhưng giữ nguyên mã UC; không gán «include»/«extend» chỉ vì hai chức năng có liên quan. SePay và sự kiện thời gian là tác nhân/kích hoạt kỹ thuật, không phải vai trò người dùng bổ sung.')
    for view in data['useCaseViews']:
        section(doc,prefix+view['title']);figure(doc,view['name'],7.4)
        doc.add_paragraph('Use case trong hình: '+', '.join(view['ids'])+'.')


def details(doc,evidence=None):
    records={row['id']:row for row in evidence or []}
    for group in ['UM','CB','PAY','AT','TR','RPT']:
        title={'UM':'Tài khoản và hồ sơ','CB':'Khóa học, lịch và đăng ký','PAY':'Thanh toán, đối soát và hoàn tiền','AT':'Điểm danh và nhận xét','TR':'Tổng kết và đánh giá','RPT':'Báo cáo'}[group]
        section(doc,'Đặc tả Use Case · '+title)
        for case in CASES:
            if not case['id'].startswith('UC-'+group+'-'):continue
            doc.add_heading(case['id']+' · '+case['title'],2)
            symbols,operations=BINDINGS[case['id']]
            record=records.get(case['id'])
            source='\n'.join(record['references']) if record else case['source']+' · '+symbols
            rows=[['Tác nhân',case['actors']],['Tiền điều kiện',case['pre']],
                  ['Luồng chính','\n'.join(f'{i}. {step}.' for i,step in enumerate(case['steps'],1))],
                  ['Luồng thay thế / ngoại lệ',case['alternatives']],['Hậu điều kiện',case['post']],
                  ['Business rules',', '.join(case['rules'])],
                  ['Endpoint / kích hoạt',operations.replace('; ','\n') or NOTES.get(case['id'],'Frontend hoặc tác vụ tự động; xem nguồn triển khai.')],
                  ['Hàm đối chiếu',source]]
            if case['id'] in NOTES:rows.append(['Cách phản ánh trong code',NOTES[case['id']]])
            grid(doc,['Thuộc tính','Đặc tả'],rows)
