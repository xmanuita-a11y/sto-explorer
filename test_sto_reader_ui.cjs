// Application-state integration tests with a minimal DOM double.
// This is not a browser, screenshot or interactive usability test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class Element {
  constructor(){this.children=[];this.listeners={};this.attributes={};this.value='';this.checked=false;this.disabled=false;this.className='';this.textContent='';this.classList={add:()=>{},remove:()=>{}};}
  getAttribute(name){return this.attributes[name];}
  setAttribute(name,value){this.attributes[name]=value;}
  append(child){this.children.push(child);}
  replaceChildren(){this.children=[];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  async emit(type,event={}){await this.listeners[type](event);}
}
const validIds=new Set(Array.from(fs.readFileSync('STO_Reader_Offline.html','utf8').matchAll(/id="([^"]+)"/g),match=>match[1]));
const unescape=text=>text.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const staticElements=[...fs.readFileSync('STO_Reader_Offline.html','utf8').matchAll(/<\w+\b[^>]*\bdata-i18n(?:-attrs)?="[^>]*>/g)].map(match=>{const e=new Element();for(const a of match[0].matchAll(/([\w-]+)="([^"]*)"/g))e.attributes[a[1]]=unescape(a[2]);return e;});
const elements=new Map(),document={documentElement:{lang:'it'},querySelectorAll(selector){return staticElements.filter(e=>e.attributes[selector.slice(1,-1)]!==undefined);},getElementById(id){assert(validIds.has(id),'Missing HTML element: '+id);if(!elements.has(id)){const e=new Element();if(id==='originals')e.checked=true;if(id==='units')e.value='metric';if(id==='sort')e.value='group';elements.set(id,e);}return elements.get(id);},createElement(){return new Element();}};
const context=vm.createContext({document,crypto:require('node:crypto').webcrypto,TextDecoder,Uint8Array,DataView,Map,Set,console,atob:globalThis.atob});
const html=fs.readFileSync('STO_Reader_Offline.html','utf8');
// Every directly openable HTML must contain syntactically valid scripts.
// The build template has an .html.in suffix so it cannot masquerade as the app.
for(const filename of fs.readdirSync('.').filter(name=>name.endsWith('.html'))){
  const content=fs.readFileSync(filename,'utf8');
  for(const script of content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(script[1],{filename});
  assert(!content.includes('/* MATERIAL_PLACEHOLDER */'),filename+' is an unbuilt template');
}
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const {fixture,fieldNames}=require('./sto-test-fixtures.cjs');
const corpus={schemas:{publicNames:{ordered_names:fieldNames}}};
const source=fixture().bytes;
const file={name:'valid.sto',size:source.length,arrayBuffer:async()=>Uint8Array.from(source).buffer};
const $=id=>document.getElementById(id);
const load=(side,f)=>$('file-'+side).emit('change',{target:{files:[f]}});
async function main(){
  assert.equal($('view').value,'garage');
  await load('a',file);assert($('stats').textContent.includes('parametri visibili'));
  const garageCards=()=>$('garage-grid').children.filter(e=>e.className.startsWith('garage-card'));
  const descendants=e=>[e,...e.children.flatMap(descendants)];
  assert.equal($('garage-grid').hidden,false,'Garage is visible after first load');
  assert.equal($('tablebox').hidden,true);
  assert.equal($('garage-grid').children.filter(e=>e.className==='garage-car').length,0);
  for(const corner of ['lf','rf','lr','rr'])assert(garageCards().some(e=>e.className.includes('garage-'+corner)),'Missing corner '+corner);
  const singleValues=garageCards().flatMap(descendants).filter(e=>e.className==='garage-value');
  assert(singleValues.length>0);assert(singleValues.every(e=>e.children[0].textContent==='Setup A'));
  assert.equal($('overview').hidden,true,'Compact Garage omits duplicate wheel overview');
  assert(garageCards().flatMap(descendants).some(e=>e.className==='garage-details'));
  assert(garageCards().flatMap(descendants).filter(e=>e.className==='garage-label').every(e=>!e.textContent.includes('anteriore sinistra')));
  await $('garage-tires').emit('click');
  assert.equal(vm.runInContext('visibleRows().length',context),4);
  assert(vm.runInContext("visibleRows().every(r=>r.description.group==='Pneumatici')",context));
  assert.equal($('garage-tires').getAttribute('aria-pressed'),'true');
  assert(!vm.runInContext('csvContent()',context).includes('lfSpringRateNpm'));
  await $('garage-chassis').emit('click');
  assert(vm.runInContext("visibleRows().every(r=>r.description.group!=='Pneumatici')",context));
  $('view').value='table';await $('view').emit('change');
  assert.equal(vm.runInContext('visibleRows().length',context),9,'Garage page does not hide table fields');
  assert.equal($('garage-tools').hidden,true);assert.equal($('overview').hidden,false);
  $('view').value='garage';await $('view').emit('change');await $('reset').emit('click');
  assert.equal($('garage-all').getAttribute('aria-pressed'),'true');
  assert.equal(vm.runInContext('visibleRows().length',context),9);


  $('search').value='pressione';await $('search').emit('input');assert($('stats').textContent.startsWith('4 parametri'));
  $('group').value='Freni';await $('group').emit('change');assert.equal($('rows').children[0].children[0].textContent,'Nessun parametro corrisponde ai filtri.');
  await $('reset').emit('click');
  await load('b',file);assert($('stats').textContent.startsWith('0 diversi'));
  assert(garageCards().flatMap(descendants).some(e=>e.className==='garage-value'&&e.children[0].textContent==='Setup B'));
assert.equal($('diff-only').disabled,false);
  assert($('summary-title').textContent.includes('stesso file'));assert.equal($('wheels').children.length,4);assert.equal($('boot-error').hidden,true);
  $('diff-only').checked=true;await $('diff-only').emit('change');assert($('stats').textContent.endsWith('0 visibili'));
  await load('a',{name:'bad.sto',size:3,arrayBuffer:async()=>new ArrayBuffer(3)});
  assert($('meta-a').textContent.includes('Impossibile'));assert.equal($('diff-only').disabled,true);
  assert.equal(vm.runInContext('state.a',context),null); // failed replacement cannot leave old A active
  await $('swap').emit('click');assert($('meta-a').textContent.includes('valid.sto'));assert.equal(vm.runInContext('state.b',context),null);
  $('search').value='not_a_real_parameter';await $('search').emit('input');assert.equal($('rows').children[0].children[0].textContent,'Nessun parametro corrisponde ai filtri.');
  await $('clear-a').emit('click');assert.equal($('stats').textContent,'Apri un setup per iniziare.');
  let resolve;
  const pending=load('a',{name:'slow.sto',size:source.length,arrayBuffer:()=>new Promise(r=>resolve=r)});
  await $('clear-a').emit('click');resolve(Uint8Array.from(source).buffer);await pending;
  assert.equal(vm.runInContext('state.a',context),null); // cancelled read cannot resurrect cleared setup
  vm.runInContext("state.a={name:'=bad.csv',car:'test',entries:StoReader.parse('// <c>test</c>\\n100000 lfTireColdPressPa !\\n1.000000 sample !').entries,notes:'',text:'',unparsed:[]};state.b={...state.a,name:'other.sto',entries:StoReader.parse('// <c>test</c>\\n200000 lfTireColdPressPa !\\n1.000001 sample !').entries};render()",context);
  await $('reset').emit('click');
  assert($('stats').textContent.startsWith('2 diversi'));
  $('units').value='imperial';await $('units').emit('change');
  assert(vm.runInContext("visibleRows().some(r=>StoPresentation.format(r.a.value,r.description,units()).primary==='14,5 psi')",context));
  const csv=vm.runInContext('csvContent()',context);assert(csv.includes('Differenza originale B-A'));assert(csv.includes("'=bad.csv"));assert(csv.includes('0.000001'));
  $('group').value='Pneumatici';await $('group').emit('change');
  assert.equal(vm.runInContext('visibleRows().length',context),1);
  assert(!vm.runInContext('csvContent()',context).includes('"sample"'));
  await $('reset').emit('click');
  await $('swap').emit('click');assert(vm.runInContext("csvContent().includes('-100000')",context));
  await $('clear-a').emit('click');
  assert.equal(vm.runInContext('allRows().every(r=>r.status===\'single\' && !r.a && r.b)',context),true);
  await $('drop-a').emit('drop',{preventDefault(){},dataTransfer:{files:[file]}});
  assert(vm.runInContext('state.a.name',context)==='valid.sto');
  vm.runInContext("state.a.name='<img src=x onerror=alert(1)>';state.a.notes='Private notes <script>alert(1)</script>';state.b={...state.a,name:'B.sto',notes:'Other notes',tailSha256:'different'};render()",context);
  assert($('summary-detail').textContent.includes('Note: diverse'));
  let report=vm.runInContext('reportContent()',context);
  assert(!report.includes('<script'));assert(!report.includes('<img'));assert(report.includes('&lt;img'));assert(!report.includes('Private notes'));
  const material=JSON.parse(fs.readFileSync('sto-reader-material.json','utf8'));
  assert(!report.includes(material.key));assert(!report.includes(material.table));assert(!report.includes('crypto.subtle'));
  $('include-notes').checked=true;report=vm.runInContext('reportContent()',context);
  assert(report.includes('Private notes &lt;script&gt;'));assert(!report.includes('<script'));
  $('search').value='lfTire';await $('search').emit('input');
  report=vm.runInContext('reportContent()',context);assert(report.includes('lfTireColdPressPa'));assert(!report.includes('rfTireColdPressPa'));
  await $('reset').emit('click');
  const area=$('areas').children[0];await area.emit('click');assert($('group').value);
  await $('reset').emit('click');
  $('wheel-kind').value='SpringRateNpm';await $('wheel-kind').emit('change');assert.equal($('wheels').children.length,4);
  vm.runInContext("state.a.entries.push({...state.a.entries[0],occurrence:2,id:state.a.entries[0].name+'#2'});render()",context);assert($('notice').textContent.includes('ripetuti'));
  const hash=vm.runInContext('state.a.sha256',context),entry=vm.runInContext('state.a.entries[0].value',context);
  $('language').value='en';await $('language').emit('change');
  assert.equal(document.documentElement.lang,'en');assert.equal(vm.runInContext('state.a.sha256',context),hash);assert.equal(vm.runInContext('state.a.entries[0].value',context),entry);
  assert($('stats').textContent.includes('visible'));assert($('notice').textContent.includes('repeated'));
  assert(vm.runInContext("StoPresentation.describe('lfTireColdPressPa').label",context)==='Cold tire pressure · front left');
  assert(vm.runInContext("StoPresentation.format('100000',StoPresentation.describe('lfTireColdPressPa'),'imperial').primary",context)==='14.5 psi');
  assert(vm.runInContext('reportContent()',context).includes('lang="en"'));assert(vm.runInContext('csvContent()',context).includes('Original value A'));
  $('search').value='cold front';await $('search').emit('input');assert(vm.runInContext('visibleRows().length',context)>0);
  await load('b',{name:'broken.sto',size:3,arrayBuffer:async()=>new ArrayBuffer(3)});assert($('meta-b').textContent.includes('Unsupported file size'));
  await load('b',file);await $('reset').emit('click');
  context.corpusSchemas=corpus.schemas;
  vm.runInContext("for(const schema of Object.values(corpusSchemas))for(const name of schema.ordered_names){const d=StoPresentation.describe(name);T(d.group);StoPresentation.format('1',d);StoPresentation.delta('1','2',d,'metric');}",context);
  assert(staticElements.some(e=>e.textContent==='Why I built this tool'));
  assert(staticElements.some(e=>e.attributes.placeholder==='Pressure, front, spring, lfTire…'));
  const missing=vm.runInContext('[...StoI18n.missing]',context);assert.deepEqual(Array.from(missing),[],'Missing EN translations: '+JSON.stringify(missing));
  $('language').value='it';await $('language').emit('change');assert.equal(document.documentElement.lang,'it');assert($('stats').textContent.includes('visibili'));
  await $('check-browser').emit('click');assert($('check-status').textContent.includes('Decoder verificato'));assert.equal($('check-browser').disabled,false);
  await $('demo').emit('click');assert($('stats').textContent.startsWith('3 diversi'));assert($('stats').textContent.includes('1 solo in B'));assert(vm.runInContext('state.a.name',context).startsWith('Synthetic-'));
  $('view').value='garage';await $('view').emit('change');assert.equal($('tablebox').hidden,true);assert.equal($('garage-grid').hidden,false);assert($('garage-grid').children.length>=4);
  vm.runInContext("state.a.car='stockcars\\\\toyotacamry2022';state.b.car=state.a.car;render();for(const name of corpusSchemas.publicNames.ordered_names)StoGarage.explain(name,state.a.car)",context);
  $('language').value='en';await $('language').emit('change');
  vm.runInContext("for(const name of corpusSchemas.publicNames.ordered_names)StoGarage.explain(name,state.a.car)",context);
  assert.deepEqual(Array.from(vm.runInContext('[...StoI18n.missing]',context)),[]);
  assert($('garage-grid').children.some(card=>card.children[0].textContent.startsWith('Front left')));
  assert.equal(vm.runInContext("StoGarage.label('lfTireColdPressPa',StoPresentation.describe('lfTireColdPressPa'),referenceCar())",context),'Cold pressure');
  assert.equal(vm.runInContext("StoGarage.label('lfSpringRateNpm',StoPresentation.describe('lfSpringRateNpm'),referenceCar())",context),'Spring rate');
  assert.equal(vm.runInContext("StoGarage.label('lfPerchOffsetm',StoPresentation.describe('lfPerchOffsetm'),referenceCar())",context),'Shock collar offset');

  $('search').value='no_match';await $('search').emit('input');assert.equal($('garage-grid').children[0].textContent,'No parameters match the filters.');
  await $('reset').emit('click');assert.equal($('garage-grid').children.filter(e=>e.className==='garage-car').length,0);$('view').value='table';await $('view').emit('change');assert.equal($('tablebox').hidden,false);
  $('metric-check').checked=true;await $('metric-check').emit('change');assert.equal($('units').value,'metric');
  $('metric-check').checked=false;await $('metric-check').emit('change');assert.equal($('units').value,'imperial');
  $('units').value='raw';await $('units').emit('change');assert.equal($('metric-check').indeterminate,true);
  $('view').value='garage';await $('view').emit('change');
  await $('garage-demo').emit('click');
  assert.equal(vm.runInContext('state.a.entries.length',context),51);
  assert.equal(vm.runInContext('state.a.car',context),'stockcars\\toyotacamry2022');
  assert.equal(vm.runInContext('state.b',context),null);
  assert.equal($('garage-window').hidden,false);
  const lf=garageCards().find(e=>e.className.includes('garage-lf'));
  assert.equal(lf.children[1].className,'garage-output');
  assert.equal(lf.children[1].children[1].textContent,'—','Simulator corner weight stays unavailable');
  assert(lf.children.some(e=>e.attributes['data-parameter']==='lfSpringRateNpm'));
  await $('garage-tires').emit('click');
  const tireLF=garageCards().find(e=>e.className.includes('garage-lf'));
  assert.equal(tireLF.children[1].attributes['data-parameter'],'lfTireColdPressPa','Cold pressure precedes simulator outputs');
  assert.equal(tireLF.children[2].className,'garage-output');
  assert.equal(vm.runInContext('visibleRows().length',context),4);
  const originalNotes='Synthetic note <b>literal text</b>\nSecond line';
  const noted=fixture({notes:originalNotes}).bytes;
  await load('a',{name:'synthetic-notes.sto',size:noted.length,arrayBuffer:async()=>Uint8Array.from(noted).buffer});
  await $('garage-notes').emit('click');
  assert.equal($('garage-notes').getAttribute('aria-pressed'),'true');
  assert.equal($('garage-notes-content').hidden,false);assert.equal($('garage-grid').hidden,true);
  assert.equal($('garage-notes-content').children[1].textContent,originalNotes,'Notes use decoded setup text without interpreting HTML');
  assert.equal($('garage-notes-content').children[1].innerHTML,undefined);
  assert.equal(vm.runInContext('visibleRows().length',context),0,'Notes do not silently export chassis fields');
  await $('garage-chassis').emit('click');assert.equal($('garage-notes-content').hidden,true);assert.equal($('garage-grid').hidden,false);
  assert(/<button[^>]*class="garage-apply"[^>]*disabled/.test(html),'Apply remains disabled without the simulator');
  // Artificial SDK snapshot, distinct from the user's capture and screenshots.
  const sdkFixture={schemaVersion:1,source:'iRacing SDK sessionInfo.CarSetup',observed_at_utc:'2026-01-01T00:00:00Z',
    car:{CarPath:'stockcars toyotacamry2022',CarScreenName:'Synthetic SDK car'},track:'Synthetic SDK track',
    setup:{UpdateCount:'1',Tires:{LeftFront:{ColdPressure:' 17.25 kPa '}},Chassis:{Front:{NoseWeight:'41.23 %'},FrontArb:{Attach:'1'},LeftFront:{Camber:'+1.23 deg',UnknownField:'<img src=x>'}}}};
  const beforeSdk=vm.runInContext('JSON.stringify(state)',context);
  const importSdk=snapshot=>$('garage-sdk-file').emit('change',{target:{files:[{size:JSON.stringify(snapshot).length,text:async()=>JSON.stringify(snapshot)}]}});
  await importSdk(sdkFixture);
  assert.equal(vm.runInContext('garageSource',context),'sdk');assert.equal(vm.runInContext('JSON.stringify(state)',context),beforeSdk,'SDK never merges into STO state');
  assert.equal($('garage-metric').disabled,true);assert.equal($('units').disabled,true);assert.equal($('diff-only').disabled,true);assert.equal($('export').disabled,true);
  assert.equal($('garage-return-sto').hidden,false);assert($('garage-caption').textContent.includes('2026-01-01T00:00:00Z'));
  const sdkElements=()=>$('garage-grid').children.flatMap(descendants);
  assert(sdkElements().some(e=>e.className==='primary'&&e.textContent==='+1.23 deg'),'SDK angles use their supplied display strings');
  assert(sdkElements().some(e=>e.className==='primary'&&e.textContent==='<img src=x>'&&e.innerHTML===undefined),'SDK text is not interpreted as HTML');
  assert(sdkElements().some(e=>e.type==='checkbox'&&e.checked===true&&e.disabled===true),'SDK Attach is a disabled check control');
  await $('garage-tires').emit('click');
  assert(sdkElements().some(e=>e.className==='primary'&&e.textContent===' 17.25 kPa '),'SDK units and whitespace are preserved');
  await $('garage-notes').emit('click');assert(!$('garage-notes-content').children.some(e=>e.textContent===originalNotes),'SDK mode never presents STO notes as its own');
  await importSdk({...sdkFixture,source:'invalid source'});assert.equal($('garage-alert').hidden,false);assert.equal(vm.runInContext('garageSource',context),'sdk');
  await $('garage-return-sto').emit('click');assert.equal(vm.runInContext('garageSource',context),'sto');assert.equal(vm.runInContext('JSON.stringify(state)',context),beforeSdk);
  assert.equal($('units').disabled,false);assert.equal($('garage-metric').disabled,false);assert.equal($('garage-return-sto').hidden,true);
  await $('garage-notes').emit('click');assert.equal($('garage-notes-content').children[1].textContent,originalNotes);
  await $('garage-chassis').emit('click');
  await load('a',{name:'invalid.sto',size:3,arrayBuffer:async()=>new ArrayBuffer(3)});
  assert.equal($('garage-alert').hidden,false,'Load errors visible outside collapsed drawer');
  assert.equal($('garage-export').disabled,true);
  fs.writeFileSync('sto-i18n-test-results.json',JSON.stringify({languages:['it','en'],static_bindings:staticElements.length,parameter_names:483,missing_english_translations:Array.from(missing),preserves_loaded_setup:true,localizes_exports_errors_and_decimal_separator:true,actual_browser_test:false},null,2));
  console.log('PASS: load, identical comparison, difference filter, invalid replacement, swap, search, clear, cancelled asynchronous load. DOM double only.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
