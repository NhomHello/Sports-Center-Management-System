"""Shared typography and layout for native report documents."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.section import WD_ORIENT, WD_SECTION_START
from PIL import Image
from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPoints
from pptx.dml.color import RGBColor as PColor
from catalog import ROLES, ROLE_SOURCE, SCOPE, RULES, BY_RULE, CASES, BY_CASE
from spec_diagrams import FLOWS, STATES, DIRECTORY
from new_plan import tab
from openpyxl import Workbook

ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs'
DATE='06/11/2026'

def source_path(path):
    if path.startswith('core/'):return path
    prefix='core/be/src/' if path.startswith('common/') else 'core/be/src/modules/'
    return prefix+path

def new_document(title, subtitle=''):
    doc=Document()
    doc.core_properties.title=title;doc.core_properties.author='Nhóm SWP391'
    sec=doc.sections[0];sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
    sec.top_margin=Inches(.75);sec.bottom_margin=Inches(.7)
    sec.left_margin=sec.right_margin=Inches(.75)
    normal=doc.styles['Normal'];normal.font.name='DejaVu Sans';normal.font.size=Pt(10)
    normal.paragraph_format.space_after=Pt(6)
    for name,size in [('Title',27),('Heading 1',17),('Heading 2',13),('Heading 3',11)]:
        doc.styles[name].font.name='DejaVu Sans';doc.styles[name].font.size=Pt(size)
        doc.styles[name].font.color.rgb=RGBColor.from_string('163B58')
    sec.header.paragraphs[0].text='SWP391 · Hệ thống quản lý trung tâm thể thao'
    foot=sec.footer.paragraphs[0];foot.text=DATE+' · '
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');foot._p.append(field)
    doc.add_heading(title,0)
    if subtitle:doc.add_paragraph(subtitle)
    return doc

def grid(doc, headers, rows):
    table=doc.add_table(rows=1,cols=len(headers));table.style='Light Shading Accent 1'
    for c,v in zip(table.rows[0].cells,headers):c.text=str(v)
    repeat=OxmlElement('w:tblHeader');table.rows[0]._tr.get_or_add_trPr().append(repeat)
    if len(headers)==2:
        table.autofit=False;table.columns[0].width=Inches(1.5);table.columns[1].width=Inches(5.2)
    for values in rows:
        for c,v in zip(table.add_row().cells,values):c.text=str(v if v is not None else '')
    for row in table.rows:
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
        for c in row.cells:
            for p in c.paragraphs:
                for run in p.runs:run.font.size=Pt(9)
    return table

def figure(doc,name,height=7.6):
    path=DIRECTORY/(name+'.png')
    w,h=Image.open(path).size
    sec=doc.sections[-1]
    max_width=(sec.page_width-sec.left_margin-sec.right_margin)/914400-.08
    scale=min(max_width/w,height/h)
    doc.add_picture(str(path),width=Inches(w*scale),height=Inches(h*scale))

def section(doc,title,page=True):
    if page:
        if doc.sections[-1].orientation==WD_ORIENT.LANDSCAPE:
            sec=doc.add_section(WD_SECTION_START.NEW_PAGE);sec.orientation=WD_ORIENT.PORTRAIT
            sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
            sec.top_margin=Inches(.75);sec.bottom_margin=Inches(.7)
            sec.left_margin=sec.right_margin=Inches(.75)
        else:doc.add_page_break()
    doc.add_heading(title,1)


def landscape_figure(doc,title,name):
    w,h=Image.open(DIRECTORY/(name+'.png')).size
    if w/h<1.15:
        section(doc,title);figure(doc,name,8.0);return
    sec=doc.add_section(WD_SECTION_START.NEW_PAGE);sec.orientation=WD_ORIENT.LANDSCAPE
    sec.page_width=Inches(11.69);sec.page_height=Inches(8.27)
    sec.top_margin=sec.bottom_margin=sec.left_margin=sec.right_margin=Inches(.55)
    doc.add_heading(title,1);figure(doc,name,5.8)

def save(doc,path):
    dest=DOCS/path;dest.parent.mkdir(parents=True,exist_ok=True);doc.save(dest)
    return dest

def roles(doc):
    grid(doc,['Vai trò','Trách nhiệm'],[[r[0],r[2]] for r in ROLES])
    doc.add_paragraph('Bốn vai trò trên là tác nhân nghiệp vụ của đề tài. Quyền là điều kiện cho phép một thao tác, không phải tên vai trò. Ma trận mặc định được khai báo trong roles.seed.js; Quản lí trung tâm có thể cấu hình quyền trên hệ thống.')
