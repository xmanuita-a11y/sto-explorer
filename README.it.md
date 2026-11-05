# STO Explorer

[English](README.md) · **Italiano** · [Changelog](CHANGELOG.md)

Visualizzatore offline in sola lettura dei setup iRacing STO v3. Release candidate **1.0.0-rc.4**.

Apri `STO_Reader_Offline.html` in Edge, Chrome o Firefox. Inglese predefinito, selettore lingua in alto a destra. Puoi aprire uno o due setup o provare gli esempi sintetici.

Mostra valori originali, nomi tecnici, note, confronto decimale esatto, filtri, CSV e stampa. I profili nativi sono selezionati per identità esatta: Camry NextGen, Ferrari 296 GT3 e Porsche 963 GTP, nelle versioni supportate. Le altre auto usano una disposizione di riferimento. I valori calcolati dal simulatore non vengono inventati; codici e dati sconosciuti restano consultabili nella tabella e nel contenuto originale.

Importazione HTML e report HTML rimossi. Gli eventuali snapshot SDK JSON restano osservazioni separate dai valori STO.

## Privacy e build

Nessun upload, account o analytics. I file vengono letti nella memoria del browser e non modificati. CSV e stampa possono contenere i dati aperti: scegli consapevolmente se condividerli.

La release esclude setup personali, catture di sessione, dump, chiavi degli archivi, risorse originali del simulatore e percorsi locali. I demo sono sintetici. I metadati normalizzati conservano gli hash di provenienza; non certificano una replica completa del Garage.

Build con Python 3.10+: `python build_sto_reader.py`.
Verifiche pubbliche con Python e Node.js 18+: `python run_tests.py`.
Verifica browser opzionale con Playwright: `node test_browser.cjs`.

La build pubblica non richiede dati privati. Limiti condizionali, calcoli fisici e dettagli del layout ancora irrisolti sono in [TODO.md](TODO.md).

Progetto indipendente, non affiliato a iRacing. MIT per il codice originale; vedi [avvertenze sulle terze parti](THIRD_PARTY_NOTICES.md).
