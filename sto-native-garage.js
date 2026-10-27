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
      if(!profile.pages||!['all','tires','chassis'].every(key=>Number.isInteger(profile.pages[key])&&profile.pages[key]>=0&&profile.pages[key]<10))throw new Error('Explicit page mapping required');
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
    if(matches.length!==1)return fail(matches.length?'ambiguous-profile':'no-profile','Exact car/STO/content-version identity required');
    return {status:'selected',profile:matches[0],complete:false};
  }
  function bindEntries(profile,entries){
    if(!Array.isArray(entries))throw new Error('Setup entries missing');
    const metadataNames=new Set(profile.records.map(record=>record.name));
    if(metadataNames.size!==profile.records.length)throw new Error('Duplicate metadata name');
    const values=new Map();
    for(const entry of entries){
      if(typeof entry?.name!=='string'||!entry.name||values.has(entry.name))throw new Error('Duplicate/missing setup parameter name');
      if(!metadataNames.has(entry.name))throw new Error('Setup parameter absent from verified profile metadata: '+entry.name);
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
    return bindings;
  }
  function render(catalog,setup,options={}){
    if(options.comparing||options.filtered)return fail('reference-mode','Comparison/filter uses reference layout');
    if(options.units==='raw')return fail('raw-mode','Original units use reference layout');
    const selected=selectProfile(catalog,setup);
    if(selected.status!=='selected')return selected;
    const profile=selected.profile;
    if(!Object.hasOwn(profile.unitSelectors,options.units)||!Object.hasOwn(profile.pages,options.page))return fail('unmapped-view','No explicit unit/page mapping');
    if(!Array.isArray(setup.unparsed)||setup.unparsed.length)return fail('unparsed-setup','Setup contains unparsed rows or unknown parsing status');
    try{
      const renderer=typeof module!=='undefined'&&module.exports?require('./sto-native-renderer.js'):typeof StoNativeRenderer!=='undefined'?StoNativeRenderer:null;
      if(!renderer)throw new Error('Native HTML renderer missing');
      const bindings=bindEntries(profile,setup.entries);
      const compiled=renderer.compile(profile.tokens,{...profile.runtime,bindings,unitSelector:profile.unitSelectors[options.units]});
      if(!compiled.supported)return fail('unsupported-controls',compiled.diagnostics);
      const page=renderer.renderHtml(compiled,{activeTab:profile.pages[options.page],width:profile.surface?.width,height:profile.surface?.height});
      return {status:'rendered',profileId:profile.id,sources:profile.sources,page,complete:false};
    }catch(error){return fail('invalid-setup-or-profile',error.message);}
  }
  return Object.freeze({validateCatalog,selectProfile,bindEntries,render});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeGarage;
