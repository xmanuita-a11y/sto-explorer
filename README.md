# STO Explorer

Offline viewer for iRacing setups — experimental demo, currently optimized for NASCAR Next Gen.

STO Explorer è un viewer indipendente per esplorare file setup `.sto` di iRacing e confrontare due configurazioni. L'interfaccia riproduce l'ambiente del garage, con supporto attualmente concentrato sulle NASCAR Next Gen e in particolare sulla Toyota Camry.

## Avvio

Apri `STO_Reader_Offline.html` in un browser moderno. È una pagina autonoma: non richiede installazione, server, connessione o simulatore aperto. Carica uno o due file STO oppure avvia la demo inclusa, costruita con dati sintetici.

I file scelti vengono elaborati nel browser. L'app non li carica su un servizio remoto. Offre confronto A/B, filtri, note, esportazioni dei risultati e interfaccia italiana/inglese. Non modifica i setup originali.

## Stato della demo

Il decoder supporta il contenitore STO versione 3 osservato durante lo sviluppo. La compatibilità con ogni auto, versione e aggiornamento del simulatore non è garantita.

La ricostruzione grafica del garage e la lettura dei valori sono due livelli distinti. Il catalogo dei profili nativi distribuito è attualmente vuoto: la mappatura completa dei campi STO verso tutti i controlli e le conversioni del garage Next Gen è ancora incompleta. I campi non verificati conservano i codici originali; non sono presentati come valori fisici certi. La demo sintetica mostra l'interfaccia, senza costituire una validazione dei calcoli del simulatore.

La cornice moderna incorpora alcuni dettagli recuperati dalle risorse XAML del client: pannello contestuale laterale, gruppo compatto delle azioni file, colori e stili di testo selezionati e geometria dell'icona Garage. Le spiegazioni dei parametri conservano la fonte del manuale NextGen; gli stili dei controlli SDK mantengono separati i valori osservati dal simulatore. Font sostitutivi, disposizione di riferimento e catalogo incompleto impediscono ancora di dichiarare una replica identica del garage per vettura.

È possibile importare anche uno snapshot JSON del garage proveniente dall'SDK iRacing, tramite gli strumenti offline nelle File Actions. Questo percorso mostra le stringhe e le unità rese disponibili dal simulatore, separatamente dai file STO. Lo snapshot riguarda lo stato corrente della sessione: non permette di ricostruire offline qualsiasi setup. I comandi che richiederebbero scrittura, simulazione fisica o validazione tecnica sono disabilitati. Il progetto non genera setup STO compatibili né certifica il superamento dell'ispezione tecnica.

## Snapshot SDK facoltativo

Con una sessione iRacing aperta, su Windows puoi eseguire:

```powershell
python capture_iracing_garage_sdk.py
```

Il helper legge la memoria condivisa pubblica dell'SDK in sola lettura. Non inietta codice nel simulatore. Scrive i risultati in `private-reference/runtime-garage-sdk/`, esclusa da Git; importa poi `car-setup-snapshot.json` nel viewer. Gli snapshot possono contenere dettagli del tuo setup e della sessione: restano dati locali.

## Sorgenti e verifica

Per ricostruire l'HTML servono Python 3.10 o successivo e i file sorgente presenti nella cartella. Non sono richiesti pacchetti aggiuntivi.

```powershell
python build_sto_reader.py
```

Il template `sto-reader-ui.html.in`, i moduli `sto-reader-*.js`, `sto-native-*.js`, `sto-sdk-garage.js` e i relativi JSON vengono incorporati nell'HTML dal builder. La suite di verifica e le fixture di sviluppo vengono mantenute localmente e non sono incluse nella distribuzione pubblica.

## Contenuto della repository

La repository contiene soltanto l'app, i sorgenti necessari, i dati sintetici incorporati nella demo, il changelog, lo stato di avanzamento e questo README. Non include setup personali o commerciali, replay, screenshot della sessione, fixture e script di test, dump di memoria, eseguibili, archivi di risorse del gioco o log di indagine. La `.gitignore` ammette solo file esplicitamente elencati: aggiungere un nuovo sorgente richiede aggiornare anche quella lista.

Il materiale tecnico indispensabile alla decodifica STO è incluso nel sorgente e nell'HTML: non può essere mantenuto segreto in un viewer offline autonomo. Non è una credenziale dell'account iRacing.

## Security review

Revisione del 17 ottobre 2026, limitata al viewer distribuito, al builder e al helper SDK. Sono stati esaminati i percorsi di importazione, visualizzazione ed esportazione e i test sintetici pertinenti. Non è un audit indipendente, un penetration test completo o una valutazione della sicurezza del simulatore e dei servizi iRacing.

### Controlli presenti

