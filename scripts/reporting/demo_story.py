"""Four continuous main workflows followed by instructor-requested exceptions."""
DEMO_REVISION='06/11/2026'
STORY=('Một hội viên M đã học khóa C, đang học khóa B và đăng ký tiếp khóa A cùng lộ trình. '
       'Bốn vai trò xử lý trên cùng hồ sơ M: chuẩn bị khóa và hồ sơ → đăng ký/thanh toán → '
       'theo dõi buổi học → tổng kết, đánh giá và báo cáo. A/B/C là nhãn trong kịch bản; '
       'khi diễn tập ghi đúng tên và ID thực tế trong hệ thống.')
CALENDAR_NOTE=('A là khóa sắp học, B có buổi đủ điều kiện điểm danh, C đã kết thúc. '
               'Các mốc này được chuẩn bị trước trên cùng hội viên M và cùng lộ trình học. '
               'Khi đổi A/B/C, người trình bày nói rõ mốc thời gian; dữ liệu không bị thay hoặc reset giữa buổi demo.')
PAYMENT_SCOPE=('Trên màn hình chỉ minh họa tạo đơn, mã hóa đơn/QR và kết quả thanh toán thành công. '
               'Thành viên nhóm phụ trách mô phỏng dùng công cụ sẵn có ở hậu trường để gửi một khoản đúng số tiền hóa đơn, '
               'qua xử lý thanh toán thực của backend; sau đó hiển thị PAID và BOOKED. '
               'Giới thiệu ngắn đây là thanh toán mô phỏng trong môi trường demo.')

