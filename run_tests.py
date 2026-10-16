"""Run synthetic application checks without discovering personal setup files."""
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent
node = shutil.which('node')
if not node:
    raise SystemExit('Node.js 18+ is required for tests; the HTML needs only a browser.')
subprocess.run([sys.executable, 'build_sto_reader.py'], cwd=root, check=True)
for name in (
    'test_sto_synthetic.cjs', 'test_sto_presentation.cjs',
    'test_sto_garage.cjs', 'test_sto_reader_ui.cjs',
    'test_sto_native_formatter.cjs', 'test_sto_native_renderer.cjs',
    'test_sto_native_garage.cjs', 'test_sto_sdk_garage.cjs',
):
    subprocess.run([node, name], cwd=root, check=True)
subprocess.run([sys.executable, 'test_sto_native_build.py'], cwd=root, check=True)
print('PASS: 8 synthetic application suites and isolated build checks.')
