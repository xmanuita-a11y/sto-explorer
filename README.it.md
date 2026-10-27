# STO Explorer

[English](README.md) · **Italiano** · [Changelog](CHANGELOG.md)

Viewer autonomo e in sola lettura per esplorare e confrontare setup iRacing. Sviluppato con JavaScript, WebCrypto e un builder Python senza dipendenze esterne.

**Release candidate sperimentale.** Supporta contenitori STO v3 osservati. Offre layout di riferimento per modello; la replica completa del Garage nativo e la validazione del simulatore restano fuori dal perimetro attuale.

Progetto indipendente, non affiliato, approvato o supportato da iRacing. Nomi e marchi di terzi appartengono ai rispettivi titolari.

## Avvio

1. Scarica [STO_Reader_Offline.html](STO_Reader_Offline.html) con **Download raw file** su GitHub.
2. Aprilo in una versione recente di Chrome, Edge o Firefox.
3. Carica uno o due file che sei autorizzato a usare, oppure apri **Confronto e strumenti offline → DEMO · SYNTHETIC**.

Il viewer non richiede installazione, server, account, connessione o simulatore aperto. Elabora i file nel browser senza caricarli su servizi remoti e senza modificare gli originali.

## Funzioni

- Confronto A/B con differenze decimali esatte, ricerca, filtro delle modifiche e provenienza dei campi.
- Pannelli di riferimento per ruote, assi, sospensioni heave/terze/centrali, aerodinamica, trasmissione, elettronica e carburante.
- Copertura strutturale di 53 identita modello/versione, 89 schemi globali e 98 combinazioni modello/schema. Nomi uguali non dimostrano comportamenti equivalenti tra vetture.
- Importazione separata di snapshot SDK JSON ed export HTML nel subset supportato, con valori e unita originali.
- Report locali CSV/HTML stampabili e interfaccia italiana/inglese.
- Nessuna scrittura STO, comando al simulatore o certificazione dell'ispezione tecnica.

Per leggere un export del simulatore scegli **Apri export HTML iRacing** negli strumenti offline. I suoi dati restano separati dagli STO gia aperti.

## Build e verifiche

Richiede Python 3.10 o successivo, senza pacchetti pip o npm:

```sh
python build_sto_reader.py
```

La build incorpora sorgenti, cataloghi e demo sintetiche nell'HTML autonomo. Il workflow pubblico verifica build e sintassi su Linux e Windows. Test, fixture di sviluppo, report locali e dati di sessione rimangono privati e non sono distribuiti.

Il codice separa decoder, valori originali, presentazione di riferimento e osservazioni esterne. Campi non verificati mantengono nomi e codici tecnici; gli output del simulatore mancanti non vengono inventati.

## Snapshot SDK facoltativo

Su Windows, con una sessione adatta gia aperta:

```sh
python capture_iracing_garage_sdk.py
```

Il helper legge il mapping pubblico dell'SDK e crea una directory locale nuova per ogni cattura. Non apre handle al processo del simulatore e non inietta codice. Le catture possono contenere dati del setup e della sessione: controllale prima di condividerle.

## Limiti

La compatibilita riguarda le varianti osservate. I layout e le conversioni ricavate dai nomi sono interpretazioni dichiarate; il catalogo nativo distribuito e vuoto. Non vengono ricostruiti tutti i controlli, enum, intervalli, risultati fisici o condizioni d'ispezione. Gli hash identificano i byte, non autenticita o accettazione del simulatore. Il lavoro avviene ancora sul thread principale del browser; i limiti d'input non garantiscono protezione da ogni file ostile.

Dettagli in [Security](SECURITY.md), [Contributing](CONTRIBUTING.md) e [Stato](PROGRESS.md).

## Privacy e licenza

Sono pubblicati solo sorgenti ammessi esplicitamente, documentazione ripulita e demo sintetiche incorporate. Setup personali/commerciali, catture, test, log, percorsi locali e indagini interne sono esclusi.

Il codice originale del progetto usa la [licenza MIT](LICENSE), senza concedere diritti su prodotti, servizi, marchi o materiali di terzi: [Third-party notices](THIRD_PARTY_NOTICES.md). Usa solo file ai quali sei autorizzato ad accedere e rispetta i termini applicabili.
