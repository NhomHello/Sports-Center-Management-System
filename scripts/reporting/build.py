"""Build the new docs tree without recreating the removed outputs directory."""
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from docx import Document
from pptx import Presentation
from openpyxl import load_workbook
from catalog import ROLES, RULES, CASES, BY_RULE, ROLE_SOURCE
from schema_source import parse_schema
from spec_diagrams import render_all, STATES, FLOWS
from new_plan import build as build_plan, PLAN_SOURCE
import new_docs
import manuals
from demo_story import validate_story, WORKFLOWS
from usecase_evidence import review as review_usecases, write as write_usecase_evidence

ROOT=Path(__file__).resolve().parents[2]
DOCS=ROOT/'docs'


def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()


def source_checks():
    assert [r[0] for r in ROLES]==['Hội viên','Huấn luyện viên','Quản lí trung tâm','Lễ tân']
    seed=(ROOT/ROLE_SOURCE).read_text()
    for _,code,_ in ROLES:assert f"code: '{code}'" in seed
    assert len(CASES)==len({c['id'] for c in CASES})
    assert len(RULES)==len(BY_RULE)
    refs=set()
    for c in CASES:
        assert set(c['rules'])<=BY_RULE.keys(),c['id']
        refs.add(new_docs.source_path(c['source']))
    assert {rid for c in CASES for rid in c['rules']}==BY_RULE.keys()
    for r in RULES:refs.update(new_docs.source_path(s) for s in r['sources'])
    refs.update(['core/be/prisma/schema.prisma',ROLE_SOURCE,'package.json',
                 'core/be/package.json','core/fe/package.json','README.md','HUONG_DAN_HE_THONG.md'])
    refs.update(str(p.relative_to(ROOT)) for p in (ROOT/'scripts/reporting').glob('*.py'))
    refs.update(str(p.relative_to(ROOT)) for p in (ROOT/'scripts/reporting/plantuml').glob('*.puml'))
    for path in refs:assert (ROOT/path).is_file(),path
    models,relations,enums=parse_schema()
    for _,enum,_,edges,_ in STATES:
        assert all(a in enums[enum] and b in enums[enum] for a,b,_ in edges),enum
    evidence=review_usecases(manuals.api_inventory())
    for row in evidence:
        refs.update(ref.split(':',1)[0] for ref in row['references'])
        refs.update(row['routeSources'])
    return {'models':models,'relations':relations,'enums':enums,'useCaseEvidence':evidence,
            'baseline':git('rev-parse','main'),'head':git('rev-parse','HEAD'),
            'sourceRefs':sorted(refs),'planSource':PLAN_SOURCE}


def export_pdf():
    executable=os.environ.get('SWP_LIBREOFFICE','libreoffice')
    for folder in ['yeu-cau','bao-cao']:
        directory=DOCS/folder
        targets=sorted(directory.glob('*.docx'))+sorted(directory.glob('*.pptx'))
        subprocess.run([executable,'-env:UserInstallation=file:///tmp/swp-docs-new-office',
                        '--headless','--convert-to','pdf','--outdir',str(directory),
                        *map(str,targets)],check=True,timeout=240)
        for target in targets:assert target.with_suffix('.pdf').is_file(),target


