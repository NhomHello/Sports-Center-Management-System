"""November review additions, kept separate from the continuous happy-path demo."""
import json
from doc_layout import DOCS, new_document, grid, save


def build():
    doc = new_document('Bổ sung theo góp ý giảng viên', 'Đối chiếu nghiệp vụ, mã nguồn và chuẩn bị hội đồng · 06/11/2026')
    doc.add_heading('1. Đổi đăng ký cả khóa', 1)
    doc.add_paragraph('Hội viên chuyển đăng ký khóa nguồn sang khóa đích cùng bộ môn. Khóa đích phải khác nguồn, đang nhận đăng ký, còn chỗ và không trùng lịch hội viên ngoài khóa đang rời. Đây là chuyển cả đăng ký khóa, không tạo chức năng học bù từng buổi. Khi cần trả thêm, nguồn vẫn BOOKED và đích giữ PENDING_PAYMENT; chỉ hoàn tất khi khoản chênh lệch được xử lý hợp lệ. Kiểm tra lại quyền nguồn, bộ môn, chỗ đích và lịch trước khi chốt dưới khóa giao dịch. Cách tính phần chưa sử dụng và hoàn phần dư vẫn theo BR-18/19/21.')
    doc.add_heading('2. Đổi giờ buổi học và lịch tuần', 1)
    doc.add_paragraph('CLASS_RESCHEDULE_MIN_HOURS_BEFORE mặc định 48 giờ; cấu hình không được nhỏ hơn 48. So sánh thời điểm thao tác với cả giờ bắt đầu cũ và mới của các buổi thực sự bị đổi. Đúng 48 giờ được phép; thiếu thời gian thì từ chối. Kiểm tra phòng, chuyên môn/khung hoạt động và lịch HLV; học viên BOOKED hoặc đang giữ chỗ chờ thanh toán không được trùng khóa khác. Chỗ nguồn/đích thuộc cùng yêu cầu đổi đang chờ là hai lựa chọn thay thế, không bắt học viên dự cả hai. Kiểm tra ở preview và lặp lại dưới khóa khi lưu; lỗi phải giữ nguyên lịch, đăng ký và outbox. Sửa tên/giá và hủy buổi có chính sách riêng.')
    doc.add_heading('3. Webhook SePay', 1)
    doc.add_paragraph('Mã tự trích từ SePay có thể khác tiền tố hóa đơn của dự án. Backend chỉ chấp nhận một mã có tiền tố cấu hình và tìm tiếp trong nội dung ngân hàng nếu code không phù hợp; nhiều mã khác nhau chuyển đối soát. Giao dịch gửi lặp, kể cả tiền ra đến đồng thời, không ghi nhận hai lần. Lỗi unique chỉ coi là duplicate khi đã tồn tại log cùng ID giao dịch. Xử lý tiền vào dùng transaction có khóa lịch và cơ chế retry xung đột chung. Hóa đơn chênh lệch đổi khóa được kiểm tra lại giữ chỗ và quyền nguồn trước khi chuyển đăng ký.')
    doc.add_paragraph('Kiểm thử HTTP mô phỏng xác minh logic ứng dụng; không chứng minh ngân hàng đã chuyển tiền hoặc SePay đã gọi đúng máy chủ công khai. Với chuyển khoản thật, đối chiếu lịch sử gửi webhook của SePay và log backend. Không dùng thao tác sửa PAID/BOOKED trực tiếp trong DB để kết luận đã sửa thanh toán.')
    doc.add_heading('4. Ghi âm và chuẩn bị hội đồng', 1)
    doc.add_paragraph('Nguồn: docs/bao-cao/6 thg 11 lúc 10-28.m4a. Đã đối chiếu hai lượt nhận dạng tiếng Việt cục bộ. Các mốc dưới đây là tóm tắt ý nghe rõ, không phải trích dẫn nguyên văn; đoạn nhiễu không dùng để đặt thêm quy tắc nghiệp vụ.')
    grid(doc, ['Mốc khoảng', 'Ý cần chuẩn bị'], [
        ['00:32–00:46', 'Slide ngắn, khoảng 5–6 trang tối đa; giữ bộ slide hiện hành 5 trang.'],
        ['01:19–03:47', 'Chuẩn bị dữ liệu lịch sử, dữ liệu đang diễn ra và dữ liệu tương lai phù hợp luồng demo.'],
        ['05:04–05:54', 'Trình bày tính năng chính theo workflow và thực hiện thành công từ đầu tới cuối.'],
        ['05:55–06:50', 'Chuẩn bị dữ liệu và khả năng giải thích exception theo business rule. Bản cập nhật có 4 workflow happy path liền mạch, tiếp theo là 4 exception do từng người minh họa trong 6 phút.'],
        ['06:51–08:00', 'Bốn thành viên có phần trình bày và giải thích trách nhiệm, task và sản phẩm của mình.'],
        ['08:00–09:35', 'Diễn tập; hiểu cách xây dựng và lý do lựa chọn để trả lời câu hỏi hội đồng.'],
    ])
    doc.add_heading('5. Chứng cứ kỹ thuật', 1)
    grid(doc, ['Phần', 'Nguồn đối chiếu'], [
        ['Nghiệp vụ', 'BR-05, BR-12, BR-18/19/21; UC-CB-03/18 và UC-PAY-02/19 trong báo cáo.'],
        ['Sơ đồ', '09-doi-khoa, 09-doi-khoa-settlement và 10-doi-lich; PlantUML, chữ tiếng Anh.'],
        ['Tình huống bổ sung', 'core/be/tests/lecturer-course-changes.test.js; class-reschedule-policy.service.test.js; sepay-webhook.test.js.'],
        ['Chạy độc lập', 'node scripts/verify-lecturer-changes.mjs: tạo DB thử, migrate/seed, chạy BE/FE và xóa DB thử trong finally.'],
        ['Thanh toán thật', 'docs/huong-dan/sepay-webhook.md; yêu cầu URL callback công khai và lịch sử gửi từ tài khoản SePay.'],
    ])
    evidence = DOCS / 'kiem-thu/ket-qua-bo-sung-2026-11-06.json'
    if evidence.exists():
        results = json.loads(evidence.read_text())
        doc.add_heading('6. Kết quả chạy kiểm tra', 1)
        grid(doc, ['Kiểm tra', 'Kết quả thực tế'], [
            ['Backend / Frontend', str(results['backendTestsPassed']) + ' / ' + str(results['frontendTestsPassed']) + ' ca passed; DB thử riêng, đã dọn.'],
            ['Lint / Build', 'Đều exit 0; build còn cảnh báo kích thước bundle.'],
            ['HTTP online và QR', 'Đơn INV003281, 1.200.000đ; QR SePay HTTP 200; webhook mô phỏng HTTP 200, PAID/BOOKED; gửi lặp DUPLICATE, chỉ một Payment.'],
            ['Phạm vi chứng cứ', 'Mã được tạo qua API mua khóa online, QR tải từ SePay; callback ngân hàng được mô phỏng. Dữ liệu kiểm thử đã dọn, không chuyển tiền ngân hàng thật.'],
        ])
    save(doc, 'bao-cao/SWP391_BoSungTheoGopYGiangVien.docx')
