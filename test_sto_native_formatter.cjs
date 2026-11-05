'use strict';
const assert=require('node:assert/strict');
const F=require('./sto-native-formatter.js');
let count=0;
function check(actual,expected){assert.deepEqual(actual,expected);count++;}
const state={base:5,alternate:8,preview:11,alternateActive:true,previewActive:true};
check(F.selectValue(state),{slot:'alternate',value:8});
check(F.selectValue(state,true),{slot:'preview',value:11});
check(F.selectValue({...state,dependency:{base:0}},true),{slot:'base',value:5});
check(F.selectValue({...state,dependency:{base:1}},true),{slot:'preview',value:11});
check(F.selectValue({...state,dependency:{base:-1}},true),{slot:'base',value:5});
const r={base:10,type:0,ce:2,oe:1,cm:4,om:-1,fe:'%.2f lb',fm:'%.1f kg'};
check(F.format(r).text,'6.00 lb');
check(F.format(r,{unitSelector:1}).text,'1.5 kg');
check(F.format(r,{unitSelector:99}).text,'6.00 lb');
check(F.format({...r,type:1,base:-3,ce:1,oe:0,fe:'%d'}).text,'-2'); // trunc(x+0.5), not round(x)
check(F.format({...r,fe:'%g'}).status,'unsupported');
check(F.format({...r,ce:undefined}).status,'unsupported');
check(F.format({...r,ce:0}).status,'unsupported');
check(F.printfSubset('%.0f',2.5,0).text,'2');
check(F.printfSubset('%.0f',3.5,0).text,'4');
check(F.printfSubset('%.1f',-0,0).text,'-0.0');
check(F.printfSubset('%.2f %%',1.25,0).text,'1.25 %');
const e={base:3,type:2,min:2,max:4,s:'M2\tM3\tM4',se:'E2\tE3\tE4'};
check(F.format(e).text,'E3');
check(F.format(e,{unitSelector:1}).text,'M3');
check(F.format({...e,se:null}).text,'M3');
check(F.format({...e,base:8}).text,'8 out of range');
check(F.format({...e,se:null,s:null}).text,'3 out of range');
check(F.format({...e,min:0,max:5,base:5}).text,'');
check(F.format({...e,base:1},{controlType:6}).text,'E3'); // no min subtraction
check(F.format({...e,base:0.49},{controlType:7}).text,'no');
check(F.format({...e,base:0.5},{controlType:7}).text,'yes');
check(F.format({...r,alternate:20,alternateActive:true,preview:40,previewActive:true},{allowPreview:true}).value,40);
check(F.format({...r,base:NaN}).status,'unsupported');
check(F.format(F.fromMetadata({type:0,fields:{'0x2f4':2,'0x2f8':1,'0x270':'%.2f'}},{base:10})).text,'6.00');
check(F.format(F.fromMetadata({type:0,attributes:{ce:2,oe:1,fe:'%.2f'}},{base:10})).text,'6.00');
check(F.format({...e,base:-0.6},{controlType:6}).status,'unsupported'); // floor(-0.1)=-1; CVTT alone would select 0
check(F.format({...e,base:-0.5},{controlType:6}).text,'E2');
check(F.format({...e,base:1.6},{controlType:6}).text,'E4');
check(F.format({...r,fe:''}).text,''); // renderer passes empty selected format unchanged
check(F.format({...r,fe:undefined}).status,'unsupported');
check(F.printfSubset('literal %%',1,0).text,'literal %');
console.log(JSON.stringify({passed:count,failed:0,scope:'synthetic contracts from static assembly; no target execution'}));
