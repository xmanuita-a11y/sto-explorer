"""Build a single offline HTML; decoder material is already extracted locally."""
import json
from pathlib import Path
import re
import hashlib
from sto_static_i18n import annotate

root = Path(__file__).resolve().parent
app = json.loads((root/'sto-app.json').read_text(encoding='utf-8'))
template, static_messages = annotate((root/'sto-reader-ui.html.in').read_text(encoding='utf-8').split('<script>')[0])
def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate translation key: '+key)
        result[key] = value
    return result

catalog = json.loads((root/'sto-locales-en.json').read_text(encoding='utf-8'), object_pairs_hook=unique_keys)
for source, translated in catalog.items():
    if set(re.findall(r'\{\w+\}', source)) != set(re.findall(r'\{\w+\}', translated)):
        raise ValueError('Translation placeholders do not match: '+source)
missing = sorted(source for source in static_messages if source not in catalog and source != '—')
if missing:
    raise ValueError('Missing English static translations: '+repr(missing))
i18n = 'const STO_EN_CATALOG = '+json.dumps(catalog, ensure_ascii=True)+';\n'+(root/'sto-reader-i18n.js').read_text(encoding='utf-8')
core = (root/'sto-reader-core.js').read_text(encoding='utf-8')
presentation = (root/'sto-reader-presentation.js').read_text(encoding='utf-8')
garage = (root/'sto-model-layout.js').read_text(encoding='utf-8') + '\n' + (root/'sto-model-groups.js').read_text(encoding='utf-8') + '\nconst STO_MODEL_GROUP_CATALOG = ' + json.dumps(json.loads((root/'sto-model-group-catalog.json').read_text(encoding='utf-8'))).replace('<', '\\u003c') + ';\n' + (root/'sto-reader-garage.js').read_text(encoding='utf-8')
ui = (root/'sto-reader-ui.js').read_text(encoding='utf-8')
native_catalog = json.loads((root/'sto-native-garage-catalog.json').read_text(encoding='utf-8'), object_pairs_hook=unique_keys)
if native_catalog.get('schemaVersion') != 1 or not isinstance(native_catalog.get('profiles'), list):
    raise ValueError('Invalid native garage catalog')
# Profiles must carry actual local source identities. No runtime network/file lookup.
for profile in native_catalog['profiles']:
    for record in profile.get('records', []):
        if record.get('_inferred') is True or record.get('_source') == 'inferred-from-patterns':
            raise ValueError('Inferred metadata cannot be embedded as a verified native profile')
    for source in profile.get('sources', []):
        source_path = (root/source['path']).resolve()
        if not source_path.is_relative_to(root) or not source_path.is_file():
            raise ValueError('Native profile source unavailable: '+source['path'])
        if hashlib.sha256(source_path.read_bytes()).hexdigest() != source['sha256']:
            raise ValueError('Native profile source SHA256 mismatch: '+source['path'])
native = '\n'.join((root/name).read_text(encoding='utf-8') for name in (
    'sto-native-generator-extra.js', 'sto-native-generator.js', 'sto-native-formatter.js',
    'sto-native-renderer.js', 'sto-native-garage.js', 'sto-sdk-garage.js', 'sto-native-export.js'))
native_catalog_js = json.dumps(native_catalog).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
material = json.loads((root/'sto-reader-material.json').read_text())
demo = json.loads((root/'sto-demo-data.json').read_text())
garage_demo = json.loads((root/'sto-garage-demo-data.json').read_text())
if garage_demo.get('synthetic') is not True:
    raise ValueError('Synthetic garage demo missing')
if demo.get('synthetic') is not True or len(demo.get('samples',[])) != 2:
    raise ValueError('Synthetic demo missing')
models = demo.get('models', [])
if len(models) != 3 or len({model.get('id') for model in models}) != len(models):
    raise ValueError('Three distinct synthetic model demos are required')
for model in models:
    if model.get('synthetic') is not True or len(model.get('samples', [])) != 2:
        raise ValueError('Invalid synthetic model comparison')
output = template.rsplit('</html>', 1)[0] + '<script>\n' + i18n + '\n' + core + '\n' + presentation + '\n' + garage + '\n' + native + '\nconst STO_NATIVE_GARAGE_CATALOG = '+native_catalog_js+';\nconst MATERIAL = ' + json.dumps(material) + ';\nconst STO_DEMO = '+json.dumps(demo)+';\nconst STO_GARAGE_DEMO = '+json.dumps(garage_demo)+';\n' + ui + '\n</script></html>\n'
if any(marker in output for marker in ('CORE_PLACEHOLDER', 'PRESENTATION_PLACEHOLDER', 'MATERIAL_PLACEHOLDER')):
    raise ValueError('Build incompleta: placeholder residui')
for source in ('STO Reader 0.4','STO READER 0.4','versione 0.4','version 0.4'):
    output = output.replace(source, source.replace('0.4', app['version']))
(root/'STO_Reader_Offline.html').write_text(output, encoding='utf-8', newline='\n')
print('Built STO_Reader_Offline.html')
