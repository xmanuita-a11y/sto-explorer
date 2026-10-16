'use strict';
// Synthetic profiles and application-state DOM double; no vehicle catalog/runtime proof.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const garage=require('./sto-native-garage.js');
let cases=0;const check=(title,fn)=>{fn();cases++;console.log('PASS '+title);};
const c=(tag,value)=>({tag,value});
const profile={id:'synthetic-only',verified:true,identity:{car:'synthetic\\car',stoVersion:3,contentVersion:'1'},
 sources:['cml','metadata','unitMapping'].map(role=>({role,path:'synthetic-fixture-'+role+'.json',sha256:'a'.repeat(64)})),
 tokens:[{tag:'output',children:[c('pos','l=20,t=30,w=400,d=170'),c('tab',0),c('var','fixturePressure')]},
  {tag:'output',children:[c('pos','t+25'),c('var','simulatorOnly')]}],
 records:[{name:'fixturePressure',type:0,attributes:{ce:100000,oe:0,fe:'%.2f bar',cm:1000,om:0,fm:'%.1f kPa'}},
  {name:'simulatorOnly',type:0,attributes:{ce:1,oe:0,fe:'%.1f'}}],
 unitSelectors:{metric:0,imperial:1},pages:{all:0,tires:0,chassis:1},runtime:{editingEnabled:false}};
const catalog={schemaVersion:1,profiles:[profile]};
const setup={car:'synthetic\\car',version:3,contentVersion:'1',entries:[{name:'fixturePressure',value:'150000',line:7}],unparsed:[],name:'synthetic.sto'};
const options={units:'metric',page:'all'};
check('distributed catalog is empty and exact identity is required',()=>{
 assert.deepEqual(require('./sto-native-garage-catalog.json'),{schemaVersion:1,profiles:[]});
 assert.equal(garage.selectProfile(catalog,setup).status,'selected');
 for(const changed of [{car:'other'},{version:4},{contentVersion:'2'},{contentVersion:1}])
  assert.equal(garage.selectProfile(catalog,{...setup,...changed}).code,'no-profile');
 assert.equal(garage.selectProfile({...catalog,profiles:[profile,{...profile,id:'second'}]},setup).code,'ambiguous-profile');
});
check('profile evidence, units, identity and duplicate records must be explicit',()=>{
 for(const changed of [{verified:false},{sources:[]},{unitSelectors:{metric:0}},{pages:{}},{records:[profile.records[0],profile.records[0]]},
  {sources:profile.sources.map(s=>({...s,path:'../outside'}))}])
  assert.equal(garage.selectProfile({...catalog,profiles:[{...profile,...changed}]},setup).code,'invalid-catalog');
 assert.equal(garage.render(null,setup,options).code,'invalid-catalog');
});
check('exact entry binding applies explicit unit mapping and missing outputs stay missing',()=>{
 const result=garage.render(catalog,setup,options);assert.equal(result.status,'rendered');
 assert.match(result.page.html,/1\.50 bar/);assert.match(result.page.html,/data-status="unavailable"/);
 assert.equal(result.page.diagnostics.length,1);assert.equal(result.page.diagnostics[0].variable,'simulatorOnly');
 assert.match(garage.render(catalog,setup,{...options,units:'imperial'}).page.html,/150\.0 kPa/);
 const bindings=garage.bindEntries(profile,setup.entries);
 assert.equal(bindings.get('fixturePressure').source.line,7);assert.equal(bindings.has('simulatorOnly'),false);
 assert.equal(result.complete,false);
});
check('duplicates, nonfinite values, unknown fields and unparsed rows fail closed',()=>{
 for(const entries of [[...setup.entries,...setup.entries],...['','Infinity','NaN','0x10','1e3','9'.repeat(400)].map(value=>[{name:'fixturePressure',value}]),
  [{name:'differentName',value:'1'}]])
  assert.equal(garage.render(catalog,{...setup,entries},options).code,'invalid-setup-or-profile');
 assert.equal(garage.render(catalog,{...setup,unparsed:[{line:1,text:'?'}]},options).code,'unparsed-setup');
});
check('raw, comparisons, filters, unsupported controls and unmapped tabs use declared fallback',()=>{
 for(const changed of [{comparing:true},{filtered:true}])assert.equal(garage.render(catalog,setup,{...options,...changed}).code,'reference-mode');
 assert.equal(garage.render(catalog,setup,{...options,units:'raw'}).code,'raw-mode');
 assert.equal(garage.render(catalog,setup,{...options,page:'unknown'}).code,'unmapped-view');
 const bad={...catalog,profiles:[{...profile,tokens:[{tag:'unknown'}]}]};
 assert.equal(garage.render(bad,setup,options).code,'unsupported-controls');
});
check('main UI routes single unfiltered setup and visibly falls back on invalid catalog',()=>{
 class Element{
  constructor(){this.children=[];this.listeners={};this.attributes={};this.value='';this.checked=false;this.textContent='';this.classList={add(){},remove(){}};this.parentElement=this;}
  setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
  append(child){this.children.push(child);}replaceChildren(){this.children=[];}
  addEventListener(type,fn){this.listeners[type]=fn;}
 }
 const elements=new Map();
 const document={documentElement:{},querySelectorAll(){return [];},createElement(){return new Element();},getElementById(id){if(!elements.has(id)){const e=new Element();if(id==='units')e.value='metric';elements.set(id,e);}return elements.get(id);}};
 const context=vm.createContext({document,Map,Set,console,TextDecoder,Uint8Array,DataView});
 vm.runInContext('const STO_EN_CATALOG='+JSON.stringify(require('./sto-locales-en.json'))+';',context);
 for(const file of ['sto-reader-i18n.js','sto-reader-core.js','sto-reader-presentation.js','sto-reader-garage.js',
  'sto-native-generator-extra.js','sto-native-generator.js','sto-native-formatter.js','sto-native-renderer.js','sto-native-garage.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
 vm.runInContext('let STO_NATIVE_GARAGE_CATALOG='+JSON.stringify(catalog)+';',context);
 vm.runInContext(fs.readFileSync('sto-reader-ui.js','utf8'),context);
 vm.runInContext('state.a='+JSON.stringify(setup)+';renderGarage([]);',context);
 assert.equal(elements.get('garage-grid').className,'garage-grid garage-native');
 assert.match(elements.get('garage-grid').children[1].innerHTML,/1\.50 bar/);
 assert.match(elements.get('garage-caption').textContent,/profilo garage verificato/);
 elements.get('search').value='pressure';vm.runInContext('renderGarage([])',context);
 assert.doesNotMatch(elements.get('garage-grid').className,/garage-native/);assert.match(elements.get('garage-caption').textContent,/Confronto e filtri/);
 elements.get('search').value='';vm.runInContext('STO_NATIVE_GARAGE_CATALOG=null;renderGarage([])',context);
 assert.match(elements.get('garage-caption').textContent,/Impossibile usare/);
 assert.equal(elements.get('garage-grid').getAttribute('style'),'');
 vm.runInContext('STO_NATIVE_GARAGE_CATALOG='+JSON.stringify(catalog)+';state.b=state.a;renderGarage([])',context);
 assert.match(elements.get('garage-caption').textContent,/Confronto e filtri/);
 vm.runInContext('state.b=null;',context);elements.get('units').value='raw';vm.runInContext('renderGarage([])',context);
 assert.match(elements.get('garage-caption').textContent,/Valori originali/);
});
console.log(JSON.stringify({suite:'native-garage-profile',cases,synthetic:true,nativeExecution:false,browserExecution:false}));