- **Elaborazione locale:** l'HTML incorpora il codice e i dati necessari; non carica librerie da CDN. Nei moduli applicativi esaminati non sono presenti chiamate di rete o salvataggi in localStorage/sessionStorage. La Content Security Policy vieta connessioni di rete, risorse esterne e invio di form; consente script e stili inline necessari alla pagina autonoma.
- **Importazione:** `sto-reader-core.js` verifica versione, dimensioni, allineamento del corpo cifrato, padding e terminatore. Il limite STO è 16 MiB. L'import SDK in `sto-reader-ui.js` e `sto-sdk-garage.js` limita il JSON a 1 MiB e verifica struttura, profondità, numero di valori e lunghezza delle stringhe. Non viene eseguito codice proveniente dai file importati.
- **Visualizzazione ed export:** nomi, note e valori importati vengono mostrati con `textContent`. Il report HTML applica escaping e una CSP senza script; le note si includono solo su scelta esplicita. Il renderer nativo produce HTML con escaping, usando profili considerati sorgenti fidate della build; il catalogo distribuito è vuoto. Il CSV quota le celle e antepone un apostrofo ai prefissi di formula gestiti dal codice.
- **Sola lettura:** il viewer non scrive STO e non comanda il simulatore. Il helper Python legge la memoria condivisa SDK pubblica e scrive soltanto file locali selezionati. I test coprono input corrotti, stringhe HTML ostili, esportazioni, percorsi di sorgente fuori progetto e hash non corrispondenti; le fixture DOM non equivalgono a test di sicurezza su tutti i browser.

### Rilievi e limiti

| Severità | Rilievo | Indicazione |
| --- | --- | --- |
| Maggiore, disponibilità locale | Parsing, aritmetica decimale e rendering STO non hanno un budget separato di righe/cifre e lavorano sul thread principale. Il limite in byte non esclude blocchi dell'interfaccia con input patologici. | Prima di accettare file ostili, aggiungere limiti di complessità, rendering progressivo o un worker e test dedicati. |
| Minore, condivisione | CSV, report, stampa e snapshot SDK possono contenere nomi dei file e dati del setup; il report del helper può includere un percorso locale. | Esaminare gli export prima di condividerli; mantenere gli output fuori da Git. La compatibilità della protezione CSV va verificata nei fogli di calcolo usati. |
| Limite crittografico | Padding valido e SHA-256 non dimostrano autore o autenticità del setup. Il decoder non verifica una firma del produttore. | Usare gli hash per identificare byte e confrontare file, senza considerarli certificati di autenticità o validità per il simulatore. |

**Esito:** utilizzabile come demo offline entro il perimetro descritto; richiede ulteriori misure per l'elaborazione robusta di input deliberatamente ostili. La CSP non protegge da una copia dell'HTML o da sorgenti di build già alterate. Il materiale del decoder incorporato non è un segreto proteggibile lato client.

### Privacy della pubblicazione

La verifica della distribuzione confronta i file scaricati da GitHub con quelli approvati e controlla separatamente i metadati Git. `.gitignore` deve essere versionato, ma non rimuove file già tracciati o dati presenti nella cronologia. Per i commit si usa un'identità `noreply`; credenziali e token di pubblicazione non devono comparire nei file o nei messaggi di commit. Questa regola va ricontrollata anche dopo nuove modifiche.

## Perché è stato possibile ricostruire il lettore

Il simulatore deve poter leggere localmente i setup. Nella build esaminata, l'implementazione client e il materiale necessario alla decodifica erano disponibili sul computer: ricostruendo la sequenza di trasformazioni è stato possibile eseguirla in un programma indipendente. Non è stato necessario indovinare per forza bruta una chiave AES o accedere a un account remoto.

La pipeline STO v3 riprodotta dal decoder combina due passaggi AES-256-CBC, materiale per file presente nell'intestazione, materiale statico associato alla build e una trasformazione dei byte tramite tabella. Dopo l'inversione si ottiene testo con identificativo dell'auto e coppie valore/nome parametro. Le note vengono lette separatamente come UTF-16LE; la coda binaria resta non interpretata. I generatori sintetici permettono di verificare che la decodifica restituisca esattamente il testo atteso, senza distribuire setup personali.

Questo risultato riguarda l'implementazione e il formato osservati: non dimostra una debolezza matematica di AES, l'accesso ai servizi iRacing o la compatibilità con ogni build futura. Una chiave e la logica necessarie alla lettura offline, quando sono disponibili al client, non possono essere considerate una barriera assoluta contro l'analisi di quel client.

Leggere i parametri non ricostruisce automaticamente il garage. Etichette, conversioni, controlli e risultati fisici richiedono ulteriori definizioni. Gli screenshot hanno guidato l'aspetto; l'SDK pubblico fornisce, durante una sessione, valori già formattati dal simulatore. Questa seconda fonte resta distinta dalla decodifica STO e non sostituisce la mappatura nativa ancora incompleta.

STO Explorer è un progetto sperimentale indipendente, non affiliato né approvato da iRacing. Nomi e marchi appartengono ai rispettivi titolari.
