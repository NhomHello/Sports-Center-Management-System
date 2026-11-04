"""Rebuild reviewed DOCX/PDF/slides/ERD and traceability without changing app data."""
import os
import hashlib
import json
import subprocess
from pathlib import Path
from pptx import Presentation
from docx import Document
from openpyxl import load_workbook
from evidence import ROOT, OUT, collect
from content import DEMO, REVIEW_DATE, TEST_EVIDENCE
from workflows import FLOWS, STATES
import diagrams
import documents
import runbook
import workbook
import slides
import slides_v2
import requirements_docs


def convert_pdf(targets, directory):
    directory.mkdir(exist_ok=True,parents=True)
    for target in targets:
        pdf=directory/(target.stem+'.pdf')
        if pdf.exists():pdf.unlink()
    subprocess.run([os.environ.get('SWP_LIBREOFFICE','libreoffice'),'-env:UserInstallation=file:///tmp/swp-report-office-current','--headless','--convert-to','pdf','--outdir',str(directory),*[str(p) for p in targets]],check=True,timeout=180)
    for target in targets:
        if not (directory/(target.stem+'.pdf')).is_file():raise RuntimeError('PDF missing: '+str(target))


def export_pdf():
    targets=[OUT/'SWP391_BaoCaoDoAn_v1.docx',OUT/'SWP391_KichBanDemo_v1.docx',OUT/'SWP391_ThuyetTrinh_v1.pptx',OUT/'SWP391_ThuyetTrinh_v2.pptx']
    convert_pdf(targets,OUT)
    convert_pdf(sorted((ROOT/'docs/yeu-cau').glob('*.docx')),OUT/'dac-ta')


def validate(snapshot):
    import pymupdf
    assert sum(r[1] for r in DEMO)==28
    assert 'SessionFeedback' in snapshot['models']
    assert all(t['owner']!='Nhanh' for t in snapshot['tasks'] if t['id'].startswith('S4'))
    book=load_workbook(OUT/'SWP391_TaskTraceability_v1.xlsx',read_only=True)
    assert book['TaskTraceability'].max_row==len(snapshot['tasks'])+1
    assert book['GitTimeline'].max_row==len(snapshot['commits'])+1
    result={'baseline':snapshot['baseline'],'reviewDate':REVIEW_DATE,'demoMinutes':28,'schemaModels':len(snapshot['models']),'schemaForeignKeys':len(snapshot['relations']),'tasks':len(snapshot['tasks']),'commits':len(snapshot['commits']),'swimlanes':len(FLOWS),'stateCharts':len(STATES),'testEvidence':TEST_EVIDENCE,'outputs':{},'pdfPages':{}}
    for version in ['v1','v2']:
        deck=Presentation(OUT/f'SWP391_ThuyetTrinh_{version}.pptx')
        assert len(deck.slides)==5
        assert all(s.notes_slide.notes_text_frame.text.strip() for s in deck.slides)
        assert all(shape.left>=0 and shape.top>=0 and shape.left+shape.width<=deck.slide_width and shape.top+shape.height<=deck.slide_height for s in deck.slides for shape in s.shapes)
    for path in OUT.rglob('*.pdf'):
        pdf=pymupdf.open(path)
        assert all(page.get_text().strip() for page in pdf),'Empty page: '+str(path)
        if 'ThuyetTrinh_' in path.stem:assert len(pdf)==5
        result['pdfPages'][str(path.relative_to(OUT))]=len(pdf)
    for path in [*OUT.glob('*.docx'),*(ROOT/'docs/yeu-cau').glob('*.docx')]:
        doc=Document(path)
        assert doc.paragraphs and doc.tables or 'Flow_Va_StateChart' in path.name
    json_files=[str(p) for p in OUT.rglob('*.json') if p.name not in {'verification.json','verification-v2.json'}]
    subprocess.run(['npx','prettier','--write',*json_files],cwd=ROOT,check=True,capture_output=True)
    for path in OUT.rglob('*'):
        if path.is_file() and path.name not in {'verification.json','verification-v2.json'}:
            result['outputs'][str(path.relative_to(OUT))]=hashlib.sha256(path.read_bytes()).hexdigest()
    (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    v2={'version':2,'date':REVIEW_DATE,'baseline':snapshot['baseline'],'slides':5,'pdfPages':5,'speakerNotesPreserved':True,'textWithinPageBounds':True,'style':'Formal editable typography; current course-only scope','sha256':{f'SWP391_ThuyetTrinh_v2.{ext}':hashlib.sha256((OUT/f'SWP391_ThuyetTrinh_v2.{ext}').read_bytes()).hexdigest() for ext in ['pptx','pdf']}}
    (OUT/'verification-v2.json').write_text(json.dumps(v2,ensure_ascii=False,indent=2))
    subprocess.run(['npx','prettier','--write',str(OUT/'verification.json'),str(OUT/'verification-v2.json')],cwd=ROOT,check=True,capture_output=True)
    print(json.dumps({k:v for k,v in result.items() if k not in {'outputs','testEvidence'}},ensure_ascii=False))


def main():
    legacy=OUT/'e2e-summary.json'
    if legacy.exists() and 'stats' in json.loads(legacy.read_text()):
        history=OUT/'lich-su';history.mkdir(exist_ok=True)
        archived=history/'e2e-summary-before-course-update.json'
        if not archived.exists():archived.write_bytes(legacy.read_bytes())
    (OUT/'e2e-summary.json').write_text(json.dumps({
        'runtimeBaseline':'801f9e6','verificationDate':'2026-11-04',
        'scope':['tests/e2e/course-only.spec.mjs','tests/e2e/course-session-history.spec.mjs'],
        'passedByFile':2,'claimsWholeRepositorySuite':False,'bankTransfersSimulated':True,
        'note':'Kết quả đã kiểm tra theo từng file; dựng tài liệu không chạy lại E2E.',
    },ensure_ascii=False,indent=2))
    requirements_docs.build()
    snapshot=collect()
    print('Rendering current flows and physical ERD',flush=True);diagrams.build(snapshot)
    runbook.build(snapshot)
    snapshot=collect()
    documents.build_report(snapshot);workbook.build(snapshot);slides.build(snapshot);slides_v2.build()
    print('Exporting current PDF companions',flush=True);export_pdf()
    validate(snapshot)

if __name__=='__main__':main()
