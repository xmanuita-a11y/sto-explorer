# Stato di avanzamento

Aggiornato il 17 ottobre 2026.

## Disponibile

- Viewer HTML autonomo, offline e in sola lettura per contenitori STO v3 osservati.
- Confronto tra due setup, filtri, conversioni dichiarate ed esportazione dei risultati.
- Garage come vista principale, con disposizione per aree e schede Tires, Chassis e Notes.
- Cornice grafica aggiornata da risorse native verificate: colori selezionati, tipografia, pannello contestuale, controlli SDK e icona Garage.
- Importazione facoltativa di uno snapshot JSON prodotto dall'SDK pubblico durante una sessione.
- Elaborazione locale: nessun setup o snapshot viene inviato dall'app a servizi remoti.

## Limite attuale

Il catalogo nativo per vettura è ancora vuoto. I contenuti effettivi di `ui.cml` e `carSetupVarDefs` non sono stati recuperati in forma utilizzabile; quindi nomi, enum, conversioni e disposizione completa di ogni garage non vengono dichiarati come equivalenti al simulatore. I campi non verificati conservano il proprio valore originale e le funzioni che richiederebbero scrittura o simulazione restano disabilitate.

## Prossimo passo tecnico

Ricostruire staticamente il percorso che riempie il payload risorsa di tipo `0x81`, oppure acquisire un contenuto già risolto per percorso, quindi generare il catalogo per vettura solo dai dati verificati. L'analisi deve mantenere immutati eseguibili, archivi e setup originali.
