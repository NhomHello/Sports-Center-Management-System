"""Demo instructions with explicit preconditions, expected outcomes and fallback."""
from evidence import ROOT, OUT
from documents import document, table, page, picture
from content import DEMO, QUESTIONS
from workflows import FLOWS, STATES


def build(snapshot):
    doc=document('Kịch bản trình bày và demo','28 phút • đề xuất người trình bày để nhóm phân công lại khi diễn tập • bản v1')
    doc.add_paragraph('Mục tiêu là chứng minh luồng vận hành xuyên vai trò, gồm cả một nhánh bị từ chối và một tình huống tiền về không khớp. Bộ 5 slide dành khoảng 6 phút, demo khoảng 18 phút, bằng chứng và hỏi đáp 4 phút. Giữ slide 5 làm màn điều hướng khi chuyển sang trình duyệt.')
    table(doc,['Mốc','Phút','Người đề xuất','Nội dung / thành công'],[[time,minutes,person,f'{screen}\n{action}\n{fallback}'] for time,minutes,person,screen,action,fallback in DEMO])
    page(doc,'Chuẩn bị trước buổi báo cáo')
    for text in [
      'Đối chiếu mã nguồn: git switch main; git pull --ff-only. Không kéo thay đổi mới chưa kiểm tra ngay trước giờ báo cáo.',
      'Máy cần Node >=22 (README khuyên 24), Docker Compose v2, Git. Với môi trường sạch dùng npm run dev; hướng dẫn đầy đủ ở docs/huong-dan/onboarding.md. Tắt ghi/chia sẻ màn hình terminal có mật khẩu vì script dev có in tài khoản demo từ .env.',
      'Với database local đã chạy: npm run db:deploy -w @scms/be; npm run db:generate; npm run db:seed. Kiểm tra health API và đăng nhập bằng đúng origin trong CORS_ORIGINS.',
      'Bổ sung dữ liệu Sprint 4 bằng npm run db:seed:sprint4. Seed idempotent không reset nhưng vẫn thêm dữ liệu; chỉ dùng database demo. Không dùng db:reset/db:demo để phục hồi một tình huống giữa buổi trình bày.',
      'Chuẩn bị bốn browser profile: quản lý (SEED_ADMIN_EMAIL), lễ tân letan@scms.local, HLV s4.coach@scms.test, hội viên s4.member1@scms.test. Mật khẩu lấy từ biến seed tại máy demo; không chép vào tài liệu hoặc slide.',
      'Với flow đăng ký lớp dùng tài khoản demo phù hợp và lớp miễn phí còn chỗ; chọn thêm một lớp chồng giờ để chứng minh backend chặn. Lớp thu phí chỉ có chỗ chính thức khi hóa đơn PAID.',
      'Giữ S4 Demo · Khoá Chờ HLV nộp ở DRAFT; dùng quản lý mở lại có lý do nếu trước đó đã công bố. S4 Demo · Khoá Đã công bố dùng để dự phòng kết quả/PDF; tài khoản seed có thể khác tên hiển thị nhưng email ổn định.',
      'Xác nhận trước kênh thu quầy và simulator local. Nếu demo SMTP, dùng sandbox; không cấu hình thì chỉ trình bày thông báo in-app và trạng thái retry, không nói email đã gửi.',
      'Mở sẵn Excel traceability, một commit thật, service và test của cùng chức năng. Các sheet Review giữ trạng thái chờ review. Chuẩn bị bản PDF và ảnh sơ đồ để dự phòng màn hình trình chiếu.',
      'Diễn tập cùng cả nhóm ít nhất một lượt có bấm giờ. Chỉ sau lượt thật mới cập nhật task diễn tập; hiện việc tạo tài liệu không được xem là đã diễn tập.'
    ]:doc.add_paragraph(text,style='List Bullet')
    page(doc,'Chi tiết thao tác và kết quả mong đợi')
    table(doc,['Luồng','Cách chạy','Kiểm tra'],[
      ['Thanh toán local','Tạo hóa đơn online mới, ghi đúng mã và số tiền đang hiển thị. Ví dụ hóa đơn 300000: npm run demo:webhook -- <MA_HOA_DON> 200000; sau đó chạy với 100000. Thay số ví dụ bằng số thật của hóa đơn.','Lần đầu PENDING và chờ bù 100000; lần sau PAID; chỉ một quyền lợi được cấp. Simulator đọc secret từ .env và gọi cổng backend trong .env.'],
      ['Quầy dự phòng','Lễ tân chọn hội viên và sản phẩm, tạo hóa đơn quầy, thu đúng số tiền theo giao diện.','PAID, kỳ gói hoặc đăng ký BOOKED; tải biên lai PDF. Nêu rõ đây là kênh quầy, không phải xác nhận webhook.'],
      ['Đăng ký/hủy hộ','Lễ tân tìm hội viên theo email, chọn lớp miễn phí còn chỗ, đăng ký rồi hủy trước deadline.','Hiển thị đúng số chỗ; enrolledBy/cancelledBy đúng nhân viên; audit giữ lịch sử. Thử tên dài trên mobile 320px không tràn.'],
      ['Hồ sơ và chia sẻ','HLV tắt showContact; hội viên kiểm tra danh bạ. Hội viên bật/tắt shareWithCoach; HLV xem học viên trong phạm vi.','Tắt liên hệ không làm đổi email đăng nhập; tắt chia sẻ không trả trainingProfile; HLV không xem hóa đơn/số dư.'],
      ['Tổng kết','HLV chọn lớp DRAFT; sửa từng học viên, chọn khác gợi ý nhưng để trống nhận xét để thấy validation; điền đủ, công bố.','Thiếu kết quả/tiến bộ bị chặn; missing attendance cần xác nhận; công bố có snapshot và revision.'],
      ['Kết quả/đánh giá','Hội viên mở Hồ sơ → kết quả đã công bố, tải PDF; tạo/sửa đánh giá trong hạn. Quản lý ẩn nhận xét có lý do.','Chỉ chính chủ; sao 1–5; một rating/lớp; HLV thấy tên viết tắt; ẩn nhận xét vẫn giữ điểm sao.'],
      ['Mở lại','Quản lý mở tổng kết PUBLISHED, ghi lý do; HLV sửa và công bố lại.','DRAFT rồi PUBLISHED; revision tăng; dữ liệu đã công bố giữ snapshot cho tới lần công bố mới.'],
      ['Báo cáo','Chọn khoảng có dữ liệu seed, nhóm tháng, so sánh kỳ trước; tải Excel rồi kiểm tra bộ lọc và số tổng.','Thu − hoàn = thuần; cơ cấu cộng khớp tổng; CREDIT không tính lại; kỳ trước 0 hiển thị dấu gạch.']
    ])
    page(doc,'Phương án dự phòng và giới hạn')
    table(doc,['Tình huống','Xử lý minh bạch'],[['Backend/DB không truy cập','Kiểm tra health và dịch vụ; dùng PDF/ảnh để giải thích thiết kế, không gọi ảnh là demo trực tiếp.'],['QR/webhook không sẵn','Đổi sang luồng thu quầy đã kiểm tra; nêu rõ kênh dự phòng. Không sửa status trực tiếp trong DB trước hội đồng.'],['Hóa đơn online cũ hết hạn','Tạo hóa đơn mới; không dùng lại QR hết hạn.'],['Tổng kết đã công bố','Quản lý mở lại với lý do; không xóa dữ liệu để dựng lại.'],['SMTP không cấu hình','Trình bày in-app/outbox retry; không tuyên bố email đã gửi.'],['Thời gian gần hết','Rút ngắn lần tải file thứ hai và thao tác theme; vẫn giữ điều kiện bị chặn, snapshot và đối soát.']])
    page(doc,'Hỏi đáp kỹ thuật')
    table(doc,['Câu hỏi','Câu trả lời theo triển khai'],QUESTIONS)
    page(doc,'Mở bằng chứng task và Git')
    doc.add_paragraph('Dùng SWP391_TaskTraceability_v1.xlsx: lọc một Task ID trong TaskTraceability; mở nguồn task tại hàng đã ghi; đối chiếu commit URL và source/test. GitTimeline giữ cả author và committer date. Người nhận task có thể khác tác giả một phần mã được dùng lại; việc chuyển trách nhiệm Sprint 4 sang Bảo không thay đổi lịch sử Git.')
    doc.add_paragraph('Bảo nhận toàn bộ task Sprint 4 trước đây giao Nhanh. Task sheet S4 hiện hành: Bảo 17, Khôi 11, Khải 7; giữ Review/In Progress theo nguồn. Những ngày 03/11–16/11 là kế hoạch, trong khi một số mã đã được commit 29/10. Không sửa ngày Git để khớp lịch dự kiến.')
    page(doc,'Tái tạo và kiểm tra bộ nộp')
    doc.add_paragraph('Generator ở scripts/reporting. Cài Python môi trường riêng và requirements.txt; cài @viz-js/viz riêng ngoài dependency ứng dụng. Chạy build.py với SWP_VIZ_MODULE trỏ tới module Viz.js; cần LibreOffice để xuất DOCX/PPTX sang PDF và kiểm tra thực tế. Không chạy reconcile.py để dựng lại thông thường: script này là bước áp dụng quyết định phân công, chỉ dùng khi cần thực hiện lại có kiểm tra.')
    doc.add_paragraph('Ví dụ: uv venv /tmp/swp-report-venv; uv pip install --python /tmp/swp-report-venv/bin/python -r scripts/reporting/requirements.txt; npm install --prefix /tmp/swp-viz @viz-js/viz; SWP_VIZ_MODULE=/tmp/swp-viz/node_modules/@viz-js/viz/dist/viz.js /tmp/swp-report-venv/bin/python scripts/reporting/build.py. Đường dẫn là ví dụ cho Linux; thay bằng môi trường của máy.')
    doc.add_paragraph('Kiểm tra DOCX/PPTX/XLSX mở được, đủ 5 slide, PDF không bị cắt chữ, ERD đủ 42 model đang dùng/72 quan hệ, số phút demo bằng 28, và không còn task Sprint 4 gán Nhanh. evidence.json giữ SHA nguồn đã đọc. Bản mã nguồn được chụp để báo cáo: '+snapshot['baseline'])
    doc.save(OUT/'SWP391_KichBanDemo_v1.docx')
    current=document('Sơ đồ luồng và trạng thái hiện hành','Đồng bộ với phạm vi main ngày 29/10/2026; chỉ mô tả các luồng đã có service triển khai.')
    for flow in FLOWS:
        page(current,flow[1]);picture(current,flow[0],8.4)
    for state in STATES:
        page(current,state[1]);picture(current,state[0],6);current.add_paragraph(state[4]);current.add_paragraph('Nguồn: '+state[5])
    current.save(ROOT/'docs/yeu-cau/02_Flow_Va_StateChart.docx')
