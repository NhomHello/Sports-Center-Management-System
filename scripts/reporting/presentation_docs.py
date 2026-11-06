"""Native presentation and timed demo script."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPoints
from pptx.dml.color import RGBColor as PColor
from catalog import ROLES, ROLE_SOURCE, SCOPE, RULES, BY_RULE, CASES, BY_CASE
from spec_diagrams import FLOWS, STATES, DIRECTORY
from new_plan import tab
from openpyxl import Workbook
from doc_layout import ROOT, DOCS, DATE, source_path, new_document, grid, figure, section, save, roles



from demo_runbook import runbook
from demo_story import WORKFLOWS, STORY, PAYMENT_SCOPE, validate_story

def slides():
    validate_story()
    prs=Presentation();prs.slide_width=PInches(13.333);prs.slide_height=PInches(7.5)
    def text(slide,x,y,w,h,content,size=20,bold=False,color='163B58'):
        shape=slide.shapes.add_textbox(PInches(x),PInches(y),PInches(w),PInches(h))
        tf=shape.text_frame;tf.word_wrap=True
        for i,line in enumerate(content.split('\n')):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name='DejaVu Sans';p.font.size=PPoints(size);p.font.bold=bold;p.font.color.rgb=PColor.from_string(color)
        return shape
    titles=['Hệ thống quản lý trung tâm thể thao','Bối cảnh và vấn đề','Giải pháp và bốn vai trò','Công nghệ và kiến trúc','Một hành trình demo · 4 workflow']
    notes=[
        '00–00:30 phút · Người 1 (Khôi). Giới thiệu nhóm Nhanh, Bảo, Khôi, Khải và phạm vi bán khóa học; gọi đúng bốn vai trò của đề tài.',
        '00:30–01 phút · Người 1 (Khôi). Trình bày bối cảnh và nhu cầu liên kết lịch, đăng ký, học tập và báo cáo trong một hành trình hội viên.',
        '01–02 phút · Người 2 (Nhanh). Giới thiệu trách nhiệm bốn vai trò. Dẫn trước câu chuyện một hội viên M với khóa C đã học, B đang học và A sắp đăng ký cùng lộ trình.',
        '02–03 phút · Người 3 (Bảo). Giới thiệu frontend, backend và database; nghiệp vụ được kiểm tra tại API. Phần thanh toán trong demo chỉ hiển thị tạo mã/QR đến thành công, do công cụ mô phỏng đã chuẩn bị xử lý ở hậu trường.',
        '03–04 phút · Người 4 (Khải) dẫn vào 4 workflow. 04–07 WF1; 07–12 WF2; 12–16 WF3; 16–21 WF4. Happy path chạy liền mạch, cùng memberId M. A là khóa sắp học, B đang học và C đã kết thúc được chuẩn bị trước; nói rõ mốc thời gian khi đổi khóa. SePay chỉ tạo mã/QR rồi hiển thị PAID và BOOKED; người hỗ trợ mô phỏng đúng tổng tiền ở hậu trường. 21–27 phút: mỗi người một exception theo business rule. 27–30 phút đối chiếu/hỏi đáp. WF2 chuyển cả A sang A2; giữ mã hóa đơn I để báo cáo.',
    ]
    ss=[]
    for i,title in enumerate(titles):
        s=prs.slides.add_slide(prs.slide_layouts[6]);ss.append(s)
        text(s,.65,.45,12,1,title,30,True)
        text(s,.65,7.0,11,.25,'SWP391 · Hệ thống quản lý trung tâm thể thao',10,color='617385')
        text(s,12.1,6.95,.5,.3,str(i+1),11)
        s.notes_slide.notes_text_frame.text=notes[i]
    text(ss[0],.7,2,11,1.5,'Quản lý khóa học, lịch học, thanh toán và kết quả học tập',28)
    text(ss[0],.7,4.3,11,1,'Nhóm: Nhanh · Bảo · Khôi · Khải\nBáo cáo cuối kỳ · '+DATE,22)
    for i,(title,body) in enumerate([('Lịch và số chỗ','Nhiều khóa, phòng và huấn luyện viên.\nCần kiểm tra trùng lịch và giới hạn đăng ký.'),('Thanh toán và đăng ký','Tiền về thiếu, thừa, sai mã hoặc muộn.\nCần xác định khi nào hội viên có quyền học.'),('Theo dõi và báo cáo','Điểm danh, nhận xét, hủy/hoàn và kết quả.\nCần dữ liệu đúng người và giữ lịch sử.')]):
        y=1.9+i*1.45;text(ss[1],.8,y,11,.45,title,23,True);text(ss[1],.8,y+.45,11,.9,body,18,color='334454')
    for i,r in enumerate(ROLES):
        x=.75+(i%2)*6.2;y=1.85+(i//2)*2.05
        text(ss[2],x,y,5.8,.5,r[0],23,True)
        text(ss[2],x,y+.6,5.8,1.3,r[2],16,color='334454')
    text(ss[2],.8,6.25,11.7,.5,'Select course → Seat hold & invoice → Payment → Learning & summary → Reports',17)
    for i,(title,body) in enumerate([('Frontend','React 19 · Ant Design 6\nVite · Router · Query'),('Business API','Node.js · Express 5\nJWT · Zod · Service'),('Database','Prisma 7 · MySQL\nFK · Unique · Transaction')]):
        x=.8+i*4.1;text(ss[3],x,2,3.8,.6,title,23,True);text(ss[3],x,2.9,3.8,1.6,body,20)
        if i<2:text(ss[3],x+3.65,3.1,.4,.6,'→',25)
    text(ss[3],.8,5.15,11.5,1.1,'SePay: transfer events · SMTP: configured email\nBackground jobs: expiry, waiting list, summaries and notifications',19)
    text(ss[4],.8,1.65,11.7,.55,'Một hội viên M · cùng một lộ trình học',22,True)
    labels='\n'.join(w['id']+' · '+w['title'] for w in WORKFLOWS)
    text(ss[4],.8,2.45,11.7,2.9,labels,22)
    text(ss[4],.8,5.45,11.7,.65,'Happy path liền mạch → 4 exception · SePay: mã/QR → thành công',17)
    text(ss[4],.8,6.2,11.7,.45,'4 phút trình bày + 17 phút happy path + 6 phút exception + 3 phút hỏi đáp',17)
    dest=DOCS/'bao-cao/SWP391_ThuyetTrinh.pptx';dest.parent.mkdir(parents=True,exist_ok=True);prs.save(dest)
