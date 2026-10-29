"""Task-to-file navigation; file history is evidence of change, not proof of task completion."""
import glob
from evidence import ROOT, git

# Each pair is an implemented module and its corresponding React page family.
SOURCES={
 'UC-UM-11':('auth','auth'), 'UC-UM-09':('user','system/users'), 'UC-UM-18':('role','system/roles'),
 'UC-UM-01':('auth','auth'), 'UC-UM-13':('auth','member'), 'UC-UM-02':('member','member'),
 'UC-UM-03':('membership','membership'), 'UC-UM-05':('member','members'), 'UC-UM-06':('member','members'),
 'UC-UM-14':('member','members'), 'UC-UM-19':('member','members'), 'UC-UM-07':('payment','membership'),
 'UC-UM-08':('membership-plan','membership'), 'UC-UM-16':('setting','system/settings'),
 'UC-UM-17':('notification','member'), 'UC-UM-12':('auth','auth'), 'UC-UM-04':('payment','payments'),
 'UC-UM-10':('membership','membership'), 'UC-UM-15':('audit','system/audit'),
 'UC-UM-20':('membership','membership'), 'UC-UM-22':('profile','profiles'), 'UC-UM-23':('profile','profiles'),
 'UC-UM-24':('profile','profiles'), 'UC-UM-25':('profile','profiles'),
 'UC-CB-01':('subject','schedule'), 'UC-CB-14':('room','schedule'), 'UC-CB-02':('class','schedule'),
 'UC-CB-03':('class','schedule'), 'UC-CB-04':('class','schedule'), 'UC-CB-13':('class','schedule'),
 'UC-CB-05':('class','schedule'), 'UC-CB-15':('class','schedule'), 'UC-CB-17':('class','schedule'),
 'UC-CB-06':('class','schedule'), 'UC-CB-07':('class','schedule'), 'UC-CB-09':('class','schedule'),
 'UC-CB-10':('class','schedule'), 'UC-CB-16':('schedule','schedule'), 'UC-CB-11':('schedule','schedule'),
 'UC-CB-12':('class','schedule'), 'UC-CB-18':('class','schedule'), 'UC-CB-19':('class','schedule'), 'UC-CB-20':('class','schedule'),
 'UC-PAY-01':('payment','payments'), 'UC-PAY-02':('payment','payments'), 'UC-PAY-04':('payment','payments'),
 'UC-PAY-05':('payment','payments'), 'UC-PAY-06':('payment','payments'), 'UC-PAY-07':('payment','payments'),
 'UC-PAY-08':('payment','payments'), 'UC-PAY-09':('reconciliation','reconciliation'),
 'UC-PAY-10':('payment','payments'), 'UC-PAY-11':('reconciliation','reconciliation'),
 'UC-PAY-12':('reconciliation','reconciliation'), 'UC-PAY-13':('reconciliation','reconciliation'),
 'UC-PAY-14':('reconciliation','reconciliation'),
 'UC-AT-01':('attendance','schedule'), 'UC-AT-02':('attendance','schedule'), 'UC-AT-03':('attendance','member'),
 'UC-TR-05':('course-summary','courses'), 'UC-TR-06':('course-summary','courses'), 'UC-TR-07':('course-summary','courses'),
 'UC-RPT-01':('report','reports'), 'UC-RPT-02':('report','reports'), 'UC-RPT-03':('course-summary','courses'), 'UC-RPT-04':('report','reports'),
}


def rows(tasks):
    cache={}
    for task in tasks:
        module,pages=SOURCES.get(str(task['uc']),('',''))
        if task['type']=='FE' and pages:
            pattern=f'core/fe/src/pages/{pages}/*.jsx'
        elif module:
            pattern=f'core/be/src/modules/{module}/*.service.js'
        elif 'Kiểm thử' in str(task['uc']):
            pattern='tests/e2e/sprint4*.spec.mjs' if task['id'].startswith('S4') else 'tests/e2e/sprint3*.spec.mjs'
        elif task['id']=='S4-00':
            pattern='core/be/prisma/schema.prisma'
        else:
            pattern='docs/yeu-cau/*.docx' if task['uc']=='Tài liệu' else 'package.json'
        files=sorted(glob.glob(pattern,root_dir=ROOT))
        if not files:
            yield [task['id'],task['uc'],task['owner'],'','','Chưa tìm thấy file theo nhóm UC; cần kiểm tra thủ công']
            continue
        key=tuple(files)
        if key not in cache:
            cache[key]=git('log','main','--no-merges','-5','--format=%H','--',*files).splitlines()
        yield [task['id'],task['uc'],task['owner'],'\n'.join(files),'\n'.join(cache[key]),'Lịch sử chạm file trong nhóm UC; mở diff và hàm cụ thể trước khi xác nhận task. Không tự suy ra tác giả hay trạng thái Done.']
