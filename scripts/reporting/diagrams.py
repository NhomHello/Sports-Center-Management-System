"""Generate editable Graphviz sources and render vector and raster diagrams."""
import html
import json
import subprocess
from pathlib import Path
import cairosvg
from evidence import ROOT, OUT
from workflows import FLOWS, STATES
from swimlane import render

DOMAINS = {
 'erd-01-access': ('Tài khoản và quyền', ['User','Role','Permission','RolePermission','EmailVerificationToken','LoginThrottle','SystemSetting','AuditLog','Notification']),
 'erd-02-schedule': ('Lớp và lịch học', ['User','Subject','Room','RoomType','RoomTypeSubject','CoachSubject','OperatingFrame','GymClass','ClassSession','ClassEnrollment','ClassWaitlist','RoomMaintenance','Attendance','CheckIn','ClassEvent','ScheduleLock']),
 'erd-03-finance': ('Gói và tài chính', ['User','MembershipPlan','Membership','MembershipFreeze','PlanFrame','PlanRoomType','Invoice','Payment','PaymentWebhookLog','ReconciliationCase','ReconciliationContact','Refund','CreditTransaction','PurchaseChange']),
 'erd-04-course': ('Hồ sơ và tổng kết', ['User','CoachProfile','MemberProfile','GymClass','CourseSummary','CourseSummaryItem','CourseRating']),

}

def quote(value):
    return json.dumps(str(value), ensure_ascii=False)

def base(direction='TB'):
    return ['digraph G {', f'graph [rankdir={direction}, bgcolor="white", pad="0.25", nodesep="0.25", ranksep="0.5", fontname="DejaVu Sans", fontsize=15];', 'node [shape=box, style="rounded,filled", fillcolor="#eef5fb", color="#a4bdce", fontname="DejaVu Sans", fontsize=11, margin="0.14,0.1"];', 'edge [fontname="DejaVu Sans", fontsize=9, color="#527087", arrowsize=0.7];']

def flow_dot(flow):
    _, title, actors, nodes, edges = flow
    lines = base()
    lines.append(f'label={quote(title)}; labelloc=t;')
    for i, actor in enumerate(actors):
        lines.append(f'subgraph cluster_{i} {{ label={quote(actor)}; color="#cbdbe7"; style="rounded,filled"; fillcolor="{["#f4f8fc","#eaf4f3","#fff8ec"][i]}";')
        for key, lane, label, shape in nodes:
            if lane == actor:
                lines.append(f'{key} [label={quote(label)}, shape={shape}];')
        lines.append('}')
    for left, right, label in edges:
        lines.append(f'{left} -> {right} [label={quote(label)}];')
    return '\n'.join([*lines, '}'])

def state_dot(state):
    _, title, nodes, edges, *_ = state
    lines = base('TB')
    lines.append(f'label={quote(title)}; labelloc=t;')
    for node in nodes:
        lines.append(f'{node} [label={quote(node)}];')
    for left, right, label in edges:
        lines.append(f'{left} -> {right} [label={quote(label)}];')
    return '\n'.join([*lines, '}'])

def erd_dot(snapshot, names, title):
    lines = base('LR')
    lines.append(f'label={quote(title)}; labelloc=t;')
    for name in names:
        model = snapshot['models'][name]
        scalar = [f for f in model['fields'] if f['type'].rstrip('?[]') not in snapshot['models']]
        fk = {key for r in snapshot['relations'] if r['from'] == name for key in r['keys']}
        shown = [f for f in scalar if '@id' in f['attributes'] or f['name'] in fk or f['name'] in ['status','code','name']][:8]
        rows = ''.join(f'<TR><TD ALIGN="LEFT">{html.escape(f["name"])} : {html.escape(f["type"])}{" [PK]" if "@id" in f["attributes"] else " [FK]" if f["name"] in fk else ""}</TD></TR>' for f in shown)
        label = f'<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5"><TR><TD BGCOLOR="#163b58"><FONT COLOR="white"><B>{name}</B></FONT></TD></TR><TR><TD><FONT POINT-SIZE="9">{model["table"]}</FONT></TD></TR>{rows}</TABLE>>'
        lines.append(f'{name} [shape=plain, label={label}];')
    for relation in snapshot['relations']:
        if relation['from'] in names and relation['to'] in names:
            label = ','.join(relation['keys'])
            parent, children = '0..1' if relation['optional'] else '1', '0..1' if relation['unique'] else '0..*'
            lines.append(f'{relation["from"]} -> {relation["to"]} [label={quote(label)}, headlabel={quote(parent)}, taillabel={quote(children)}, labeldistance=2, fontsize=8];')
    return '\n'.join([*lines, '}'])

