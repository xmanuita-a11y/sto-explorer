const assert=require('node:assert/strict');
const fs=require('node:fs');
const layout=require('./sto-model-layout.js');
const catalog=JSON.parse(fs.readFileSync(process.argv[2]||'sto-model-group-catalog.json','utf8'));
const cases=[
 ['porsche963gtp','rtLowSpeedCompDampSetting','tr','chassis'],
 ['acuraarx06gtp','fHeaveSpringRateNpm','hf','chassis'],
 ['acuraarx06gtp','rThirdSpringRateNpm','tr','chassis'],
 ['dallarap217','fThirdSpringRateNpm','tf','chassis'],
 ['audir8gt3','hrSpringSelected','hr','chassis'],
 ['dallaraf3','hfCompDampSetting','hf','chassis'],
 ['dallarair18','diffuserIndex','aero','aero'],
 ['dallarair18','fWingAngle','aero','aero'],
 ['acuraarx06gtp','rWingSetting','aero','aero'],
 ['acuraarx06gtp','diffRampIndex','drivetrain','drivetrain'],
 ['hondacivictyper','fpreLoadDiff','drivetrain','drivetrain'],
 ['toyotagr86','coastBiasDiff','drivetrain','drivetrain'],
 ['stockcars\\toyotacamry2022','diffIndex','drivetrain','drivetrain'],
 ['acuraarx06gtp','mgukDeployThrottleSetting','electronics','electronics'],
 ['bmwm4gt3','mapSetting','electronics','electronics'],
 ['amvantagegt4','throttleMapSetting','fuel','fuel'],
 ['acuraarx06gtp','fuelFillToKg','fuel','fuel'],
 ['acuraarx06gtp','lfTireColdPressPa','lf','tires']
];
for(const [car,name,panel,page] of cases){
 assert(catalog.models.some(model=>model.car===car&&model.schemas.some(schema=>schema.fields.includes(name+'#1'))),car+'/'+name+' must be in actual catalog');
 const row={name,id:name+'#1',description:{group:'Altri parametri'}};
 assert.equal(layout.plan([row])[0].key,panel,name);
 assert.equal(layout.pageFor(row),page,name);
}
let structures=0,fieldCount=0;
for(const model of catalog.models)for(const schema of model.schemas){
 const rows=schema.fields.map((id,index)=>({id,name:id.replace(/#\d+$/,''),description:{group:'Altri parametri'},index}));
 const planned=layout.plan(rows),flat=planned.flatMap(panel=>panel.rows);
 assert.equal(flat.length,rows.length,model.car+' total rows');
 assert.equal(new Set(flat).size,rows.length,model.car+' identity exactly once');
 for(const panel of planned){assert(panel.title);assert.deepEqual(panel.rows.map(row=>row.index),panel.rows.map(row=>row.index).sort((a,b)=>a-b),model.car+' source order');}
 for(const row of rows)assert(['tires','chassis','aero','drivetrain','electronics','fuel','other'].includes(layout.pageFor(row)));
 structures++;fieldCount+=rows.length;
}
const duplicateRows=[{name:'unknown',id:'unknown#1'},{name:'unknown',id:'unknown#2'}];
assert.deepEqual(layout.plan(duplicateRows)[0].rows,duplicateRows);
assert.equal(layout.pageFor(duplicateRows[0]),'other');
assert.equal(layout.plan([]).length,0);
console.log(JSON.stringify({structures,fieldCount,explicitCases:cases.length,result:'PASS'}));
