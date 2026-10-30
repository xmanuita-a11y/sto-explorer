const state={a:null,b:null}, generation={a:0,b:0};
// SDK snapshots remain a separate observation; never merge them into STO state.
let nativeExport=null,sdkSnapshot=null,garageSource='sto',sdkError='',sdkGeneration=0;
const messages={a:{key:'Nessun setup aperto.'},b:{key:'Facoltativo: aggiungi un file da confrontare.'}},errors={a:false,b:false};
const $=id=>document.getElementById(id);
const T=StoI18n.t;
StoI18n.setLanguage(globalThis.navigator?globalThis.navigator.language?.startsWith('it')?'it':'en':'it');
StoI18n.applyStatic();$('language').value=StoI18n.language;
$('view').value='garage';
const labels={single:'Valore',same:'Uguale',changed:'≠ Diverso','only-a':'Solo in A','only-b':'Solo in B'};
let browserCheck={key:'Verifica disponibile senza file personali.'};
for(const group of StoPresentation.groups){const option=document.createElement('option');option.value=group;option.textContent=T(group);$('group').append(option);}
function cell(row,text,cls=''){const td=document.createElement('td');td.textContent=text;td.className=cls;row.append(td);return td;}
function block(parent,text,cls){const div=document.createElement('div');div.textContent=text;div.className=cls;parent.append(div);return div;}
function units(){return $('units').value||'metric';}
function referenceCar(){return state.a&&state.b?(state.a.car===state.b.car?state.a.car:''):(state.a||state.b)?.car||'';}

// Car profile lookup from decoded STO files
function carProfile(carId){
  if(typeof STO_CAR_PROFILES==='undefined'||!STO_CAR_PROFILES.cars)return null;
  const key=carId.replace(/\\/g,'_');
  return STO_CAR_PROFILES.cars[key]||null;
}
function carLabel(name){
  if(typeof STO_CAR_PROFILES==='undefined'||!STO_CAR_PROFILES.fieldLabels)return null;
  return STO_CAR_PROFILES.fieldLabels[name]||null;
}

function resetGarageHelp(){
  $('garage-help').hidden=true;
  for(const id of ['garage-help-title','garage-help-text','garage-help-source','garage-help-qualification'])$(id).textContent='';
}
function attachGarageHelp(entry,name){
  const info=StoGarage.explain(name,referenceCar());if(!info)return;
  // Same manual explanation as the inline fallback; never a recovered CML tooltip.
  const show=()=>{
    $('garage-help-title').textContent=info.title;
    $('garage-help-text').textContent=info.description;
    $('garage-help-source').textContent=info.source+' · '+T('pagina {n}',{n:info.page});
    $('garage-help-qualification').textContent=info.qualification;
    $('garage-help').hidden=false;
  };
  entry.addEventListener('mouseenter',show);entry.addEventListener('focusin',show);
}
function fieldHelp(parent,name){
  const info=StoGarage.explain(name,referenceCar());if(!info)return;
  const details=document.createElement('details');details.className='field-help';
  const summary=document.createElement('summary');summary.textContent=T('Che cosa significa · manuale NextGen');details.append(summary);
  block(details,info.title,'secondary');block(details,info.description,'help');block(details,info.source+' · '+T('pagina {n}',{n:info.page}),'field-source');block(details,info.qualification,'field-source');parent.append(details);
}
let garagePage='all';
const garagePages={all:'Tutte le regolazioni',tires:'Pneumatici',chassis:'Telaio',aero:'Aerodinamica',drivetrain:'Trasmissione',electronics:'Elettronica',fuel:'Motore e carburante',other:'Altri parametri',notes:'Note'};
function useModelLayout(){return typeof StoModelLayout!=='undefined'&&!StoGarage.isNextGen(referenceCar());}
function syncGaragePages(){
  const extended=garageSource==='sto'&&useModelLayout();
  $('garage-tabs').className='garage-tabs'+(extended?' garage-model-tabs':'');
  const available=new Set(extended?allRows().map(row=>StoModelLayout.pageFor(row)):[]);
  for(const page of ['aero','drivetrain','electronics','fuel','other'])$('garage-'+page).hidden=!extended||!available.has(page);
  if(!['all','tires','chassis','notes'].includes(garagePage)&&(!extended||!available.has(garagePage)))garagePage='all';
}

