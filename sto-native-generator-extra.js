/* DropList model from 141cfd6b0..141cfe83f; structured child-tag adapter only.
 * Native tokenizer, allocation failures, callbacks and live Noesis bridge excluded.
 */
const StoNativeGeneratorExtra=(()=>{
  'use strict';
  const font='Myriad_Pro_bold_16.bff';
  const isInt32=value=>Number.isInteger(value)&&value>=-2147483648&&value<=2147483647;
  function dropList(token,initialState,options={}){
    if(token?.tag!=='dropList'||!Array.isArray(token.children))throw new Error('Expected dropList ordered child-tag adapter');
    if(typeof options.position!=='function')throw new Error('Supply the recovered common position parser');
    const state={...initialState};
    for(const key of ['l','t','w','h','d','tab'])if(!isInt32(state[key]))throw new Error('Resolved int32 state required');
    if(state.tab>=10)throw new Error('Native tab requires int32 below 10');
    const model={text:'',info:'',variable:null,dropHeight:300,selectable:true,driverOnly:false};
    for(const child of token.children){
      if(child.tag==='pos'){options.position(state,child.value);continue;}
      if(child.tag==='tab'){
        if(!isInt32(child.value)||child.value>=10)throw new Error('Native tab requires int32 below 10');
        state.tab=child.value;continue;
      }
      if(child.tag==='webpos')continue;
      if(['text','info','var'].includes(child.tag)){
        if(typeof child.value!=='string'||/[^\x01-\x7f]/.test(child.value)||child.value.length>1023)throw new Error('Outside bounded ASCII string subset');
        model[child.tag==='var'?'variable':child.tag]=child.value;continue;
      }
      if(child.tag==='dropHeight'){
        if(!Number.isInteger(child.value)||child.value< -2147483648||child.value>2147483647)throw new Error('dropHeight requires resolved int32');
        model.dropHeight=child.value;continue;
      }
      if(child.tag==='notSelectable'){model.selectable=false;continue;}
      if(child.tag==='driverOnly'){model.driverOnly=true;continue;}
      throw new Error('Child outside reconstructed dropList: '+child.tag);
    }
    for(const key of ['l','t','w','h','d','tab'])if(!isInt32(state[key]))throw new Error('Position parser returned state outside int32');
    if(!model.variable)throw new Error('Native variable binding missing');
    if(options.nativeMode!==0&&options.nativeMode!==1)throw new Error('Resolve native global 15e47d614 as 0 or 1');
    if(typeof options.resolvedInteractive!=='boolean')throw new Error('Resolve native default/callback result explicitly');
    const {l:x,t:y,w,h:height,d,tab}=state;
    const common={font,tab,driverOnly:model.driverOnly};
    const label={...common,geometry:{x,y,width:d-4,height},text:model.text,info:model.info,
      payload:{action:2,controlType:11,variable:null,linkedControlId:-1,tab}};
    let value;
    if(options.resolvedInteractive){
      value={...common,kind:'dropdown',geometry:{x:x+d+4-(options.nativeMode===1?4:0),y,width:w-d-4,height},
        payload:{action:6,controlType:11,variable:model.variable,tab},
        nativeFixedField500:500,
        assets:{down:'widget\\btn_dd_down.stp',up:'widget\\btn_dd_up.stp',disabled:'garage\\sm_arrow_dn_d.stp',
          selected:'garage\\sm_arrow_dn_s.stp',hover:'garage\\sm_arrow_dn_h.stp',normal:'garage\\sm_arrow_dn_n.stp'}};
    }else{
      value={...common,kind:'text',geometry:{x:x+d+4,y,width:w-d-4,height},
        payload:{action:3,controlType:6,variable:model.variable,tab}};
    }
    const overlay=model.selectable&&options.nativeMode===1?{
      geometry:{x,y,width:w,height},payload:{action:10,controlType:11,variable:null,tab},opacity:1}:null;
    return {tag:'dropList',...model,position:state,label,value,overlay,complete:false,
      inputContract:'ordered-child-tag-adapter',
      limitations:['Runtime IDs, color globals and Noesis properties remain unresolved',
        'Interaction default/callback result supplied explicitly; not inferred from setup',
        'Native printf/int scanning and allocation failures not emulated',
        'dropHeight reaches Noesis bridge; not substituted for fixed legacy descriptor field 500']};
  }
  // checkBox: garage-fields1 static dump 141cfc430..141cfd6a9; not a live checked-state implementation.
  function checkBox(token,initialState,options={}){
  if(token?.tag!=='checkBox'||!Array.isArray(token.children))throw Error('Expected ordered checkBox child tags');
  if(typeof options.position!=='function')throw Error('Supply recovered common position parser');
  if(![0,1].includes(options.nativeMode)||typeof options.resolvedInteractive!=='boolean')throw Error('Explicit nativeMode and resolvedInteractive required');
  const state={...initialState}, model={text:'',text_r:'',info:'',variable:null,selectable:true,driverOnly:false};
  for(const child of token.children){
    if(child.tag==='pos'){options.position(state,child.value);continue;}
    if(child.tag==='tab'){if(!isInt32(child.value)||child.value>=10)throw Error('Invalid tab');state.tab=child.value;continue;}
    if(child.tag==='webpos')continue;
    if(['text','text_r','info','var'].includes(child.tag)){
      if(typeof child.value!=='string'||/[^\x01-\x7f]/.test(child.value)||child.value.length>1023)throw Error('Outside bounded ASCII subset');
      model[child.tag==='var'?'variable':child.tag]=child.value;continue;
    }
    if(child.tag==='notSelectable'){model.selectable=false;continue;}
    if(child.tag==='driverOnly'){model.driverOnly=true;continue;}
    throw Error('Unreconstructed checkBox child: '+child.tag);
  }
  if(!['l','t','w','h','d','tab'].every(k=>isInt32(state[k]))||state.tab>=10)throw Error('Explicit int32 geometry required');
  if(!model.variable)throw Error('Variable binding required');
  const {l:x,t:y,w,h:height,d,tab}=state, interactive=options.resolvedInteractive;
  const common={font:'Myriad_Pro_bold_16.bff',tab,driverOnly:model.driverOnly};
  const label={...common,text:model.text,info:model.info,geometry:{x,y,width:d-4,height},payload:{action:2,controlType:11,variable:null,linkedControlId:-1,tab}};
  const value={...common,kind:interactive?'checkbox':'text',geometry:{x:x+d+4,y:y+(interactive?2:0),width:w-d-4,height},
    payload:{action:interactive?7:3,controlType:interactive?11:7,variable:model.variable,tab},
    linkedControlId:'runtime-value-control-id'};
  if(interactive){
    // text_r influences descriptor flags and is passed as text. It does not prove checked state.
    value.text_r=model.text_r;
    value.nativeDescriptorFields={field0xc4:model.text_r?21:0,field0xc8:model.text_r?-1:0};
    value.assets=Object.fromEntries(['cd','cs','ch','cn','d','s','h','n'].map(s=>[s,'garage\\sm_chk_box_'+s+'.stp']));
  }
  const overlay=model.selectable&&options.nativeMode===1?{geometry:{x,y,width:w,height},opacity:1,
    payload:{action:10,controlType:11,variable:null,linkedControlId:'runtime-value-control-id',tab}}:null;
  return {tag:'checkBox',...model,position:state,label,value,overlay,
    nativeColorGlobals:options.nativeMode===0?{text:'0x15c244954',checkbox:'0x15c244958'}:{text:'0x15c244960',checkbox:'0x15c244964'},
    complete:false,inputContract:'ordered-child-tag-adapter',
    limitations:['No vehicle catalog or CML recovered','Interaction result supplied explicitly; default byte 142d425fd and callback 1523e5638 not executed',
      'Checked state and meaning of text_r descriptor flags unresolved','Runtime IDs, payload param_7, colors, asset sizes, allocation failures and Noesis property identities unresolved',
      'Native numeric scanning and full Unicode conversion excluded']};
}

  // textWidget 141d01ee0..141d028cd; geometry stores verified against assembly.
  function textWidget(token,initialState,options={}){
    if(token?.tag!=='textWidget'||!Array.isArray(token.children))throw new Error('Expected textWidget ordered child tags');
    if(typeof options.position!=='function'||![0,1].includes(options.nativeMode))throw new Error('Supply position parser and explicit nativeMode');
    const state={...initialState},model={text:'',info:'',font:'Myriad_Pro_bold_16.bff',justify:0};
    for(const child of token.children){
      if(child.tag==='pos'){options.position(state,child.value);continue;}
      if(child.tag==='tab'){if(!isInt32(child.value)||child.value>=10)throw new Error('Invalid tab');state.tab=child.value;continue;}
      if(child.tag==='webpos')continue;
      if(['text','info','font'].includes(child.tag)){
        if(typeof child.value!=='string'||/[^\x01-\x7f]/.test(child.value)||child.value.length>1023)throw new Error('Outside bounded ASCII adapter subset');
        model[child.tag]=child.value;continue;
      }
      if(child.tag==='justify'){
        if(!Object.hasOwn({left:0,right:1,center:2},child.value))throw new Error('Unknown textWidget justify');
        model.justify={left:0,right:1,center:2}[child.value];continue;
      }
      throw new Error('Child outside reconstructed textWidget: '+child.tag);
    }
    if(!['l','t','w','h','d','tab'].every(key=>isInt32(state[key]))||state.tab>=10)throw new Error('Explicit int32 state required');
    const geometry={x:state.l,y:state.t,width:state.w,height:state.h};
    const text={geometry,font:model.font,justify:model.justify,
      payload:{action:0,controlType:11,variable:null,linkedControlId:-1,tab:state.tab},
      colorGlobal:options.nativeMode===0?'0x15c244954':'0x15c244960'};
    return {tag:'textWidget',...model,geometry,position:state,nativeDescriptors:{text},complete:false,
      limitations:['Structured child-tag adapter only; no native tokenization or allocation failures',
        'Font name is preserved metadata; browser uses fallback typography',
        'Noesis bridge offsets, text processing, runtime IDs and colors unresolved']};
  }
  return Object.freeze({dropList,checkBox,textWidget});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeGeneratorExtra;
