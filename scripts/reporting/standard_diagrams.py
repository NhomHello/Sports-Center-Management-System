"""Render editable PlantUML sources locally with Graphviz; never hand-draw SVG."""
import hashlib
import json
import os
from pathlib import Path
import re
import textwrap
import shutil
import subprocess
import xml.etree.ElementTree as ET
import cairosvg
from plantuml_erd import DOMAINS, source as erd_source, conceptual
from plantuml_models import state_source, usecase_sources
from diagram_english import TRANSITIONS

ROOT=Path(__file__).resolve().parents[2]
DIRECTORY=ROOT/'docs/so-do'
TEMPLATES=Path(__file__).parent/'plantuml'
FLOW_VIEWS={
 '01-dang-ky':['01-dang-ky','01-dang-ky-verification','01-dang-ky-login'],
 '02-mua-khoa':['02-mua-khoa','02-mua-khoa-webhook','02-mua-khoa-allocation'],
 '03-hang-cho':['03-hang-cho','03-hang-cho-promotion','03-hang-cho-response'],
 '04-thu-quay':['04-thu-quay'],
 '05-huy-hoan':['05-huy-hoan','05-huy-hoan-repayment'],
 '06-doi-soat':['06-doi-soat','06-doi-soat-resolution'],
 '07-diem-danh':['07-diem-danh-attendance','07-diem-danh-feedback'],
 '08-tong-ket':['08-tong-ket','08-tong-ket-publish','08-tong-ket-reopen'],
 '09-doi-khoa':['09-doi-khoa','09-doi-khoa-settlement'],
 '10-doi-lich':['10-doi-lich'],
}
STYLE='''skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontName DejaVu Sans
skinparam defaultFontSize 15
skinparam titleFontSize 22
skinparam ArrowColor #25465E
skinparam ArrowThickness 1.3
skinparam defaultTextAlignment center
skinparam activityBackgroundColor #F0F5F9
skinparam activityBorderColor #25465E
skinparam stateBackgroundColor #F0F5F9
skinparam stateBorderColor #25465E
skinparam classBackgroundColor #F0F5F9
skinparam classBorderColor #25465E
skinparam usecaseBackgroundColor #F0F5F9
skinparam usecaseBorderColor #25465E
skinparam conditionStyle diamond
!pragma useVerticalIf on
'''


def wrap_activity(text):
    lines=[]
    for line in text.splitlines():
        action=re.match(r'^(\s*):(.+);$',line)
        decision=re.match(r'^(\s*(?:if|elseif|while|repeat while)\s*\()(.+?)(\).*)$',line)
        if action:
            actor=re.match(r'<b>([^<]+)</b>\\n(.*)',action[2])
            if actor:
                owner=actor[1]+':'
                segments=textwrap.wrap(owner+' '+actor[2].replace(r'\n',' '),36,break_long_words=False)
                segments[0]=segments[0].replace(owner,'<b>'+owner+'</b>',1)
            else:segments=textwrap.wrap(action[2].replace(r'\n',' '),36,break_long_words=False)
            line=action[1]+':'+r'\n'.join(segments)+';'
        elif decision:
            line=decision[1]+r'\n'.join(textwrap.wrap(decision[2],32))+decision[3]
        lines.append(line)
    return '\n'.join(lines)+'\n'


def command():
    jar=os.environ.get('PLANTUML_JAR')
    if jar:
        assert Path(jar).is_file(),jar
        return ['java','-Djava.awt.headless=true','-Xmx1536m','-jar',jar]
    executable=shutil.which('plantuml')
    if executable:return [executable]
    raise RuntimeError('Install PlantUML or set PLANTUML_JAR to the official local jar; Graphviz dot is required.')