WORKFLOWS=[
 dict(id='WF1',time='04–07',minutes=3,title='Chuẩn bị khóa và hồ sơ hội viên',
      actors='Quản lí trung tâm → Lễ tân → Hội viên',
      inputs='Hội viên M đã có hồ sơ và lịch sử học; bộ môn, phòng và huấn luyện viên hợp lệ.',
      steps=[
          ('Quản lí trung tâm','Tạo khóa A có giá trọn khóa, lịch các buổi và cửa sổ đăng ký đang mở; ghi lại khóa vừa tạo.'),
          ('Lễ tân','Tìm đúng hội viên M, mở hồ sơ và xác nhận thông tin liên hệ cùng các khóa liên quan.'),
          ('Hội viên','Mở hồ sơ tập luyện của chính M, cập nhật mục tiêu và bật chia sẻ với huấn luyện viên.'),
      ],
      outputs='Khóa A hiển thị để đăng ký; giữ nguyên memberId của M, classId của A và huấn luyện viên phụ trách.',
      transition='Hồ sơ của M đã sẵn sàng. M sẽ đăng ký khóa A vừa được trung tâm mở.'),
 dict(id='WF2',time='07–12',minutes=5,title='Đăng ký khóa và thanh toán thành công',
      actors='Hội viên → Hệ thống → Lễ tân',
      inputs='Đúng hội viên M và khóa A được tạo ở WF1.',
      steps=[
          ('Hội viên','Tìm khóa A, xem lịch và học phí, xác nhận đăng ký; mở hóa đơn mới và hiển thị mã/QR.'),
          ('Hệ thống','Sau thao tác thanh toán mô phỏng ở hậu trường, cập nhật cùng hóa đơn thành PAID và đăng ký thành BOOKED.'),
          ('Hội viên','Chỉ ra trạng thái thanh toán thành công và khóa A đã đăng ký trong tài khoản M.'),
          ('Lễ tân','Tra đúng mã hóa đơn vừa tạo, kiểm tra cùng hội viên/khóa/số tiền rồi tải hoặc in biên lai.'),
          ('Hội viên','Chuyển đăng ký cả khóa A sang A2 cùng bộ môn, cùng giá còn lại và còn chỗ. Xác nhận preview: đăng ký A chuyển CANCELLED, A2 thành BOOKED; không chuyển riêng một buổi.'),
      ],
      outputs='Một hóa đơn I cho M/A đã PAID; sau đổi, M BOOKED A2 và đăng ký A CANCELLED; biên lai và mã I dùng tiếp ở báo cáo cuối lượt.',
      transition='M đã thanh toán A và chuyển thành công sang lịch A2 phù hợp hơn. Bây giờ quay lại khóa B mà M đang học để theo dõi buổi học hôm nay.'),
 dict(id='WF3',time='12–16',minutes=4,title='Theo dõi buổi học và phản hồi cho hội viên',
      actors='Huấn luyện viên → Hội viên',
      inputs='Vẫn hội viên M; khóa B và buổi gần nhất và quyền điểm danh hợp lệ đã được chuẩn bị trước, M đã BOOKED trước giờ bắt đầu.',
      steps=[
          ('Huấn luyện viên','Mở roster buổi học của B, chọn M và xem mục tiêu tập luyện mà M vừa chia sẻ ở WF1.'),
          ('Huấn luyện viên','Ghi có mặt cho M, lưu điểm danh; nhập điểm/ghi chú nhận xét buổi và lưu thành công.'),
          ('Hội viên','Mở Điểm danh & nhận xét của chính M, chọn B và xem đúng buổi vừa được ghi có mặt, điểm và ghi chú.'),
      ],
      outputs='Attendance và nhận xét của cùng M/buổi B đã lưu; hai phía nhìn thấy cùng kết quả.',
      transition='M đã theo dõi được tiến bộ trong khóa B. Tiếp theo, xem kết quả khóa C mà chính M đã học xong.'),
 dict(id='WF4',time='16–21',minutes=5,title='Tổng kết khóa, đánh giá và báo cáo quản lý',
      actors='Huấn luyện viên → Hội viên → Quản lí trung tâm',
      inputs='M có item tổng kết DRAFT ở khóa C đã kết thúc, còn cửa sổ đánh giá; giữ mã hóa đơn I của WF2.',
      steps=[
          ('Huấn luyện viên','Mở tổng kết C, xem chuyên cần, chọn kết quả Đạt theo gợi ý, cập nhật tiến bộ/nhận xét của M và công bố thành công.'),
          ('Hội viên','Mở kết quả C của chính M, xem nhận xét, tải phiếu PDF và gửi đánh giá khóa/huấn luyện viên thành công.'),
          ('Quản lí trung tâm','Mở báo cáo tổng kết để xem C đã công bố và đánh giá vừa ghi.'),
          ('Quản lí trung tâm','Chọn báo cáo doanh thu, lọc khóa A và hội viên M trong kỳ có hóa đơn I; đối chiếu khoản thu ở WF2 và xuất báo cáo cùng bộ lọc.'),
      ],
      outputs='C có tổng kết PUBLISHED và đánh giá của M; báo cáo khóa A phản ánh đúng khoản thu của hóa đơn I.',
      transition='Cùng một hội viên đã được theo dõi xuyên suốt từ hồ sơ, đăng ký đến học tập và kết quả; trung tâm đối chiếu được khoản thu phát sinh trong lượt demo.'),
]
SPEAKERS={'WF1':'Người 1 · Khôi (đề xuất)', 'WF2':'Người 2 · Nhanh (đề xuất)', 'WF3':'Người 3 · Bảo (đề xuất)', 'WF4':'Người 4 · Khải (đề xuất)'}
EXCEPTIONS=[
 dict(id='EX1',flow='WF1',time='21–22:30',title='Đổi giờ khi chưa đủ hạn báo trước',dataset='NEAR',action='Quản lí trung tâm mở NEAR, dời giờ thêm một giờ, xem trước hoặc lưu.',expected='422; giờ cũ và đăng ký giữ nguyên. Giải thích giới hạn từ cấu hình, tối thiểu 48 giờ.',optional='R dời sang giờ MEMBER_CONFLICT / COACH_CONFLICT / ROOM_CONFLICT phải 409; dùng khi hội đồng hỏi.'),
 dict(id='EX2',flow='WF2',time='22:30–24',title='Khóa đích đầy chỗ và giao dịch gửi lặp',dataset='FULL; A2; hóa đơn I',action='Từ đăng ký A2 của M, mở đổi khóa: FULL không được chọn vì hết chỗ. Mở FULL để đối chiếu sức chứa. Khi cần minh họa webhook lặp, chạy công cụ phát lại đúng payload/ID đã xử lý của I.',expected='Không chuyển đăng ký khi đích đầy. Webhook cùng ID trả DUPLICATE, tổng Payment không tăng.',optional='OTHER khác bộ môn bị loại khỏi danh sách; backend cũng kiểm tra, không chỉ FE.'),
 dict(id='EX3',flow='WF3',time='24–25:30',title='Không điểm danh trước khi buổi học bắt đầu',dataset='B, buổi tương lai',action='HLV mở buổi tương lai của B và chỉ ra thao tác ghi bị chặn; đối chiếu lỗi API/kiểm thử nếu UI đã khóa nút.',expected='422 nếu gửi ghi trước giờ; không tạo Attendance mới cho buổi tương lai.',optional='Hội viên khác không đọc được nhận xét riêng; sửa nhận xét sai expectedVersion bị 409.'),
 dict(id='EX4',flow='WF4',time='25:30–27',title='Tổng kết chưa đủ kết quả không được công bố',dataset='C_BAD; HLV đối chứng',action='Mở phiên HLV đối chứng là tác giả C_BAD. Giữ item chưa có result/progress và thử công bố.',expected='422 hoặc UI chặn; C_BAD vẫn DRAFT, không có công bố/PDF mới. C của demo chính vẫn PUBLISHED.',optional='Có đủ result/progress nhưng thiếu Attendance thì cần acknowledgeMissingAttendance; không tự gọi đó là đã điểm danh đầy đủ.'),
]
TIMELINE=[('00–04',4,'Trình bày','5 slide ngắn; bốn người chia phần dẫn theo bảng phân công.'),
          *[(w['time'],w['minutes'],w['id']+' · '+SPEAKERS[w['id']],w['title']) for w in WORKFLOWS],
          ('21–27',6,'Bốn exception theo flow','Mỗi người minh họa một exception; giữ nguyên dữ liệu của hành trình chính.'),
          ('27–30',3,'Đối chiếu và hỏi đáp','WHAT / WHO / HOW / WHY, kiểm thử và bằng chứng task–Git.')]


def validate_story():
    assert len(WORKFLOWS)==4 and [w['id'] for w in WORKFLOWS]==['WF1','WF2','WF3','WF4']
    assert sum(w['minutes'] for w in WORKFLOWS)==17
    assert sum(row[1] for row in TIMELINE)==30
    assert all(w['inputs'] and w['outputs'] and w['transition'] and w['steps'] for w in WORKFLOWS)
    assert {e['flow'] for e in EXCEPTIONS}==set(SPEAKERS)
    return {'workflows':4,'continuousRun':True,'happyPathOnly':False,'mainFlowHappyPath':True,
            'exceptionMinutes':6,'exceptions':4,'sameMemberAcrossWorkflows':True,'demoMinutes':23,'totalMinutes':30,
            'dateSource':'system clock when npm run demo:prepare is executed',
            'sepayPresentation':'invoice code/QR to successful payment; exact-amount simulation off-screen'}
