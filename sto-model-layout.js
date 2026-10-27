/* Reference presentation only. Grouping technical names does not establish
 * native Garage layout, controls, enums, units or model equivalence. */
const StoModelLayout = (() => {
  const titles={front:'Avantreno',rear:'Retrotreno',lf:'Anteriore sinistra',rf:'Anteriore destra',lr:'Posteriore sinistra',rr:'Posteriore destra',hf:'Heave anteriore',hr:'Heave posteriore',tf:'Terza sospensione anteriore',tr:'Terza sospensione posteriore',cf:'Centrale anteriore',cr:'Centrale posteriore',aero:'Aerodinamica',drivetrain:'Trasmissione e differenziale',electronics:'Elettronica e abitacolo',fuel:'Motore e carburante',ballast:'Zavorra e bilanciamento',other:'Regolazioni generali'};
  const order=['front','rear','lf','rf','lr','rr','hf','hr','tf','tr','cf','cr','aero','drivetrain','electronics','fuel','ballast','other'];
  function category(row){
    const name=row.name||'',group=row.description?.group||'';
    // Specific technical families precede general groups: existing description
    // heuristics can classify diffuser as differential or torsion as antiroll.
    if(/Wing|Flap|Gurn|Wicker|Aero|Spoiler|diffuser|WEPAngle|radInlet|^C[pxz]|^dC|^Clf|^downforce|^drag|^DPSetting|^PSSetting/i.test(name))return 'aero';
    if(/Gear|Diff|Ramp|Clutch|frictionFaces|FinalDrive/i.test(name))return 'drivetrain';
    if(/display|dash|Light|LED|ABS|ESC|tracControl|tcSwitch|TCKnob|Slip|regen|deploy|mguk|strat|wiper|Halo|ibsMode|multiFunction|^mapSetting|stabControl|tpsSetting/i.test(name))return 'electronics';
    if(/Fuel|Engine|Throttle|boost|launchRPM|hpScale/i.test(name))return 'fuel';
    if(/Weight|Mass|ballast|BoP|cgAdjust|Jacker|tiltTarget/i.test(name))return 'ballast';
    return {'Aerodinamica':'aero','Trasmissione e differenziale':'drivetrain','Elettronica e abitacolo':'electronics','Motore e carburante':'fuel','Zavorra e bilanciamento':'ballast'}[group]||null;
  }
  function pageFor(row){
    const special=category(row);
    if(special)return special==='ballast'?'chassis':special;
    if(/Tire|tyre/i.test(row.name||'')||row.description?.group==='Pneumatici')return 'tires';
    if(row.description?.group&&row.description.group!=='Altri parametri')return 'chassis';
    if(/Spring|Packer|Bump|Perch|Damp|Shock|TorBar|Pushrod|PushRod|Toe|hubD|wheelD|Arb|Bar|Brake|steering|PinLength/i.test(row.name||''))return 'chassis';
    return 'other';
  }
  function panelFor(row){
    const special=category(row);if(special)return special;
    const name=row.name||'';
    const central=name.match(/^(hf|hr|tf|tr|rt|cf|cr)(?=[A-Z])/);
    if(central)return central[1]==='rt'?'tr':central[1];
    // Separate full-word heave/third families before their f/r axle prefix.
    const full=name.match(/^(f|r)(Heave|Third)(?=[A-Z])/);
    if(full)return (full[2]==='Heave'?'h':'t')+full[1];
    const corner=name.match(/^(lf|rf|lr|rr)(?=[A-Z]|hub|wheel)/);
    if(corner)return corner[1];
    const suffix=name.match(/(?:Dia|Turns)(FL|FR|RL|RR)m?$/);
    if(suffix)return {FL:'lf',FR:'rf',RL:'lr',RR:'rr'}[suffix[1]];
    if(/^(?:f(?=[A-Z])|front|Front)|^steering|^driversteering/.test(name))return 'front';
    if(/^(?:r(?=[A-Z])|rear|Rear)/.test(name))return 'rear';
    return 'other';
  }
  function plan(rows){
    const panels=new Map();
    for(const row of rows){const key=panelFor(row);if(!panels.has(key))panels.set(key,[]);panels.get(key).push(row);}
    return order.filter(key=>panels.has(key)).map(key=>({key,title:titles[key],rows:panels.get(key)}));
  }
  return {plan,pageFor};
})();
if(typeof module!=='undefined')module.exports=StoModelLayout;
