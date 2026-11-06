"""Standard Information Engineering / Crow's Foot sources from the real Prisma FKs."""
import re

DOMAINS={
 'erd-access':('Accounts and permissions',['User','Role','Permission','RolePermission','EmailVerificationToken','LoginThrottle']),
 'erd-facilities':('Subjects, rooms and operating frames',['CoachSubject','Subject','RoomType','RoomTypeSubject','Room','OperatingFrame','RoomMaintenance']),
 'erd-courses':('Course definition and resources',['User','Subject','Room','GymClass']),
 'erd-sessions':('Sessions and resource overrides',['User','Room','GymClass','ClassSession']),
 'erd-enrollment':('Course enrollment',['User','GymClass','Invoice','ClassEnrollment']),
 'erd-waiting-list':('Course waiting list',['User','GymClass','ClassWaitlist']),
 'erd-attendance':('Session attendance and feedback',['User','GymClass','ClassSession','ClassEnrollment','Attendance','SessionFeedback','CheckIn']),
 'erd-billing':('Invoices, payments and refunds',['User','GymClass','Invoice','Payment','Refund']),
 'erd-reconciliation':('Bank transfers and reconciliation',['Invoice','PaymentWebhookLog','ReconciliationCase','ReconciliationContact','Refund']),
 'erd-summary':('Course summaries and member results',['User','GymClass','CourseSummary','CourseSummaryItem']),
 'erd-profiles':('Coach and member profiles',['User','CoachProfile','MemberProfile']),
 'erd-ratings':('Course and coach ratings',['User','GymClass','CourseRating']),
 'erd-purchase-change':('Course change and cancellation records',['User','GymClass','ClassEnrollment','Invoice','PurchaseChange','Refund']),
 'erd-operations':('Notifications, audit and configuration',['User','AuditLog','Notification','SystemSetting']),
}
OWNER_SCOPE={
 'Accounts and permissions':{'User','RolePermission','EmailVerificationToken','LoginThrottle'},
 'Subjects, rooms and operating frames':{'CoachSubject','Room','RoomTypeSubject','RoomMaintenance'},
 'Course definition and resources':{'GymClass'},'Sessions and resource overrides':{'ClassSession'},
 'Course enrollment':{'ClassEnrollment'},'Course waiting list':{'ClassWaitlist'},
 'Session attendance and feedback':{'Attendance','SessionFeedback','CheckIn'},
 'Invoices, payments and refunds':{'Invoice','Payment','Refund'},
 'Bank transfers and reconciliation':{'PaymentWebhookLog','ReconciliationCase','ReconciliationContact','Refund'},
 'Course summaries and member results':{'CourseSummary','CourseSummaryItem'},
 'Coach and member profiles':{'CoachProfile','MemberProfile'},
 'Course and coach ratings':{'CourseRating'},
 'Course change and cancellation records':{'PurchaseChange'},
 'Notifications, audit and configuration':{'AuditLog','Notification','SystemSetting'},
}
BUSINESS_FIELDS={'name','fullName','email','code','status','kind','price','amount','receivedAmount','paidAt',
                 'startAt','endAt','capacity','sessionCount','totalSessions',
                 'registrationStartAt','registrationEndAt','holdExpiresAt','rating','version',
                 'planName','provider','reference','reason','excessAmount',
                 'bio','experienceYears','publicEmail','publicPhone','showContact',
                 'goals','shareWithCoach','healthNotes','result','progress','comment',
                 'attendanceSnapshot','publishedAt','revision','deadlineAt',
                 'courseStars','coachStars','hiddenAt'}


def primary_keys(model):
    fields={f['name'] for f in model['fields'] if '@id' in f['attributes']}
    for constraint in model['constraints']:
        match=re.match(r'@@id\(\[([^\]]+)\]',constraint)
        if match:fields.update(x.strip() for x in match.group(1).split(','))
    return fields


