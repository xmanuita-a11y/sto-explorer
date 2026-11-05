"""Reject private identifiers, paths and research artifacts in release inputs."""
from pathlib import Path
import re,subprocess
root=Path(__file__).resolve().parent
names=set(subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines())
names.update(p.name for p in root.glob('test_*.cjs'))
names.update(['run_tests.py','verify_release.py','TODO.md'])
patterns=[r'(?i)\b(?:member|customer|cust|account)[_-]?id\b\s*[=:]\s*["\x27]?\d+',r'(?i)[A-Z]:[\\/](?:Users|AI-Shared)[\\/]',r'/(?:home|root|workspace|workbench)/',r'(?i)\b(?:access_token|refresh_token)\b\s*[=:]\s*["\x27][A-Za-z0-9_-]{12,}',r'(?i)\b(?:baselinee|RYCO|TCSP_|Garage 61)\b']
errors=[]
for name in sorted(names):
 p=root/name
 if not p.is_file() or p.name=='verify_release.py':continue
 if p.suffix.lower() in ('.sto','.dmp','.dat') or 'native-sources/' in name:errors.append(name+': private artifact')
 text=p.read_text(encoding='utf-8')
 for pattern in patterns:
  if re.search(pattern,text):errors.append(name+': forbidden release content')
if errors:raise SystemExit('\n'.join(errors))
print('PASS: release privacy scan')
