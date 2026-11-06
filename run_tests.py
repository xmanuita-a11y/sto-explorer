"""Public synthetic verification; no personal setup discovery."""
from pathlib import Path
import subprocess,sys,shutil
root=Path(__file__).resolve().parent
node=shutil.which('node')
if not node:raise SystemExit('Node.js 18+ required for tests')
subprocess.run([sys.executable,'build_sto_reader.py'],cwd=root,check=True)
for source in root.glob('sto-*.js'):
 subprocess.run([node,'--check',source.name],cwd=root,check=True)
for name in ('test_sto_synthetic.cjs','test_sto_presentation.cjs','test_sto_native_formatter.cjs','test_sto_native_renderer.cjs','test_sto_model_layout.cjs','test_release.cjs'):
 subprocess.run([node,name],cwd=root,check=True)
subprocess.run([sys.executable,'verify_release.py'],cwd=root,check=True)
print('PASS: build, script syntax, six regression suites and privacy checks')
