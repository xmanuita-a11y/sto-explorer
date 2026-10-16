/* Synthetic NextGen layout fixture. No user files or simulator are read. */
const fs=require('node:fs'),{createHash}=require('node:crypto'),{fixture}=require('./sto-test-fixtures.cjs');
const entries=[['steeringmmperrev',50],['steeringWheelOffset',0],['fMCdiameterIndex',7],['rMCdiameterIndex',5],['fBrakeBarBias',50],['fBarDiam',0.0508],['fArbArmIndex',2],['fBarOffset',0],['fArbConnect',1],['diffIndex',4],['preLoadDiff',0]];
for(const [i,corner] of ['lf','rf','lr','rr'].entries())for(const [field,value]of [['TireColdPressPa',150000+i*25000],['PerchOffsetm',0.1],['SpringRateNpm',350000+i*17500],['LowSpeedCompDampSetting',3],['HighSpeedCompDampSetting',4],['HSSlopeCompDampSetting',5],['LowSpeedRbdDampSetting',6],['HighSpeedRbdDampSetting',7],['HSSlopeRbdDampSetting',8],['ToeIn',0]])entries.push([corner+field,value]);
const text='// <i>\n// <v>1</v>\n// <c>stockcars\\toyotacamry2022</c>\n// </i>\n'+entries.map(([name,value])=>value.toFixed(6)+' '+name+' !\n').join('');
const sample=fixture({text,notes:'SYNTHETIC LAYOUT DEMO. Invented values for interface testing only. Not a simulator setup.',seed:27});
fs.writeFileSync('sto-garage-demo-data.json',JSON.stringify({synthetic:true,name:'SYNTHETIC-Camry-Layout.sto',base64:sample.bytes.toString('base64'),decodedSha256:createHash('sha256').update(text).digest('hex')},null,2)+'\n');
console.log('Built synthetic Camry layout fixture: '+entries.length+' fields.');
