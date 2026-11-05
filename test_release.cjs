const assert=require('node:assert/strict'),fs=require('node:fs');
const garage=require('./sto-native-garage.js'),formatter=require('./sto-native-formatter.js');
const catalog=require('./sto-native-garage-catalog.json');
garage.validateCatalog(catalog);assert.equal(catalog.profiles.length,3);
for(const [car,names] of [['toyotacamry2022',['rrInclinationRads']],['ferrari296gt3',['rfInclinationRads']],['porsche963gtp',['rfInclinationRads','rrInclinationRads']]]){
 const pr=catalog.profiles.find(p=>p.id.startsWith(car));
 for(const name of names){
  const rec=pr.records.find(r=>r.name===name);
  assert.equal(rec.attributes.cm,0.017453);assert.equal(rec.attributes.ce,0.017453);
  const result=formatter.format(formatter.fromMetadata(rec,{base:0.017453}),{unitSelector:1});
  assert.equal(result.status,'ok');assert.match(result.text,/\+1\.0 deg/);
 }
}
for(const profile of catalog.profiles){
 assert.equal(profile.identity.equivalentCars,undefined);
 const setup={car:profile.identity.car,version:3,contentVersion:profile.identity.contentVersion,unparsed:[],entries:[]};
 assert.equal(garage.selectProfile(catalog,setup).status,'selected');
 assert.equal(garage.selectProfile(catalog,{...setup,car:'different-car'}).code,'no-profile');
}
const html=fs.readFileSync('STO_Reader_Offline.html','utf8');
for(const removed of ['id="garage-native-export-file"','id="report"','function reportContent(','StoNativeExport.parse'])assert(!html.includes(removed));
assert(html.includes("StoI18n.setLanguage('en')"));
assert(html.indexOf('id="language"')<html.indexOf('id="garage-window"'));
console.log('PASS: conversion regressions, exact vehicle routing, English default, removed HTML flows');
