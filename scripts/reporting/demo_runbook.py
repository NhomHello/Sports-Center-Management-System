"""Audience-visible script and off-screen preparation for one continuous demo."""
from pathlib import Path
from docx.shared import Inches
from doc_layout import new_document, grid, save, figure
from demo_story import WORKFLOWS, TIMELINE, STORY, CALENDAR_NOTE, PAYMENT_SCOPE, DEMO_REVISION, SPEAKERS, EXCEPTIONS, validate_story


def workflow_steps(doc,workflow):
    table=grid(doc,['Bước','Vai trò','Thao tác và kết quả cần chỉ ra'],[
        [str(i),role,action] for i,(role,action) in enumerate(workflow['steps'],1)])
    table.autofit=False
    widths=[.45,1.5,4.7]
    for column,width in zip(table.columns,widths):column.width=Inches(width)
    for row in table.rows:
        for cell,width in zip(row.cells,widths):
            cell.width=Inches(width)
            for paragraph in cell.paragraphs:paragraph.paragraph_format.keep_with_next=True


def runbook():
    validate_story()
    doc=new_document('Kịch bản trình bày và demo','4 workflow · Một lượt liền mạch · Happy path rồi exception · Cập nhật '+DEMO_REVISION)
    doc.add_paragraph(STORY)
    doc.add_paragraph(CALENDAR_NOTE)
    doc.add_paragraph('Tổng 30 phút: trình bày 4 phút, 4 workflow liền mạch 17 phút, exception 6 phút, đối chiếu/hỏi đáp 3 phút. Mở slide 5 để dẫn vào hành trình; sau đó hoàn tất WF1–WF4, rồi mỗi người minh họa một exception theo business rule.')
    grid(doc,['Thời gian','Chặng','Nội dung'],[[t,who,action] for t,_,who,action in TIMELINE])
    doc.add_heading('Toàn cảnh một lượt demo',1)
    figure(doc,'demo-happy-path',6.5)
    doc.add_heading('Ngày thực tế và bộ dữ liệu đã chuẩn bị',1)
    from council_data_docs import describe_anchor
    describe_anchor(doc)
    doc.add_heading('Dữ liệu và phiên đăng nhập chuẩn bị trước',1)
    grid(doc,['Ký hiệu','Điều kiện cần có trong hệ thống'],[
        ['M · một hội viên duy nhất','Tài khoản ACTIVE, email đã xác minh nếu có email; đăng nhập được, có hồ sơ và lịch sử B/C. Ghi tên và memberId thực tế trước diễn tập.'],
        ['A · khóa sắp đăng ký','Tạo ở WF1 bằng tài nguyên hợp lệ, giá dương, còn chỗ, thời gian nhận đăng ký bao gồm lúc demo; lịch học tương lai không trùng lịch đã có của M.'],
        ['B · khóa đang học','Cùng M đã BOOKED trước giờ buổi học bắt đầu; huấn luyện viên demo phụ trách đúng buổi. Buổi gần nhất đã bắt đầu; công cụ chuẩn bị gọi nghiệp vụ quản lý mở hạn điểm danh. Đọc attendanceUnlockedUntil trong demo-data.json; không đổi giờ hệ thống.'],
        ['C · khóa đã kết thúc','Cùng M có item tổng kết, tổng kết DRAFT; còn hạn đánh giá và M chưa gửi đánh giá. Chuyên cần M đủ ngưỡng gợi ý Đạt. Chuẩn bị đủ điểm danh và kết quả/tiến bộ hợp lệ của mọi học viên, để công bố ngay.'],
        ['Bốn vai trò','Mở sẵn bốn phiên: Quản lí trung tâm, Lễ tân, Hội viên M, Huấn luyện viên. Khi đổi vai trò chỉ đổi cửa sổ đang đăng nhập, giữ cùng server và dữ liệu.'],
        ['Lộ trình học','Chọn A/B/C cùng bộ môn hoặc lộ trình. Một huấn luyện viên demo phụ trách đúng buổi B và là tác giả được phân công tổng kết C; A cũng được tạo với huấn luyện viên đó.'],
    ])
    doc.add_paragraph('A/B/C là nhãn ghi chú của người trình bày. Ghi lại tên và ID thật khi diễn tập; không coi chúng là mã khóa có sẵn trong seed. Dữ liệu và cấu hình được chuẩn bị xong trước buổi trình bày.')
    doc.add_heading('SePay: phần trình bày gọn trong WF2',1)
    doc.add_paragraph(PAYMENT_SCOPE)
    doc.add_paragraph('Chuẩn bị hậu trường: kiểm tra cấu hình SePay/simulator trên máy demo. Sau khi màn hình tạo mã/QR, thành viên nhóm phụ trách mô phỏng lấy đúng mã I và tổng tiền của hóa đơn để chạy một lần:')
    doc.add_paragraph('npm run demo:webhook -- <MA_HOA_DON_I> <TONG_TIEN_HOA_DON>')
    doc.add_paragraph('Công cụ đọc cấu hình máy và đi qua endpoint webhook hiện có. Chỉ hiển thị giao diện mã/QR, sau đó trạng thái PAID và BOOKED cho người xem. Mã I được tạo trong chính lượt demo; thông tin khóa API và mật khẩu nằm trong cấu hình tại máy.')
    doc.add_heading('Kịch bản chạy liên tục',1)
    for w in WORKFLOWS:
        doc.add_heading(w['id']+' · '+w['title']+' ('+w['time']+' phút)',2)
        doc.add_paragraph('Người trình bày: '+SPEAKERS[w['id']])
        paragraph=doc.add_paragraph('Đầu vào: '+w['inputs']);paragraph.paragraph_format.keep_with_next=True
        workflow_steps(doc,w)
        paragraph=doc.add_paragraph('Điểm kết thúc để chuyển tiếp: '+w['outputs']);paragraph.paragraph_format.keep_with_next=True
        doc.add_paragraph('Lời dẫn chuyển chặng: “'+w['transition']+'”')
    doc.add_heading('21–27 phút · Minh họa exception theo yêu cầu giảng viên',1)
    for e in EXCEPTIONS:
        doc.add_heading(e['id']+' · '+e['title']+' ('+e['time']+')',2)
        if e['id']=='EX2': doc.add_paragraph('Lệnh phát lại đúng ID đã xử lý: node scripts/replay-demo-webhook.mjs <MA_HOA_DON_I>. Không dùng --twice: cờ đó tạo hai giao dịch khác ID.')
        grid(doc,['Mục','Nội dung'],[['Người phụ trách',SPEAKERS[e['flow']]],['Dữ liệu',e['dataset']],['Thao tác',e['action']],['Kết quả',e['expected']],['Dự phòng hỏi đáp',e['optional']]])
    doc.add_heading('Mạch dữ liệu cần giữ khi diễn tập',1)
    grid(doc,['Nối chặng','Bằng chứng trên giao diện'],[
        ['WF1 → WF2','Khóa A vừa tạo xuất hiện khi M chọn khóa; dùng cùng hồ sơ M và mục tiêu vừa cập nhật.'],
        ['WF2 → WF3','Giữ hồ sơ M; nói rõ A là khóa tiếp theo, B là khóa đang học. Buổi B hiển thị đúng M và mục tiêu đã chia sẻ ở WF1.'],
        ['WF3 → WF4','M vừa xem nhận xét B, tiếp tục mở kết quả C của chính mình; đây là mốc học tập trước đó trong cùng lộ trình.'],
        ['WF2 → kết thúc WF4','Giữ mã hóa đơn I, lọc đúng A/M và kỳ thanh toán; số liệu báo cáo và file xuất phản ánh khoản thu vừa tạo.'],
    ])
    doc.add_paragraph('Diễn tập toàn bộ một lần có bấm giờ. Chỉ chốt mỗi chặng khi đầu ra đã hiển thị thành công, rồi dùng chính dữ liệu đó để chuyển tiếp. Exception thực hiện sau WF4, hỏi đáp và đối chiếu Git ở phút 27–30.')
    save(doc,Path('bao-cao/SWP391_KichBanDemo.docx'))
