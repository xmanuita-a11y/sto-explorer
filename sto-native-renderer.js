/* Browser/CommonJS bridge for the reconstructed native generator and formatter.
 * Inputs are explicit structured CML tokens and exact-name metadata/state bindings.
 * This is an HTML presentation adapter, not recovered Noesis/garage source.
 */
const StoNativeRenderer=(()=>{
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function dependencies(){
    const common=typeof module!=='undefined'&&module.exports;
    const generator=common?require('./sto-native-generator.js'):typeof StoNativeGenerator!=='undefined'?StoNativeGenerator:null;
    const formatter=common?require('./sto-native-formatter.js'):typeof StoNativeFormatter!=='undefined'?StoNativeFormatter:null;
    if(!generator||!formatter)throw new Error('Load StoNativeGenerator and StoNativeFormatter before rendering');
    return {generator,formatter};
  }
  function compile(tokens,options={}){
    // A Map makes exact variable identity mandatory, including names such as __proto__.
    // Metadata does not supply current values; state is always a separate input.
    if(!(options.bindings instanceof Map))throw new Error('Supply exact-name bindings as a Map');
    const {generator,formatter}=dependencies();
    const {bindings,...generatorOptions}=options;
    return generator.compile(tokens,{...generatorOptions,formatVariable:(name,formatOptions)=>{
      if(!bindings.has(name))return {status:'unavailable',reason:'No verified metadata/state binding for '+name};
      const binding=bindings.get(name);
      if(!binding?.metadata||!binding.state||binding.metadata.name!==name)
        return {status:'unavailable',reason:'Binding requires matching metadata.name and explicit state'};
      return formatter.format(formatter.fromMetadata(binding.metadata,binding.state),formatOptions);
    }});
  }
  const css=`.sto-native-surface{position:relative;isolation:isolate;overflow:visible;font:16px Arial,sans-serif;color:inherit}
.sto-native-element{position:absolute;box-sizing:border-box;margin:0;white-space:pre;overflow:visible;line-height:normal}
.sto-native-section{background:rgba(128,128,128,.2)}
.sto-native-label{font-weight:bold}
.sto-native-value[data-status="unavailable"],.sto-native-value[data-status="unsupported"]{opacity:.65}
.sto-native-dropdown{border:1px solid currentColor}`;
  function renderHtml(compiled,options={}){
    if(!compiled||!Array.isArray(compiled.controls)||!Array.isArray(compiled.diagnostics))throw new Error('Expected compiled native controls');
    // A partial compile must never masquerade as a complete page.
    if(compiled.supported!==true)throw new Error('Cannot render unsupported/partial native compilation');
    const activeTab=options.activeTab??0;
    if(!Number.isInteger(activeTab)||activeTab<0||activeTab>9)throw new Error('activeTab must be 0..9');
    const diagnostics=[],elements=[];
    let right=0,bottom=0,renderedControls=0;
    function element(control,kind,geometry,text,extra={}){
      if(geometry==null)return;
      if(!['x','y','width','height'].every(key=>Number.isFinite(geometry[key]))||geometry.width<0||geometry.height<0)
        throw new Error('Unresolved/invalid geometry at source index '+control.sourceIndex);
      const {x,y,width,height}=geometry;
      right=Math.max(right,x+width);bottom=Math.max(bottom,y+height);
      const nativeFont=control.nativeDescriptors?.[kind]?.font??control.font;
      const attributes={class:'sto-native-element sto-native-'+kind+(extra.dropdown?' sto-native-dropdown':''),
        'data-source-index':control.sourceIndex,'data-control-tag':control.tag,'data-tab':control.tab,
        'data-variable':kind==='value'?control.variable:undefined,'data-native-font':nativeFont,
        'data-control-type':kind==='value'?control.formatterControlType:undefined,
        'data-native-kind':kind==='value'?control.nativeDescriptors?.value.kind:undefined,
        'data-status':extra.status,'data-value-slot':extra.slot,title:extra.reason??control.info,
        style:`left:${x}px;top:${y}px;width:${width}px;height:${height}px;text-align:${kind==='value'||kind==='text'?['left','right','center'][control.justify??0]:'left'}`};
      elements.push('<div '+Object.entries(attributes).filter(([,v])=>v!==undefined&&v!==null).map(([k,v])=>k+'="'+escape(v)+'"').join(' ')+'>'+escape(text)+'</div>');
    }
    for(const control of compiled.controls){
      // HTML adapter policy: unassigned controls remain visible on each selected tab.
      // This is not evidence of native negative-tab visibility behavior.
      if(control.tab>=0&&control.tab!==activeTab)continue;
      renderedControls++;
      if(control.tag==='textWidget'){
        element(control,'text',control.geometry,control.text);continue;
      }
      if(control.tag==='sectionTitle'){
        element(control,'section',control.background,'');element(control,'label',control.label,control.text);continue;
      }
      element(control,'label',control.label,control.text);
      const formatted=control.formatted;
      const ok=formatted?.status==='ok'&&typeof formatted.text==='string';
      const status=ok?'ok':formatted?.status==='unsupported'?'unsupported':'unavailable';
      const reason=ok?undefined:formatted?.reason??'No supplied formatted value';
      element(control,'value',control.value,ok?formatted.text:(options.unavailableText??'—'),
        {status,reason,slot:ok?formatted.slot:undefined,dropdown:control.nativeDescriptors?.value.kind==='dropdown'});
      if(!ok)diagnostics.push({sourceIndex:control.sourceIndex,variable:control.variable,status,reason});
      if(control.arrows?.length||control.conditionalArrows?.length)
        diagnostics.push({sourceIndex:control.sourceIndex,status:'unresolved-assets',reason:'Arrow asset dimensions are native sentinels; no browser size substituted'});
      const nativeValue=control.nativeDescriptors?.value;
      if(nativeValue?.assets&&Object.keys(nativeValue.assets).length)
        // Informational adapter coverage only: the formatted value remains readable.
        // Asset paths identify recovered descriptors, not verified browser images.
        diagnostics.push({sourceIndex:control.sourceIndex,status:'unresolved-assets',severity:'info',
          nativeKind:nativeValue.kind,assets:{...nativeValue.assets},
          reason:'Native control assets are preserved as metadata; HTML displays read-only formatted text'});
    }
    const width=options.width??Math.max(0,right),height=options.height??Math.max(0,bottom);
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<0||height<0)throw new Error('Invalid HTML surface dimensions');
    return {html:`<div class="sto-native-surface" data-native-complete="false" data-active-tab="${activeTab}" style="width:${width}px;height:${height}px">${elements.join('')}</div>`,
      css,width,height,renderedControls,diagnostics,complete:false,
      limitations:['HTML uses recovered geometry and supplied formatter output; typography/colors are presentation fallbacks',
        'Native Noesis styles, event effects, overlay IDs and arrow asset dimensions remain unresolved',
        'Controls render as read-only text; no setup editing or simulator calculations',
        'Unassigned controls are shown on each HTML tab as an explicit adapter policy',
        'No vehicle catalog, CML source or state is inferred from parameter names']};
  }
  return Object.freeze({compile,renderHtml,css});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeRenderer;