def prepare(snapshot,flows,states):
    sources={};kind={};fk_counts={}
    sources['demo-happy-path']=wrap_activity((TEMPLATES/'demo-happy-path.puml').read_text())
    kind['demo-happy-path']='activity'
    for flow in flows:
        names=FLOW_VIEWS[flow['name']]
        assert set(names)=={p.stem for p in TEMPLATES.glob(flow['name']+'*.puml')},flow['name']
        flow['views']=names
        for name in names:
            sources[name]=wrap_activity((TEMPLATES/(name+'.puml')).read_text());kind[name]='activity'
    for state in states:
        name='state-'+state[0]
        sources[name]=state_source(state);kind[name]='state'
    uml_sources,views=usecase_sources();sources.update(uml_sources)
    kind.update({name:'usecase' for name in uml_sources})
    for name,(title,models) in DOMAINS.items():
        sources[name],fk_counts[name]=erd_source(snapshot,title,models);kind[name]='erd'
    sources['erd-vat-ly-day-du'],fk_counts['erd-vat-ly-day-du']=erd_source(snapshot,'Complete physical schema',list(snapshot['models']),full=True)
    kind['erd-vat-ly-day-du']='erd'
    sources['conceptual']=conceptual();kind['conceptual']='conceptual'
    assert {(s[0],a,b) for s in states for a,b,_ in s[3]}==set(TRANSITIONS)
    return sources,kind,fk_counts,views


def render_all(snapshot,flows,states):
    assert shutil.which('dot'),'Install Graphviz dot'
    sources,kind,fk_counts,views=prepare(snapshot,flows,states)
    DIRECTORY.mkdir(parents=True,exist_ok=True)
    for old in DIRECTORY.iterdir():
        if old.suffix in {'.svg','.png','.pdf','.puml','.dot'}:old.unlink()
    for name,text in sources.items():
        assert text.isascii(),(name,'Diagram source must contain English / ASCII labels only')
        text=text.replace('@startuml','@startuml\n'+STYLE,1)
        (DIRECTORY/(name+'.puml')).write_text(text)
    cmd=command()
    version=subprocess.check_output([*cmd,'-version'],text=True,stderr=subprocess.STDOUT).splitlines()[0]
    environment={**os.environ,'PLANTUML_LIMIT_SIZE':'32000'}
    result=subprocess.run([*cmd,'-charset','UTF-8','-failfast2','-tsvg',*map(str,sorted(DIRECTORY.glob('*.puml')))],
                          text=True,capture_output=True,timeout=240,env=environment)
    if result.returncode:raise RuntimeError(result.stdout+'\n'+result.stderr)
    checks=[]
    for name in sources:
        path=DIRECTORY/(name+'.svg');assert path.is_file(),name
        root=ET.parse(path).getroot()
        texts=[''.join(node.itertext()) for node in root.iter() if node.tag.endswith('}text')]
        visible=' '.join(texts)
        assert 'Syntax Error' not in visible and 'Error line' not in visible,name
        assert not re.search(r'[À-ÖØ-öø-ÿĀ-žẠ-ỹ]',visible),(name,'Non-English diagram label')
        if name!='erd-vat-ly-day-du':
            cairosvg.svg2png(url=str(path),write_to=str(path.with_suffix('.png')),scale=1.8,background_color='white')
        checks.append(dict(file=path.name,notation=kind[name],renderer='PlantUML',
                           sourceFile=name+'.puml',englishOnly=True,syntaxValid=True,
                           sourceSha256=hashlib.sha256(path.with_suffix('.puml').read_bytes()).hexdigest()))
    cairosvg.svg2pdf(url=str(DIRECTORY/'erd-vat-ly-day-du.svg'),write_to=str(DIRECTORY/'erd-vat-ly-day-du.pdf'),background_color='white')
    record=dict(renderer='PlantUML + Graphviz',plantumlVersion=version,
                graphvizVersion=subprocess.check_output(['dot','-V'],stderr=subprocess.STDOUT,text=True).strip(),
                checks=checks,useCaseViews=views,fullErdPages=1,
                completeSchemaModels=len(snapshot['models']),completeSchemaForeignKeys=fk_counts['erd-vat-ly-day-du'],
                domainForeignKeys=fk_counts,automatedCrossingGuarantee=False)
    (DIRECTORY/'kiem-tra-so-do.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    return {name:title for name,(title,_) in DOMAINS.items()}