def entity(snapshot,name,full=False):
    model=snapshot['models'][name];pk=primary_keys(model)
    fk={key for r in snapshot['relations'] if r['from']==name for key in r['keys']}
    lines=[f'entity "{name}\\n({model["table"]})" as T_{name} {{']
    scalars=[f for f in model['fields'] if f['type'].rstrip('?[]') not in snapshot['models']]
    selected=[f for f in scalars if full or f['name'] in pk|fk|BUSINESS_FIELDS]
    selected.sort(key=lambda f:(f['name'] not in pk,f['name'] not in fk))
    for field in selected:
        flags=[]
        if field['name'] in pk:flags.append('PK')
        if field['name'] in fk:flags.append('FK')
        if '@unique' in field['attributes']:flags.append('UQ')
        mandatory='' if field['type'].endswith('?') else '* '
        suffix=' <<'+','.join(flags)+'>>' if flags else ''
        lines.append(f'  {mandatory}{field["name"]} : {field["type"]}{suffix}')
    return lines+['}']


def source(snapshot,title,names,full=False):
    lines=['@startuml',f'title {title}','left to right direction','hide circle','hide methods',
           'skinparam linetype polyline','skinparam nodesep 40','skinparam ranksep 80','skinparam ArrowFontSize 13']
    for name in names:
        lines.extend(entity(snapshot,name,full))
        for constraint in snapshot['models'][name]['constraints']:
            unique=re.match(r'@@unique\(\[([^\]]+)\]',constraint)
            if unique:lines.append(f'note bottom of T_{name} : Unique together: {unique[1]}')
    count=0
    selected=[r for r in snapshot['relations'] if r['from'] in names and r['to'] in names and (full or r['from'] in OWNER_SCOPE[title])]
    for relation in selected:
        parent='|o' if relation['optional'] else '||'
        child='o|' if relation['unique'] else 'o{'
        identifying=set(relation['keys'])<=primary_keys(snapshot['models'][relation['from']])
        link='--' if identifying else '..'
        label=relation['field']
        parallel=sum(r['from']==relation['from'] and r['to']==relation['to'] for r in selected)>1
        lines.append(f'T_{relation["to"]} {parent}{link}{child} T_{relation["from"]}'+(' : '+label if parallel else ''))
        count+=1
    scope='Complete physical schema, including retained legacy tables.' if full else 'Focus: '+', '.join(sorted(OWNER_SCOPE[title]))+'. Other references are in the full ERD.'
    lines.extend(['legend bottom','  PK = primary key; FK = foreign key; UQ = unique key',
                  '  * = mandatory attribute; ? = nullable type',
                  '  Solid = identifying relationship; dashed = non-identifying relationship',
                  '  '+scope,'endlegend','@enduml'])
    return '\n'.join(lines)+'\n',count


def conceptual():
    return '''@startuml
title Conceptual model - Sports Center Management System
left to right direction
hide circle
skinparam linetype ortho
entity User
entity Role
entity Permission
entity RolePermission
entity Course
entity Session
entity Enrollment
entity Invoice
entity Payment
entity Refund
entity Attendance
entity SessionFeedback
entity CourseSummary
entity MemberResult
entity CourseRating
Role ||--o{ User
Role ||--o{ RolePermission
Permission ||--o{ RolePermission
User ||--o{ Enrollment
Course ||--o{ Enrollment
Course ||--o{ Session
Enrollment |o--o| Invoice : current purchase
Invoice ||--o{ Payment
Invoice |o--o{ Refund
Session ||--o{ Attendance
Session ||--o{ SessionFeedback
Course ||--o| CourseSummary
CourseSummary ||--o{ MemberResult
Course ||--o{ CourseRating
User ||--o{ CourseRating
legend bottom
  Conceptual entities summarize the current course-based business.
  Refer to the physical ERD for nullable links, foreign keys and retained legacy models.
endlegend
@enduml
'''
