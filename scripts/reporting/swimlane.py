"""Compact responsibility swimlanes with readable Vietnamese labels."""
import html
from evidence import OUT


def render(flow):
    name, title, actors, nodes, edges = flow
    lane_width, row_height, top = 270, 83, 110
    width, height = len(actors) * lane_width + 30, top + len(nodes) * row_height + 30
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">', '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#527087"/></marker></defs>', '<rect width="100%" height="100%" fill="white"/>', f'<text x="20" y="30" font-family="DejaVu Sans" font-size="20" font-weight="bold" fill="#163b58">{html.escape(title)}</text>']
    for index, actor in enumerate(actors):
        x = 15 + index * lane_width
        color = ['#f4f8fc', '#eaf4f3', '#fff8ec'][index]
        parts.append(f'<rect x="{x}" y="50" width="{lane_width}" height="{height-65}" fill="{color}" stroke="#bdccd7"/>')
        parts.append(f'<text x="{x+lane_width/2}" y="80" text-anchor="middle" font-family="DejaVu Sans" font-size="16" font-weight="bold">{html.escape(actor)}</text>')
    positions = {key: (15 + actors.index(actor) * lane_width + lane_width / 2, top + i * row_height + 30) for i,(key,actor,_,_) in enumerate(nodes)}
    for index,(left,right,label) in enumerate(edges):
        x1,y1 = positions[left]
        x2,y2 = positions[right]
        if y2 > y1:
            middle = y1 + 40
            if x1 == x2 and y2-y1 > row_height:
                rail = x1 + 120
                path = f'M{x1},{y1+29} V{middle} H{rail} V{y2-40} H{x2} V{y2-29}'
                tx,ty = rail+2,middle+17
            else:
                path = f'M{x1},{y1+29} V{middle} H{x2} V{y2-29}'
                tx,ty = min(x1,x2)+8,middle-5
        else:
            rail = max(x1,x2)+122
            path = f'M{x1+112},{y1} H{rail} V{y2} H{x2+112}'
            tx,ty = rail-5,(y1+y2)/2
        parts.append(f'<path d="{path}" fill="none" stroke="#527087" stroke-width="1.7" marker-end="url(#arrow)"/>')
        if label:
            parts.append(f'<text x="{tx}" y="{ty}" font-family="DejaVu Sans" font-size="11" fill="#375367">{html.escape(label)}</text>')
    for key,actor,label,shape in nodes:
        x,y = positions[key]
        if shape == 'diamond':
            parts.append(f'<path d="M{x},{y-33} L{x+114},{y} L{x},{y+33} L{x-114},{y} Z" fill="#fff2ce" stroke="#a89254"/>')
        else:
            parts.append(f'<rect x="{x-112}" y="{y-29}" width="224" height="58" rx="9" fill="white" stroke="#91aabd"/>')
        lines = label.split('\n')
        for number,line in enumerate(lines):
            baseline = y + (number-(len(lines)-1)/2)*19+6
            parts.append(f'<text x="{x}" y="{baseline}" text-anchor="middle" font-family="DejaVu Sans" font-size="14">{html.escape(line)}</text>')
    parts.append('</svg>')
    (OUT/'so-do'/f'{name}.svg').write_text('\n'.join(parts))
