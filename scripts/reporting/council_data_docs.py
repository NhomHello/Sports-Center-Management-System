"""Date-mapped rehearsal inventory, built from the actual seeded IDs rather than invented names."""
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
from openpyxl import Workbook
from doc_layout import DOCS, new_document, grid, save
from new_plan import tab
from demo_story import EXCEPTIONS


def data():
    path = DOCS / 'bao-cao/demo-data.json'
    return json.loads(path.read_text()) if path.exists() else {}


def local(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(ZoneInfo('Asia/Ho_Chi_Minh')).strftime('%d/%m/%Y %H:%M:%S')


def describe_anchor(doc):
    record = data()
    if not record:
        doc.add_paragraph('Chưa nạp dataset: chạy npm run demo:prepare -- --apply. Không dùng ngày biên soạn tài liệu làm ngày thi.')
        return
    grid(doc, ['Mốc', 'Giá trị thực tế'], [
        ['Ngày/giờ lấy từ máy', local(record['anchor']) + ' · Asia/Ho_Chi_Minh'],
        ['Namespace', record['tag']],
        ['Nguồn ngày và ID', 'docs/bao-cao/demo-data.json; được tạo bởi npm run demo:prepare -- --apply'],
        ['Điểm danh B', 'Buổi ID ' + str(record['currentSession']['id']) + '; quản lý đã mở hạn đến ' + local(record['currentSession']['attendanceUnlockedUntil'])],
        ['Khi đổi ngày/diễn tập lại', 'Chạy lại lệnh để thêm bộ dữ liệu mới theo đồng hồ thực, tài liệu được sinh lại tự động. Bộ cũ được giữ; chọn đúng namespace hiện hành.'],
    ])


ACTORS={'manager':'Quản lí trung tâm','member':'Hội viên M','otherMember':'Hội viên N','coach':'Huấn luyện viên chính','otherCoach':'Huấn luyện viên đối chứng','reception':'Lễ tân'}

READY = {
    'B': 'M đã BOOKED trước buổi đầu; buổi gần nhất chưa điểm danh/nhận xét; đã mở hạn bằng quyền quản lý.',
    'C': 'M BOOKED, 4/4 PRESENT, DRAFT, PASS/progress nền đã điền; chưa công bố và chưa đánh giá.',
    'C_BAD': 'N có lịch sử học; DRAFT còn thiếu result/progress; HLV đối chứng là tác giả.',
    'A2': 'Cùng bộ môn/giá với A, chưa có M; còn chỗ và đang nhận đăng ký.',
    'FULL': 'Cùng bộ môn, sức chứa 1, N đã BOOKED; không còn chỗ.',
    'OTHER': 'Khác bộ môn của A/A2; không phải khóa tương đương.',
    'R': 'Lớp miễn phí, M và N BOOKED; đủ thời gian báo trước để tách riêng lỗi xung đột.',
    'MEMBER_CONFLICT': 'N BOOKED; HLV/phòng khác R. R dời vào giờ này gây trùng lịch N.',
    'COACH_CONFLICT': 'Cùng HLV với R, phòng khác R; dời R vào giờ này gây trùng HLV.',
    'ROOM_CONFLICT': 'Cùng phòng R, HLV khác R; dời R vào giờ này gây trùng phòng.',
    'NEAR': 'Buổi ngày kế tiếp, dưới hạn báo trước; dời thêm 1 giờ vẫn phải bị chặn.',
}


def build():
    record = data()
    doc = new_document('Dữ liệu và ca kiểm thử phục vụ hội đồng', 'Ngày được map tự động theo đồng hồ máy chạy bộ chuẩn bị')
    describe_anchor(doc)
    doc.add_heading('1. Cách chuẩn bị theo ngày thực tế', 1)
    for text in [
        'npm run demo:prepare: chỉ xem trước các ngày và tình huống. npm run demo:prepare -- --apply: thêm một namespace riêng, không reset dữ liệu hiện có. Mật khẩu các tài khoản demo lấy SEED_MOCK_PASSWORD ở máy chạy; quản lý giữ tài khoản hiện có. Không xuất mật khẩu vào tài liệu.',
        'D là ngày Việt Nam của đồng hồ máy, T là thời điểm chạy. A bắt đầu D+28; A2 D+29. Mỗi khóa có 4 buổi cách nhau 7 ngày. B lấy buổi gần nhất đã bắt đầu trong khung hoạt động, cùng các buổi trước/sau đó; quản lý mở hạn điểm danh qua service thực. C kết thúc trước B và gần T để còn cửa sổ đánh giá; không đẩy đồng hồ hoặc cho buổi chưa diễn ra thành lịch sử.',
        'R và ba lớp đối chứng đặt sau lịch A/A2 để tránh xung đột sẵn. NEAR lấy ngày kế tiếp để chưa đủ thời gian báo trước. Mọi khóa tương lai được kiểm tra phòng, HLV, bộ môn và khung hoạt động trước commit. Chứng từ lịch sử là dữ liệu demo mô phỏng, không phải tiền ngân hàng đã nhận.',
        'Chạy trước buổi thi và kiểm tra lại hạn mở điểm danh, cửa sổ đánh giá, phiên đăng nhập. Nếu thi khác ngày hoặc diễn tập đã làm đổi trạng thái, tạo namespace mới rồi chọn đúng ID trong manifest mới; wrapper tự cập nhật Word/PDF/Excel/slide. Không chạy refresh/reset DB giữa buổi báo cáo.',
    ]: doc.add_paragraph(text)
    if record:
        doc.add_heading('2. Tài khoản và dữ liệu thực đã tạo', 1)
        grid(doc, ['Phiên', 'Email / ID'], [[ACTORS[k], v['email'] + ' / ' + str(v['id'])] for k, v in record['accounts'].items()])
        rows = [[k, c['name'] + ' / ID ' + str(c['id']), READY[k]] for k, c in record['courses'].items()]
        grid(doc, ['Ký hiệu', 'Bản ghi thực', 'Trạng thái chuẩn bị'], rows)
        doc.add_paragraph('A tạo trực tiếp tại WF1. Dùng giá ' + str(record['createAInWorkflow1']['price']) + 'đ, subjectId/roomId/coachId và các ngày trong sheet A_tao_live. Không mua A, đổi A2, công bố C hoặc đánh giá C trước buổi demo chính.')
    doc.add_heading('3. Happy path và exception', 1)
    grid(doc, ['Chặng', 'Tiền điều kiện → Thao tác → Kết quả'], [
        ['WF1', 'Đúng namespace → tạo A và cập nhật mục tiêu M → A mở bán, M chia sẻ mục tiêu.'],
        ['WF2', 'M chưa có A → mua online, mở mã/QR, mô phỏng đúng tiền, tra biên lai → I PAID, A BOOKED; sau đó đổi cả A sang A2 cùng giá → A CANCELLED, A2 BOOKED.'],
        ['WF3', 'M đã mua B trước giờ học; còn hạn mở → ghi PRESENT và phản hồi → M đọc đúng bản ghi.'],
        ['WF4', 'C có dữ liệu đầy đủ, còn hạn đánh giá → công bố, PDF, đánh giá → PUBLISHED; báo cáo A/M đối chiếu I dù đăng ký đã đổi sang A2.'],
    ])
    for e in EXCEPTIONS:
        doc.add_heading(e['id'] + ' · ' + e['title'], 2)
        doc.add_paragraph(e['action'] + ' Kết quả: ' + e['expected'] + ' Dự phòng: ' + e['optional'])
    doc.add_heading('4. Các kiểm tra phải làm khi diễn tập', 1)
    doc.add_paragraph('Kiểm tra M thật sự BOOKED B/C, chưa BOOKED A2; tổng kết C chưa công bố, chưa có rating; FULL có đúng một đăng ký chính thức. Đổi R vào MEMBER_CONFLICT phải báo N; vào COACH_CONFLICT phải báo HLV; vào ROOM_CONFLICT phải báo phòng. Lỗi không đổi session, đăng ký hoặc outbox. Mã I lấy từ đơn vừa tạo, không gõ lại mã lịch sử trong tài liệu.')
    save(doc, Path('bao-cao/SWP391_DuLieuDemo.docx'))
    workbook(record)


def workbook(record):
    book = Workbook(); book.remove(book.active)
    tab(book, 'Moc_ngay', ['Mục', 'Giá trị'], [
        ['Đồng hồ thực (VN)', local(record['anchor']) if record else 'Chưa nạp'],
        ['Namespace', record.get('tag', '')], ['Nguồn', 'docs/bao-cao/demo-data.json'],
        ['Chuẩn bị lại theo ngày chạy', 'npm run demo:prepare -- --apply (tự cập nhật dữ liệu và tài liệu)'],
        ['Mật khẩu', 'SEED_MOCK_PASSWORD tại máy; không xuất vào workbook'],
    ], {1:35, 2:115})
    accounts = record.get('accounts', {})
    tab(book, 'Tai_khoan', ['Phiên', 'Email', 'User ID'], [[ACTORS[k], v['email'], v['id']] for k, v in accounts.items()], {1:25, 2:65, 3:20})
    courses = record.get('courses', {})
    tab(book, 'Khoa_va_dieu_kien', ['Key', 'Class ID', 'Tên thực', 'Giá', 'Sức chứa', 'Điều kiện nền'], [[k, c['id'], c['name'], c['price'], c['capacity'], READY[k]] for k, c in courses.items()], {1:25, 3:75, 6:115})
    tab(book, 'Buoi_hoc', ['Key', 'Session ID', 'Bắt đầu VN', 'Kết thúc VN', 'Trạng thái'], [[k, s['id'], local(s['startAt']), local(s['endAt']), s['status']] for k, c in courses.items() for s in c['sessions']], {1:25, 3:30, 4:30, 5:25})
    a = record.get('createAInWorkflow1', {})
    tab(book, 'A_tao_live', ['Mục', 'Giá trị'], [[k, local(v) if k.endswith('At') else json.dumps(v, ensure_ascii=False) if isinstance(v, (dict,list)) else v] for k,v in a.get('form', {k:a.get(k,'') for k in ['name','price','capacity','subjectId','roomId','coachId']}).items()] + [[f'Buổi {i+1}', local(s['startAt'])+' → '+local(s['endAt'])] for i, s in enumerate(a.get('sessions', []))], {1:28, 2:100})
    tab(book, 'Ngoai_le', ['ID', 'Flow', 'Dữ liệu', 'Thao tác', 'Mong đợi', 'Dự phòng'], [[e['id'],e['flow'],e['dataset'],e['action'],e['expected'],e['optional']] for e in EXCEPTIONS], {3:35,4:105,5:95,6:105})
    tab(book, 'Ghi_ket_qua', ['Mục', 'Giá trị thực sau thao tác'], [[s, 'Điền khi diễn tập'] for s in ['Class ID A','Invoice I','Số tiền I','Enrollment A','Enrollment A2','QR hiển thị','PAID/BOOKED','Attendance B','Feedback B','PUBLISHED C','Rating C','Báo cáo A/M','EX1','EX2','EX3','EX4']], {1:35,2:100})
    book.save(DOCS/'bao-cao/SWP391_DemoData.xlsx')


if __name__ == '__main__': build()