def conceptual():
    lines = base('TB')
    nodes = {'person':'Người dùng\nHội viên / HLV / nhân viên', 'access':'Vai trò và quyền', 'member':'Kỳ gói tự tập', 'plan':'Gói tự tập', 'class':'Khóa / lớp học', 'session':'Buổi học', 'room':'Phòng và khung giờ', 'enroll':'Đăng ký lớp', 'invoice':'Hóa đơn và thanh toán', 'summary':'Tổng kết và đánh giá', 'profile':'Hồ sơ và chia sẻ', 'audit':'Audit / thông báo'}
    for key, label in nodes.items():
        lines.append(f'{key} [label={quote(label)}];')
    for a,b,label in [('person','access','được phân quyền'),('person','member','mua kỳ'),('member','plan','thuộc gói'),('person','enroll','đăng ký'),('enroll','class','vào lớp'),('class','session','gồm buổi'),('session','room','sử dụng'),('person','class','HLV phụ trách'),('invoice','member','thanh toán'),('invoice','enroll','thanh toán khóa'),('person','invoice','sở hữu'),('class','summary','có tổng kết'),('person','profile','sở hữu'),('summary','audit','phát sinh sự kiện')]:
        lines.append(f'{a} -> {b} [label={quote(label)}];')
    return '\n'.join([*lines,'}'])

def architecture():
    lines = base('TB')
    for key,label in {'browser':'Trình duyệt\nReact 19 + Ant Design 6\nRouter / Query / Zustand','api':'Express 5 API\nJWT → permission → Zod\nController → Service','db':'MySQL 8\nPrisma 7 + transaction\nFK / unique / lock','jobs':'Worker cùng tiến trình Node\nExpiry / waitlist / summary\nOutbox và email retry','sepay':'SePay\nWebhook xác thực','smtp':'SMTP sandbox / server','files':'PDF / CSV / XLSX\nBuilder theo bộ lọc'}.items():
        lines.append(f'{key} [label={quote(label)}];')
    for a,b,label in [('browser','api','HTTP / JSON'),('api','db','Prisma'),('sepay','api','Webhook'),('jobs','db','Đọc / ghi; khoá'),('jobs','smtp','Gửi email; retry'),('api','files','Export'),('api','jobs','Khởi chạy worker')]:
        lines.append(f'{a} -> {b} [label={quote(label)}];')
    return '\n'.join([*lines,'}'])

def build(snapshot):
    directory = OUT / 'so-do'
    directory.mkdir(exist_ok=True)
    diagrams = {f[0]: flow_dot(f) for f in FLOWS}
    diagrams.update({s[0]: state_dot(s) for s in STATES})
    diagrams.update({name: erd_dot(snapshot, entities, title) for name,(title,entities) in DOMAINS.items()})
    diagrams.update({'conceptual':conceptual(), 'architecture':architecture(), 'erd-full':erd_dot(snapshot, [name for name in snapshot['models'] if name[0].isupper()], 'ERD các model đang dùng trong phạm vi triển khai')})
    for name, dot in diagrams.items():
        (directory / f'{name}.dot').write_text(dot)
    subprocess.run(['node', str(ROOT / 'scripts/reporting/render-graphs.mjs'), str(directory)], check=True)
    for flow in FLOWS:
        render(flow)
    for name in diagrams:
        svg = directory / f'{name}.svg'
        if name != 'erd-full':
            cairosvg.svg2png(url=str(svg), write_to=str(directory / f'{name}.png'), scale=2)
    cairosvg.svg2pdf(url=str(directory / 'erd-full.svg'), write_to=str(OUT / 'SWP391_ERD_DayDu_v1.pdf'))
    return diagrams
