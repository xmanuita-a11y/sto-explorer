/* Deterministic public demo, created solely from synthetic literals. */
const fs=require('node:fs'),{createHash}=require('node:crypto'),{fixture}=require('./sto-test-fixtures.cjs');
const base=fixture({notes:'Synthetic demonstration only. Not an iRacing setup recommendation.'});
const other=fixture({text:base.text.replace('100000.000000 lfTire','125000.000000 lfTire').replace('100000.000000 lfSpring','110000.000000 lfSpring').replace('1.000000 sample','2.000000 sample')+'3.000000 extraDemoSetting !\n',notes:'Synthetic variant B. No private setup data.',seed:19});
const result={synthetic:true,samples:[base,other].map((s,i)=>({name:'Synthetic-Demo-'+(i?'B':'A')+'.sto',base64:s.bytes.toString('base64'),decodedSha256:createHash('sha256').update(s.text,'ascii').digest('hex')}))};
fs.writeFileSync('sto-demo-data.json',JSON.stringify(result,null,2)+'\n');
console.log('Built two synthetic in-memory demo containers; no user setup reads.');
