# STO Explorer

[English](README.md) · **Italiano** · [Changelog](CHANGELOG.md)

Visualizzatore offline in sola lettura dei setup iRacing STO v3. Release candidate **1.0.0-rc.4**.

Apri `STO_Reader_Offline.html` in Edge, Chrome o Firefox. Inglese predefinito, selettore lingua in alto a destra. Puoi aprire uno o due setup o provare gli esempi sintetici.

Mostra soltanto il Garage, con valori originali, nomi tecnici e note. Un secondo setup si apre in un Garage affiancato e indipendente, con schede e unità proprie. Su schermi piccoli i Garage si dispongono in verticale. I profili nativi sono selezionati per identità esatta: Camry NextGen, Ferrari 296 GT3 e Porsche 963 GTP, nelle versioni supportate. Le altre auto usano una disposizione di riferimento. I valori calcolati dal simulatore non vengono inventati; codici e dati sconosciuti restano consultabili nei dettagli originali del singolo Garage.

Nessun confronto A/B, tabella comparativa, Black Box, Dash o In-car. Importazione HTML, SDK e report rimossi dalla UI.

## Privacy e build

Nessun upload, account o analytics. I file vengono letti nella memoria del browser e non modificati. I dettagli originali rimangono nel rispettivo Garage.

La release esclude setup personali, catture di sessione, dump, chiavi degli archivi, risorse originali del simulatore e percorsi locali. I demo sono sintetici. I metadati normalizzati conservano gli hash di provenienza; non certificano una replica completa del Garage.

Build con Python 3.10+: `python build_sto_reader.py`.
Verifiche pubbliche con Python e Node.js 18+: `python run_tests.py`.
Verifica browser opzionale con Playwright: `node test_browser.cjs`.

La build pubblica non richiede dati privati. Limiti condizionali, calcoli fisici e dettagli del layout ancora irrisolti sono in [TODO.md](TODO.md).

Progetto indipendente, non affiliato a iRacing. MIT per il codice originale; vedi [avvertenze sulle terze parti](THIRD_PARTY_NOTICES.md).