def validation(snapshot,tasks,testcases,inventory):
    import pymupdf
    assert not (ROOT/'outputs/bao-cao-cuoi-ky').exists(), 'Removed report tree must stay removed'
    texts=[]
    for path in DOCS.rglob('*.docx'):
        doc=Document(path)
        body='\n'.join([p.text for p in doc.paragraphs]+[c.text for t in doc.tables for r in t.rows for c in r.cells])
        texts.append(body)
        assert 'Admin theo permission' not in body and 'Nhân viên hỗ trợ' not in body,path
        role_text=re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '', body)
        assert not re.search(r'\badmin\b',role_text,re.I),path
        assert 'Đã kiểm tra tại main' not in body,path
    alltext='\n'.join(texts)
    assert all(name in alltext for name,_,_ in ROLES)
    assert all(c['id'] in alltext for c in CASES)
    assert all(r['id'] in alltext for r in RULES)
    assert 'publicEmail khác email' not in alltext
    assert 'cron mỗi 1 phút' not in alltext
    report=Document(DOCS/'bao-cao/SWP391_BaoCaoCuoiKy.docx')
    headings={p.text for p in report.paragraphs}
    assert all(c['id']+' · '+c['title'] in headings for c in CASES),'UC details missing from main report'
    diagram_review=json.loads((DOCS/'so-do/kiem-tra-so-do.json').read_text())
    assert diagram_review['renderer']=='PlantUML + Graphviz'
    assert all(c['syntaxValid'] and c['englishOnly'] and c['renderer']=='PlantUML' for c in diagram_review['checks'])
    assert all((DOCS/'so-do'/c['sourceFile']).is_file() for c in diagram_review['checks'])
    assert {c['id'] for c in CASES}=={code for view in diagram_review['useCaseViews'] for code in view['ids']}
    assert diagram_review['completeSchemaForeignKeys']==len(snapshot['relations'])
    assert diagram_review['completeSchemaModels']==len(snapshot['models'])
    for _,_,_,_,path in testcases:assert (ROOT/path).is_file(),path
    assert len(tasks)==len({t['id'] for t in tasks})
    for t in tasks:assert set(t['rule_ids'])<=BY_RULE.keys()
    for path in DOCS.rglob('*.xlsx'):
        book=load_workbook(path,read_only=True)
        assert all(s.max_row>=1 for s in book)
        for s in book:
            for row in s:
                for cell in row:assert cell.data_type!='e',(path,s.title,cell.coordinate)
    runbook=Document(DOCS/'bao-cao/SWP391_KichBanDemo.docx')
    workflow_headings=[p.text for p in runbook.paragraphs if re.match(r'^WF[1-4] · ',p.text)]
    assert len(workflow_headings)==4
    demo_text='\n'.join(p.text for p in runbook.paragraphs)+'\n'+'\n'.join(c.text for t in runbook.tables for row in t.rows for c in row.cells)
    assert all(w['title'] in demo_text for w in WORKFLOWS)
    assert all(e['title'] in demo_text for e in __import__('demo_story').EXCEPTIONS)
    assert __import__('demo_story').validate_story()['totalMinutes']==30
    deck=Presentation(DOCS/'bao-cao/SWP391_ThuyetTrinh.pptx')
    assert len(deck.slides)==5
    slide_five=' '.join(shape.text for shape in deck.slides[4].shapes if shape.has_text_frame)
    assert all(w['id']+' · '+w['title'] in slide_five for w in WORKFLOWS)
    for slide in deck.slides:
        assert slide.notes_slide.notes_text_frame.text.strip()
        for shape in slide.shapes:
            assert shape.left>=0 and shape.top>=0
            assert shape.left+shape.width<=deck.slide_width and shape.top+shape.height<=deck.slide_height
    pdfs={}
    for path in DOCS.rglob('*.pdf'):
        pdf=pymupdf.open(path)
        assert len(pdf)>0 and all(p.get_text().strip() for p in pdf),path
        if path.stem=='SWP391_ThuyetTrinh':assert len(pdf)==5
        pdfs[str(path.relative_to(DOCS))]=len(pdf)
    for path in DOCS.rglob('*.md'):
        for target in re.findall(r'\]\(([^)]+)\)',path.read_text()):
            if '://' in target or target.startswith('#'):continue
            assert (path.parent/target.split('#')[0]).exists(),(path,target)
    record={
        'demoPlan':validate_story(),
        'date':'2026-11-06','kind':'documentation-validation','applicationTestsRun':False,
        'applicationTestEvidence':'kiem-thu/ket-qua-bo-sung-2026-11-06.json',
        'councilDemoEvidence':'kiem-thu/council-demo-preflight.json',
        'roles':[r[0] for r in ROLES],'useCases':len(CASES),'businessRules':len(RULES),
        'tasksInCurrentScope':len(tasks),'testCasesPlanned':len(testcases),'apiRoutesListed':len(inventory),
        'sourceMain':snapshot['baseline'],'sourceHead':snapshot['head'],'taskMetadataSource':PLAN_SOURCE,
        'flows':len(FLOWS),'stateCharts':len(STATES),'models':len(snapshot['models']),
        'useCasesVerifiedAgainstCode':len(snapshot['useCaseEvidence']),
        'useCaseDiagrams':len(diagram_review['useCaseViews']),
        'diagramRenderer':diagram_review['renderer'],'diagramLanguage':'English',
        'plantumlVersion':diagram_review['plantumlVersion'],'graphvizVersion':diagram_review['graphvizVersion'],
        'foreignKeys':len(snapshot['relations']),'pdfPages':pdfs,
        'checks':['role names','source paths','UC/BR references','schema enum states','task IDs','XLSX cell errors','slide count/notes/bounds','PDF text','Markdown links','PlantUML syntax','English diagram labels','complete physical FK coverage'],
        'sources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in snapshot['sourceRefs']},
        'localReferenceInputs':{str(p.relative_to(DOCS)):hashlib.sha256(p.read_bytes()).hexdigest() for p in DOCS.rglob('*.m4a') if p.is_file()},
        'artifacts':{str(p.relative_to(DOCS)):hashlib.sha256(p.read_bytes()).hexdigest() for p in DOCS.rglob('*') if p.is_file() and p.suffix!='.m4a' and p.name!='kiem-tra-tai-lieu.json'},
    }
    (DOCS/'kiem-tra-tai-lieu.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in record.items() if k not in {'sources','artifacts','pdfPages'}},ensure_ascii=False))


def main():
    snapshot=source_checks();DOCS.mkdir(parents=True,exist_ok=True)
    print('Building current task scope from pinned Git metadata',flush=True)
    tasks=build_plan()
    print('Rendering current flows, states and ERD',flush=True)
    groups=render_all(snapshot)
    print('Writing new specifications, report, demo and slides',flush=True)
    new_docs.requirements(snapshot['useCaseEvidence']);new_docs.data_model(snapshot,groups)
    new_docs.flow_document();new_docs.report(snapshot,tasks);new_docs.runbook();new_docs.slides()
    from council_data_docs import build as build_council_data
    from speaker_notes import build as build_speaker_notes
    build_council_data();build_speaker_notes()
    testcases=new_docs.testcases_and_trace(tasks,snapshot)
    inventory=manuals.build()
    from lecturer_notes import build as build_lecturer_notes
    build_lecturer_notes()
    write_usecase_evidence(snapshot['useCaseEvidence'])
    print('Exporting PDF and validating documentation',flush=True)
    export_pdf()
    text_artifacts=[ROOT/'README.md',ROOT/'HUONG_DAN_HE_THONG.md',*DOCS.rglob('*.md'),*DOCS.rglob('*.json')]
    subprocess.run(['node',str(ROOT/'node_modules/prettier/bin/prettier.cjs'),'--write',*map(str,text_artifacts)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
    validation(snapshot,tasks,testcases,inventory)


if __name__=='__main__':main()
