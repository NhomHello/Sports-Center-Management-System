"""Standard state and use-case diagrams, with English text and actual UC/state IDs."""
import textwrap
from catalog import ROLES, CASES
from diagram_english import ACTORS, TITLES, PERSPECTIVES, STATE_TITLES, TRANSITIONS


def label(text,width=42):
    return '\\n'.join(textwrap.wrap(text,width))


def state_source(item):
    name,enum,title,edges,note=item
    if name=='class':return course_state()
    if name=='waitlist':return waiting_state()
    initial={'invoice':['PENDING'],'enrollment':['PENDING_PAYMENT','BOOKED'],
             'class':['OPEN','CLOSED'],'waitlist':['WAITING'],'refund':['PENDING'],
             'change':['PENDING_PAYMENT'],'summary':['DRAFT']}[name]
    nodes=list(dict.fromkeys([*initial,*[s for a,b,_ in edges for s in (a,b)]]))
    lines=['@startuml',f'title {STATE_TITLES[name]}','hide empty description','left to right direction',
           'skinparam nodesep 55','skinparam ranksep 65']
    for node in nodes:lines.append(f'state {node}')
    if len(initial)>1:
        lines.extend(['state CreationChoice <<choice>>','[*] --> CreationChoice : create'])
        for node in initial:
            guard=('course price = 0' if node=='BOOKED' else 'course price > 0') if name=='enrollment' else 'initial '+node
            lines.append(f'CreationChoice --> {node} : [{guard}]')
    else:lines.append(f'[*] --> {initial[0]} : create')
    for a,b,_ in edges:
        text=TRANSITIONS[(name,a,b)]
        lines.append(f'{a} --> {b} : {label(text,34)}')
    if name=='refund':lines.append('DONE --> [*]')
    if name=='class':
        lines.extend(['COMPLETED --> [*]','CANCELLED --> [*]','note bottom of COMPLETED : Non-cancelled sessions only;\\nat least one session is required.'])
    if name=='change':lines.extend(['DONE --> [*]','CANCELLED --> [*]'])
    lines.extend(['@enduml'])
    return '\n'.join(lines)+'\n'


def course_state():
    return '''@startuml
title Course lifecycle
hide empty description
skinparam nodesep 45
skinparam ranksep 45
[*] --> NonTerminal
state "Non-terminal course" as NonTerminal {
  state InitialStatus <<choice>>
  [*] --> InitialStatus
  InitialStatus --> OPEN : [initial OPEN]
  InitialStatus --> CLOSED : [initial CLOSED]
  OPEN --> CLOSED : closeRegistration
  CLOSED --> OPEN : reopenRegistration
}
NonTerminal --> COMPLETED : completionCheck [all ended]
NonTerminal --> CANCELLED : centerCancels
COMPLETED --> [*]
CANCELLED --> [*]
note right of COMPLETED
  Count non-cancelled sessions only.
  At least one session is required.
end note
note bottom of NonTerminal
  UML composite groups OPEN and CLOSED.
  It is not another database status.
end note
@enduml
'''


def waiting_state():
    return '''@startuml
title Waiting list entry lifecycle
hide empty description
skinparam nodesep 45
skinparam ranksep 45
[*] --> ActiveQueue
state "Active queue entry" as ActiveQueue {
  [*] --> WAITING
  WAITING --> OFFERED : seatAvailable [eligible]
}
state "Inactive queue entry" as InactiveQueue {
  state ACCEPTED
  state EXPIRED
  state CANCELLED
}
OFFERED --> ACCEPTED : accept [before expiry]
OFFERED --> EXPIRED : offerExpires
ActiveQueue --> CANCELLED : leaveOrRegistrationClosed
WAITING --> CANCELLED : promotionCheck [ineligible]
InactiveQueue --> WAITING : rejoin [eligible and full]
note bottom of InactiveQueue
  Rejoining requires no active BOOKED
  or PENDING_PAYMENT enrollment.
  Composite boxes are UML groupings,
  not additional database statuses.
end note
@enduml
'''


def actors_for(case):
    raw=case['actors'].casefold()
    result=[name for name,_,_ in ROLES if name.casefold() in raw]
    if 'bốn vai trò' in raw:result=[name for name,_,_ in ROLES]
    if 'sepay' in raw:result.append('SePay')
    if case['id'] in {'UC-PAY-04','UC-CB-13','UC-TR-05'}:result.append('Bộ định thời')
    return list(dict.fromkeys(result))


def usecase_sources():
    assert {c['id'] for c in CASES}==set(TITLES)
    slugs=['hoi-vien','huan-luyen-vien','quan-li-trung-tam','le-tan','sepay','thoi-gian']
    actors=[name for name,_,_ in ROLES]+['SePay','Bộ định thời']
    sources={};views=[]
    for actor,slug in zip(actors,slugs):
        selected=[c for c in CASES if actor in actors_for(c)]
        english=ACTORS[actor]
        for part,start in enumerate(range(0,len(selected),8),1):
            cases=selected[start:start+8];name=f'usecase-{slug}-{part:02}'
            title=f'Use Case - {english} - Part {part}'
            stereotype=' <<external system>>' if actor=='SePay' else ' <<time event>>' if actor=='Bộ định thời' else ''
            lines=['@startuml',f'title {title}','left to right direction',
                   f'actor "{english}" as Actor{stereotype}',
                   'rectangle "Sports Center Management System" {']
            for i,case in enumerate(cases):
                text=PERSPECTIVES.get((case['id'],english),TITLES[case['id']])
                lines.append(f'  usecase "{case["id"]}\\n{label(text,38)}" as U{i}')
            lines.append('}')
            lines.extend(f'Actor -- U{i}' for i in range(len(cases)))
            lines.extend(['@enduml'])
            sources[name]='\n'.join(lines)+'\n'
            views.append(dict(name=name,title=title,actor=english,ids=[c['id'] for c in cases]))
    return sources,views
