/* Browser/CommonJS bridge for the reconstructed native generator and formatter.
 * Inputs are explicit structured CML tokens and exact-name metadata/state bindings.
 * This is an HTML presentation adapter, not recovered Noesis/garage source.
 */
const StoNativeRenderer=(()=>{
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  // Presentation-only localization: the app exposes StoI18n in the same script scope; without it (for
  // example in Node harnesses) the Italian source text is used unchanged.
  function localize(source){
    try{
      const i18n=typeof StoI18n!=='undefined'?StoI18n:typeof module!=='undefined'&&module.exports?require('./sto-reader-i18n.js'):null;
      if(i18n&&typeof i18n.t==='function')return i18n.t(source);
    }catch(error){/* localization failures never change rendered values */}
    return source;
  }
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
    const {bindings,metadataIndex,...generatorOptions}=options;
    if(metadataIndex!==undefined&&!(metadataIndex instanceof Map))throw new Error('Metadata index must be a Map when supplied');
    const compiled=generator.compile(tokens,{...generatorOptions,formatVariable:(name,formatOptions)=>{
      if(!bindings.has(name)){
        // A declared <ni> link is recovered metadata: it names the setup variable the simulation derives this
        // field from. The linked value is reported as the linked variable's own value, never as this field's.
        const linked=typeof metadataIndex?.get(name)?.linkedInput==='string'?metadataIndex.get(name).linkedInput:undefined;
        if(linked!==undefined){
          const linkedBinding=bindings.get(linked);
          const usable=linkedBinding?.metadata&&linkedBinding.state&&linkedBinding.metadata.name===linked;
          const linkedFormatted=usable?formatter.format(formatter.fromMetadata(linkedBinding.metadata,linkedBinding.state),formatOptions):null;
          const text=linkedFormatted?.status==='ok'&&typeof linkedFormatted.text==='string'?linkedFormatted.text:undefined;
          return {status:'unavailable',reason:text===undefined
            ?'Computed by the simulation; declared link to '+linked+' has no supplied formatted value'
            :'Computed by the simulation; declared link to '+linked+' (supplied value: '+text+')',
            linkedVariable:linked,...(text===undefined?{}:{linkedValueText:text})};
        }
        return {status:'unavailable',reason:'No verified metadata/state binding for '+name};
      }
      const binding=bindings.get(name);
      if(!binding?.metadata||!binding.state||binding.metadata.name!==name)
        return {status:'unavailable',reason:'Binding requires matching metadata.name and explicit state'};
      return formatter.format(formatter.fromMetadata(binding.metadata,binding.state),formatOptions);
    }});
    // Setup values this file supplies but no recovered native control displays. They keep their verified
    // profile metadata; no native position is invented for them, they are listed outside the native surface.
    const layoutVariables=new Set(compiled.controls.map(control=>control?.variable).filter(name=>typeof name==='string'));
    compiled.declaredOnly=[...bindings.entries()]
      .filter(([name,binding])=>!layoutVariables.has(name)&&binding?.metadata&&binding.state&&binding.metadata.name===name)
      .map(([name,binding])=>{
        const units=generatorOptions.unitSelector===1;
        const formatted=formatter.format(formatter.fromMetadata(binding.metadata,binding.state),{unitSelector:generatorOptions.unitSelector});
        const declaredList=units?binding.metadata.attributes?.s??binding.metadata.attributes?.se
          :binding.metadata.attributes?.se??binding.metadata.attributes?.s;
        return {name,text:formatted?.status==='ok'?formatted.text:undefined,status:formatted?.status,reason:formatted?.reason,
          raw:binding.state.base,
          ...(typeof declaredList==='string'?{enumList:declaredList.split('\t')}:{})};
      })
      .sort((left,right)=>left.name<right.name?-1:left.name>right.name?1:0);
    return compiled;
  }
  const css=`.sto-native-surface{position:relative;isolation:isolate;overflow:visible;font:16px Arial,sans-serif;color:inherit}
.sto-native-element{position:absolute;box-sizing:border-box;margin:0;white-space:pre;overflow:visible;line-height:normal}
.sto-native-section{background:rgba(128,128,128,.2)}
.sto-native-label{font-weight:bold}
.sto-native-value[data-status="unavailable"],.sto-native-value[data-status="unsupported"]{opacity:.65}
.sto-native-dropdown{border:1px solid currentColor}
.sto-native-equivalence{margin:0 0 12px;padding:10px 12px;border:1px solid #4d3f22;border-left:3px solid #d8a13a;border-radius:9px;background:#211d14;font:13px Arial,sans-serif}
.sto-native-equivalence h3{margin:0 0 6px;font-size:13px;color:#f0c674}
.sto-native-equivalence p{margin:0 0 6px;color:#c9c3b4;font-size:12px}
.sto-native-equivalence code{font-family:ui-monospace,Consolas,monospace;color:#e8e2d4}`;
  function renderHtml(compiled,options={}){
    if(!compiled||!Array.isArray(compiled.controls)||!Array.isArray(compiled.diagnostics))throw new Error('Expected compiled native controls');
    // A partial compile must never masquerade as a complete page.
    if(compiled.supported!==true)throw new Error('Cannot render unsupported/partial native compilation');
    const activeTab=options.activeTab??0;
    if(!Number.isInteger(activeTab)||activeTab<0||activeTab>9)throw new Error('activeTab must be 0..9');
    const diagnostics=[],elements=[];
    let right=0,bottom=0,renderedControls=0;
    // Adapter-only left inset: a label anchored at its native box right edge (x + (d-4)) can hang
    // left of the native surface origin whenever d=0, which is every recovered garage row. The
    // text extent below is a presentation estimate (the native font metrics are not recovered);
    // all native relative positions are preserved and the inset is reported on the surface.
    const estimate=text=>Math.ceil(String(text).length*9.6);
    let inset=0,originX=0,originY=0;
    for(const control of compiled.controls){
      if(control.tab>=0&&control.tab!==activeTab)continue;
      const geometry=control.label;
      if(geometry==null||geometry.width>=0)continue;
      inset=Math.max(inset,Math.ceil(-(geometry.x+geometry.width-estimate(control.text))));
    }
    // Recovered layouts use signed cursor coordinates: blackBox columns start at negative l
    // (for example l=-195) and every tab group jumps back with an absolute t=-24 before its
    // first row. The adapter shifts the whole recovered layout so its lowest native coordinate
    // becomes the surface origin; all native relative offsets between controls stay intact.
    for(const control of compiled.controls){
      if(control.tab>=0&&control.tab!==activeTab)continue;
      for(const geometry of [control.label,control.value,control.geometry,control.background]){
        if(geometry==null||!Number.isFinite(geometry.x)||!Number.isFinite(geometry.y))continue;
        originX=Math.min(originX,geometry.x,geometry.x+(geometry.width<0?geometry.width:0));
        originY=Math.min(originY,geometry.y);
      }
    }
    if(originX<0)inset+=-originX;
    const topShift=-originY;
    function element(control,kind,geometry,text,extra={}){
      if(geometry==null)return;
      if(!['x','y','width','height'].every(key=>Number.isFinite(geometry[key])))
        throw new Error('Unresolved/invalid geometry at source index '+control.sourceIndex);
      const {width,height}=geometry,xr=geometry.x-originX,yr=geometry.y-originY,x=xr+inset,y=yr;
      // Native descriptors carry negative sizes as sentinels: spinInput arrows are written with
      // -1/-1 asset sentinels and label descriptors are written as d-4, which is negative for the
      // recovered CML rows that set d=0 (FUN_141cfe850 writes width = DAT_151917058 - 4).
      // Native size resolution is not recovered, so those boxes are auto-sized by the HTML adapter
      // instead of inventing pixel extents; the raw native values stay in data attributes.
      // Recovered descriptor geometry (FUN_141cfe850/FUN_141cff340/FUN_141d02fa0 family):
      //   label box  x = l,          width = d - 4
      //   value box  x = l + d + 4,  width = w - d - 4
      // so every label box right edge (l + d - 4) sits exactly 8 px before its value box left
      // edge, and d is the label column width. The HTML adapter therefore right-aligns labels to
      // their native box right edge (anchoring at x + width when that width is the d-4 sentinel)
      // and keeps values left-aligned at their native box left edge. Native text-alignment fields
      // are not recovered: this placement is an INFERITO adapter policy, not native evidence.
      const autoWidth=width<0,autoHeight=height<0;
      // Only sentinel-size labels (native width = d - 4 < 0) are right-anchored at their native
      // right edge. A label with a recovered positive width is a real native text box and keeps
      // its own left edge and width; native alignment fields are unrecovered, so it is drawn
      // left-aligned inside that box (adapter inference).
      const labelAnchor=kind==='label'&&width<0;
      if(autoWidth||autoHeight)diagnostics.push({sourceIndex:control.sourceIndex,kind,status:'native-auto-size',
        severity:'info',nativeWidth:width,nativeHeight:height,
        reason:'Native descriptor size is a negative sentinel; native size resolution unrecovered, HTML auto-sizes'+(labelAnchor?' and anchors the text at its native box right edge':'')});
      if(!autoWidth)right=Math.max(right,xr+width);
      if(!autoHeight)bottom=Math.max(bottom,yr+height);
      const nativeFont=control.nativeDescriptors?.[kind]?.font??control.font;
      const attributes={class:'sto-native-element sto-native-'+kind+(extra.dropdown?' sto-native-dropdown':'')+(autoWidth||autoHeight?' sto-native-auto':''),
        'data-source-index':control.sourceIndex,'data-control-tag':control.tag,'data-tab':control.tab,
        'data-variable':kind==='value'?control.variable:undefined,
        'data-linked-variable':kind==='value'?extra.linkedVariable:undefined,
        'data-native-font':nativeFont,
        'data-control-type':kind==='value'?control.formatterControlType:undefined,
        'data-native-kind':kind==='value'?control.nativeDescriptors?.value.kind:undefined,
        'data-native-width':width,'data-native-height':height,
        'data-status':extra.status,'data-value-slot':extra.slot,title:extra.reason??control.info,
        style:`${labelAnchor?`left:${width<0?x+width:x}px;transform:translateX(-100%)`:`left:${x}px`};top:${y}px;${autoWidth?'width:auto':`width:${width}px`};${autoHeight?'height:auto':`height:${height}px`};text-align:${labelAnchor?'right':(kind==='value'||kind==='text'?['left','right','center'][control.justify??0]:'left')}`};
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
        {status,reason,slot:ok?formatted.slot:undefined,linkedVariable:formatted?.linkedVariable,
         dropdown:control.nativeDescriptors?.value.kind==='dropdown'});
      if(!ok)diagnostics.push({sourceIndex:control.sourceIndex,variable:control.variable,status,reason,
        ...(typeof formatted?.linkedVariable==='string'?{linkedVariable:formatted.linkedVariable,linkedValueText:formatted.linkedValueText}:{})});
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
    const declared=options.showUnboundSetupValues&&Array.isArray(compiled.declaredOnly)
      ?compiled.declaredOnly.filter(item=>item&&typeof item.name==='string'):[];
    const declaredSection=declared.length?`<section class="sto-native-declared-only" data-declared-only-count="${declared.length}"><h3>${escape(localize('Valori di setup presenti nel file ma non esposti dal garage nativo'))}</h3><p>${escape(localize('Sola lettura, dai metadati del profilo verificato. Queste variabili non hanno un controllo nativo recuperato, quindi non viene inventata nessuna posizione nativa. Se il profilo non dichiara un formato viene mostrato il valore grezzo del file, con l’elenco delle opzioni quando esiste.'))}</p><ul>${declared.map(item=>`<li data-variable="${escape(item.name)}"><span>${escape(item.name)}</span>${item.text===undefined?`<b class="sto-native-declared-unformatted">${escape(String(item.raw))}${Array.isArray(item.enumList)?' · '+escape(item.enumList.join(' | ')):''}</b>`:`<b>${escape(item.text)}</b>`}</li>`).join('')}</ul></section>`:'';
    const declaredCss=declared.length?'.sto-native-declared-only{margin-top:14px;padding:12px 14px;border:1px solid #363741;border-radius:9px;background:#191a22;font:13px Arial,sans-serif}.sto-native-declared-only h3{margin:0 0 6px;font-size:13px}.sto-native-declared-only p{margin:0 0 8px;color:#8e93a3;font-size:12px}.sto-native-declared-only ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:4px 14px}.sto-native-declared-only li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #2a2c35;padding:3px 0}.sto-native-declared-only li span{font-family:ui-monospace,Consolas,monospace;color:#8e93a3}.sto-native-declared-only li b{font-family:ui-monospace,Consolas,monospace}.sto-native-declared-unformatted{color:#ffc6c6}':'';
    const width=(options.width??Math.max(0,right))+inset,height=options.height??Math.max(0,bottom);
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<0||height<0)throw new Error('Invalid HTML surface dimensions');
    return {html:`<div class="sto-native-surface" data-native-complete="false" data-native-left-inset="${inset}" data-native-origin-shift-x="${originX<0?-originX:0}" data-native-origin-shift-y="${topShift}" data-active-tab="${activeTab}" style="width:${width}px;height:${height}px">${elements.join('')}</div>${declaredSection}`,
      css:css+declaredCss,width,height,leftInset:inset,activeTab,originShift:{x:originX<0?-originX:0,y:topShift},renderedControls,diagnostics,complete:false,
      declaredOnly:declared,
      limitations:['HTML uses recovered geometry and supplied formatter output; typography/colors are presentation fallbacks',
        'Recovered value boxes are native clip regions (x = l + d + 4, width = w - d - 4), so controls that only advance d (for example d+24 or d+53 rows) legitimately nest inside the same row region; their texts start at distinct column offsets and the box rectangles are expected to overlap',
        'Recovered layouts use signed cursor coordinates; the surface origin is shifted to the lowest recovered native coordinate (data-native-origin-shift-*) so negative-column and tab-jump rows fit. The shift is an adapter choice, not a recovered native surface size',
        'Right-anchored labels are shifted right by a measured-in-advance text-extent estimate (data-native-left-inset) so they stay inside the surface; the estimate is presentation-only, native font metrics are not recovered',
        'Native descriptor sizes that are negative sentinels (arrow -1/-1, label d-4 with d=0) are HTML auto-sized; native size resolution unrecovered',
        'Labels are right-aligned to their recovered native box right edge (x + native width, sentinel included) and values stay left-aligned at their native box left edge; the recovered geometry puts every label right edge 8 px before its value left edge, but native text-alignment fields are unrecovered, so this placement is an adapter inference',
        'Native Noesis styles, event effects, overlay IDs and arrow asset dimensions remain unresolved',
        'Controls render as read-only text; no setup editing or simulator calculations',
        'Unassigned controls are shown on each HTML tab as an explicit adapter policy',
        'No vehicle catalog, CML source or state is inferred from parameter names'].concat(declared.length?['Setup values with no recovered native control are listed in a separate declared-only section outside the native surface; no native position is invented for them']:[])};
  }
  return Object.freeze({compile,renderHtml,css});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeRenderer;
