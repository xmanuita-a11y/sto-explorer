/* Reconstructed behavior from local static dumps garage4/5/6; no recovered source.
 * Input records are normalized metadata/state, NOT raw STO fields or a car catalog.
 * Browser/CommonJS standalone. Unsupported CRT formats remain explicit.
 */
const StoNativeFormatter = (() => {
  const f = Math.fround;
  const unsupported = reason => ({status:'unsupported', reason});
  function number(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isFinite(f(value)))
      throw new Error(`Missing/nonfinite ${name}`);
    return f(value);
  }
  function selectValue(record, allowPreview = false) {
    // 141308b90..bdd: COMISS 0,dep followed by SETC; nonpositive dep forces base.
    let slot = 'base';
    if (record.dependency == null || number(record.dependency.base,'dependency.base') > 0) {
      if (allowPreview && record.previewActive) slot = 'preview';
      else if (record.alternateActive) slot = 'alternate';
    }
    return {slot, value:number(record[slot],slot)};
  }
  function cvtt(value) {
    const n = Math.trunc(value);
    if (!Number.isFinite(n) || n < -2147483648 || n > 2147483647)
      throw new Error('CVTTSS2SI overflow/indefinite result is not rendered');
    return n;
  }
  function listFor(record, alternateUnits) {
    return alternateUnits ? record.s ?? record.se : record.se ?? record.s;
  }
  function tokenAt(list,index) {
    if (typeof list !== 'string' || /[^\x01-\x7f]/.test(list))
      throw new Error('Lists require non-NUL ASCII; original byte encoding unknown');
    return list.split('\t')[index];
  }
  // Fixed output under default round-to-nearest-even CRT mode, applied to exact f32.
  function fixedEven(value, precision) {
    const buf=new ArrayBuffer(4), view=new DataView(buf);view.setFloat32(0,value,false);
    const bits=view.getUint32(0,false), exponent=(bits>>>23)&255;
    let mantissa=BigInt(bits&0x7fffff), shift;
    if(exponent){mantissa|=0x800000n;shift=exponent-150;}else shift=-149;
    let n=mantissa*10n**BigInt(precision), q;
    if(shift>=0) q=n<<BigInt(shift);
    else {const den=1n<<BigInt(-shift);q=n/den;const rem=n%den;
      if(rem*2n>den || (rem*2n===den && (q&1n)))q++;}
    let digits=q.toString().padStart(precision+1,'0');
    if(precision)digits=digits.slice(0,-precision)+'.'+digits.slice(-precision);
    return (bits>>>31?'-':'')+digits;
  }
  function printfSubset(format, value, type) {
    if(typeof format!=='string')return unsupported('Missing selected format');
    // Literal %% plus one unadorned %d, %f, or %.0f..%.9f conversion only.
    const escaped=format.replace(/%%/g,'\u0000');
    // printf accepts an empty/literal format even when an unused argument is passed.
    if(!escaped.includes('%'))return {status:'ok',text:escaped.replace(/\u0000/g,'%')};
    const matches=[...escaped.matchAll(/%(?:\.(\d))?([df])/g)];
    if(matches.length!==1)return unsupported('CRT format outside supported subset');
    const m=matches[0], remainder=escaped.slice(0,m.index)+escaped.slice(m.index+m[0].length);
    if(remainder.includes('%') || (type===1 && m[2]!=='d') || (type===0 && m[2]!=='f') || (m[2]==='d'&&m[1]!=null))
      return unsupported('Format conversion does not match reconstructed argument type');
    const text=m[2]==='d'?String(value):fixedEven(value,m[1]==null?6:Number(m[1]));
    return {status:'ok', text:(escaped.slice(0,m.index)+text+escaped.slice(m.index+m[0].length)).replace(/\u0000/g,'%')};
  }
  function format(record, options={}) {
    try {
      const control=options.controlType??11, units=options.unitSelector===1;
      const selected=selectValue(record,control===11 && !!options.allowPreview);
      const {value}=selected;
      if(control===7)return {status:'ok',text:value>=0.5?'yes':'no',...selected,route:'control7'};
      if(control===6){
        if(record.type!==2)return unsupported('Control 6 requires record type 2');
        // 14160af8b..afb5 first truncates, then subtracts sign bit iff fractional,
        // converts back to f32 and truncates again: floor for finite in-range input.
        const index=cvtt(Math.floor(f(value+0.5))), text=tokenAt(listFor(record,units),index);
        return text===undefined?unsupported('Control 6 has no selected list item'):{status:'ok',text,...selected,index,route:'control6'};
      }
      if(control!==11)return unsupported('Unreconstructed control type');
      if(record.type===2){
        const min=number(record.min,'min'), max=number(record.max,'max'), list=listFor(record,units);
        if(value<min || value>max || list==null)return {status:'ok',text:`${cvtt(f(value+0.5))} out of range`,...selected,route:'enum-fallback'};
        const index=cvtt(f(f(value+0.5)-min));
        const text=index<0?undefined:tokenAt(list,index);
        // General renderer leaves initial empty buffer if list cannot reach index.
        return {status:'ok',text:text??'',...selected,index,route:'enum'};
      }
      if(record.type!==0 && record.type!==1)return unsupported('Unreconstructed record type');
      const divisor=number(units?record.cm:record.ce,'divisor'), addend=number(units?record.om:record.oe,'addend');
      if(divisor===0)return unsupported('Zero divisor');
      const numeric=f(f(value/divisor)+addend);
      if(!Number.isFinite(numeric))return unsupported('Nonfinite converted value');
      const argument=record.type===1?cvtt(f(numeric+0.5)):numeric;
      const format=units?record.fm:record.fe;
      return {...printfSubset(format,argument,record.type),...selected,numeric,argument,format,route:'numeric',unitBranch:units?'alternate':'default'};
    }catch(error){return unsupported(error.message);}
  }
  function fromMetadata(metadata,state={}) {
    const fields=metadata.fields??{}, a=metadata.attributes??{};
    const mapping={type:'0x290',min:'0x298',max:'0x29c',s:'0x40',se:'0x48',
      fm:'0x250',fe:'0x270',cm:'0x2ec',om:'0x2f0',ce:'0x2f4',oe:'0x2f8'};
    const record={};
    for(const [name,offset] of Object.entries(mapping))
      record[name]=Object.hasOwn(fields,offset)?fields[offset]:a[name];
    if(metadata.type!=null)record.type=metadata.type;
    // Values/edit flags are supplied separately: metadata does not imply STO state.
    return {...record,...state};
  }
  return Object.freeze({selectValue,format,printfSubset,fromMetadata});
})();
if(typeof module!=='undefined' && module.exports)module.exports=StoNativeFormatter;
