"""Isolated builder checks; never overwrite the workspace HTML or inspect real STOs."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent
files = [
    'build_sto_reader.py', 'sto_static_i18n.py', 'sto-app.json',
    'sto-reader-ui.html.in', 'sto-locales-en.json', 'sto-reader-i18n.js',
    'sto-reader-core.js', 'sto-reader-presentation.js', 'sto-reader-garage.js',
    'sto-reader-ui.js', 'sto-reader-material.json', 'sto-demo-data.json',
    'sto-garage-demo-data.json', 'sto-native-generator-extra.js',
    'sto-native-generator.js', 'sto-native-formatter.js', 'sto-native-renderer.js',
    'sto-native-garage.js', 'sto-native-garage-catalog.json', 'sto-sdk-garage.js',
]
scratch = root/'tmp'
scratch.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='sto-native-build-', dir=scratch) as directory:
    target = Path(directory)
    for name in files:
        shutil.copyfile(root/name, target/name)
    def build():
        return subprocess.run([sys.executable, str(target/'build_sto_reader.py')],
                              cwd=target, text=True, capture_output=True)
    result = build()
    assert result.returncode == 0, result.stderr
    html = (target/'STO_Reader_Offline.html').read_text(encoding='utf-8')
    assert 'const StoNativeGarage=' in html and 'const StoNativeRenderer=' in html
    assert 'const STO_NATIVE_GARAGE_CATALOG = {"schemaVersion": 1, "profiles": []};' in html
    node = shutil.which('node')
    assert node, 'Node.js required for inline script syntax check'
    check = subprocess.run([node, '-e',
        "const fs=require('fs'),vm=require('vm');const html=fs.readFileSync(process.argv[1],'utf8');"
        "for(const s of html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi))new vm.Script(s[1]);",
        str(target/'STO_Reader_Offline.html')], text=True, capture_output=True)
    assert check.returncode == 0, check.stderr
    # Source proof is required even before a future profile can be embedded.
    source = target/'fixture-source.txt'
    source.write_bytes(b'synthetic source only')
    catalog_path = target/'sto-native-garage-catalog.json'
    catalog = {'schemaVersion': 1, 'profiles': [{'sources': [
        {'path': source.name, 'sha256': '0'*64}]}]}
    catalog_path.write_text(json.dumps(catalog), encoding='utf-8')
    assert build().returncode != 0, 'Source digest mismatch accepted'
    catalog['profiles'][0]['sources'][0]['sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
    catalog['profiles'][0]['sources'][0]['path'] = '../outside-workspace.txt'
    catalog_path.write_text(json.dumps(catalog), encoding='utf-8')
    assert build().returncode != 0, 'Source path traversal accepted'
print('PASS isolated native-module build, inline syntax, empty catalog, source digest and path boundary checks; no workspace HTML regenerated')
