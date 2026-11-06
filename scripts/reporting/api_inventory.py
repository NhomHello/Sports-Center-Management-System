"""Read API operations from mounted routers, including catalog factories."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def api_inventory():
    routes=ROOT/'core/be/src/routes.js'
    text=routes.read_text()
    imports=dict(re.findall(r"import\s+(\w+)\s+from\s+'([^']+)'",text))
    mounts=[]
    for m in re.finditer(r"router\.use\((?:'([^']+)',\s*)?(\w+)\)",text):
        prefix,symbol=m.groups()
        if symbol not in imports:continue
        path=(routes.parent/imports[symbol]).resolve()
        if path.name=='retired-membership.routes.js':continue
        mounts.append((prefix or '',path))
    health=re.search(r"HEALTH_PATH\s*=\s*'([^']+)'",(ROOT/'core/be/src/constants/index.js').read_text())
    if health and 'healthRoutes' in imports:
        mounts.append((health.group(1),(routes.parent/imports['healthRoutes']).resolve()))
    # This module exports two named routers rather than a default router.
    mounts.extend([('/reconciliations',ROOT/'core/be/src/modules/reconciliation/reconciliation.routes.js'),('/refunds',ROOT/'core/be/src/modules/reconciliation/reconciliation.routes.js')])
    rows=[]
    for prefix,path in mounts:
        body=path.read_text()
        if 'export default createCatalogRouter(' in body:
            permissions=dict(re.findall(r'(read|create|update|delete):\s*P\.([A-Z_]+)',body))
            template=(ROOT/'core/be/src/modules/catalog/catalog.routes.js').read_text()
            for method,route,key in re.findall(r"router\.(get|post|put|delete)\(\s*'([^']+)',\s*authorize\(permissions\.(\w+)\)",template):
                rows.append((method.upper(),(prefix+route).rstrip('/'),permissions[key],str(path.relative_to(ROOT))))
            continue
        matches=list(re.finditer(r"(\w+)\.(get|post|put|patch|delete)\(\s*'([^']+)'",body))
        for i,m in enumerate(matches):
            symbol,method,route=m.groups()
            if prefix=='/reconciliations' and symbol!='reconciliationRoutes':continue
            if prefix=='/refunds' and symbol!='refundRoutes':continue
            full=(prefix+route).rstrip('/') or '/'
            if full.startswith(('/memberships','/membership-plans')):continue
            block=body[m.end():matches[i+1].start() if i+1<len(matches) else len(body)]
            perms=list(dict.fromkeys(re.findall(r'(?:P|PERMISSIONS)\.([A-Z_]+)',block)))
            rows.append((method.upper(),full,', '.join(perms) or 'Xem middleware chung/service',str(path.relative_to(ROOT))))
    return sorted(set(rows))
