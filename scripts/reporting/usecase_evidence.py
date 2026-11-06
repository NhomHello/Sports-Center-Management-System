"""Check every UC against declared operations and mounted API routes."""
import re
from pathlib import Path
from openpyxl import Workbook
from catalog import CASES
from usecase_bindings import BINDINGS, EXTRA, NOTES
from new_plan import tab

ROOT=Path(__file__).resolve().parents[2]


def path_for(source):
    return source if source.startswith('core/') else 'core/be/src/modules/'+source


def declaration(source,symbol):
    text=(ROOT/source).read_text()
    pattern=r'export\s+(?:default\s+)?(?:(?:async\s+)?function|const|class)\s+'+re.escape(symbol)+r'\b'
    match=re.search(pattern,text)
    assert match,(source,symbol,'missing declaration')
    return text.count('\n',0,match.start())+1


def review(inventory):
    assert set(BINDINGS)=={c['id'] for c in CASES},'UC binding coverage mismatch'
    routes={method+' '+path:source for method,path,_,source in inventory}
    rows=[]
    for case in CASES:
        symbols,operations=BINDINGS[case['id']]
        refs=[]
        for symbol in symbols.split():
            source=path_for(case['source']);line=declaration(source,symbol)
            refs.append(f'{source}:{line} · {symbol}')
        for source,symbol in EXTRA.get(case['id'],[]):
            source=path_for(source);line=declaration(source,symbol)
            refs.append(f'{source}:{line} · {symbol}')
        endpoints=operations.split('; ') if operations else []
        assert all(op in routes for op in endpoints),(case['id'],[op for op in endpoints if op not in routes])
        if case['id']=='UC-PAY-04':
            assert 'startInvoiceExpiryWorker()' in (ROOT/'core/be/src/server.js').read_text()
        if case['id']=='UC-CB-13':
            assert 'startClassEventWorker()' in (ROOT/'core/be/src/server.js').read_text()
        if case['id']=='UC-UM-11':
            assert 'logout: () => set(' in (ROOT/'core/fe/src/stores/authStore.js').read_text()
        rows.append(dict(id=case['id'],title=case['title'],actors=case['actors'],operations=endpoints,
                         references=refs,routeSources=sorted({routes[op] for op in endpoints}),
                         note=NOTES.get(case['id'],'Endpoint và hàm xử lý có trong mã nguồn; quyền/phạm vi được mô tả trong đặc tả.'),
                         check='Đã đối chiếu tĩnh với code'))
    return rows


def write(rows):
    book=Workbook();book.remove(book.active)
    tab(book,'Use case - Code',['UC','Chức năng','Vai trò','Endpoint / kích hoạt','Hàm triển khai','Router nguồn','Kết quả đối chiếu','Ghi chú'],[
        [r['id'],r['title'],r['actors'],'\n'.join(r['operations']) or 'Frontend/tác vụ nền; xem ghi chú',
         '\n'.join(r['references']),'\n'.join(r['routeSources']),r['check'],r['note']] for r in rows],
        {1:18,2:55,3:45,4:90,5:115,6:85,7:32,8:110})
    tab(book,'Phuong phap',['Mục','Ý nghĩa'],[
        ['Đối chiếu','Kiểm tra từng UC có hàm khai báo thật và đường dẫn được router tổng mount. Tác vụ nền và đăng xuất frontend được ghi riêng.'],
        ['Phạm vi','Đây là bằng chứng triển khai tĩnh, không phải kết quả chạy nghiệm thu mọi ngoại lệ. Các UC dùng chung endpoint được ghi rõ.'],
        ['Bổ sung','UC-CB-23: loại phòng; UC-CB-24: khung giờ; UC-UM-26: Tổng quan. Các chức năng này có code nhưng thiếu mục riêng trong bản trước.'],
    ],{1:35,2:140})
    dest=ROOT/'docs/yeu-cau/SWP391_DoiChieuUseCaseCode.xlsx';book.save(dest)
    return dest
