/* Local catalogs only. No remote translation, locale downloads or file storage. */
const StoI18n = (() => {
  let language='it';
  const missing=new Set();
  const en=typeof STO_EN_CATALOG==='undefined'?{}:STO_EN_CATALOG;
  function t(source,values={}){
    let result=source;
    if(language==='en'){
      if(Object.hasOwn(en,source))result=en[source];
      else if(source && !/^[—ABΔ\s]+$/.test(source))missing.add(source);
    }
    return result.replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??'{'+name+'}'));
  }
  function setLanguage(value){language=value==='en'?'en':'it';}
  function applyStatic(root=document){
    if(root.documentElement)root.documentElement.lang=language;
    for(const element of root.querySelectorAll('[data-i18n]'))element.textContent=t(element.getAttribute('data-i18n'));
    for(const element of root.querySelectorAll('[data-i18n-attrs]')){
      const attributes=JSON.parse(element.getAttribute('data-i18n-attrs'));
      for(const [name,source]of Object.entries(attributes))element.setAttribute(name,t(source));
    }
  }
  function error(message){
    const version=message.match(/^Versione STO (\d+) non supportata: questa versione legge STO v3\.$/);
    return version?t('Versione STO {version} non supportata: questa versione legge STO v3.',{version:version[1]}):t(message);
  }
  return {t,error,setLanguage,applyStatic,missing,get language(){return language;}};
})();
if(typeof module!=='undefined')module.exports=StoI18n;
