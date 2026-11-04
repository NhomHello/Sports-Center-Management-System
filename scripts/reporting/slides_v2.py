"""Formal five-slide presentation with editable typography and preserved speaker notes."""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.xmlchemy import OxmlElement
from evidence import OUT

NAVY, TEAL, GOLD = '172F43', '347C83', 'A68B5B'
PAPER, WHITE, INK, MUTED, LINE = 'FAFAF7', 'FFFFFF', '243C4B', '5E707B', 'D8E0E3'


def rect(slide, x, y, w, h, fill, border=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape._element.spPr.append(OxmlElement('a:effectLst'))
    for effect in shape._element.xpath('./p:style/a:effectRef'):
        effect.set('idx', '0')
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor.from_string(fill)
    shape.line.fill.background()
    if border:
        shape.line.color.rgb = RGBColor.from_string(border)
        shape.line.width = Pt(.75)
    return shape


def text(slide, x, y, w, h, value, size=18, color=INK, bold=False):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = shape.text_frame
    frame.word_wrap = True
    frame.margin_left = frame.margin_right = Inches(.01)
    frame.margin_top = frame.margin_bottom = 0
    for i, line in enumerate(value.split('\n')):
        p = frame.paragraphs[0] if i == 0 else frame.add_paragraph()
        p.text = line
        p.font.name, p.font.size, p.font.bold = 'DejaVu Sans', Pt(size), bold
        p.font.color.rgb = RGBColor.from_string(color)
        p.space_after = Pt(5)
        p.line_spacing = 1.12
    return shape


def base(prs, number, section, title=None, dark=False):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = RGBColor.from_string(NAVY if dark else PAPER)
    fg, secondary, rule = (WHITE, 'A6BDC8', '426074') if dark else (NAVY, MUTED, LINE)
    rect(slide, .62, .48, .42, .045, GOLD)
    text(slide, 1.18, .38, 10.7, .3, section, 11, secondary, True)
    if title:
        text(slide, .65, .97, 12, 1.0, title, 29, fg, True)
    rect(slide, .65, 6.98, 12.02, .008, rule)
    text(slide, .66, 7.12, 11.3, .2, 'SPORTS CENTER MANAGEMENT SYSTEM   ·   SWP391 FA26', 8, secondary)
    text(slide, 12.05, 7.08, .6, .25, f'{number:02d} / 05', 9, secondary)
    return slide


def build():
    source = Presentation(OUT / 'SWP391_ThuyetTrinh_v1.pptx')
    notes = [s.notes_slide.notes_text_frame.text for s in source.slides]
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    prs.core_properties.author = 'Nhóm SWP391'
    prs.core_properties.title = 'Hệ thống quản lý trung tâm thể thao'
    prs.core_properties.subject = 'Báo cáo đồ án · phong cách trang trọng · phiên bản 2'
    s = base(prs, 1, 'BÁO CÁO ĐỒ ÁN PHẦN MỀM')
    text(s, .65, 1.24, 7.6, 1.65, 'Hệ thống quản lý\ntrung tâm thể thao', 35, NAVY, True)
    text(s, .68, 3.12, 7.1, .55, 'Sports Center Management System', 18, TEAL)
    text(s, .68, 3.85, 7, .8, 'Hội viên · Lớp học · Thanh toán\nTổng kết khóa học · Báo cáo', 18, MUTED)
    rect(s, 8.86, 1.28, 3.8, 3.48, NAVY)
    text(s, 9.17, 1.68, 3.15, .85, 'SCMS', 43, WHITE, True)
    rect(s, 9.2, 2.79, .62, .035, GOLD)
    text(s, 9.2, 3.12, 3.08, 1.05, 'SWP391 · FA26\nĐề tài 4\nThiết kế và triển khai', 16, 'C5D6DF')
    rect(s, .65, 5.05, 12.02, .01, LINE)
    people = [('Nhanh', 'Nền tảng, thanh toán\nSprint 1–3'), ('Bảo', 'BE và báo cáo full-stack\nPhụ trách phần Nhanh ở S4'), ('Khôi', 'Hồ sơ full-stack\nLuồng nhân viên, hội viên'), ('Khải', 'FE tổng kết, đánh giá\nKiểm thử và trải nghiệm')]
    for i, (name, role) in enumerate(people):
        x = .68 + i * 3.09
        text(s, x, 5.34, 2.8, .43, name, 20, NAVY, True)
        text(s, x, 5.97, 2.86, .76, role, 12.5, MUTED)
    s = base(prs, 2, '01   BỐI CẢNH VÀ VẤN ĐỀ', 'Các điểm cần kiểm soát trong vận hành')
    problems = [('01', 'Lịch học và sức chứa', 'Trùng lịch HLV, phòng hoặc hội viên;\ntranh chấp chỗ khi đăng ký đồng thời.'), ('02', 'Thanh toán và quyền lợi', 'Tiền về thiếu, thừa, sai mã hoặc chuyển lặp;\ncần xác định đúng lúc xác nhận chỗ học.'), ('03', 'Kết quả và lịch sử thay đổi', 'Hồ sơ, điểm danh, tổng kết cần đúng phạm vi;\nsố liệu thu và hoàn phải đối chiếu được.')]
    for i, (number, title, body) in enumerate(problems):
        y = 2.18 + i * 1.22
        text(s, .7, y, .7, .55, number, 27, TEAL)
        text(s, 1.73, y + .05, 3.45, .72, title, 20, NAVY, True)
        text(s, 5.65, y + .04, 6.95, .85, body, 17, MUTED)
        rect(s, 1.73, y + 1, 10.9, .008, LINE)
    text(s, .7, 6.24, 11.9, .46, 'Mục tiêu: thống nhất trạng thái, trách nhiệm và bằng chứng xử lý.', 18, TEAL, True)
    s = base(prs, 3, '02   GIẢI PHÁP VÀ NGƯỜI SỬ DỤNG', 'Một quy trình chung, bốn phạm vi trách nhiệm')
    roles = [('Hội viên', 'Mua khóa, đăng ký lớp\nXem lịch và kết quả\nChia sẻ hồ sơ, đánh giá'), ('Lễ tân', 'Tìm và đăng ký hộ\nThu tiền tại quầy\nGhi nhận người thực hiện'), ('Huấn luyện viên', 'Lịch dạy, điểm danh\nHồ sơ trong phạm vi\nLập tổng kết khóa học'), ('Quản lý', 'Tài nguyên và phân quyền\nĐối soát, kiểm duyệt\nBáo cáo và mở lại tổng kết')]
    for i, (role, body) in enumerate(roles):
        x = .68 + i * 3.09
        rect(s, x, 2.23, 2.78, .035, TEAL)
        text(s, x, 2.5, 2.92, .5, role, 17 if i != 2 else 15.5, NAVY, True)
        text(s, x, 3.21, 2.87, 1.6, body, 15.5, MUTED)
    stages = ['Chọn khóa học', 'Giữ chỗ, hóa đơn', 'Thanh toán', 'Học và tổng kết', 'Báo cáo, nhật ký']
    for i, stage in enumerate(stages):
        x = .68 + i * 2.47
        rect(s, x, 5.12, 2.16, .66, 'E8F0F0')
        text(s, x + .1, 5.3, 1.98, .32, stage, 12.8, NAVY, True)
        if i < 4:
            text(s, x + 2.2, 5.27, .25, .35, '→', 16, TEAL)
    for i, label in enumerate(['Chỉ bán khóa học', 'Kiểm tra quyền và phạm vi tại API', 'Chốt chuyên cần khi công bố']):
        text(s, .7 + i * 4.12, 6.26, 3.8, .48, label, 12.5, MUTED)
    s = base(prs, 4, '03   CÔNG NGHỆ VÀ KIẾN TRÚC', 'Kiểm soát nghiệp vụ tại API và dữ liệu', True)
    layers = [('GIAO DIỆN WEB', 'React 19 · Ant Design 6\nRouter · Query · Zustand'), ('API NGHIỆP VỤ', 'Node.js · Express 5 · Zod\nJWT · Quyền · Service'), ('DỮ LIỆU', 'Prisma 7 · MySQL 8\nTransaction · FK · Unique')]
    for i, (title, body) in enumerate(layers):
        x = .68 + i * 4.13
        rect(s, x, 2.3, 3.74, 1.67, NAVY, '658293')
        text(s, x + .2, 2.57, 3.34, .35, title, 14, 'A6CBD2', True)
        text(s, x + .2, 3.18, 3.34, .68, body, 15.3, WHITE)
        if i < 2:
            text(s, x + 3.83, 2.98, .3, .4, '→', 18, WHITE)
    for i, (title, body) in enumerate([('Thanh toán', 'Webhook SePay: xác thực, chống xử lý trùng.'), ('Tác vụ nền', 'Hết hạn, danh sách chờ, tổng kết và gửi thông báo.'), ('Kết quả', 'Snapshot, revision; xuất PDF, Excel và CSV.')]):
        y = 4.52 + i * .64
        text(s, .73, y, 2.3, .35, title, 15, 'A6CBD2', True)
        text(s, 3.2, y, 9.35, .4, body, 16, WHITE)
    s = base(prs, 5, '04   DEMO VÀ BẰNG CHỨNG', 'Kịch bản trình bày và demo trong 28 phút')
    steps = [('06–10’', 'Mua khóa → thiếu → bù trong hạn → PAID'), ('10–13’', 'Hủy khóa → mã HT → admin hoàn'), ('13–16’', 'Buổi 1–N: điểm danh, đánh giá, note'), ('16–21’', 'Tổng kết → PDF → đánh giá → mở lại'), ('21–24’', 'Báo cáo theo kỳ và xuất Excel')]
    for i, (time, label) in enumerate(steps):
        y = 2.18 + i * .65
        text(s, .73, y, 1.25, .4, time, 17, TEAL, True)
        text(s, 2.1, y, 6.05, .5, label, 16, INK)
    rect(s, 8.53, 2.15, .012, 3.45, LINE)
    text(s, 8.93, 2.22, 3.5, .4, 'Tiêu chí kiểm chứng', 18, NAVY, True)
    for i, label in enumerate(['Trạng thái được xử lý đúng', 'Đúng quyền và phạm vi', 'File xuất khớp bộ lọc', 'Có task, commit và kiểm thử']):
        text(s, 8.96, 3 + i * .6, 3.5, .48, label, 14.5, MUTED)
    phases = [(0, 3.1, 'Trình bày 06 phút'), (3.12, 4.48, 'Demo 18 phút'), (7.62, 4.37, 'Bằng chứng, hỏi đáp 04 phút')]
    for offset, width, label in phases:
        rect(s, .68 + offset, 6.05, width, .65, NAVY if offset == 3.12 else 'E8F0F0')
        text(s, .84 + offset, 6.22, width - .3, .34, label, 12.8, WHITE if offset == 3.12 else NAVY, True)
    for slide, note in zip(prs.slides, notes):
        slide.notes_slide.notes_text_frame.text = note
    path = OUT / 'SWP391_ThuyetTrinh_v2.pptx'
    prs.save(path)
    return path


if __name__ == '__main__':
    print(build())
