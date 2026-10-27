"""Read the public IRSDK shared mapping, retaining only CarSetup and car identity.

No process handle, injection, remote-control message or target write. Header layout:
https://github.com/meltingice/node-iracing/blob/master/lib/irsdk_defines.h
(iRacing-authored SDK header mirrored in that repository).
"""
import argparse,ctypes,hashlib,json,pathlib,re,struct,sys,time,uuid
from ctypes import wintypes

def block(text,key):
 match=re.search(r'(?m)^'+re.escape(key)+r':\s*\r?\n',text)
 if not match:return None
 end=re.search(r'(?m)^[A-Za-z][A-Za-z0-9_]*:',text[match.end():])
 return text[match.start():match.end()+end.start() if end else len(text)]
def scalar(raw):
 # Preserve formatted SDK numbers and units as strings, without guessing types.
 if raw.startswith('"') and raw.endswith('"'):
  return json.loads(raw)
 if raw.startswith("'") and raw.endswith("'"):
  return raw[1:-1].replace("''", "'")
 if raw.startswith(('*','&','!','|','>','[','{')):raise ValueError('CarSetup scalar outside explicit mapping subset')
 return raw
def parse_mapping(section):
 result={};stack=[(-1,result)]
 for line in section.splitlines()[1:]:
  if not line.strip() or line.strip() in ('---','...'):continue
  match=re.fullmatch(r'( *)([A-Za-z][A-Za-z0-9_]*):(?: (.*))?',line)
  if not match:raise ValueError('CarSetup YAML outside explicit mapping subset')
  indent=len(match[1]);key=match[2];value=match[3]
  while stack[-1][0]>=indent:stack.pop()
  parent=stack[-1][1]
  if key in parent:raise ValueError('Duplicate CarSetup YAML key')
  if value is None or value=='':parent[key]={};stack.append((indent,parent[key]))
  else:parent[key]=scalar(value)
 return result
def field(text,key):
 match=re.search(r'(?m)^ +'+re.escape(key)+r': (.*)$',text or '')
 return scalar(match[1]) if match else None
def capture_session(report):
 k=ctypes.WinDLL('kernel32',use_last_error=True)
 k.OpenFileMappingW.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.LPCWSTR];k.OpenFileMappingW.restype=wintypes.HANDLE
 k.MapViewOfFile.argtypes=[wintypes.HANDLE,wintypes.DWORD,wintypes.DWORD,wintypes.DWORD,ctypes.c_size_t];k.MapViewOfFile.restype=ctypes.c_void_p
 k.UnmapViewOfFile.argtypes=[ctypes.c_void_p];k.UnmapViewOfFile.restype=wintypes.BOOL
 k.CloseHandle.argtypes=[wintypes.HANDLE];k.CloseHandle.restype=wintypes.BOOL
 class MBI(ctypes.Structure):
  _fields_=[('BaseAddress',ctypes.c_void_p),('AllocationBase',ctypes.c_void_p),('AllocationProtect',wintypes.DWORD),
            ('RegionSize',ctypes.c_size_t),('State',wintypes.DWORD),('Protect',wintypes.DWORD),('Type',wintypes.DWORD)]
 k.VirtualQuery.argtypes=[ctypes.c_void_p,ctypes.POINTER(MBI),ctypes.c_size_t];k.VirtualQuery.restype=ctypes.c_size_t
 handle=None;view=None
 try:
  handle=k.OpenFileMappingW(4,False,report['mapping'])
  if not handle:raise ctypes.WinError(ctypes.get_last_error())
  view=k.MapViewOfFile(handle,4,0,0,0)
  if not view:raise ctypes.WinError(ctypes.get_last_error())
  region=MBI()
  if not k.VirtualQuery(view,ctypes.byref(region),ctypes.sizeof(region)):raise ctypes.WinError(ctypes.get_last_error())
  available=region.RegionSize-(view-region.BaseAddress)
  if available<24:raise ValueError('SDK mapping too short')
  def header():return struct.unpack('<6i',ctypes.string_at(view,24))
  stable=False
  for attempt in range(3):
   first=header();ver,status,rate,update,length,offset=first
   if not 1<=ver<=4 or not status&1:raise ValueError('SDK session not connected or unsupported version')
   if not 0<length<=4*1024*1024 or offset<24 or offset+length>min(available,8*1024*1024):raise ValueError('SDK session-info bounds rejected')
   raw=ctypes.string_at(view+offset,length)
   if first==header():stable=True;break
  if not stable:raise ValueError('SDK session info changed while reading')
  text=raw.split(b'\0',1)[0].decode('cp1252')
  section=block(text,'CarSetup')
  if not section:raise ValueError('CarSetup absent from current SDK session info')
  setup=parse_mapping(section)
  info=block(text,'DriverInfo') or '';idx=field(info,'DriverCarIdx')
  driver_match=re.search(r'(?m)^ *- CarIdx: '+re.escape(str(idx))+r'\s*\r?\n',info)
  driver=''
  if driver_match:
   tail=info[driver_match.end():];end=re.search(r'(?m)^ *- CarIdx:',tail)
   driver=tail[:end.start()] if end else tail
  identity={key:value for key in ['CarPath','CarScreenName','CarID'] if (value:=field(driver,key)) is not None}
  identity.update({key:value for key in ['DriverCarIdx','DriverCarScreenName','DriverCarShortName'] if (value:=field(info,key)) is not None})
  selected=dict(schemaVersion=1,source='iRacing SDK sessionInfo.CarSetup',
                observed_at_utc=report['observed_at_utc'],session_info_update=update,
                car=identity,track=field(block(text,'WeekendInfo'),'TrackName'),setup=setup)
  return selected,section,ver
 finally:
  if view:k.UnmapViewOfFile(view)
  if handle:k.CloseHandle(handle)

