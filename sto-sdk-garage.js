/* Read-only display of an explicitly imported SDK CarSetup snapshot.
 * These are already-formatted simulator outputs, never inferred STO values.
 * Structure observed in the user's current Camry SDK capture; no embedded data.
 */
const StoSdkGarage=(()=>{
  'use strict';
  const corners=[['LeftFront','lf','LEFT FRONT:'],['RightFront','rf','RIGHT FRONT:'],['LeftRear','lr','LEFT REAR:'],['RightRear','rr','RIGHT REAR:']];
  const labels={ColdPressure:'Cold pressure',LastHotPressure:'Last hot pressure',LastTempsOMI:'Last temperatures (O / M / I)',LastTempsIMO:'Last temperatures (I / M / O)',TreadRemaining:'Tread remaining',NoseWeight:'Nose weight',CrossWeight:'Cross weight',SteeringPinion:'Steering pinion',SteeringOffset:'Steering offset',FrontMc:'Front MC',RearMc:'Rear MC',FrontBrakeBias:'Front brake bias',CornerWeight:'Corner weight',RideHeight:'Ride height',ShockCollarOffset:'Shock collar offset',SpringRate:'Spring rate',LsCompression:'LS compression',HsCompression:'HS compression',HsCompSlope:'HS comp slope',LsRebound:'LS rebound',HsRebound:'HS rebound',HsRebSlope:'HS reb slope',Camber:'Camber',Caster:'Caster',ToeIn:'Toe-in',Diameter:'Diameter',ArbArm:'ARB arm',LinkSlack:'Link slack',Preload:'Preload',Attach:'Attach',FinalDriveRatio:'Final drive ratio',DiffPreload:'Diff preload',ArbPreload:'ARB preload'};
  const outputKeys=new Set(['LastHotPressure','LastTempsOMI','LastTempsIMO','TreadRemaining','CrossWeight','CornerWeight','RideHeight','Preload','ArbPreload']);
  const tireOrder=['ColdPressure','LastHotPressure','LastTempsOMI','LastTempsIMO','TreadRemaining'];
  const frontOrder=['NoseWeight','CrossWeight','SteeringPinion','SteeringOffset','FrontMc','RearMc','FrontBrakeBias'];
  const cornerOrder=['CornerWeight','RideHeight','ShockCollarOffset','SpringRate','LsCompression','HsCompression','HsCompSlope','LsRebound','HsRebound','HsRebSlope','Camber','Caster','ToeIn'];
  const arbOrder=['Diameter','ArbArm','LinkSlack','Preload','Attach'];
  const rearOrder=['FinalDriveRatio','DiffPreload','Diameter','ArbArm','ArbPreload','Attach'];
  // Control appearance observed in the two supplied modern-garage screenshots.
  // These descriptors are decorative/read-only; they are not recovered CML events.
  const dropKeys=new Set(['SteeringPinion','FrontMc','RearMc','ArbArm','FinalDriveRatio']);
  const mapping=value=>value&&typeof value==='object'&&!Array.isArray(value);
  function validate(snapshot){
    if(!mapping(snapshot)||snapshot.schemaVersion!==1||snapshot.source!=='iRacing SDK sessionInfo.CarSetup')throw new Error('Expected iRacing SDK CarSetup snapshot');
    if(!mapping(snapshot.car)||typeof snapshot.car.CarPath!=='string'||!snapshot.car.CarPath||!mapping(snapshot.setup))throw new Error('Snapshot requires explicit car identity and CarSetup');
    if(snapshot.car.CarPath!=='stockcars toyotacamry2022')throw new Error('SDK layout currently verified only for Toyota Camry NextGen');
    if(typeof snapshot.observed_at_utc!=='string'||snapshot.observed_at_utc.length>128||!Number.isFinite(Date.parse(snapshot.observed_at_utc)))throw new Error('Snapshot timestamp missing/invalid');
    for(const value of [snapshot.track,snapshot.car.CarScreenName])if(value!=null&&(typeof value!=='string'||value.length>256||/[\x00-\x1f]/.test(value)))throw new Error('Invalid SDK car/track metadata');
    if(snapshot.session_info_update!=null&&(!Number.isInteger(snapshot.session_info_update)||snapshot.session_info_update<0))throw new Error('Invalid SDK update counter');
    let leaves=0;
    function visit(value,depth){
      if(depth>6)throw new Error('Snapshot structure exceeds explicit bounds');
      if(mapping(value)){
        for(const [key,child] of Object.entries(value)){
          if(!/^[A-Za-z][A-Za-z0-9_]{0,95}$/.test(key))throw new Error('Invalid snapshot field name');
          visit(child,depth+1);
        }
      }else{
        if(typeof value!=='string'||value.length>2048||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))throw new Error('Expected bounded SDK formatted string');
        if(++leaves>512)throw new Error('Snapshot field budget exceeded');
      }
    }
    visit(snapshot.setup,0);
    if(!mapping(snapshot.setup.Tires)||!mapping(snapshot.setup.Chassis))throw new Error('Snapshot requires explicit Tires and Chassis');
    return snapshot;
  }
  function plan(input,page='chassis'){
    const snapshot=validate(input);
    if(!['all','tires','chassis'].includes(page))throw new Error('Unsupported SDK page');
    const sections=[],used=new Set();
    function section(domain,sourceKey,key,title,order){
      const value=snapshot.setup[domain][sourceKey];
      if(value===undefined)return;
      if(!mapping(value))throw new Error('Expected SDK section mapping');
      const rows=[];
      for(const field of [...order,...Object.keys(value).filter(name=>!order.includes(name))]){
        if(!Object.hasOwn(value,field))continue;
        const text=value[field];
        if(typeof text!=='string')throw new Error('Nested SDK control outside observed section structure');
        const path=domain+'.'+sourceKey+'.'+field;
        const kind=field==='Attach'?'check':outputKeys.has(field)?'output':'value';
        rows.push({path,label:labels[field]??field,value:text,kind,
          control:kind==='check'?'check':kind==='output'?'none':dropKeys.has(field)?'drop':'spin'});
        used.add(path);
      }
      sections.push({key,title,rows});
    }
    if(page==='tires'||page==='all')for(const [name,key,title] of corners)section('Tires',name,key,title,tireOrder);
    if(page==='chassis'||page==='all'){
      section('Chassis','Front','front','FRONT:',frontOrder);
      section('Chassis','FrontArb','front-arb','FRONT ARB:',arbOrder);
      for(const [name,key,title] of corners)section('Chassis',name,key,title,cornerOrder);
      section('Chassis','Rear','rear','REAR:',rearOrder);
    }
    // Preserve future fields visibly rather than silently dropping unknown SDK sections.
    for(const domain of page==='all'?['Tires','Chassis']:[page==='tires'?'Tires':'Chassis']){
      const known=new Set(corners.map(row=>row[0]).concat(domain==='Chassis'?['Front','FrontArb','Rear']:[]));
      for(const [name,value] of Object.entries(snapshot.setup[domain])){
        if(known.has(name))continue;
        const rows=[];
        function flatten(node,path){
          if(mapping(node))for(const [key,child] of Object.entries(node))flatten(child,path+'.'+key);
          else rows.push({path,label:path.split('.').slice(2).join(' / '),value:node,kind:'output'});
        }
        flatten(value,domain+'.'+name);
        sections.push({key:'other',title:name,rows});
      }
    }
    return {sections,metadata:{car:snapshot.car.CarScreenName??snapshot.car.CarPath,carPath:snapshot.car.CarPath,track:snapshot.track??null,observedAt:snapshot.observed_at_utc,update:snapshot.setup.UpdateCount??null},complete:false,
      limitations:['Snapshot values are already formatted by the simulator and retain their original units',
      'No association with a loaded STO or modified screenshot is inferred',
      'Geometry is reconstructed from the supplied screenshots; original CML remains unavailable']};
  }
  return Object.freeze({validate,plan});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=StoSdkGarage;
