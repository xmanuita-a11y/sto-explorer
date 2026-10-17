/* Garage-inspired layout and concise paraphrases of the user-supplied manual.
 * A documented concept is not proof of an internal STO-to-garage conversion.
 */
const StoGarage = (() => {
  const t=source=>typeof StoI18n==='undefined'?source:StoI18n.t(source);
  const nextgen=new Set(['stockcars\\fordmustang2022','stockcars\\toyotacamry2022','stockcars\\chevycamarozl12022']);
  const sections=[['front','Avantreno'],['front-arb','Barra antirollio anteriore'],['lf','Anteriore sinistra'],['rf','Anteriore destra'],['lr','Posteriore sinistra'],['rr','Posteriore destra'],['rear','Retrotreno'],['cockpit','Comandi e abitacolo'],['other','Regolazioni generali']];
  function section(name,group=''){
    if(/^f(?:Arb|Bar)/.test(name))return 'front-arb';
    if(/^steering|^fMCdiameter|^rMCdiameter|^fBrake/.test(name))return 'front';
    if(/^(?:FinalDriveIndex|finalDriveIndex|diffPreLoad|diffPreload|preLoadDiff)$/.test(name))return 'rear';
    if(group==='Elettronica e abitacolo'||group==='Motore e carburante')return 'cockpit';
    const corner=name.match(/^(lf|rf|lr|rr)(?=[A-Z]|hub|wheel)/);
    if(corner)return corner[1];
    const suffix=name.match(/(?:Dia|Turns)(FL|FR|RL|RR)m?$/);
    if(suffix)return {FL:'lf',FR:'rf',RL:'lr',RR:'rr'}[suffix[1]];
    if(/^(?:f(?=[A-Z])|front|Front|hf(?=[A-Z])|tf(?=[A-Z])|cf(?=[A-Z]))/.test(name))return 'front';
    if(/^(?:r(?=[A-Z])|rear|Rear|hr(?=[A-Z])|tr(?=[A-Z])|cr(?=[A-Z]))/.test(name))return 'rear';
    return 'other';
  }
  function order(name){
    const sequence=[/^steeringmmperrev$/,/^steeringWheelOffset$/,/^fMCdiameterIndex$/,/^rMCdiameterIndex$/,/^fBrake/,/TireColdPressPa$/,/(?:PerchOffset|SpringPerch)/,/SpringRateNpm$/,/(?:LowSpeedComp|LowSpeedBump)/,/HighSpeedComp/,/HSSlopeComp/,/LowSpeedRbd/,/HighSpeedRbd/,/HSSlopeRbd/,/(?:hubDroll|wheelDroll)/,/hubDpitch/,/ToeIn/,/BarDiam$/,/ArbArmIndex$/,/BarOffset$/,/ArbConnect$/,/BarAttachedLeftQ$/,/^(?:FinalDriveIndex|finalDriveIndex|diffIndex)$/,/^(?:preLoadDiff|diffPreload)$/];
    const i=sequence.findIndex(pattern=>pattern.test(name));return i<0?100:i;
  }
  // Labels transcribed from the supplied NextGen manual, pages 11-21.
  // Name-based association only: no new conversion, click scale or telemetry.
  const compactNames=[
    [/TireColdPressPa$/,'Pressione a freddo','Cold pressure'],
    [/^(?:lf|rf|lr|rr)(?:DamperPerchOffsetm|PerchOffsetm)$/,'Offset collare ammortizzatore'],
    [/^(?:lf|rf|lr|rr)SpringRateNpm$/,'Rigidità molla','Spring rate'],
    [/LowSpeedCompDampSetting$/,'Compressione LS'],[/HighSpeedCompDampSetting$/,'Compressione HS'],
    [/HSSlopeCompDampSetting$/,'Pendenza compressione HS'],
    [/LowSpeedRbdDampSetting$/,'Estensione LS'],[/HighSpeedRbdDampSetting$/,'Estensione HS'],
    [/HSSlopeRbdDampSetting$/,'Pendenza estensione HS'],
    [/^(?:f|r)ArbArmIndex$/,'Braccio ARB'],[/^(?:f|r)Bar(?:Diam|Dia)$/,'Diametro ARB'],
    [/^(?:f|r)BarOffset$/,'Precarico ARB'],[/^(?:f|r)(?:ArbConnect|BarHooked|BarAttachedLeftQ)$/,'Collegamento ARB'],
    [/^steeringmmperrev$/,'Pignone sterzo'],[/^steeringWheelOffset$/,'Offset sterzo'],
    [/^fMCdiameterIndex$/,'Pompa freno anteriore'],[/^rMCdiameterIndex$/,'Pompa freno posteriore'],
    [/^fBrake(?:Bar)?Bias$/,'Ripartizione freni anteriore'],
    [/^(?:FinalDriveIndex|finalDriveIndex)$/,'Rapporto finale'],[/^(?:diffPreLoad|diffPreload|preLoadDiff)$/,'Precarico differenziale']
  ];
  function label(name,description,car){
    const matched=nextgen.has(car)&&compactNames.find(([pattern])=>pattern.test(name));
    if(matched)return typeof StoI18n!=='undefined'&&StoI18n.language==='en'&&matched[2]?matched[2]:t(matched[1]);
    // The corner is already in the panel heading; retain other qualifications.
    return description.label.split(' · ').filter(part=>!['anteriore sinistra','anteriore destra','posteriore sinistra','posteriore destra','front left','front right','rear left','rear right'].includes(part.toLowerCase())).join(' · ');
  }
  const glossary=[
    [/TireColdPressPa$/,'Pressione a freddo','Pressione iniziale del pneumatico quando la vettura viene caricata. È distinta dalla pressione a caldo dopo un run.',11],
    [/SpringRateNpm$/,'Rigidità molla','Forza necessaria per una variazione di lunghezza della molla. Il valore di regolazione non è una misura dell’altezza effettiva della vettura.',15],
    [/(?:PerchOffsetm|DamperPerchOffsetm)$/,'Piattello e collare molla','Regolazione del precarico statico. Nel manuale NextGen il collare modifica carico alla ruota e altezza; il suo offset non è l’altezza da terra.',15],
    [/LowSpeedCompDampSetting$/,'Compressione lenta','Resistenza dell’ammortizzatore all’accorciamento a bassa velocità dello stelo. “Lenta” riguarda il movimento della sospensione, non la velocità dell’auto.',15],
    [/HighSpeedCompDampSetting$/,'Compressione veloce','Resistenza all’accorciamento rapido dello stelo, per esempio su buche o cordoli. Il numero interno non viene convertito automaticamente in click.',16],
    [/LowSpeedRbdDampSetting$/,'Estensione lenta','Resistenza all’allungamento dell’ammortizzatore durante movimenti lenti della sospensione. La scala interna dei valori resta separata dai click del garage.',16],
    [/HighSpeedRbdDampSetting$/,'Estensione veloce','Resistenza all’allungamento rapido dello stelo, spesso dopo un urto. La lettura STO non misura la risposta dinamica della sospensione.',16],
    [/HSSlope(?:Comp|Rbd)DampSetting$/,'Pendenza alle alte velocità','Regola la forma della risposta dell’ammortizzatore alle alte velocità dello stelo. È un parametro diverso dalla sola regolazione di compressione o estensione.',16],
    [/(?:BarDiam|BarDia)$/,'Diametro barra antirollio','Il diametro contribuisce alla rigidezza al rollio dell’asse. Il manuale NextGen descrive due opzioni; non viene dedotta una selezione Soft/Firm dal solo codice interno.',14],
    [/ArbArmIndex$/,'Braccio barra antirollio','Il manuale NextGen descrive posizioni P1–P5. Non è ancora dimostrato se il numero STO parta da zero o da uno: l’indice resta originale.',14],
    [/(?:ArbConnect|BarHooked|BarAttachedLeftQ)$/,'Collegamento barra antirollio','Collegare o scollegare la barra cambia il suo contributo. Il manuale descrive il comando, ma non prova la codifica numerica di ciascun campo STO.',14],
    [/BarOffset$/,'Precarico barra antirollio','Carico statico della barra nel garage. Non è una misura diretta del cross weight e non permette di ricavarlo da solo.',14],
    [/^(?:fBrakeBarBias|fBrakeBias)$/,'Ripartizione frenante','Il manuale descrive la percentuale della frenata inviata all’avantreno. La corrispondenza del campo interno e della sua scala deve essere confermata separatamente.',13],
    [/^(?:fMCdiameterIndex|rMCdiameterIndex)$/,'Pompa freno','Il diametro della pompa modifica la risposta del pedale. Un indice serializzato non è un diametro in pollici o millimetri.',13],
    [/steeringmmperrev/,'Pignone sterzo','Il manuale esprime lo spostamento della cremagliera per giro del volante. La scala del campo STO non viene dedotta dall’esempio del manuale.',12],
    [/steeringWheelOffset/,'Offset volante','Il manuale descrive un disassamento angolare del volante. Non viene attribuita una scala in gradi al valore STO senza una conversione dimostrata.',12],
    [/FinalDriveIndex|finalDriveIndex/,'Rapporto finale','Rapporto tra pignone e corona del differenziale. L’indice interno non è il rapporto effettivo.',21],
    [/diffPreLoad|diffPreload|preLoadDiff/,'Precarico differenziale','Precarico statico degli elementi di attrito del differenziale. Non equivale a un valore di bloccaggio calcolato durante la guida.',21]
  ];
  function explain(name,car){
    if(!nextgen.has(car))return null;
    const row=glossary.find(([pattern])=>pattern.test(name));
    if(!row)return null;
    return {title:t(row[1]),description:t(row[2]),source:'NASCAR NextGen Cars Manual',page:row[3],qualification:t('Concetto documentato; associazione al campo basata sul nome, conversione garage non confermata.')};
  }
  // Manual screenshots, pages 11, 12, 15 and 18. These are output slots,
  // not quantities calculable from a serialized adjustment.
  function outputs(panel,page,car){
    if(!nextgen.has(car))return [];
    if(page==='tires')return /^(lf|rf|lr|rr)$/.test(panel)?['Last hot pressure','Last temperatures (O / M / I)','Tread remaining (O / M / I)']:[];
    if(panel==='front')return ['Nose weight','Cross weight'];
    if(/^(lf|rf|lr|rr)$/.test(panel))return ['Corner weight','Ride height'];
    return [];
  }
  return {sections,section,order,outputs,explain,label,isNextGen:car=>nextgen.has(car)};
})();
if(typeof module!=='undefined')module.exports=StoGarage;