def leaves(value):
 return sum(leaves(v) for v in value.values()) if isinstance(value,dict) else 1

def main(argv=None):
 parser=argparse.ArgumentParser(description='Capture public SDK CarSetup in a NEW private directory, without overwriting earlier evidence.')
 parser.add_argument('--output-dir',type=pathlib.Path,help='New directory for this capture; an existing directory is rejected before accessing the SDK.')
 args=parser.parse_args(argv)
 root=pathlib.Path(__file__).resolve().parent
 stamp=time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())
 out=args.output_dir if args.output_dir is not None else root/'private-reference'/'runtime-garage-sdk'/(stamp+'-'+uuid.uuid4().hex[:12])
 try:
  out.mkdir(parents=True,exist_ok=False)
 except OSError as exc:
  print('Capture directory must be new: '+str(exc),file=sys.stderr)
  return 2
 report=dict(authority='observed public iRacing SDK sessionInfo snapshot',read_only=True,
  observed_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),mapping='Local\\IRSDKMemMapFileName',
  privacy_scope='Only CarSetup and selected vehicle/track identity are retained; no driver names or account IDs',
  limitations=['SDK output is a snapshot, not recovered CML/metadata or a numeric STO binding',
               'No evidence that modified garage controls are applied unless corroborated',
               'No target process memory or keys read'])
 try:
  selected,section,ver=capture_session(report)
  data=json.dumps(selected,indent=2,ensure_ascii=False).encode('utf-8')
  snapshot=out/'car-setup-snapshot.json'
  with snapshot.open('xb') as stream:stream.write(data)
  with (out/'car-setup-source.yaml').open('x',encoding='utf-8') as stream:stream.write(section)
  report.update(status='captured',sdk_version=ver,session_info_update=selected['session_info_update'],stable_header=True,
                car=selected['car'],track=selected['track'],setup_top_level_keys=list(selected['setup']),
                setup_leaf_count=leaves(selected['setup']),snapshot_path=str(snapshot),
                snapshot_sha256=hashlib.sha256(data).hexdigest())
 except (OSError,ValueError,AttributeError) as exc:
  report.update(status='unavailable',error=str(exc))
 with (out/'capture-report.json').open('x',encoding='utf-8') as stream:
  json.dump(report,stream,indent=2)
 print(json.dumps(report,indent=2))
 return 0 if report['status']=='captured' else 2

if __name__=='__main__':
 sys.exit(main())
