const $=id=>document.getElementById(id),T=StoI18n.t;
const resizeObservers=[];
const panes=[{setup:null,page:null,units:'metric',error:'',ticket:0},{setup:null,page:null,units:'metric',error:'',ticket:0}];
StoI18n.setLanguage('en');
function node(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
function action(text,handler){const b=node('button',text);b.type='button';b.addEventListener('click',handler);return b;}
function picker(index){$(index?'file-second':'file-main').click();}
function profileFor(setup){const selected=StoNativeGarage.selectProfile(STO_NATIVE_GARAGE_CATALOG,setup);return selected.status==='selected'?selected.profile:null;}
function rowsFor(setup){return setup.entries.map(entry=>({name:entry.name,a:entry,description:StoPresentation.describe(entry.name)}));}
function pagesFor(pane){
 const profile=profileFor(pane.setup);
 if(profile){const layout=profile.layouts?.garage;return Object.entries(layout?.pages||profile.pages).filter(([slug])=>slug!=='all').map(([slug,index])=>({id:slug,label:layout?.tabNames?.[index]||slug}));}
 const groups=StoModelLayout.plan(rowsFor(pane.setup));
 return [{id:'all',label:T('Tutte le regolazioni')},...groups.map(g=>({id:g.key,label:T(g.title)})),{id:'notes',label:T('Note')}];
}
function referenceView(parent,pane){
 const groups=StoModelLayout.plan(rowsFor(pane.setup));
 const grid=node('div',null,'reference-grid');
 for(const group of groups){
  if(groups.some(g=>g.key===pane.page)&&pane.page!==group.key)continue;
  const card=node('section',null,'reference-card');card.append(node('h3',T(group.title)));
  for(const row of group.rows){
   const value=StoPresentation.format(row.a.value,row.description,pane.units);
   const line=node('div',null,'value-row'),label=node('div',row.description.label),number=node('div',value.primary,'value');
   label.append(node('small',row.name+(row.a.occurrence>1?' #'+row.a.occurrence:'')));
   number.title=row.a.value+' · '+value.secondary;
   line.append(label,number);card.append(line);
  }
  grid.append(card);
 }
 if(!groups.length)grid.append(node('p',T('Nessun parametro letto.')));
 parent.append(grid);
}
function renderPane(index){
 const pane=panes[index],setup=pane.setup,article=node('section',null,'garage-pane');article.dataset.pane=String(index);
 if(pane.error){const alert=node('div',pane.error,'alert');alert.setAttribute('role','alert');article.append(alert);}
 if(!setup){
  const empty=node('div',null,'empty');empty.append(node('h2',T('Apri un setup nel Garage')),node('div',T('Scegli un file .sto oppure trascinalo qui.')),action(T('Apri setup'),()=>picker(index)));article.append(empty);
 }else{
  const head=node('header',null,'pane-head'),title=node('div',null,'pane-title');title.append(node('h2',setup.name),node('div',StoPresentation.carName(setup.car),'file-meta'));head.append(title);
  const controls=node('div',null,'pane-actions'),unit=node('select');unit.setAttribute('aria-label',T('Unità'));
  for(const [value,label]of [['metric','Metriche'],['imperial','Imperiali'],['raw','Originali']]){const option=node('option',T(label));option.value=value;unit.append(option);}unit.value=pane.units;unit.addEventListener('change',()=>{pane.units=unit.value;render();});
  controls.append(unit,action(T('Sostituisci'),()=>picker(index)),action(T('Chiudi'),()=>{pane.ticket++;pane.setup=null;pane.error='';pane.page=null;if(index===0&&panes[1].setup){const other=panes[1];pane.setup=other.setup;pane.page=other.page;pane.units=other.units;other.ticket++;other.setup=null;other.error='';other.page=null;}render();}));head.append(controls);article.append(head);
  const pages=pagesFor(pane);if(!pages.some(p=>p.id===pane.page))pane.page=pages[0]?.id||'all';
  const tabs=node('nav',null,'tabs');tabs.setAttribute('aria-label',T('Schede Garage'));
  for(const page of pages){const b=action(page.label,()=>{pane.page=page.id;render();});b.setAttribute('aria-selected',String(page.id===pane.page));tabs.append(b);}article.append(tabs);
  const caption=node('p',null,'caption'),body=node('div',null,'garage-body');
  if(pane.page==='notes'){
   body.append(node('pre',setup.notes||T('Nessuna nota.'),'setup-notes'));
  }else{
   const native=StoNativeGarage.render(STO_NATIVE_GARAGE_CATALOG,setup,{units:pane.units,page:pane.page,layout:'garage'});
   if(native.status==='rendered'){
    caption.textContent=T('Garage da metadati nativi · sola lettura · — = valore non presente nello STO');
    const style=node('style',native.page.css),surface=node('div',null,'native-wrap');surface.innerHTML=native.page.html;body.append(style,surface);
    requestAnimationFrame(()=>{if(!surface.isConnected)return;const fit=()=>{const width=surface.clientWidth,canvas=surface.querySelector('.sto-native-surface');if(canvas)canvas.style.zoom=width>=600?String(Math.min(1,width/native.page.width)):'1';};fit();if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fit);observer.observe(surface);resizeObservers.push(observer);}});
   }else{
    caption.textContent=T('Disposizione di riferimento · valori letti dallo STO · controlli nativi non verificati');referenceView(body,pane);
   }
  }
  article.append(caption,body);
  const details=node('details',null,'raw-details');details.append(node('summary',T('Valori originali e dettagli del file')));
  const original=setup.text||setup.entries.map(e=>e.name+' = '+e.value).join('\n');
  details.append(node('pre',setup.car+' · STO v'+setup.version+' · '+setup.entries.length+' '+T('parametri')+'\n\n'+original));article.append(details);
 }
 article.addEventListener('dragover',e=>e.preventDefault());article.addEventListener('drop',e=>{e.preventDefault();loadSetup(index,e.dataTransfer.files[0]);});
 return article;
}
function render(){
 for(const observer of resizeObservers)observer.disconnect();resizeObservers.length=0;
 StoI18n.applyStatic();$('language').value=StoI18n.language;
 const second=Boolean(panes[1].setup||panes[1].error),container=$('garages');container.replaceChildren();container.classList.toggle('dual',second);
 container.append(renderPane(0));if(second)container.append(renderPane(1));
 $('open-second').disabled=!panes[0].setup;
 $('boot-error').hidden=true;
}
async function loadSetup(index,file){
 if(!file)return;const pane=panes[index],ticket=++pane.ticket;
 pane.error='';render();
 try{
  if(file.size>16*1024*1024)throw new Error(T('File troppo grande: limite 16 MiB.'));
  const decoded=await StoReader.decode(await file.arrayBuffer(),MATERIAL);
  if(ticket!==pane.ticket)return;
  pane.setup={...decoded,name:file.name};pane.page=null;
 }catch(error){if(ticket!==pane.ticket)return;pane.error=T('Impossibile aprire il setup: {error}',{error:StoI18n.error(error.message)});}
 render();
}
for(const index of [0,1]){
 const input=$(index?'file-second':'file-main');input.addEventListener('change',event=>{const file=event.target.files[0];event.target.value='';loadSetup(index,file);});
}
$('open-main').addEventListener('click',()=>picker(0));$('open-second').addEventListener('click',()=>picker(1));
$('language').addEventListener('change',()=>{StoI18n.setLanguage($('language').value);render();});
$('demo').addEventListener('click',()=>{
 const sample=STO_GARAGE_DEMO,bytes=Uint8Array.from(atob(sample.base64),c=>c.charCodeAt(0));
 loadSetup(0,{name:sample.name,size:bytes.length,arrayBuffer:async()=>bytes.buffer});
});
globalThis.addEventListener('error',()=>{$('boot-error').hidden=false;$('boot-error').textContent=T('Errore interfaccia: riapri il file HTML.');});
render();
