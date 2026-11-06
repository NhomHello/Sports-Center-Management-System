"""State conditions remain readable next to the compact non-crossing state view."""
from doc_layout import section, figure, grid, landscape_figure


def add_state(doc,state):
    name,enum,title,edges,note=state
    landscape_figure(doc,'Trạng thái · '+title,'state-'+name)
    doc.add_paragraph('Enum '+enum+'. '+note)
    grid(doc,['Từ trạng thái','Đến trạng thái','Điều kiện chuyển'],edges)
