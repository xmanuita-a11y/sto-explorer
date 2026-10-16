/* Partial reconstruction of the CML generator, not a manually arranged garage.
 * Input uses a structured child-tag adapter. Native byte/XML scanner is separate.
 * Recovered geometry: 141d03250, 141cff340, 141cfe850, 141d02c80/141d028e0,
 * plus dropList 141cfd6b0 through the extra module.
 */
const StoNativeGenerator=(()=>{
  'use strict';
  const defaults=()=>({l:10,t:10,w:50,h:20,d:25,tab:-1});
  const int=value=>{
    if(!Number.isInteger(value)||value<-2147483648||value>2147483647)throw new Error('Expected resolved int32');
    return value;
  };
  function position(state,text){
    // Strict subset of the observed wide sscanf format (%C%C%d, ...), seven triples.
    // Malformed/trailing/overflow cases are rejected, not emulated as CRT prefix scans.
    if(typeof text!=='string')throw new Error('pos requires a string');
    const parts=text.split(',');
    if(parts.length>7)throw new Error('At most seven pos commands');
    const commands=parts.map(part=>{
      const m=part.trim().match(/^([dlthw])([+=-])([+-]?\d+)$/);
      if(!m)throw new Error('pos outside reconstructed strict subset');
      return [m[1],m[2],int(Number(m[3]))];
    });
    for(const [key,op,n]of commands)state[key]=op==='='?n:op==='+'?(state[key]+n)|0:(state[key]-n)|0;
  }
  function compile(tokens,options={}){
    if(!Array.isArray(tokens))throw new Error('Expected ordered child-tag adapter tokens');
    const state=defaults(),controls=[],diagnostics=[],tabNames=Array(10).fill('');
    let snapshot=null,tabCount=0;
    const shared=(tag,value)=>{
      if(tag==='pos'){position(state,value);return true;}
      if(tag==='tab'){const n=int(value);if(n>=10)throw new Error('Native tab requires index <10');state.tab=n;return true;}
      if(tag==='webpos')return true; // 141d03250 consumes this child without changing this state.
      return false;
    };
    for(let index=0;index<tokens.length;index++){
      try{
        const token=tokens[index];
        if(!token||typeof token.tag!=='string')throw new Error('Invalid adapter token');
        if(token.tag==='savePosition'){
          if(token.children?.length)throw new Error('savePosition children are outside the supported empty subset');
          // A single snapshot, not a stack; d and tab are intentionally not saved.
          snapshot={l:state.l,t:state.t,w:state.w,h:state.h};continue;
        }
        if(token.tag==='restorePosition'){
          if(token.children?.length)throw new Error('restorePosition children are outside the supported empty subset');
          if(snapshot===null)throw new Error('restorePosition before savePosition');
          Object.assign(state,snapshot);continue;
        }
        if(token.tag==='tabs'){
          for(const child of token.children??[]){
            const m=/^tab([0-9])Name$/.exec(child.tag);
            if(m){if(tabCount>=10)throw new Error('Native tabs count limit');if(typeof child.value!=='string'||child.value.length>30)throw new Error('Tab label outside nontruncated subset');tabNames[Number(m[1])]=child.value;tabCount++;}
          }
          continue;
        }
        if(token.tag==='dropList'){
          const extra=typeof module!=='undefined'&&module.exports?require('./sto-native-generator-extra.js'):
            typeof StoNativeGeneratorExtra!=='undefined'?StoNativeGeneratorExtra:null;
          if(!extra)throw new Error('dropList requires StoNativeGeneratorExtra');
          const descriptor=extra.dropList(token,state,{position,nativeMode:options.nativeMode,resolvedInteractive:options.resolvedInteractive});
          const control={...descriptor,tab:descriptor.position.tab,sourceIndex:index,
            label:{...descriptor.label.geometry},value:{...descriptor.value.geometry},
            nativeDescriptors:{label:descriptor.label,value:descriptor.value,overlay:descriptor.overlay},
            overlay:descriptor.overlay?{...descriptor.overlay.geometry}:null,
            formatterControlType:descriptor.value.payload.controlType};
          if(typeof options.formatVariable==='function')control.formatted=options.formatVariable(descriptor.variable,{controlType:control.formatterControlType,unitSelector:options.unitSelector??0});
          Object.assign(state,descriptor.position);
          controls.push(control);continue;
        }
        if(!['spinInput','output','sectionTitle'].includes(token.tag))throw new Error('Control tag not yet reconstructed: '+token.tag);
        if(!Array.isArray(token.children))throw new Error('Expected ordered child tags');
        const model={text:'',info:'',variable:null,justify:0,selectable:true,driverOnly:false};
        for(const child of token.children){
          if(shared(child.tag,child.value))continue;
          if(['text','info','var'].includes(child.tag)&&!(token.tag==='sectionTitle'&&child.tag==='var')){
            if(typeof child.value!=='string'||/[^\x01-\x7f]/.test(child.value))throw new Error('Control strings outside ASCII adapter subset');
            if(child.value.length>1023)throw new Error('Control text exceeds bounded subset');
            model[child.tag==='var'?'variable':child.tag]=child.value;
          }else if(child.tag==='justify'&&token.tag!=='sectionTitle'){
            if(!Object.hasOwn({left:0,right:1,center:2},child.value))throw new Error('Unknown justify');
            model.justify={left:0,right:1,center:2}[child.value];
          }else if(child.tag==='notSelectable'&&token.tag==='spinInput')model.selectable=false;
          else if(child.tag==='driverOnly'&&token.tag==='spinInput')model.driverOnly=true;
          else throw new Error('Child not reconstructed: '+child.tag);
        }
        const {l:x,t:y,w,h:height,d}=state;
        if(token.tag==='sectionTitle'){
          controls.push({tag:token.tag,text:model.text,info:model.info,tab:state.tab,
            background:{x,y,width:w,height:29},label:{x:x+10,y:y+3,width:w,height},
            font:'Square721_BdEx_BT_16.bff',position:{...state},sourceIndex:index});
          continue;
        }
        if(!model.variable)throw new Error('Native variable binding missing');
        const spin=token.tag==='spinInput';
        const label=(spin||model.text!=='')?{x,y,width:d-4,height}:null;
        const value={x:x+d+(spin?25:4),y,width:w-d-(spin?58:4),height};
        // -1/-1 are native asset-size sentinels, not measured browser dimensions.
        const arrowDescriptors=spin?[{action:5,x:x+d+4,y:y+1,width:-1,height:-1},{action:4,x:x+w-29,y:y+1,width:-1,height:-1}]:[];
        const arrows=options.editingEnabled===true?arrowDescriptors:[];
        const control={tag:token.tag,...model,tab:state.tab,label,value,arrows,conditionalArrows:options.editingEnabled===undefined?arrowDescriptors:[],formatterControlType:11,position:{...state},sourceIndex:index};
        if(typeof options.formatVariable==='function')control.formatted=options.formatVariable(model.variable,{controlType:11,unitSelector:options.unitSelector??0});
        controls.push(control);
      }catch(error){diagnostics.push({index,reason:error.message});break;}
    }
    return {controls,tabNames,tabCount,state:{...state},diagnostics,supported:diagnostics.length===0,complete:false,
      inputContract:'ordered-child-tag-adapter',limitations:['Native source tokenizer and numeric scanner not emulated','Only sectionTitle/spinInput/output/dropList geometry and tabs/save/restore supported','dropList requires resolved nativeMode and interaction decision; native descriptors retained separately','No recovered vehicle CML or metadata catalog','Runtime key registry, event side effects, IDs, Noesis style resolution and physics are outside this model']};
  }
  return Object.freeze({defaults,position,compile});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeGenerator;
