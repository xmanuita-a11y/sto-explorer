/* Read-only parser for the explicitly supported iRacing HTML setup export.
 * Returns inert strings. Consumers must render them with textContent/escaping.
 * Export order is document order, not evidence of native Garage geometry.
 */
const StoNativeExport=(()=>{
  'use strict';
  const limits=Object.freeze({bytes:1048576,sections:128,rows:512,valuesPerRow:16,text:4096,notes:65536,tokens:20000});
  const fail=message=>{throw new Error('iRacing export: '+message);};
  function bounded(value,max=limits.text){
    if(typeof value!=='string'||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))fail('invalid or oversized text');
    return value;
  }
  function decode(value){
    return value.replace(/&([^;\s<&]{1,32});/g,(whole,name)=>{
      const named={amp:'&',lt:'<',gt:'>',quot:'"',nbsp:'\u00a0',apos:"'"};
      if(Object.hasOwn(named,name))return named[name];
      if(!/^#(?:[0-9]{1,7}|x[0-9a-f]{1,6})$/i.test(name))fail('unsupported character entity');
      const n=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):Number(name.slice(1));
      if(!Number.isInteger(n)||n<32&&![9,10,13].includes(n)||n===127||n>0x10ffff||n>=0xd800&&n<=0xdfff)fail('invalid character entity');
      return String.fromCodePoint(n);
    });
  }
  function attributes(source){
    const attrs=Object.create(null);let rest=source;
    while(rest.trim()){
      const m=/^\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rest);
      if(!m)fail('unsupported attribute syntax');
      const key=m[1].toLowerCase();if(Object.hasOwn(attrs,key))fail('duplicate attribute');
      attrs[key]=decode(m[2]??m[3]);rest=rest.slice(m[0].length);
    }
    return attrs;
  }
  function parse(html){
    if(typeof html!=='string'||html.length>limits.bytes||new TextEncoder().encode(html).length>limits.bytes)fail('input exceeds 1 MiB');
    bounded(html,limits.bytes);
    const result={car:'',setupName:'',track:'',sections:[],notes:'',complete:false};
    let pos=0,tokens=0,generator=false,body=false,ended=false,heading=null,under=null,section=null,pending='',notes=false,headerSeen=false,totalRows=0;
    const stack=[];
    function text(value){
      value=decode(value);
      if(heading!==null){heading+=value;bounded(heading);}
      else if(under!==null){under+=value;bounded(under);}
      else if(body){
        if(notes){result.notes+=value;bounded(result.notes,limits.notes);}
        else {pending+=value;bounded(pending);}
      }else if(!stack.includes('title')&&value.trim())fail('text outside supported body');
    }
    function finishHeading(){
      const title=heading.trim();heading=null;
      if(!headerSeen){
        const lines=title.split('\n').map(s=>s.trim()).filter(Boolean);
        if(lines.length!==3||lines[0]!=='iRacing.com Motorsport Simulations')fail('missing export identity header');
        const car=/^(.+?) setup:\s*(.+)$/.exec(lines[1]),track=/^track:\s*(.+)$/.exec(lines[2]);
        if(!car||!track)fail('missing car, setup or track identity');
        result.car=bounded(car[1].trim(),256);result.setupName=bounded(car[2].trim(),512);result.track=bounded(track[1].trim(),256);
        headerSeen=true;return;
      }
      if(!title||title.includes('\n'))fail('invalid section heading');
      if(notes)fail('notes must be the final section');
      if(/^Notes:$/i.test(title)){notes=true;section=null;return;}
      if(result.sections.length>=limits.sections)fail('section budget exceeded');
      section={ordinal:result.sections.length,title:bounded(title),rows:[]};result.sections.push(section);
    }
    function finishValue(){
      if(!section||notes)fail('value outside a section');
      const value=bounded(under);under=null;
      if(!value.trim())fail('empty underlined value');
      const label=pending.trim();pending='';let row;
      if(label){
        if(!label.endsWith(':'))fail('value requires a colon-delimited label');
        const name=bounded(label.slice(0,-1).trim());if(!name)fail('empty row label');
        if(++totalRows>limits.rows)fail('row budget exceeded');
        row={label:name,values:[]};section.rows.push(row);
      }else{row=section.rows[section.rows.length-1];if(!row)fail('unlabelled first value');}
      if(row.values.length>=limits.valuesPerRow)fail('value budget exceeded');row.values.push(value);
    }
    while(pos<html.length){
      if(++tokens>limits.tokens)fail('token budget exceeded');
      if(html[pos]!=='<'){const end=html.indexOf('<',pos);const next=end<0?html.length:end;text(html.slice(pos,next));pos=next;continue;}
      const end=html.indexOf('>',pos+1);if(end<0)fail('unterminated tag');
      const token=html.slice(pos,end+1);pos=end+1;
      if(/^<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4\.0 Transitional\/\/EN">$/i.test(token)||/^<!doctype html>$/i.test(token)){
        if(stack.length||body||headerSeen)fail('misplaced doctype');continue;
      }
      const m=/^<(\/)?([a-z][a-z0-9]*)([\s\S]*?)>$/i.exec(token);if(!m)fail('unsupported markup');
      const close=!!m[1],tag=m[2].toLowerCase();let tail=m[3];
      if(!['html','head','title','meta','body','h2','u','br'].includes(tag))fail('unsupported or active tag '+tag);
      if(close){
        if(tail.trim()||['meta','br'].includes(tag)||stack.pop()!==tag)fail('unbalanced closing tag');
        if(tag==='u'&&heading===null)finishValue();
        if(tag==='h2')finishHeading();
        if(tag==='body'){if(pending.trim())fail('unconsumed body text');body=false;ended=true;}
        continue;
      }
      const self=/\/\s*$/.test(tail);if(self)tail=tail.replace(/\/\s*$/,'');
      if(self&&!['meta','br'].includes(tag))fail('unsupported self-closing tag');
      const attrs=attributes(tail),keys=Object.keys(attrs);
      if(tag==='meta'){
        if(stack.at(-1)!=='head'||keys.length!==2||attrs.name!=='GENERATOR'||attrs.content!=='iRacing.com Simulator')fail('unsupported metadata');
        if(generator)fail('duplicate generator marker');generator=true;continue;
      }
      if(tag==='h2'){
        if(keys.some(k=>k!=='align')||attrs.align!=null&&attrs.align.toLowerCase()!=='center')fail('unsupported heading attributes');
      }else if(keys.length)fail('unsupported attributes');
      const parent=stack.at(-1);
      if(tag==='html'&&(stack.length||ended)||tag==='head'&&parent!=='html'||tag==='title'&&parent!=='head'||tag==='body'&&(parent!=='html'||ended)||tag==='h2'&&parent!=='body'||tag==='u'&&!['body','h2'].includes(parent)||tag==='br'&&!['body','h2'].includes(parent))fail('unsupported tag nesting');
      if(tag==='br'){if(heading!==null)heading+='\n';else if(notes)result.notes+='\n';continue;}
      if(tag==='body')body=true;
      if(tag==='h2'){if(pending.trim())fail('unconsumed section text');pending='';heading='';}
      if(tag==='u'&&heading===null){if(under!==null)fail('nested values');under='';}
      stack.push(tag);
    }
    if(stack.length||!ended||!generator||!headerSeen||!result.sections.length||!totalRows)fail('incomplete export document');
    if(result.sections.some(s=>!s.rows.length))fail('empty section');
    result.notes=bounded(result.notes.trim(),limits.notes);return result;
  }
  function plan(parsed,page='all'){
    if(!['all','tires','chassis','notes'].includes(page))fail('unsupported export page');
    if(!parsed||parsed.complete!==false||!Array.isArray(parsed.sections)||!parsed.sections.length||parsed.sections.length>limits.sections)fail('invalid parsed export');
    for(const key of ['car','setupName','track'])if(!bounded(parsed[key],512).trim())fail('missing parsed identity');
    bounded(parsed.notes,limits.notes);let count=0;
    const sections=[];
    parsed.sections.forEach((section,index)=>{
      bounded(section.title);if(!Array.isArray(section.rows)||!section.rows.length)fail('invalid parsed rows');
      const rows=section.rows.map((row,j)=>{
        bounded(row.label);if(++count>limits.rows||!Array.isArray(row.values)||!row.values.length||row.values.length>limits.valuesPerRow)fail('invalid parsed values');
        const values=row.values.map(v=>bounded(v));return {path:'export.'+index+'.'+j,label:row.label,values,value:values.join(', '),kind:'output',control:'none'};
      });
      const domain=rows.some(row=>row.label==='Cold pressure')?'tires':'chassis';
      if(page==='all'||page===domain)sections.push({key:'export-'+index,ordinal:section.ordinal,title:section.title,domain,rows});
    });
    if((page==='notes'||page==='all')&&parsed.notes)sections.push({key:'export-notes',title:'Notes:',domain:'notes',rows:[{path:'export.notes',label:'Notes',value:parsed.notes,values:[parsed.notes],kind:'output',control:'none'}]});
    return {sections,metadata:{car:parsed.car,carPath:parsed.car,setupName:parsed.setupName,track:parsed.track},notes:parsed.notes,complete:false,layout:'native-export-document-order',limitations:[
      'Native export labels, order and formatted strings; Garage screen geometry and controls remain unverified.',
      'Tires/chassis is an app classification: sections with the exact Cold pressure label are tires, all other sections are chassis.',
      'No STO association, model inheritance, conversion, enum or physics binding is inferred.'
    ]};
  }
  return Object.freeze({parse,plan,limits});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoNativeExport;