function renderSdkGarage(grid){
  grid.className='garage-grid garage-sdk garage-page-'+(garagePage==='all'?'sdk-all':garagePage);
  try{
    if(typeof StoSdkGarage==='undefined')throw new Error(T('Lettore snapshot SDK non disponibile.'));
    const plan=StoSdkGarage.plan(sdkSnapshot,garagePage==='notes'?'chassis':garagePage);
    const meta=plan.metadata;
    $('garage-file-name').textContent='SDK · '+meta.car;
    $('garage-source').textContent='SDK · '+meta.track;
    $('garage-caption').textContent=T('Fonte: snapshot SDK del simulatore · {car} · {track} · {time} · unità originali SDK.',{car:meta.car,track:meta.track,time:meta.observedAt});
    if(plan.layout==='observed-sdk-hierarchy')$('garage-caption').textContent+=' '+T('Struttura SDK del modello; disposizione e controlli nativi non verificati.');
    if(garagePage==='notes'){
      grid.hidden=true;$('garage-notes-content').hidden=false;
      block($('garage-notes-content'),T('Nessuna nota disponibile nello snapshot SDK. Torna ai file STO per le note dei setup.'),'empty');return;
    }
    for(const section of plan.sections){
      const card=document.createElement('section');card.className='garage-card garage-'+section.key+(['rear','cockpit','other'].includes(section.key)?' wide':'');
      const heading=document.createElement('h2');heading.textContent=section.title;card.append(heading);
      for(const row of section.rows){
        const entry=document.createElement('div');entry.className='garage-entry sdk-entry';entry.setAttribute('data-sdk-path',row.path);
        block(entry,row.label,'garage-label');
        const values=document.createElement('div');values.className='garage-values';
        const value=document.createElement('div');value.className='garage-value sdk-control-'+row.control;
        // Cosmetic controls follow the supplied screenshot plan; events stay disabled.
        const marker=text=>{const button=document.createElement('button');button.type='button';button.disabled=true;button.className='sdk-arrow';button.textContent=text;button.setAttribute('aria-hidden','true');value.append(button);};
        if(row.control==='spin')marker('‹');else if(row.control==='drop')marker('⌄');
        if(row.kind==='check'&&(row.value==='0'||row.value==='1')){
          const input=document.createElement('input');input.type='checkbox';input.disabled=true;input.checked=row.value==='1';input.setAttribute('aria-label',row.label);input.setAttribute('title',row.value);value.append(input);
        }else block(value,row.value==null?'—':String(row.value),'primary');
        if(row.control==='spin')marker('›');
        values.append(value);entry.append(values);card.append(entry);
      }
      grid.append(card);
    }
  }catch(error){
    $('garage-caption').textContent=T('Impossibile mostrare lo snapshot SDK. Torna ai file STO o importa un altro snapshot.');
    $('garage-alert').hidden=false;$('garage-alert').textContent=error.message;
  }
}
function renderNativeExport(grid){
  const plan=StoNativeExport.plan(nativeExport,garagePage);
  grid.className='garage-grid garage-sdk garage-model garage-export';
  $('garage-file-name').textContent=plan.metadata.car+' · '+plan.metadata.setupName;
  $('garage-source').textContent='HTML · '+plan.metadata.track;
  $('garage-caption').textContent=T('Fonte: export HTML iRacing · etichette, ordine e valori del file · nessuna associazione automatica allo STO.');
  if(garagePage==='notes'){
    grid.hidden=true;$('garage-notes-content').hidden=false;
    const note=document.createElement('pre');note.textContent=plan.notes||T('Nessuna nota.');$('garage-notes-content').append(note);return;
  }
  for(const section of plan.sections){
    if(section.domain==='notes')continue;
    const card=document.createElement('section');card.className='garage-card garage-'+section.key;
    const heading=document.createElement('h2');heading.textContent=section.title;card.append(heading);
    for(const row of section.rows){
      const entry=document.createElement('div');entry.className='garage-entry sdk-entry';entry.setAttribute('data-export-path',row.path);
      block(entry,row.label,'garage-label');const values=document.createElement('div');values.className='garage-values';
      const value=document.createElement('div');value.className='garage-value';block(value,row.value,'primary');values.append(value);entry.append(values);card.append(entry);
    }
    grid.append(card);
  }
}
function renderGarage(rows){
  resetGarageHelp();
  $('garage-load-a').textContent='My Setups · A';$('garage-load-b').textContent=T('Apri il secondo setup');$('garage-clear-a').textContent=T('Rimuovi A');$('garage-clear-b').textContent=T('Rimuovi B');
  $('garage-metric').textContent=($('metric-check').checked?'☑ ':'☐ ')+T('Metric units');$('garage-metric').setAttribute('aria-pressed',String($('metric-check').checked));$('garage-autoload').textContent=T('Auto-load setups for this car');
  $('garage-metric').disabled=garageSource!=='sto';
  if(garageSource!=='sto')$('garage-metric').textContent=T(garageSource==='sdk'?'Unità originali SDK':'Unità originali export');
  $('garage-return-sto').hidden=garageSource==='sto';
  const actionPanel=$('garage-file-actions');
  const addAction=(id,label,disabled=true,parent=actionPanel)=>{let button=$(id);if(!button){button=document.createElement('button');button.id=id;button.type='button';}if(button.parentElement!==parent)parent.append(button);button.textContent=label;button.disabled=disabled;return button;};
  addAction('garage-official','Official Setups');addAction('garage-shared','Shared Setups');
  const fileRow=$('garage-file-row');
  addAction('garage-export','Export CSV',garageSource!=='sto'||!(state.a||state.b),fileRow);addAction('garage-save','Save',true,fileRow);addAction('garage-share','Share',true,fileRow);addAction('garage-revert','Revert',true,$('garage-sidebar-bottom'));
  const grid=$('garage-grid');grid.replaceChildren();
  grid.setAttribute('style','');
  const pair=Boolean(state.a&&state.b);
  grid.className='garage-grid garage-page-'+garagePage+(pair?' comparing':'');
  $('garage-window').hidden=$('view').value!=='garage';
  $('garage-alert').hidden=!sdkError&&!Object.values(errors).some(Boolean);
  $('garage-alert').textContent=[...['a','b'].filter(side=>errors[side]).map(side=>T(messages[side].key,messages[side].args)),sdkError].filter(Boolean).join('\n');
  if(garageSource==='sto'&&!$('notice').hidden){
    $('garage-alert').textContent=[$('garage-alert').textContent,$('notice').textContent].filter(Boolean).join('\n');
    $('garage-alert').hidden=false;
  }
  $('garage-caption').textContent=StoGarage.isNextGen(referenceCar())?'NextGen · layout dal manuale · scale garage da verificare':'Layout generico · carica un setup NextGen per la disposizione di riferimento';
  $('garage-file-name').textContent=(state.a||state.b)?.name||'Apri un file .sto dal menu a destra';
  $('garage-tools').hidden=$('view').value!=='garage';
  for(const page of Object.keys(garagePages))$('garage-'+page).setAttribute('aria-pressed',String(garagePage===page));
  const notesView=$('garage-notes-content');notesView.hidden=garagePage!=='notes';notesView.replaceChildren();
  $('garage-source').textContent=['a','b'].filter(side=>state[side]).map(side=>side.toUpperCase()+': '+state[side].name).join('  /  ');
  if(garageSource==='sdk'){renderSdkGarage(grid);return;}
  if(garageSource==='native-export'){renderNativeExport(grid);return;}
  if(garagePage==='notes'){
    grid.hidden=true;
    for(const side of ['a','b'])if(state[side]){
      const heading=document.createElement('h2');heading.textContent='Setup '+side.toUpperCase()+' · '+state[side].name;notesView.append(heading);
      const note=document.createElement('pre');note.textContent=state[side].notes||T('Nessuna nota.');notesView.append(note);
    }
    if(!state.a&&!state.b)block(notesView,T('Apri un setup per esplorare i suoi valori.'),'empty');
    $('garage-caption').textContent=T('Note originali dei setup aperti · sola lettura.');return;
  }
  if(state.a||state.b){
    const native=typeof StoNativeGarage==='undefined'?{status:'fallback',code:'no-profile'}:
      StoNativeGarage.render(typeof STO_NATIVE_GARAGE_CATALOG==='undefined'?null:STO_NATIVE_GARAGE_CATALOG,state.a||state.b,
        {units:units(),page:garagePage,comparing:pair,filtered:Boolean($('search').value.trim()||$('group').value||$('diff-only').checked)});
    if(native.status==='rendered'){
      grid.className='garage-grid garage-native';grid.setAttribute('style','display:block;overflow-x:auto;');
      const style=document.createElement('style');style.textContent=native.page.css;grid.append(style);
      const surface=document.createElement('div');surface.innerHTML=native.page.html;grid.append(surface);
      $('garage-caption').textContent=T('Posizioni e formati dal profilo garage verificato · sola lettura.');
      return;
    }
    const caption=native.code==='reference-mode'?'Confronto e filtri: disposizione di riferimento.':native.code==='raw-mode'?'Valori originali: disposizione di riferimento.':
      native.code==='no-profile'?'Disposizione di riferimento; profilo garage verificato non disponibile per questo setup.':'Impossibile usare il profilo garage verificato; viene mostrata la disposizione di riferimento.';
    $('garage-caption').textContent=T(caption);
  }
  if(typeof StoModelGroups!=='undefined'&&typeof STO_MODEL_GROUP_CATALOG!=='undefined'){
    const observed=['a','b'].filter(side=>state[side]).map(side=>{
      const group=StoModelGroups.lookup(state[side],STO_MODEL_GROUP_CATALOG);
      return side.toUpperCase()+': '+state[side].car+' · '+(group?T('Gruppo struttura {id} · {n} campi',{id:group.groupId.slice(0,12),n:group.fieldCount}):T('Struttura non censita'));
    });
    if(observed.length)$('garage-caption').textContent=observed.join(' / ')+' · '+T('Gruppi basati sui campi STO; catalogo nativo da verificare.');
  }
  const panels=useModelLayout()?StoModelLayout.plan(($('sort').value||'group')==='group'?[...rows].sort((a,b)=>(a.a||a.b).line-(b.a||b.b).line):rows):StoGarage.sections.map(([key,title])=>({key,title,rows:rows.filter(r=>StoGarage.section(r.name,r.description.group)===key).sort((a,b)=>StoGarage.order(a.name)-StoGarage.order(b.name))}));
  if(useModelLayout())grid.className+=' garage-model';
  for(const {key,title,rows:members}of panels){
    if(!members.length)continue;
    const card=document.createElement('section');card.className='garage-card garage-'+key+(['rear','cockpit','other'].includes(key)?' wide':'');
    const heading=document.createElement('h2');heading.textContent=T(title);card.append(heading);
    const outputRows=[];
    for(const label of StoGarage.outputs(key,garagePage,referenceCar())){
      const output=document.createElement('div');output.className='garage-output';
      block(output,label,'garage-label');block(output,'—','garage-unavailable');
      output.setAttribute('title','Risultato del simulatore non presente nel file STO.');
      outputRows.push(output);
    }
    if(garagePage!=='tires')for(const output of outputRows)card.append(output);
    if(pair){const columns=document.createElement('div');columns.className='garage-columns';block(columns,T('Parametro'),'');block(columns,'A','');block(columns,'B','');card.append(columns);}
    for(const row of members){
      const d=row.description,entry=document.createElement('div');entry.className='garage-entry '+row.status;
      entry.setAttribute('data-parameter',row.name);entry.setAttribute('data-occurrence',String(row.occurrence));
      block(entry,StoGarage.label(row.name,d,referenceCar())+(row.occurrence>1?' · '+T('occorrenza {n}',{n:row.occurrence}):''),'garage-label');
      const values=document.createElement('div');values.className='garage-values';
      const details=document.createElement('details');details.className='garage-details';
      const summary=document.createElement('summary');summary.textContent='i';summary.setAttribute('aria-label',T('Dettagli parametro'));details.append(summary);
      block(details,d.quality,'secondary');block(details,d.unitEvidence,'secondary');
      if(d.partial)block(details,T('Etichetta parziale · significato da verificare'),'secondary');
      if($('originals').checked)block(details,row.name,'technical');
      for(const side of ['a','b']){
        if(!state[side])continue;
        const value=StoPresentation.format(row[side]?.value,d,units()),box=document.createElement('div');box.className='garage-value';
        block(box,'Setup '+side.toUpperCase(),'garage-side');block(box,value.primary,'primary');
        if(d.kind==='raw'||units()==='raw')block(box,'raw','garage-internal');
        block(details,'Setup '+side.toUpperCase()+': '+value.secondary,'secondary');
        if($('originals').checked&&row[side])block(details,T('Originale: {value} · riga {line}',{value:row[side].value,line:row[side].line}),'technical');
        values.append(box);
      }
      entry.append(values);
      if(pair&&row.status!=='same'){
        block(entry,T(labels[row.status]),'garage-status');
        if(row.status==='changed')block(details,'Δ '+StoPresentation.delta(row.a?.value,row.b?.value,d,units()).primary,'secondary');
      }
      fieldHelp(details,row.name);attachGarageHelp(entry,row.name);entry.append(details);card.append(entry);
    }
    if(garagePage==='tires')for(const output of outputRows)card.append(output);
    grid.append(card);
  }
  if(!rows.length)block(grid,T(state.a||state.b?'Nessun parametro corrisponde ai filtri.':'Apri un setup per esplorare i suoi valori.'),'empty');
}
function allRows(){
  let rows=state.a?StoReader.compare(state.a,state.b):state.b?StoReader.compare(state.b,null).map(r=>({...r,a:undefined,b:r.a})):[];
  return rows.map(r=>({...r,description:StoPresentation.describe(r.name)}));
}
function visibleRows(){
  const query=$('search').value.toLocaleLowerCase(StoI18n.language).trim(),group=$('group').value;
  const rows=allRows().filter(r=>{
    const words=[r.name,r.description.label,T(r.description.group)].join(' ').toLocaleLowerCase(StoI18n.language).split(/[\s·]+/);
    const matches=!query||query.split(/\s+/).every(token=>words.some(word=>word.startsWith(token)));
    const inPage=$('view').value!=='garage'||garagePage==='all'||(garagePage==='notes'?false:useModelLayout()?StoModelLayout.pageFor(r)===garagePage:garagePage==='tires'?r.description.group==='Pneumatici':r.description.group!=='Pneumatici');
    return inPage&&(!group||r.description.group===group)&&matches&&(!($('diff-only').checked&&state.a&&state.b)||r.status!=='same');
  });
  const order=$('sort').value||'group',rank={changed:0,'only-a':1,'only-b':1,same:2,single:2};
  if(order==='name') rows.sort((a,b)=>a.description.label.localeCompare(b.description.label,StoI18n.language));
  if(order==='group') rows.sort((a,b)=>StoPresentation.groups.indexOf(a.description.group)-StoPresentation.groups.indexOf(b.description.group));
  if(order==='changed') rows.sort((a,b)=>rank[a.status]-rank[b.status]);
  return rows;
}
function renderOverview(rows,counts){
  const pair=Boolean(state.a&&state.b),loaded=state.a||state.b;
  $('overview').hidden=!loaded||$('view').value==='garage';
  if(!loaded){$('summary-title').textContent='';$('summary-detail').textContent='';$('areas').replaceChildren();$('wheels').replaceChildren();return;}
  if(pair){
    const different=(counts.changed||0)+(counts['only-a']||0)+(counts['only-b']||0);
    $('summary-title').textContent=different?T('{n} parametri da confrontare',{n:different}):T(state.a.sha256&&state.a.sha256===state.b.sha256?'Hai aperto lo stesso file su entrambi i lati.':'I parametri numerici coincidono.');
  }else $('summary-title').textContent=T('{n} parametri nel setup {side}',{n:loaded.entries.length,side:state.a?'A':'B'});
  const lines=[];
  if(pair){
    lines.push(T('{changed} valori diversi · {a} solo in A · {b} solo in B · {same} uguali',{changed:counts.changed||0,a:counts['only-a']||0,b:counts['only-b']||0,same:counts.same||0}));
    lines.push(T('Note: {state}',{state:T(state.a.notes===state.b.notes?'uguali':'diverse')}));
    if(state.a.tailSha256&&state.b.tailSha256) lines.push(T('Coda binaria: {state} · contenuto non interpretato',{state:T(state.a.tailSha256===state.b.tailSha256?'identica':'diversa')}));
    if(state.a.decodedSha256&&state.b.decodedSha256&&state.a.decodedSha256!==state.b.decodedSha256&&!counts.changed&&!counts['only-a']&&!counts['only-b'])lines.push(T('Il testo originale differisce: possono cambiare ordine, formattazione o metadati.'));
    if(state.a.car!==state.b.car)lines.push(T('Attenzione: modelli auto differenti.'));
  }else lines.push(T('Aggiungi il secondo setup per evidenziare le modifiche.'));
  lines.push(T('{units} parametri con unità dal nome del campo · {partial} etichette parziali',{units:rows.filter(r=>r.description.kind!=='raw').length,partial:rows.filter(r=>r.description.partial).length}));
  $('summary-detail').textContent=lines.join('\n');
  $('areas').replaceChildren();
  for(const group of StoPresentation.groups){
    const members=rows.filter(r=>r.description.group===group);if(!members.length)continue;
    const changed=members.filter(r=>r.status!=='same'&&r.status!=='single').length;
    const button=document.createElement('button');button.className='area-button'+($('group').value===group?' active':'');
    button.textContent=T(group)+' · '+(pair?changed+' / '+members.length:members.length);
    button.title=T(pair?'Parametri diversi o mancanti / totale nell’area':'Numero di parametri nell’area');
    button.addEventListener('click',()=>{$('group').value=$('group').value===group?'':group;render();});$('areas').append(button);
  }
  $('wheels').replaceChildren();
  const suffix=$('wheel-kind').value||'TireColdPressPa';
  for(const [prefix,label] of [['lf','Anteriore sinistra'],['rf','Anteriore destra'],['lr','Posteriore sinistra'],['rr','Posteriore destra']]){
    const name=prefix+suffix,d=StoPresentation.describe(name),box=document.createElement('div');box.className='wheel';block(box,T(label),'wheel-label');
    const readings={};
    for(const side of ['a','b']){
      if(!state[side])continue;
      const entries=state[side].entries.filter(e=>e.name===name);
      const entry=entries.length===1?entries[0]:null;readings[side]=entry;
      block(box,side.toUpperCase()+': '+(entries.length>1?T('Più occorrenze · vedi tabella'):entry?StoPresentation.format(entry.value,d,units()).primary:T('Non presente')),'wheel-value');
    }
    if(pair&&readings.a&&readings.b&&StoReader.canonicalDecimal(readings.a.value)!==StoReader.canonicalDecimal(readings.b.value)){box.className+=' wheel-diff';block(box,'Δ '+StoPresentation.delta(readings.a.value,readings.b.value,d,units()).primary,'wheel-hint');}
    $('wheels').append(box);
  }
}
function render(){
  $('app-main').className=$('view').value==='garage'?'garage-mode':'';
  $('garage-window').hidden=$('view').value!=='garage';
  $('metric-check').checked=units()==='metric';$('metric-check').indeterminate=units()==='raw';
  $('check-status').textContent=T(browserCheck.key,browserCheck.args);
  for(const side of ['a','b']){
    const s=state[side];$('meta-'+side).className='meta'+(errors[side]?' error':'');
    const message=messages[side],args={...message.args};if(args.error)args.error=StoI18n.error(args.error);
    const cp=carProfile(s?.car||'');
    $('meta-'+side).textContent=s?s.name+'\n'+StoPresentation.carName(s.car)+(cp?' · '+cp.fieldCount+' campi noti':'')+'\n'+T('{n} parametri · {groups} aree\nModello interno: {car}',{n:s.entries.length,groups:new Set(s.entries.map(e=>StoPresentation.describe(e.name).group)).size,car:s.car}):T(message.key,args);
    $('raw-'+side).textContent=s?T('File: {name}\nModello: {car}\nSTO v{version} · contenuto v{content} · coda {tail} byte\nSHA-256: {hash}',{name:s.name,car:s.car,version:s.version,content:s.contentVersion,tail:s.tailSize,hash:s.sha256})+'\n\n'+s.text:'—';
    $('head-'+side).textContent='Setup '+side.toUpperCase()+(s?' · '+s.name:'');
  }
  const notes=[];
  if(state.a&&state.b&&state.a.car!==state.b.car) notes.push(T('Modelli auto diversi: {a} / {b}. Il nome uguale di un parametro non prova equivalenza fra auto.',{a:StoPresentation.carName(state.a.car),b:StoPresentation.carName(state.b.car)}));
  for(const side of ['a','b']) if(state[side]?.unparsed.length) notes.push(T('Setup {side}: {n} righe non interpretate; consultare il contenuto originale.',{side:side.toUpperCase(),n:state[side].unparsed.length}));
  for(const side of ['a','b'])if(state[side]?.entries.some(e=>e.occurrence>1))notes.push(T('Setup {side}: nomi di parametro ripetuti. Il confronto abbina le occorrenze nell’ordine del file.',{side:side.toUpperCase()}));
  if(state.a&&state.b&&state.a.notes!==state.b.notes) notes.push(T('Le note dei due setup sono diverse: apri la scheda NOTES del garage per leggerle.'));
  $('notice').hidden=!notes.length;$('notice').textContent=notes.join('\n');
  $('diff-only').disabled=!(state.a&&state.b);for(const id of ['export','report','print'])$(id).disabled=!(state.a||state.b);
  $('tablebox').className='tablebox'+($('originals').checked?'':' originals-off');
  const completeRows=allRows(),counts={};completeRows.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);
  renderOverview(completeRows,counts);
  syncGaragePages();
  const rows=visibleRows(),tableView=$('view').value!=='garage';$('rows').replaceChildren();let currentGroup;
  if(tableView)for(const r of rows){
    const d=r.description;
    if(($('sort').value||'group')==='group'&&currentGroup!==d.group){const header=document.createElement('tr');header.className='group-row';const td=cell(header,T(d.group));td.colSpan=5;$('rows').append(header);currentGroup=d.group;}
    const tr=document.createElement('tr');tr.className=r.status;
    const cl=carLabel(r.name);
    const nameCell=cell(tr,'','parameter');block(nameCell,(cl||d.label)+(r.occurrence>1?' · '+T('occorrenza {n}',{n:r.occurrence}):''),'primary');block(nameCell,r.name,'technical');if(d.partial&&!cl)block(nameCell,T('Etichetta parziale · significato da verificare'),'secondary');nameCell.title=(cl?cl+' · ':'')+d.quality+'\n'+d.unitEvidence;block(nameCell,r.name,'technical');if(d.partial)block(nameCell,T('Etichetta parziale · significato da verificare'),'secondary');nameCell.title=d.quality+'\n'+d.unitEvidence;
    fieldHelp(nameCell,r.name);
    for(const side of ['a','b']){const entry=r[side],formatted=StoPresentation.format(entry?.value,d,units()),td=cell(tr,'','value');block(td,formatted.primary,'primary');block(td,formatted.secondary,'secondary');if(entry)block(td,T('Originale: {value} · riga {line}',{value:entry.value,line:entry.line}),'technical raw-value');}
    const delta=state.a&&state.b?StoPresentation.delta(r.a?.value,r.b?.value,d,units()):{primary:'—',detail:T('Aggiungi il secondo setup per confrontare')};
    const diffCell=cell(tr,'','value');block(diffCell,delta.primary,'primary');if(r.status==='changed')block(diffCell,delta.detail,'technical');diffCell.title=delta.detail;
    cell(tr,T(labels[r.status]),'badge');$('rows').append(tr);
  }
  if(tableView&&!rows.length){const tr=document.createElement('tr');const td=cell(tr,T(state.a||state.b?'Nessun parametro corrisponde ai filtri.':'Apri un setup per esplorare i suoi valori.'),'empty');td.colSpan=5;$('rows').append(tr);}
  $('tablebox').hidden=$('view').value==='garage';$('garage-grid').hidden=$('view').value!=='garage';
  if($('view').value==='garage')renderGarage(rows);else {$('garage-grid').replaceChildren();$('garage-notes-content').hidden=true;$('garage-tools').hidden=true;}
  $('stats').textContent=state.a&&state.b?T('{changed} diversi · {a} solo in A · {b} solo in B · {same} uguali · {visible} visibili',{changed:counts.changed||0,a:counts['only-a']||0,b:counts['only-b']||0,same:counts.same||0,visible:rows.length}):state.a||state.b?T('{n} parametri visibili',{n:rows.length}):T('Apri un setup per iniziare.');
  $('print-heading').textContent=[T('STO Reader 0.4 — risultati filtrati'),state.a?'A: '+state.a.name+' · '+state.a.car:'',state.b?'B: '+state.b.name+' · '+state.b.car:'',T('Filtri: {filters}',{filters:filterSummary()})].filter(Boolean).join('\n');
  for(const id of ['units','metric-check','search','group','sort','originals','swap','export','report','print','view']){
    const ordinaryDisabled=['export','report','print'].includes(id)&&!(state.a||state.b);
    $(id).disabled=garageSource!=='sto'||ordinaryDisabled;
  }
  $('diff-only').disabled=garageSource!=='sto'||!(state.a&&state.b);
  if(garageSource!=='sto')$('stats').textContent=T(garageSource==='sdk'?'Snapshot SDK separato dai file STO · unità e testo originali.':'Export HTML separato dai file STO · etichette e valori originali.');
  $('garage-comparison').hidden=garageSource!=='sto';
  $('garage-summary').textContent=$('stats').textContent;
  $('garage-search').value=$('search').value;
  $('garage-diff-only').checked=$('diff-only').checked;
  $('garage-diff-only').disabled=$('diff-only').disabled;
  $('garage-swap').disabled=garageSource!=='sto'||!(state.a&&state.b);
  $('garage-filter-summary').textContent=filterSummary();
}
async function load(side,file){
  if(!file)return;sdkGeneration++;garageSource='sto';sdkError='';const ticket=++generation[side];state[side]=null;errors[side]=false;messages[side]={key:'Lettura di {name}…',args:{name:file.name}};render();
  try{if(file.size>16*1024*1024)throw new Error('File troppo grande: limite 16 MiB.');const result=await StoReader.decode(await file.arrayBuffer(),MATERIAL);if(ticket!==generation[side])return;state[side]={...result,name:file.name};render();}
  catch(error){if(ticket!==generation[side])return;errors[side]=true;messages[side]={key:'Impossibile aprire {name}\n{error}',args:{name:file.name,error:error.message}};render();}
}
const demoBytes=sample=>Uint8Array.from(atob(sample.base64),char=>char.charCodeAt(0));
$('showcase-model').value='camry';
$('showcase-load').addEventListener('click',async()=>{
  const demo=STO_DEMO.models.find(model=>model.id===$('showcase-model').value);
  if(!demo)return;
  garagePage='all';$('view').value='garage';$('search').value='';$('group').value='';$('diff-only').checked=false;
  await Promise.all(demo.samples.map((sample,i)=>load(i?'b':'a',{name:sample.name,size:demoBytes(sample).length,arrayBuffer:async()=>demoBytes(sample).buffer})));
});
$('check-browser').addEventListener('click',async()=>{
  $('check-browser').disabled=true;browserCheck={key:'Verifica in corso…'};render();
  try{
    for(const sample of STO_DEMO.samples){const result=await StoReader.decode(demoBytes(sample),MATERIAL);if(result.decodedSha256!==sample.decodedSha256)throw new Error('Synthetic sample mismatch');}
    browserCheck={key:'Decoder verificato su due campioni sintetici. Nessun file personale utilizzato.'};
  }catch(error){browserCheck={key:'Verifica non riuscita: {error}',args:{error:StoI18n.error(error.message)}};}
  finally{$('check-browser').disabled=false;render();}
});
$('demo').addEventListener('click',async()=>{
  garagePage='all';$('search').value='';$('group').value='';$('diff-only').checked=false;
  await Promise.all(STO_DEMO.samples.map((sample,i)=>load(i?'b':'a',{name:sample.name,size:demoBytes(sample).length,arrayBuffer:async()=>demoBytes(sample).buffer})));
});
for(const side of ['a','b']){
  $('load-'+side).addEventListener('click',()=>$('file-'+side).click());
  $('file-'+side).addEventListener('change',event=>{const file=event.target.files[0];event.target.value='';return load(side,file);});
  $('clear-'+side).addEventListener('click',()=>{generation[side]++;state[side]=null;$('file-'+side).value='';errors[side]=false;messages[side]={key:'Nessun setup aperto.'};render();});
  $('drop-'+side).addEventListener('dragover',event=>{event.preventDefault();$('drop-'+side).classList.add('drag');});
  $('drop-'+side).addEventListener('dragleave',()=>$('drop-'+side).classList.remove('drag'));
  $('drop-'+side).addEventListener('drop',event=>{event.preventDefault();$('drop-'+side).classList.remove('drag');return load(side,event.dataTransfer.files[0]);});
}
$('garage-load-a').addEventListener('click',()=>$('file-a').click());$('garage-load-b').addEventListener('click',()=>$('file-b').click());
$('garage-demo').addEventListener('click',async()=>{
  garagePage='chassis';$('search').value='';$('group').value='';$('diff-only').checked=false;
  generation.b++;state.b=null;errors.b=false;messages.b={key:'Facoltativo: aggiungi un file da confrontare.'};
  const sample=STO_GARAGE_DEMO;
  await load('a',{name:sample.name,size:demoBytes(sample).length,arrayBuffer:async()=>demoBytes(sample).buffer});
});
$('garage-clear-a').addEventListener('click',()=>$('clear-a').click());$('garage-clear-b').addEventListener('click',()=>$('clear-b').click());
$('garage-metric').addEventListener('click',()=>{$('metric-check').click();});
$('garage-export').addEventListener('click',()=>$('export').click());
$('garage-load-sdk').addEventListener('click',()=>$('garage-sdk-file').click());
$('garage-sdk-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  const ticket=++sdkGeneration;
  try{
    if(file.size>1024*1024)throw new Error(T('Snapshot troppo grande: limite 1 MiB.'));
    if(typeof StoSdkGarage==='undefined')throw new Error(T('Lettore snapshot SDK non disponibile.'));
    const text=await file.text();if(text.length>1024*1024)throw new Error(T('Snapshot troppo grande: limite 1 MiB.'));
    const snapshot=JSON.parse(text);StoSdkGarage.validate(snapshot);StoSdkGarage.plan(snapshot,'chassis');
    if(ticket!==sdkGeneration)return;
    sdkSnapshot=snapshot;garageSource='sdk';garagePage='chassis';sdkError='';$('view').value='garage';render();
  }catch(error){if(ticket!==sdkGeneration)return;sdkError=T('Impossibile importare lo snapshot SDK: {error}',{error:error.message});render();}
});
$('garage-load-native-export').addEventListener('click',()=>$('garage-native-export-file').click());
$('garage-native-export-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;const ticket=++sdkGeneration;
  try{
    if(file.size>1024*1024)throw new Error(T('Export troppo grande: limite 1 MiB.'));
    const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
    const parsed=StoNativeExport.parse(text);StoNativeExport.plan(parsed,'all');
    if(ticket!==sdkGeneration)return;
    nativeExport=parsed;garageSource='native-export';garagePage='all';sdkError='';$('view').value='garage';render();
  }catch(error){if(ticket!==sdkGeneration)return;sdkError=T('Impossibile importare export HTML: {error}',{error:error.message});render();}
});
$('garage-return-sto').addEventListener('click',()=>{sdkGeneration++;garageSource='sto';sdkError='';garagePage='chassis';render();});
for(const page of Object.keys(garagePages))$('garage-'+page).addEventListener('click',()=>{garagePage=page;render();});
for(const id of ['search','diff-only','group','units','sort','originals','wheel-kind','view'])$(id).addEventListener(id==='search'?'input':'change',render);
$('metric-check').addEventListener('change',()=>{$('units').value=$('metric-check').checked?'metric':'imperial';render();});
function resetFilters(){garagePage='all';$('search').value='';$('group').value='';$('diff-only').checked=false;$('sort').value='group';render();}
function swapSetups(){generation.a++;generation.b++;[state.a,state.b]=[state.b,state.a];for(const side of ['a','b']){$('file-'+side).value='';errors[side]=false;messages[side]={key:'Nessun setup aperto.'};}render();}
for(const id of ['reset','garage-reset'])$(id).addEventListener('click',resetFilters);
for(const id of ['swap','garage-swap'])$(id).addEventListener('click',swapSetups);
$('garage-search').addEventListener('input',()=>{$('search').value=$('garage-search').value;render();});
$('garage-diff-only').addEventListener('change',()=>{$('diff-only').checked=$('garage-diff-only').checked;render();});
$('language').addEventListener('change',()=>{StoI18n.setLanguage($('language').value);StoI18n.applyStatic();for(const option of $('group').children)if(option.value)option.textContent=T(option.value);render();});
function csvContent(){
  const quote=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
  const records=[['Area','Parametro leggibile','Parametro originale','Occorrenza','File A','Modello A','Valore originale A','Valore mostrato A','Riga A','File B','Modello B','Valore originale B','Valore mostrato B','Riga B','Differenza originale B-A','Differenza mostrata','Stato','Interpretazione'].map(key=>T(key))];
  for(const r of visibleRows()){const d=r.description;records.push([T(d.group),d.label,r.name,r.occurrence,state.a?.name,state.a?.car,r.a?.value,StoPresentation.format(r.a?.value,d,units()).primary,r.a?.line,state.b?.name,state.b?.car,r.b?.value,StoPresentation.format(r.b?.value,d,units()).primary,r.b?.line,r.a&&r.b?StoPresentation.subtract(r.a.value,r.b.value):'',state.a&&state.b?StoPresentation.delta(r.a?.value,r.b?.value,d,units()).primary:'',T(labels[r.status]),d.quality+'; '+d.unitEvidence]);}
  return '\ufeff'+records.map(row=>row.map(quote).join(';')).join('\r\n');
}
function filterSummary(){return T('Area: {group} · ricerca: {search} · {mode} · unità: {units} · ordine: {order}',{group:T($('group').value||'tutte'),search:$('search').value||T('nessuna'),mode:T($('diff-only').checked&&state.a&&state.b?'solo differenze':'tutti i valori'),units:T(units()),order:T($('sort').value||'group')})+($('view').value==='garage'?' · '+T('VISTA')+': '+T(garagePages[garagePage]):'');}
function reportContent(){
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=visibleRows();
  const originals=$('originals').checked;
  const table=rows.map(r=>{
    const d=r.description,value=side=>{
      const entry=r[side];if(!entry)return '—';
      return escape(StoPresentation.format(entry.value,d,units()).primary)+(originals?'<small>'+escape(T('Originale: {value} · riga {line}',{value:entry.value,line:entry.line}))+'</small>':'');
    };
    const delta=state.a&&state.b?StoPresentation.delta(r.a?.value,r.b?.value,d,units()):{primary:'—',detail:''};
    return '<tr class="'+r.status+'"><td>'+escape(T(d.group))+'</td><td>'+escape(d.label)+(r.occurrence>1?' · '+escape(T('occorrenza {n}',{n:r.occurrence})): '')+'<small>'+escape(r.name)+'</small></td><td>'+value('a')+'</td><td>'+value('b')+'</td><td>'+escape(delta.primary)+(originals&&r.status==='changed'?'<small>'+escape(delta.detail)+'</small>':'')+'</td><td>'+escape(T(labels[r.status]))+'</td></tr>';
  }).join('');
  const sources=['a','b'].filter(side=>state[side]).map(side=>{
    const s=state[side];return '<section><h2>Setup '+side.toUpperCase()+': '+escape(s.name)+'</h2><p>'+escape(s.car)+'</p><small>'+escape(T('SHA-256 file'))+': '+escape(s.sha256)+'</small>'+($('include-notes').checked?'<h3>'+escape(T('Note'))+'</h3><pre>'+escape(s.notes||T('Nessuna nota.'))+'</pre>':'')+'</section>';
  }).join('');
  const style='body{font:14px system-ui;margin:30px;color:#152638}h1{font-size:28px}h2{font-size:17px}p{line-height:1.7;white-space:pre-line}small{display:block;font-size:11px;color:#536477;overflow-wrap:anywhere;margin-top:5px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border:1px solid #ccd6df;vertical-align:top}th{background:#edf2f6}.changed{background:#fff1d7}.only-a,.only-b{background:#e5f2fa}pre{white-space:pre-wrap;overflow-wrap:anywhere}section{margin:20px 0}.table{overflow:auto}@media print{body{margin:0;font-size:9pt}th,td{padding:5px}tr{break-inside:avoid}thead{display:table-header-group}}';
  const headers=['Area','Parametro','Setup A','Setup B','Δ B − A','Stato'].map(key=>'<th>'+escape(T(key))+'</th>').join('');
  return '<!doctype html><html lang="'+StoI18n.language+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>'+escape(T('Report confronto setup'))+'</title><style>'+style+'</style><h1>'+escape(T('Report setup · STO Reader 0.4'))+'</h1><p>'+escape(filterSummary())+'<br>'+escape(T('{n} parametri visibili. Δ = B − A.',{n:rows.length}))+'</p>'+sources+'<p>'+escape($('summary-detail').textContent)+'</p><p>'+escape(T('Etichette interpretate dai nomi tecnici; unità dal suffisso del campo, equivalenza con il garage non verificata. Indici e impostazioni sono codici interni. La coda binaria non è interpretata.'))+'</p>'+($('notice').hidden?'':'<p>'+escape($('notice').textContent)+'</p>')+'<div class="table"><table><thead><tr>'+headers+'</tr></thead><tbody>'+table+'</tbody></table></div><p>'+escape(T('Report statico generato localmente. Contiene risultati dei setup selezionati; nessun decoder, nessuna costante di decodifica. Non consente di aprire altri setup.'))+'</p></html>';
}
function download(content,type,filename){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export').addEventListener('click',()=>download(csvContent(),'text/csv;charset=utf-8','confronto-setup.csv'));
$('report').addEventListener('click',()=>download(reportContent(),'text/html;charset=utf-8','report-setup.html'));
$('print').addEventListener('click',()=>globalThis.print());
globalThis.addEventListener?.('error',()=>{const box=$('boot-error');box.hidden=false;box.textContent=T('Si è verificato un errore nell’interfaccia. Riapri il file HTML completo; se ricompare, segnala il messaggio della console e la versione 0.4.');});
render();
$('boot-error').hidden=true;
