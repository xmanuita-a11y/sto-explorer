'use strict';
// Synthetic integration contracts. No original Camry definitions or simulator execution.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const renderer=require('./sto-native-renderer.js');
let cases=0;const check=(name,fn)=>{fn();cases++;console.log('PASS '+name);};
const c=(tag,value)=>({tag,value});
const numeric=name=>({name,type:0,attributes:{ce:1000,oe:0,fe:'%.1f kPa',cm:100000,om:0,fm:'%.2f bar'}});
const tokens=[{tag:'tabs',children:[c('tab0Name','Tires'),c('tab1Name','Chassis')]},
 {tag:'sectionTitle',children:[c('pos','l=20,t=10,w=400,h=20,d=170'),c('tab',0),c('text','LEFT <FRONT>')]},
 {tag:'spinInput',children:[c('pos','t=45'),c('text','Pressure & value'),c('var','fixtureLeft')]},
 {tag:'spinInput',children:[c('pos','l+440'),c('var','fixtureRight')]},
 {tag:'output',children:[c('pos','t+25'),c('var','missingOutput')]},
 {tag:'output',children:[c('tab',1),c('var','chassisOnly')]}];
const bindings=new Map([['fixtureLeft',{metadata:numeric('fixtureLeft'),state:{base:150000}}],
 ['fixtureRight',{metadata:numeric('fixtureRight'),state:{base:175000,alternate:180000,alternateActive:true}}]]);
const compiled=renderer.compile(tokens,{bindings,unitSelector:1,editingEnabled:true});
check('exact binding uses native formatter and preserves positions and selected state',()=>{
 assert.equal(compiled.supported,true);assert.equal(compiled.controls[1].formatted.text,'1.50 bar');
 assert.equal(compiled.controls[2].formatted.text,'1.80 bar');
 const page=renderer.renderHtml(compiled);
 assert.equal(page.renderedControls,4);assert.equal(page.width,860);assert.equal(page.height,90);
 assert.match(page.html,/left:215px;top:45px;width:172px;height:20px/);
 assert.match(page.html,/data-variable="fixtureRight"[^>]*data-value-slot="alternate"/);
 assert.equal(page.complete,false);
 assert.equal(page.diagnostics.filter(d=>d.status==='unavailable').length,1);
 assert.equal(page.diagnostics.filter(d=>d.status==='unresolved-assets').length,2);
 assert.doesNotMatch(page.html,/chassisOnly/);assert.match(renderer.renderHtml(compiled,{activeTab:1}).html,/chassisOnly/);
});
check('HTML escapes captions, variable names, reasons and unavailable marker',()=>{
 const r=renderer.renderHtml(compiled,{unavailableText:'<missing>'});
 assert.match(r.html,/LEFT &lt;FRONT&gt;/);assert.match(r.html,/Pressure &amp; value/);
 assert.match(r.html,/&lt;missing&gt;/);assert.doesNotMatch(r.html,/<missing>/);
 const special='<img src=x onerror="x">';
 const x=renderer.compile([{tag:'output',children:[c('var',special)]}],{bindings:new Map()});
 const html=renderer.renderHtml(x).html;
 assert.doesNotMatch(html,/<img/);assert.match(html,/&quot;x&quot;/);
});
check('missing state, mismatched metadata and unsupported formats stay unavailable',()=>{
 const incomplete=new Map(bindings);
 incomplete.set('fixtureLeft',{metadata:numeric('other'),state:{base:10}});
 incomplete.set('fixtureRight',{metadata:numeric('fixtureRight')});
 const r=renderer.compile(tokens,{bindings:incomplete});
 assert.equal(r.controls[1].formatted.status,'unavailable');assert.equal(r.controls[2].formatted.status,'unavailable');
 assert.throws(()=>renderer.compile(tokens,{bindings:{}}));
 const bad=new Map([['fixtureLeft',{metadata:{...numeric('fixtureLeft'),attributes:{ce:1,oe:0,fe:'%g'}},state:{base:1}}]]);
 const result=renderer.renderHtml(renderer.compile(tokens,{bindings:bad}));
 assert.equal(result.diagnostics[0].status,'unsupported');
 assert.doesNotMatch(result.html,/>0<\/div>/);
});
check('dropList branches route through control type six and eleven without guessed editing',()=>{
 const dropdown=[{tag:'dropList',children:[c('pos','l=20,t=40,w=400,h=20,d=170'),c('var','fixtureChoice')]}];
 const map=new Map([['fixtureChoice',{metadata:{name:'fixtureChoice',type:2,attributes:{min:2,max:4,se:'A\tB\tC'}},state:{base:2}}]]);
 const text=renderer.compile(dropdown,{bindings:map,nativeMode:1,resolvedInteractive:false});
 const interactive=renderer.compile(dropdown,{bindings:map,nativeMode:1,resolvedInteractive:true});
 assert.equal(text.controls[0].formatted.text,'C');assert.equal(interactive.controls[0].formatted.text,'A');
 assert.match(renderer.renderHtml(text).html,/left:194px;top:40px/);
 assert.match(renderer.renderHtml(interactive).html,/left:190px;top:40px/);
 assert.doesNotMatch(renderer.renderHtml(text).html,/sto-native-dropdown/);
 assert.match(renderer.renderHtml(interactive).html,/sto-native-dropdown/);
 assert.throws(()=>renderer.renderHtml(renderer.compile(dropdown,{bindings:map})));
});
check('partial compile and unresolved geometry never render as a complete page',()=>{
 assert.throws(()=>renderer.renderHtml({...compiled,supported:false}));
 assert.throws(()=>renderer.renderHtml(compiled,{activeTab:10}));
 assert.throws(()=>renderer.renderHtml(compiled,{width:NaN}));
 const bad={...compiled,controls:[{...compiled.controls[1],value:{x:0,y:0,width:-1,height:20}}]};
 assert.throws(()=>renderer.renderHtml(bad));
});
check('browser lexical modules work when inlined into a single script',()=>{
 const context=vm.createContext({});
 for(const name of ['sto-native-generator-extra.js','sto-native-generator.js','sto-native-formatter.js','sto-native-renderer.js'])
  vm.runInContext(fs.readFileSync(require.resolve('./'+name),'utf8'),context);
 vm.runInContext('const fixtureTokens='+JSON.stringify(tokens)+'; const fixtureBindings=new Map('+JSON.stringify([...bindings])+');',context);
 assert.equal(vm.runInContext('StoNativeRenderer.renderHtml(StoNativeRenderer.compile(fixtureTokens,{bindings:fixtureBindings,unitSelector:1})).html.includes("1.50 bar")',context),true);
});
console.log(JSON.stringify({suite:'native-html-renderer',cases,synthetic:true,nativeExecution:false,completeVehicleReplica:false}));
