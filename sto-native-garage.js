/* Verified-profile routing only. No Camry metadata, geometry or unit mapping inferred.
 * Source paths/digests are checked by the offline HTML builder before embedding.
 * verified:true is the investigator's explicit attestation of this profile, not
 * proof inferred from its hashes. Digests identify source bytes only; they do not
 * establish semantic correctness of tokens, metadata, unit or page mappings.
 * Catalogs are trusted build inputs, not externally supplied browser documents.
 */
const StoNativeGarage=(()=>{
  'use strict';
  const fail=(code,detail)=>({status:'fallback',code,detail,complete:false});
  const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
  function validateCatalog(catalog){
    if(catalog?.schemaVersion!==1||!Array.isArray(catalog.profiles))throw new Error('Unsupported native garage catalog');
    const ids=new Set();
    for(const profile of catalog.profiles){
      if(!profile||typeof profile.id!=='string'||!profile.id||ids.has(profile.id))throw new Error('Missing/duplicate profile ID');
      ids.add(profile.id);
      const identity=profile.identity;
      if(profile.verified!==true||typeof identity?.car!=='string'||!identity.car||!Number.isInteger(identity.stoVersion)||
        typeof identity.contentVersion!=='string'||!identity.contentVersion)throw new Error('Profile requires verified exact identity');
      if(!Array.isArray(profile.sources)||!['cml','metadata','unitMapping'].every(role=>profile.sources.some(source=>source.role===role)))
        throw new Error('Profile requires CML, metadata and unit mapping sources');
      for(const source of profile.sources){
        if(typeof source.path!=='string'||!source.path||/^(?:[a-z]:|[\\/])/i.test(source.path)||source.path.split(/[\\/]/).includes('..')||!validHash(source.sha256))
          throw new Error('Source requires workspace-relative path and SHA256');
      }
      if(!Array.isArray(profile.tokens)||!Array.isArray(profile.records)||!profile.tokens.length)throw new Error('Profile requires explicit controls and metadata');
      for(const key of ['metric','imperial'])if(![0,1].includes(profile.unitSelectors?.[key]))throw new Error('Explicit unit branch mapping required');
      if(!profile.pages||!['all','tires','chassis','notes'].every(key=>Number.isInteger(profile.pages[key])&&profile.pages[key]>=0&&profile.pages[key]<10))throw new Error('Explicit page mapping required');
      if(profile.layouts!==undefined){
        if(typeof profile.layouts!=='object'||profile.layouts===null)throw new Error('Layout map must be an object');
        for(const [key,layout] of Object.entries(profile.layouts)){
          if(!/^[a-z][a-z0-9]*$/.test(key))throw new Error('Layout key must be a lowercase slug');
          if(!Array.isArray(layout?.tokens)||!layout.tokens.length)throw new Error('Layout requires explicit controls');
          if(!layout.tabNames||typeof layout.tabNames!=='object')throw new Error('Layout requires explicit tab names');
          for(const [tab,name] of Object.entries(layout.tabNames)){
            if(!/^\d+$/.test(tab)||!Number.isInteger(Number(tab))||Number(tab)<0||Number(tab)>=10||typeof name!=='string'||!name)
              throw new Error('Layout tab name requires an index below the native tab limit');
          }
          if(!layout.pages||typeof layout.pages!=='object')throw new Error('Layout requires an explicit page mapping');
          for(const [page,tab] of Object.entries(layout.pages)){
            if(!/^[a-z][a-z0-9]*$/.test(page)||!Number.isInteger(tab)||tab<0||tab>=10)throw new Error('Layout page mapping must map slugs to native tab indices');
            if(!(tab in layout.tabNames))throw new Error('Layout page maps to a tab without a recovered native tab name');
          }
        }
      }
      const names=new Set();
      for(const metadata of profile.records){
        if(metadata?._inferred===true||metadata?._source==='inferred-from-patterns')
          throw new Error('Inferred metadata cannot be used in a verified native profile');
        if(typeof metadata?.name!=='string'||!metadata.name||names.has(metadata.name))throw new Error('Missing/duplicate metadata name');
        names.add(metadata.name);
      }
      if(!profile.runtime||profile.runtime.editingEnabled!==false)throw new Error('Profile must explicitly disable editing');
    }
    return catalog;
  }
  function selectProfile(catalog,setup){
    try{validateCatalog(catalog);}catch(error){return fail('invalid-catalog',error.message);}
    if(!setup)return fail('no-setup','No setup loaded');
    const matches=catalog.profiles.filter(profile=>profile.identity.car===setup.car&&profile.identity.stoVersion===setup.version&&profile.identity.contentVersion===setup.contentVersion);
    if(matches.length===1)return {status:'selected',profile:matches[0],complete:false};
    return fail(matches.length?'ambiguous-profile':'no-profile','Exact car/STO/content-version identity required');
  }
  function bindEntries(profile,entries,options={}){
    if(!Array.isArray(entries))throw new Error('Setup entries missing');
    const metadataNames=new Set(profile.records.map(record=>record.name));
    if(metadataNames.size!==profile.records.length)throw new Error('Duplicate metadata name');
    const values=new Map(),unmatched=[];
    for(const entry of entries){
      if(typeof entry?.name!=='string'||!entry.name||values.has(entry.name))throw new Error('Duplicate/missing setup parameter name');
      if(!metadataNames.has(entry.name)){
        // Only the labelled equivalence path may keep a name that the verified profile does not describe.
        if(!options.allowUnmatched)throw new Error('Setup parameter absent from verified profile metadata: '+entry.name);
        unmatched.push({name:entry.name,value:entry.value,line:entry.line});continue;
      }
      // Same finite decimal subset as the documentary reader; no blanks, hex or Infinity.
      if(typeof entry.value!=='string'||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(entry.value))throw new Error('Invalid setup numeric value');
      const value=Number(entry.value);
      if(!Number.isFinite(value)||!Number.isFinite(Math.fround(value)))throw new Error('Setup value outside finite float32');
      values.set(entry.name,{value,original:entry.value,line:entry.line});
    }
    const bindings=new Map();
    for(const metadata of profile.records){
      const source=values.get(metadata.name);
      if(source)bindings.set(metadata.name,{metadata,state:{base:source.value},source});
    }
    return {bindings,unmatched};
  }
  function render(catalog,setup,options={}){
    if(options.comparing||options.filtered)return fail('reference-mode','Comparison/filter uses reference layout');
    if(options.units==='raw')return fail('raw-mode','Original units use reference layout');
    const selected=selectProfile(catalog,setup);
    if(selected.status!=='selected')return selected;
    const profile=selected.profile;
    const layoutKey=typeof options.layout==='string'?options.layout:'garage';
    const layout=layoutKey==='garage'?{tokens:profile.tokens,pages:profile.pages,surface:profile.surface}
      :(profile.layouts&&profile.layouts[layoutKey]?{tokens:profile.layouts[layoutKey].tokens,pages:profile.layouts[layoutKey].pages,surface:undefined}:null);
    if(!layout)return fail('unknown-layout','Requested layout is not part of the verified profile');
    if(!Object.hasOwn(profile.unitSelectors,options.units)||!Object.hasOwn(layout.pages,options.page))return fail('unmapped-view','No explicit unit/page mapping');
    if(!Array.isArray(setup.unparsed)||setup.unparsed.length)return fail('unparsed-setup','Setup contains unparsed rows or unknown parsing status');
    try{
      const renderer=typeof module!=='undefined'&&module.exports?require('./sto-native-renderer.js'):typeof StoNativeRenderer!=='undefined'?StoNativeRenderer:null;
      if(!renderer)throw new Error('Native HTML renderer missing');
      const {bindings,unmatched}=bindEntries(profile,setup.entries,{allowUnmatched:Boolean(selected.equivalence)});
      // Metadata index lets the renderer explain a declared <ni> link when the computed field itself has no state.
      const metadataIndex=new Map(profile.records.map(record=>[record.name,record]));
      const compiled=renderer.compile(layout.tokens,{...profile.runtime,bindings,metadataIndex,unitSelector:profile.unitSelectors[options.units]});
      if(!compiled.supported)return fail('unsupported-controls',compiled.diagnostics);
      const page=renderer.renderHtml(compiled,{activeTab:layout.pages[options.page],width:layout.surface?.width,height:layout.surface?.height,
        // Only the garage layout gets the declared-only list: it explains setup values the file supplies
        // that have no recovered native control, without claiming a native position for them.
        showUnboundSetupValues:layoutKey==='garage'});
      if(selected.equivalence){
        const escapeText=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        const evidence=selected.equivalence.evidence||{};
        const exceptions=Array.isArray(evidence.exceptions)?evidence.exceptions:[];
        const note=['<section class="sto-native-equivalence" data-equivalence-kind="',escapeText(selected.equivalence.kind),
          '" data-requested-car="',escapeText(selected.equivalence.requestedCar),'" data-profile-car="',escapeText(selected.equivalence.profileCar),'">',
          '<h3>Layout nativa condivisa (NextGen)</h3>',
          '<p>Il file dichiara <code>',escapeText(selected.equivalence.requestedCar),'</code>; la superficie nativa viene dal profilo verificato <code>',
          escapeText(selected.equivalence.profileCar),'</code> (',escapeText(evidence.status||'OSSERVATO'),').</p>',
          evidence.basis?['<p>',escapeText(evidence.basis),'</p>']:'',
          exceptions.length?['<p>Eccezioni: ',exceptions.map(escapeText).join(' · '),'</p>']:'',
          unmatched.length?['<p>Nomi scritti dal file ma non descritti dal profilo verificato: ',unmatched.map(item=>escapeText(item.name)).join(', '),'</p>']:'',
          '</section>'].flat().join('');
        page.html=note+page.html;
        page.limitations=Array.isArray(page.limitations)?page.limitations:[];
        page.limitations.push({kind:'nextgen-shared-profile',requestedCar:selected.equivalence.requestedCar,profileCar:selected.equivalence.profileCar,
          detail:evidence.limits||'Equivalence transfers layout, labels, formats and unit conversion only.'});
        if(unmatched.length)page.limitations.push({kind:'equivalence-unmatched-entries',names:unmatched.map(item=>item.name)});
      }
      const tabsOf=key=>{const l=profile.layouts&&profile.layouts[key];
        return l?Object.fromEntries(Object.entries(l.pages).map(([slug,tab])=>[slug,l.tabNames[tab]])):null;};
      return {status:'rendered',profileId:profile.id,sources:profile.sources,page,layout:layoutKey,equivalence:selected.equivalence||null,
        unmatchedNames:unmatched.map(item=>item.name),
        layoutTabs:tabsOf(layoutKey),
        layouts:profile.layouts?Object.fromEntries(Object.keys(profile.layouts).map(key=>[key,{tabs:tabsOf(key)}])):{garage:{tabs:null}},complete:false};
    }catch(error){return fail('invalid-setup-or-profile',error.message);}
  }
  return Object.freeze({validateCatalog,selectProfile,bindEntries,render});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeGarage;
