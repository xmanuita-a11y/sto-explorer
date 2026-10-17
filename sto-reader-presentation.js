/* User-facing interpretation is separate from the lossless STO parser. */
const StoPresentation = (() => {
  const t=(source,values)=>typeof StoI18n==='undefined'?source.replace(/\{(\w+)\}/g,(_,key)=>String(values?.[key]??'{'+key+'}')):StoI18n.t(source,values);
  const english=()=>typeof StoI18n!=='undefined'&&StoI18n.language==='en';
  const groups = ['Pneumatici','Geometria e altezze','Molle e sospensioni','Ammortizzatori','Barre antirollio','Freni','Aerodinamica','Trasmissione e differenziale','Motore e carburante','Elettronica e abitacolo','Zavorra e bilanciamento','Altri parametri'];
  const positions={lf:'Anteriore sinistra',rf:'Anteriore destra',lr:'Posteriore sinistra',rr:'Posteriore destra',f:'Anteriore',r:'Posteriore',hf:'Heave anteriore',hr:'Heave posteriore',tf:'Terza sospensione anteriore',tr:'Terza sospensione posteriore',cf:'Centrale anteriore',cr:'Centrale posteriore',rt:'Terza sospensione posteriore'};
  const namedFields={
    fuelFillToKg:['Carburante da caricare','Motore e carburante'],fuelUsedLapTargetKg:['Consumo obiettivo per giro','Motore e carburante'],driverWeight:['Peso pilota · valore interno','Zavorra e bilanciamento'],chassisballastDx:['Posizione longitudinale della zavorra','Zavorra e bilanciamento'],
    fBrakeBarBias:['Ripartizione frenante anteriore','Freni'],fBrakeBias:['Ripartizione frenante anteriore','Freni'],steeringmmperrev:['Corsa dello sterzo per giro · valore interno','Geometria e altezze'],steeringArmLength:['Lunghezza braccio sterzo','Geometria e altezze'],steeringWheelOffset:['Offset volante','Geometria e altezze'],
    Qtape:['Nastro sulle prese d’aria · codice','Aerodinamica'],QtapeRorQ:['Nastro sulle prese d’aria · codice','Aerodinamica'],tireCompound:['Mescola pneumatici · indice','Pneumatici'],tyreSetting:['Pneumatici · impostazione','Pneumatici'],
    absSwitch:['ABS · selettore interno','Elettronica e abitacolo'],tcSwitch:['Controllo trazione · selettore interno','Elettronica e abitacolo'],tracControlSwitch:['Controllo trazione · selettore interno','Elettronica e abitacolo'],escSwitch:['Controllo stabilità · selettore interno','Elettronica e abitacolo'],
    dashDisplayPage:['Pagina del cruscotto','Elettronica e abitacolo'],driversteeringRatio:['Rapporto sterzo pilota','Geometria e altezze'],weightJacker:['Weight jacker · regolazione','Zavorra e bilanciamento'],rearSpoilerAngle:['Angolo spoiler posteriore','Aerodinamica']
  };
  const families={
    TireColdPressPa:['Pressione a freddo','Pneumatici'],TireStaggerm:['Differenza diametro pneumatici (stagger)','Pneumatici'],
    SpringRateNpm:['Rigidità molla','Molle e sospensioni'],SideSpringRateNpm:['Rigidità molla laterale','Molle e sospensioni'],HeaveSpringRateNpm:['Rigidità molla heave','Molle e sospensioni'],ThirdSpringRateNpm:['Rigidità terza molla','Molle e sospensioni'],RollSpringRateNpm:['Rigidità molla rollio','Molle e sospensioni'],
    PerchOffsetm:['Offset piattello molla','Molle e sospensioni'],DamperPerchOffsetm:['Offset piattello ammortizzatore','Molle e sospensioni'],SpringSelected:['Molla selezionata · indice','Molle e sospensioni'],PerchOffset:['Offset piattello · valore interno','Molle e sospensioni'],SpringPerch:['Piattello molla · valore interno','Molle e sospensioni'],
    LowSpeedCompDampSetting:['Compressione lenta · impostazione','Ammortizzatori'],HighSpeedCompDampSetting:['Compressione veloce · impostazione','Ammortizzatori'],LowSpeedRbdDampSetting:['Estensione lenta · impostazione','Ammortizzatori'],HighSpeedRbdDampSetting:['Estensione veloce · impostazione','Ammortizzatori'],HSSlopeCompDampSetting:['Pendenza compressione veloce · impostazione','Ammortizzatori'],HSSlopeRbdDampSetting:['Pendenza estensione veloce · impostazione','Ammortizzatori'],CompDampSetting:['Compressione · impostazione','Ammortizzatori'],RbdDampSetting:['Estensione · impostazione','Ammortizzatori'],BumpSetting:['Compressione · impostazione','Ammortizzatori'],ReboundSetting:['Estensione · impostazione','Ammortizzatori'],LowSpeedBumpSetting:['Compressione lenta · impostazione','Ammortizzatori'],
    ToeIn:['Convergenza · valore interno','Geometria e altezze'],hubDroll:['Inclinazione mozzo · valore interno','Geometria e altezze'],wheelDroll:['Inclinazione ruota · valore interno','Geometria e altezze'],hubDpitch:['Inclinazione longitudinale mozzo · valore interno','Geometria e altezze'],
    PackerThicknessm:['Spessore distanziale fine corsa','Molle e sospensioni'],BumpRubberFitted:['Tampone montato · codice','Molle e sospensioni'],Bumpstop:['Fine corsa · valore interno','Molle e sospensioni'],Packer:['Distanziale · valore interno','Molle e sospensioni'],PTPacker:['Distanziale PT · valore interno','Molle e sospensioni'],ShockFreeLength:['Lunghezza libera ammortizzatore','Ammortizzatori'],PinLengthm:['Lunghezza perno','Molle e sospensioni'],PushrodLengthm:['Lunghezza pushrod','Geometria e altezze'],PushRodLengthm:['Lunghezza pushrod','Geometria e altezze'],PushrodDeltaLengthm:['Variazione lunghezza pushrod','Geometria e altezze'],
    BarDiam:['Diametro barra antirollio · valore interno','Barre antirollio'],BarDia:['Diametro barra antirollio · valore interno','Barre antirollio'],BarOffset:['Precarico barra · valore interno','Barre antirollio'],BarAttachedLeftQ:['Attacco barra lato sinistro · codice','Barre antirollio'],ArbConnect:['Connessione barra antirollio · codice','Barre antirollio'],BarHooked:['Connessione barra antirollio · codice','Barre antirollio'],ArbArmIndex:['Braccio barra antirollio · indice','Barre antirollio'],
    WingAngle:['Angolo ala · valore interno','Aerodinamica'],WingSetting:['Ala · impostazione','Aerodinamica'],MCdiameterIndex:['Diametro pompa freno · indice','Freni'],BrakeCoolingIndex:['Raffreddamento freni · indice','Freni'],
    TorBarTurns:['Barra di torsione · regolazione','Molle e sospensioni'],TruckArm:['Braccio sospensione · valore interno','Geometria e altezze']
  };
  const words={Low:'bassa',High:'alta',Speed:'velocità',Comp:'compressione',Rbd:'estensione',Damp:'ammortizzatore',Setting:'impostazione',Settings:'impostazioni',Selected:'selezionato',Index:'indice',Spring:'molla',Rate:'rigidità',Roll:'rollio',Heave:'heave',Third:'terza',Side:'laterale',Bar:'barra',Arb:'barra antirollio',Diam:'diametro',Dia:'diametro',Arm:'braccio',Len:'lunghezza',Length:'lunghezza',Attached:'collegata',Left:'sinistra',Right:'destra',Front:'anteriore',Rear:'posteriore',Offset:'offset',Bump:'compressione',Rubber:'tampone',Free:'libera',Fitted:'montato',Rebound:'estensione',Perch:'piattello',Packer:'distanziale',Thickness:'spessore',Pushrod:'pushrod',Delta:'variazione',Brake:'freno',Bias:'ripartizione',Master:'principale',Cyl:'cilindro',Pedal:'pedale',Ratio:'rapporto',Cooling:'raffreddamento',Torque:'coppia',Wing:'ala',Flap:'flap',Angle:'angolo',Wicker:'wicker',Gurney:'gurney',Diff:'differenziale',Pre:'pre',Load:'carico',Preload:'precarico',Coast:'rilascio',Drive:'trazione',Ramp:'rampa',Gear:'marcia',Stack:'gruppo',First:'prima',Second:'seconda',Third:'terza',Fourth:'quarta',Fifth:'quinta',Sixth:'sesta',Seventh:'settima',Final:'finale',Clutch:'frizione',Clutches:'frizioni',Num:'numero',Fuel:'carburante',Map:'mappa',Mix:'miscela',Throttle:'acceleratore',Engine:'motore',Boost:'sovralimentazione',Press:'pressione',Launch:'partenza',Steering:'sterzo',Wheel:'volante',Box:'scatola',Power:'potenza',Assist:'assistenza',Tire:'pneumatico',Tyre:'pneumatico',Compound:'mescola',Stagger:'stagger',Target:'obiettivo',Ride:'assetto',Height:'altezza',Display:'display',Page:'pagina',Light:'luce',Night:'notturna',Color:'colore',Warning:'avviso',Switch:'selettore',Control:'controllo',Trac:'trazione',Slip:'slittamento',Cut:'taglio',Start:'inizio',Scale:'fattore',Scalar:'fattore',Aero:'aerodinamica',Downforce:'carico aerodinamico',Drag:'resistenza',Package:'pacchetto',Mass:'massa',Weight:'peso',Add:'aggiunta',Change:'variazione',Ballast:'zavorra',Pin:'perno',Turns:'giri',Tor:'torsione',Damper:'ammortizzatore',Engage:'innesto',Travel:'corsa',Toe:'convergenza',In:'interna',Endurance:'endurance',Wiper:'tergicristallo'};
  function humanize(name) {
    return name.replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2').replace(/_/g,' ').split(/\s+/).map(w=>words[w]||words[w[0]?.toUpperCase()+w.slice(1)]||w).join(' ');
  }
  function groupFor(name) {
    if (/Tire|tyre/i.test(name)) return 'Pneumatici';
    if (/Brake|MCdiameter|handbrake/i.test(name)) return 'Freni';
    if (/Damp|BumpSetting|ReboundSetting|Shock/i.test(name)) return 'Ammortizzatori';
    if (/Arb|Bar(?:Dia|Diam|Arm|Blade|Hole|Hook|Index|Length|Offset|Setting|Asymmetry|Attached)|AntiRoll/i.test(name)) return 'Barre antirollio';
    if (/Spring|Packer|Bumpstop|BumpRubber|TorBar|Perch|EngageTravel/i.test(name)) return 'Molle e sospensioni';
    if (/Wing|Flap|Gurn|Wicker|Aero|^C[pxz]|^dC|^Clf|^downforce|^drag|Spoiler|WEPAngle|radInlet|^DPSetting|^PSSetting/i.test(name)) return 'Aerodinamica';
    if (/Gear|Diff|Ramp|Clutch|frictionFaces/i.test(name)) return 'Trasmissione e differenziale';
    if (/Fuel|Engine|Throttle|boost|launchRPM|hpScale/i.test(name)) return 'Motore e carburante';
    if (/Toe|Steering|hubD|wheelD|RideHeight|TargetRide|RHm|Pushrod|TruckArm|wheelbase/i.test(name)) return 'Geometria e altezze';
    if (/Weight|Mass|ballast|BoP|cgAdjust|Jacker|tiltTarget/i.test(name)) return 'Zavorra e bilanciamento';
    if (/display|dash|Light|LED|ABS|ESC|tracControl|tcSwitch|TCKnob|Slip|regen|deploy|mguk|strat|wiper|Halo|ibsMode|multiFunction|mapSetting|stabControl|tpsSetting/i.test(name)) return 'Elettronica e abitacolo';
    return 'Altri parametri';
  }
  function describe(name) {
    let item=namedFields[name], position='', quality='Etichetta interpretata dal nome tecnico';
    if (!item) for (const prefix of Object.keys(positions).sort((a,b)=>b.length-a.length)) {
      if(name.startsWith(prefix) && families[name.slice(prefix.length)]) { item=families[name.slice(prefix.length)];position=positions[prefix];break; }
    }
    let label=item?.[0] || humanize(name), group=item?.[1] || groupFor(name);
    if (position) label+=' · '+position.toLowerCase();
    if (!item) quality='Nome tecnico reso leggibile; significato da verificare';
    if(english())label=item?label.split(' · ').map(part=>t(part)).join(' · '):name.replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2').replace(/_/g,' ');
    let kind='raw';
    if (/TireColdPressPa$/.test(name)) kind='pressure';
    else if (/SpringRateNpm$/.test(name)) kind='spring';
    else if (/(?:FillTo|LapTarget)Kg$/.test(name)) kind='mass';
    else if (/(?:Offset|Length|Thickness|Stagger|PerchZero|PinLength|RH)m$/.test(name) || /^(?:torBarDiaFLm|torBarDiaFRm)$/.test(name)) kind='length';
    const indexed=/Index|Setting|Selected|Switch|Connect|Hooked|Attached|Fitted|^Qtape|tireCompound|tyreSetting/.test(name);
    return {name,label,group,position,kind,indexed,partial:!item,quality:t(quality),unitEvidence:t(kind==='raw'?'Unità e scala garage non verificate':'Unità ricavata dal suffisso del campo; equivalenza garage non verificata')};
  }
  // Decimal arithmetic uses integers so exact differences remain visible even
  // when values exceed Number's precision. Conversion rounding is display-only.
  function decimal(value) {
    const match=String(value).match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
    if(!match || (!match[2]&&!match[3])) throw new Error('Valore decimale non valido');
    const fraction=match[3]||'';
    return {n:BigInt((match[1]==='-'?'-':'')+(match[2]||'0')+fraction),scale:fraction.length};
  }
  function exact(n,scale) {
    const sign=n<0n?'-':'';let s=(n<0n?-n:n).toString().padStart(scale+1,'0');
    if(scale) s=s.slice(0,-scale)+'.'+s.slice(-scale);
    return sign+s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  }
  function convert(value,numerator,denominator,places=3) {
    const d=decimal(value),negative=d.n<0n,n=(negative?-d.n:d.n)*BigInt(numerator)*10n**BigInt(places),den=BigInt(denominator)*10n**BigInt(d.scale);
    const rounded=(n+den/2n)/den;
    return exact(negative?-rounded:rounded,places).replace('.',english()?'.':',');
  }
  function subtract(a,b) { // B minus A, no floating point
    const x=decimal(a),y=decimal(b),scale=Math.max(x.scale,y.scale);
    return exact(y.n*10n**BigInt(scale-y.scale)-x.n*10n**BigInt(scale-x.scale),scale);
  }
  function format(value,description,units='metric') {
    if(value===undefined || value===null) return {primary:'—',secondary:t('Parametro assente'),unit:''};
    const kind=description.kind;
    let primary,unit='';
    if(units!=='raw' && kind==='pressure') {unit=units==='imperial'?'psi':'bar';primary=units==='imperial'?convert(value,100000000,689475729317,2):convert(value,1,100000,3);}
    else if(units!=='raw' && kind==='spring') {unit=units==='imperial'?'lbf/in':'N/mm';primary=units==='imperial'?convert(value,1000000000000,175126835246477,2):convert(value,1,1000,3);}
    else if(units!=='raw' && kind==='length') {unit=units==='imperial'?'in':'mm';primary=units==='imperial'?convert(value,10000,254,4):convert(value,1000,1,3);}
    else if(units!=='raw' && kind==='mass') {unit=units==='imperial'?'lb':'kg';primary=units==='imperial'?convert(value,100000000,45359237,3):convert(value,1,1,3);}
    else primary=StoReader.canonicalDecimal(value).replace('.',english()?'.':',');
    const secondary=unit?'Conversione dal nome del campo':description.indexed?'Codice interno · scala garage da verificare':'Valore interno';
    return {primary:primary+(unit?' '+unit:''),secondary:t(secondary),unit};
  }
  function delta(a,b,description,units) {
    if(a===undefined || b===undefined) return {primary:'—',detail:t('Parametro presente in un solo file')};
    const difference=subtract(a,b),sign=difference.startsWith('-')?'':difference==='0'?'':'+';
    const formatted=format(difference,description,units);
    let primary=sign+formatted.primary;
    if(difference!=='0' && /^-?0(?: |$)/.test(formatted.primary)) primary=t('≠ sotto la precisione mostrata');
    return {primary,detail:t('Differenza esatta B − A (valore originale): {value}',{value:sign+difference})};
  }
  function carName(car) {
    const known={toyotacamry2022:'Toyota Camry · NASCAR Next Gen',fordmustang2022:'Ford Mustang · NASCAR Next Gen',chevycamarozl12022:'Chevrolet Camaro ZL1 · NASCAR Next Gen',bmwm4gt3:'BMW M4 GT3',ferrari296gt3:'Ferrari 296 GT3',porsche992rgt3:'Porsche 911 GT3 R (992)',porsche992cup:'Porsche 911 GT3 Cup (992)',toyotagr86:'Toyota GR86',acuraarx06gtp:'Acura ARX-06 GTP',bmwlmdh:'BMW M Hybrid V8',cadillacvseriesrgtp:'Cadillac V-Series.R GTP',porsche963gtp:'Porsche 963 GTP'};
    return known[car.split('\\').at(-1)] || car.replace(/\\/g,' / ');
  }
  return {groups,describe,format,delta,subtract,convert,carName};
})();
if(typeof module!=='undefined') module.exports=StoPresentation;
