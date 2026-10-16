/* Synthetic STO-v3 fixtures, in memory only. Never reads user setups or the sim.
 * This encoder is test support, not a supported setup editor or simulator writer.
 */
const {createCipheriv}=require('node:crypto');
const material=require('./sto-reader-material.json');
function fixture({text,notes='',tail=Buffer.alloc(8),seed=0}={}){
  text??='// <i>\n// <v>1</v>\n// <c>synthetic\\testcar</c>\n// </i>\n100000.000000 lfTireColdPressPa !\n200000.000000 rfTireColdPressPa !\n150000.000000 lrTireColdPressPa !\n150000.000000 rrTireColdPressPa !\n100000.000000 lfSpringRateNpm !\n100000.000000 rfSpringRateNpm !\n75000.000000 lrSpringRateNpm !\n75000.000000 rrSpringRateNpm !\n1.000000 sample !\n';
  if(!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(text))throw new Error('Synthetic plaintext must be ASCII');
  const table=Buffer.from(material.table,'hex'),inverse=new Map();
  for(let i=0;i<table.length;i++)if(!inverse.has((table[i]^218)&127))inverse.set((table[i]^218)&127,i);
  const substituted=Buffer.from([...Buffer.from(text,'ascii')].map(c=>{if(!inverse.has(c))throw new Error('Unmapped synthetic character');return inverse.get(c);}));
  const raw=Buffer.concat([substituted,Buffer.from([0])]),pad=16-raw.length%16,padded=Buffer.concat([raw,Buffer.alloc(pad,pad)]);
  const inner=Buffer.from(Array.from({length:32},(_,i)=>(i+seed)&255));
  const enc=(data,key)=>{const c=createCipheriv('aes-256-cbc',key,Buffer.alloc(16));c.setAutoPadding(false);return Buffer.concat([c.update(data),c.final()]);};
  const body=enc(enc(padded,inner),Buffer.from(material.key,'hex'));
  const noteBytes=Buffer.from(notes+'\0','utf16le'),header=Buffer.alloc(48);
  [3,40+body.length+noteBytes.length,body.length,noteBytes.length].forEach((n,i)=>header.writeUInt32LE(n,i*4));inner.copy(header,16);
  return {bytes:Buffer.concat([header,body,noteBytes,tail]),text,notes,tail};
}
const fieldNames=require('./sto-field-names.json');
module.exports={fixture,fieldNames};
