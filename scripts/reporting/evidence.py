"""Read Git, task sheets and Prisma without changing the source evidence."""
import hashlib
import io
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/bao-cao-cuoi-ky'
REPO = 'https://github.com/NhomHello/Sports-Center-Management-System'
TEAM = {
    'godskyfastmc@gmail.com': 'Nhanh',
    '141387122+LDNVN86@users.noreply.github.com': 'Nhanh',
    'phamthaibao29072004@gmail.com': 'Bảo',
    'longhuy0078@gmail.com': 'Khôi',
    'joppyminecraft2005@gmail.com': 'Khải',
    'khainguyen02112005@gmail.com': 'Khải',
}

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).rstrip('\n')

def load_sheet(path, data_only=True):
    """Some source workbooks contain invalid numeric NaN cells; treat as empty on read."""
    data = io.BytesIO()
    with ZipFile(path) as source, ZipFile(data, 'w', ZIP_DEFLATED) as dest:
        for name in source.namelist():
            dest.writestr(name, source.read(name).replace(b'<v>NaN</v>', b'<v></v>'))
    return load_workbook(data, read_only=False, data_only=data_only)

def collect_tasks():
    tasks = []
    for path in sorted((ROOT / 'docs/ke-hoach').glob('SWP391_TaskSheet_Sprint*.xlsx')):
        for sheet in load_sheet(path):
            rows = list(sheet.values)
            header = next((i for i, row in enumerate(rows) if row and row[0] == 'Task ID'), None)
            if header is None:
                continue
            for number, row in enumerate(rows[header + 1:], header + 2):
                if not row or not isinstance(row[0], str) or not re.fullmatch(r'S[1-4]-[\w-]+', row[0]):
                    continue
                values = list(row) + [None] * 12
                tasks.append(dict(zip(['id', 'uc', 'function', 'type', 'owner', 'level', 'rule', 'branch', 'start', 'due', 'status', 'notes'], values)))
                tasks[-1].update(source=str(path.relative_to(ROOT)), sheet=sheet.title, row=number)
    return tasks

def collect_commits():
    fields = '%H%x1f%aI%x1f%cI%x1f%an%x1f%ae%x1f%P%x1f%s%x1f%b%x1e'
    records = git('log', 'main', '--reverse', '--date-order', f'--format={fields}')
    commits = []
    for record in records.split('\x1e'):
        values = record.strip('\n').split('\x1f', 7)
        if len(values) != 8:
            continue
        commit = dict(zip(['hash', 'authored', 'committed', 'author', 'email', 'parents', 'subject', 'body'], values))
        commit['member'] = TEAM.get(commit['email'], 'Chưa đối chiếu')
        commit['merge'] = len(commit['parents'].split()) > 1
        commit['url'] = f"{REPO}/commit/{commit['hash']}"
        commit['coauthors'] = re.findall(r'(?im)^Co-authored-by:\s*(.+)$', commit['body'])
        commit['tasks'] = sorted(set(re.findall(r'\bS[1-4]-\d{2,3}\b', commit['subject'] + '\n' + commit['body'])))
        del commit['body']
        commits.append(commit)
    return commits

def parse_schema():
    text = (ROOT / 'core/be/prisma/schema.prisma').read_text()
    models = {}
    for match in re.finditer(r'^model\s+(\w+)\s*\{(.*?)^\}', text, re.M | re.S):
        name, body = match.groups()
        table = re.search(r'@@map\("([^\"]+)"\)', body)
        fields = []
        for line in body.splitlines():
            field = re.match(r'\s*(\w+)\s+([\w?\[\]]+)\s*(.*)', line)
            if not field or line.lstrip().startswith('//'):
                continue
            key, kind, attributes = field.groups()
            column = re.search(r'(?<!@)@map\("([^\"]+)"\)', attributes)
            fields.append({'name': key, 'type': kind, 'column': column.group(1) if column else key, 'attributes': attributes})
        models[name] = {'table': table.group(1) if table else name, 'fields': fields, 'constraints': re.findall(r'^\s*(@@[^\n]+)', body, re.M)}
    relations = []
    for name, model in models.items():
        for field in model['fields']:
            target = field['type'].rstrip('?[]')
            foreign = re.search(r'fields:\s*\[([^\]]+)\].*?references:\s*\[([^\]]+)\]', field['attributes'])
            if target not in models or not foreign:
                continue
            keys = [v.strip() for v in foreign.group(1).split(',')]
            references = [v.strip() for v in foreign.group(2).split(',')]
            unique = any(f['name'] in keys and ('@id' in f['attributes'] or '@unique' in f['attributes']) for f in model['fields'])
            unique = unique or any(re.match(r'@@(?:id|unique)\(\[' + re.escape(', '.join(keys)) + r'\]', c) for c in model['constraints'])
            relations.append({'from': name, 'to': target, 'field': field['name'], 'keys': keys, 'references': references, 'optional': field['type'].endswith('?'), 'unique': unique})
    enums = {m.group(1): re.findall(r'^\s*(\w+)\s*$', m.group(2), re.M) for m in re.finditer(r'^enum\s+(\w+)\s*\{(.*?)^\}', text, re.M | re.S)}
    return models, relations, enums

def collect():
    OUT.mkdir(parents=True, exist_ok=True)
    tasks, commits = collect_tasks(), collect_commits()
    models, relations, enums = parse_schema()
    for task in tasks:
        matches = [c for c in commits if task['id'] in c['tasks']]
        task['commits'] = [c['hash'] for c in matches]
        task['evidence'] = 'ID trực tiếp trong commit' if matches else 'Cần đối chiếu nội dung; không suy ra từ tên nhánh'
    sources = ['core/be/prisma/schema.prisma', 'docs/README.md', 'README.md', 'package.json', 'core/be/package.json', 'core/fe/package.json', *sorted({t['source'] for t in tasks}), *[str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/yeu-cau').glob('*.docx'))]]
    snapshot = {'baseline': git('rev-parse', 'main'), 'date': '2026-10-29', 'repo': REPO, 'sources': {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in sources}, 'tasks': tasks, 'commits': commits, 'models': models, 'relations': relations, 'enums': enums}
    (OUT / 'evidence.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))
    print(json.dumps({'commits': len(commits), 'tasks': len(tasks), 'directTaskLinks': sum(bool(t['commits']) for t in tasks), 'models': len(models), 'relations': len(relations)}, ensure_ascii=False))
    return snapshot
