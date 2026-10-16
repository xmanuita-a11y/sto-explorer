const assert=require('node:assert/strict'),garage=require('./sto-reader-garage.js');
assert.equal(garage.section('lfSpringRateNpm'),'lf');assert.equal(garage.section('rrhubDroll'),'rr');
assert.equal(garage.section('TorBarDiaFL'),'lf');assert.equal(garage.section('TorBarTurnsRR'),'rr');
assert.equal(garage.section('frontTargetRideHeight'),'front');assert.equal(garage.section('rBarDiam'),'rear');
assert.equal(garage.section('fuelFillToKg','Motore e carburante'),'cockpit');
assert.equal(garage.section('driverWeight'),'other');
assert.equal(garage.explain('lfPerchOffsetm','bmwm4gt3'),null);
const car='stockcars\\toyotacamry2022';
assert(garage.explain('lfPerchOffsetm',car).description.includes('non è l’altezza'));
assert.equal(garage.explain('lfTireColdPressPa',car).page,11);
assert.equal(garage.explain('fArbArmIndex',car).page,14);
assert(garage.explain('fArbArmIndex',car).description.includes('zero o da uno'));
assert.equal(garage.explain('lfhubDroll',car),null); // no unproven camber mapping
assert.equal(garage.explain('unknownParameter',car),null);
console.log('PASS: garage sections, NextGen-only conceptual help, source pages, no invented ride height, click or camber conversion.');

assert.equal(garage.section('fArbArmIndex'),'front-arb');
assert.equal(garage.section('rMCdiameterIndex'),'front');
assert.equal(garage.section('FinalDriveIndex'),'rear');
assert.equal(garage.label('lfLowSpeedCompDampSetting',{label:'fallback'},car),'Compressione LS');
assert.equal(garage.label('lfPerchOffsetm',{label:'fallback'},car),'Offset collare ammortizzatore');
assert.equal(garage.label('lfhubDroll',{label:'Inclinazione mozzo · anteriore sinistra'},car),'Inclinazione mozzo');
assert.equal(garage.label('lfPerchOffsetm',{label:'Altro parametro'},'othercar'),'Altro parametro');
assert.equal(garage.label('lfSideSpringRateNpm',{label:'Molla laterale'},car),'Molla laterale');
