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
  return Object.freeze({dropList});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeGeneratorExtra;
