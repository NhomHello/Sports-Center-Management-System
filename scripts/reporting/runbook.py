"""Current course-only demo instructions; never treat simulation as a bank transfer."""
from evidence import ROOT, OUT
from documents import document, table, page, picture
from content import DEMO, QUESTIONS, REVIEW_DATE, TEST_EVIDENCE
from workflows import FLOWS, STATES


def build(snapshot):
    doc=document('Kịch bản trình bày và demo','Cập nhật 05/11/2026 • 28 phút • Chỉ bán khóa học, hoàn qua admin bằng mã HT')
    doc.add_paragraph('Bốn browser profile theo permission, dữ liệu local giả lập. Không có bước mua gói tự tập hoặc ghi tiền hủy vào ví. Chỉ gọi khoản hoàn DONE sau thao tác chuyển trả giả lập được giải thích rõ.')
    table(doc,['Mốc','Phút','Người đề xuất','Thao tác và kết quả'],[[time,minutes,person,screen+'\n'+action+'\n'+fallback] for time,minutes,person,screen,action,fallback in DEMO])
    page(doc,'Chuẩn bị trước buổi diễn tập')
    for text in [
        'Lấy đúng mã main đã kiểm tra; không kéo code chưa thử ngay trước giờ báo cáo. Baseline bộ tài liệu: '+snapshot['baseline'],
        'Chuẩn bị Node/npm, MySQL, migration và Prisma Client theo README. Sau cập nhật chạy SEED_MOCK_DATA=false npm run db:seed để đồng bộ metadata cấu hình, không đổi tỷ lệ đã lưu.',
        'Dựng dữ liệu trước buổi diễn tập: npm run db:refresh:courses chỉ preview. -- --yes xóa nghiệp vụ và map lại 16 khóa, chỉ chạy trên DB demo sau khi kiểm tra đúng tên DB. Không reset giữa buổi báo cáo.',
        'Admin dùng SEED_ADMIN_EMAIL; HLV s4.coach@scms.test; học viên s4.member1…3@scms.test; mật khẩu lấy từ cấu hình tại máy, không đưa lên màn hình/file. Nếu cần tài khoản nhân viên, admin cấp permission phù hợp trước demo.',
        'Bộ mới có khóa lịch sử/tổng kết và hai khóa tương lai. Chọn khóa nâng cao đang còn chỗ để mua; khóa nền tảng có giữ chỗ/chờ để giải thích FIFO. Giá/tên và deadline đọc UI, không đoán mã hóa đơn.',
        'Chuẩn bị một lớp nháp đã kết thúc cho tổng kết. Lớp công bố rồi thì dùng mở lại theo quyền, không xóa dữ liệu.',
        'Xác nhận cấu hình ngân hàng/SePay ở local và simulator. Không chuyển tiền thật; nếu không hiện QR dùng luồng thu tiền mặt và nói rõ kênh dự phòng.',
        'Chuẩn bị một ví dụ giữa khóa 20 buổi/đã học 10 để trình bày công thức; phí lấy từ UI. Nếu thiếu đúng dataset, chỉ trình bày ví dụ và bằng chứng test, không sửa trạng thái DB trước hội đồng.',
        'Mở sẵn test case mới, commit thật, tài liệu trạng thái và PDF dự phòng. Diễn tập trực tiếp có bấm giờ; chưa diễn tập không đánh dấu task diễn tập hoàn tất.',
    ]:doc.add_paragraph(text,style='List Bullet')
    page(doc,'Các ca thao tác trên giao diện')
    table(doc,['Ca','Thao tác','Kết quả cần chỉ ra'],[
        ['Mua khóa online','Chọn khóa → Đăng ký khóa học → xác nhận → QR của hóa đơn mới.','PENDING_PAYMENT giữ chỗ; chưa BOOKED. Đủ tiền mới hiện Đã đăng ký và nút bị khóa.'],
        ['Thiếu rồi bù','Ghi đúng mã; ví dụ tổng 300000: npm run demo:webhook -- <MA> 100000 rồi 200000 trong deadline.','Cộng dồn đúng; đóng phiếu thiếu; một đăng ký chính thức. Dùng số tiền của hóa đơn đang mở thay vì cố định ví dụ.'],
        ['Sát hạn','Chỉ ra deadline/grace ở UI và mở test course-payment-window/course-payment-deadline.','15 phút để chuyển, 120 giây chờ thông báo tiền đúng hạn. Quá grace không giành lại chỗ; không phải đợi 17 phút trong demo.'],
        ['Thu quầy','Nhân viên chọn học viên/khóa, mở hóa đơn quầy và xác nhận thu đủ trước hạn.','Mốc chốt server dưới khóa; quá hạn bị từ chối dù job chưa chạy. Khách chuyển khoản tại quầy dùng hóa đơn ONLINE.'],
        ['Hủy và mã hoàn','Hội viên mở khóa đã trả tiền → Hủy khóa học → đọc preview/phí → lý do → xác nhận. Mở Hồ sơ → Lịch sử hủy khóa học.','Không có lựa chọn ví; có mã HT…, số tiền và trạng thái chờ admin. Chứng từ/điểm/note cũ vẫn còn.'],
        ['Admin hoàn','Hóa đơn → Theo dõi hoàn tiền → tìm HT… → kiểm tra người/số tiền → Xác nhận đã chuyển trả → tham chiếu DEMO.','Nêu rõ chuyển trả giả lập. Sau DONE hội viên thấy Đã hoàn tiền và có thông báo. Không gọi việc tạo yêu cầu là đã hoàn.'],
        ['Thông báo','Mở thông báo ở hội viên, nhân viên có quyền hoàn và HLV.','Hội viên có mã/số tiền; admin có yêu cầu; HLV chỉ biết học viên rút; FIFO chỉ mời khi khóa còn hạn.'],
        ['Buổi 1–N','Hội viên vào Điểm danh & nhận xét → chọn khóa. Admin mở Chi tiết hội viên → Buổi học & nhận xét.','Đủ mọi buổi cùng giờ/HLV/điểm/đánh giá/note. Dữ liệu trống không tự thành vắng; không thấy ghi chú của người khác.'],
        ['Hồ sơ và tổng kết','Thử chia sẻ hồ sơ; HLV sửa nháp và công bố; hội viên xem/PDF/rating; quản lý mở lại với lý do.','Scope/permission đúng; công bố snapshot và revision, không tự đổi số liệu cũ.'],
        ['Báo cáo','Chọn khoảng có dữ liệu, nhóm tháng, xuất Excel và đối chiếu màn hình.','Nói rõ tiền giả lập; thu/hoàn/thuần và quyền xuất đúng bộ lọc.'],
    ])
    page(doc,'Dự phòng và giới hạn')
    table(doc,['Tình huống','Cách trình bày'],[['QR/webhook chưa sẵn','Dùng thu quầy đã kiểm tra; không nói ngân hàng thật đã kết nối xuyên suốt.'],['Hóa đơn đã quá hạn','Ngừng chuyển, chờ nhả chỗ rồi mua lại theo điều kiện hoặc xử lý khoản đã chuyển qua đối soát.'],['Không đủ dữ liệu giữa khóa','Dùng công thức và bằng chứng test; không bịa rằng vừa học 10 buổi trên sân khấu.'],['Tổng kết đã công bố','Mở lại bằng permission/lý do; không reset.'],['SMTP chưa cấu hình','Chỉ chứng minh in-app/outbox; không nói email đã gửi.'],['Máy lỗi','Dùng PDF/ảnh và nói đây là tài liệu, không gọi là demo trực tiếp.']])
    table(doc,['Câu hỏi','Trả lời theo triển khai'],QUESTIONS)
    doc.add_paragraph(TEST_EVIDENCE)
    page(doc,'Tái tạo bộ tài liệu')
    doc.add_paragraph('Cài requirements.txt trong môi trường Python riêng; Viz.js tách khỏi dependency app. Ví dụ: uv venv /tmp/swp-report-venv; uv pip install --python /tmp/swp-report-venv/bin/python -r scripts/reporting/requirements.txt; npm install --prefix /tmp/swp-viz @viz-js/viz; SWP_VIZ_MODULE=/tmp/swp-viz/node_modules/@viz-js/viz/dist/viz.js /tmp/swp-report-venv/bin/python scripts/reporting/build.py. Cần LibreOffice để xuất PDF. Generator chỉ đọc source và dựng file, không truy cập DB hoặc .env.')
    doc.add_paragraph('Không chạy reconcile.py để dựng thông thường vì script đó áp dụng phân công lịch sử. Bằng chứng Git giữ author/committer thật, trạng thái Review từ nguồn và 28 phút là kế hoạch chưa phải xác nhận đã diễn tập.')
    doc.save(OUT/'SWP391_KichBanDemo_v1.docx')
    current=document('Sơ đồ luồng và trạng thái hiện hành','Main '+snapshot['baseline']+' • '+REVIEW_DATE+' • Khóa học, hoàn qua admin và lịch sử từng buổi')
    for flow in FLOWS:
        page(current,flow[1]);picture(current,flow[0],8.1)
    for state in STATES:
        page(current,state[1]);picture(current,state[0],6);current.add_paragraph(state[4]);current.add_paragraph('Nguồn: '+state[5])
    current.save(ROOT/'docs/yeu-cau/02_Flow_Va_StateChart.docx')
