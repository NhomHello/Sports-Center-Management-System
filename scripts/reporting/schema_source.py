"""Read model fields, constraints, foreign keys and enums from Prisma."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

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
