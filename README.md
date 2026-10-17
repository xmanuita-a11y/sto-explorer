# STO Explorer

**Independent offline file inspection and comparison — research preview**  
**Ispezione e confronto locale di file — anteprima di ricerca indipendente**

[English](#english) · [Italiano](#italiano)

> **Independent project / Progetto indipendente.** Not affiliated with, endorsed by, certified by, or authorized by iRacing. Not a cheat, anti-cheat bypass, competitive automation tool, or official garage implementation. Research or “white-hat” intent does **not** grant permission to reverse engineer third-party software or override applicable terms.

---

<a id="english"></a>
## English

### Purpose and scope

STO Explorer is an experimental, browser-based tool for **local inspection, structured presentation, and A/B comparison** of user-selected racing setup files. It is provided for educational research, interoperability assessment, reproducibility, and defensive code review.

The current prototype explores an observed version of the `.sto` container associated with iRacing. That reference identifies the relevant file format; it does **not** imply cooperation, approval, compatibility certification, or ownership of any third-party technology.

**Scope boundaries**

- The standalone HTML viewer operates locally. It does not need an iRacing account, a running simulator, a backend service, or an internet connection.
- Users explicitly choose files to inspect. The viewer does not search for personal setups, modify the source files, write simulator configuration, drive the simulator, or automate competitive actions.
- An **optional, separate** Windows helper reads an exposed SDK shared-memory mapping in a read-only manner while a simulator session is active. It is not required for the standalone viewer. SDK data may still be subject to third-party terms.
- Included example fixtures are synthetic. Their purpose is software testing and UI demonstration, not validation of any vehicle's engineering setup.
- Decoded or displayed values are **not** certified as accurate, authoritative, complete, safe for a vehicle, or accepted by the simulator.

### Run locally

Open `STO_Reader_Offline.html` in a modern browser and choose one or two files, or use the included synthetic demo. No installation is needed for the standalone viewer.

Input remains in the browser for local processing. The reviewed viewer does not submit imported files to an external service. **Exports, downloaded reports, and imported SDK snapshots may themselves contain sensitive setup information or file names; review them before sharing.**

### Reproducible build and tests

Python 3.10+ is needed to rebuild the HTML; Node.js 18+ is needed for the JavaScript tests. No additional packages are specified by the included build instructions.

```bash
python build_sto_reader.py
python run_tests.py
```

Source modules and templates are assembled into the standalone HTML file. Synthetic fixture generators (`build_sto_demo.cjs` and `build_sto_garage_demo.cjs`) are included for reproducible demonstrations. Tests cover selected decoding, numeric formatting, presentation, comparisons, rendering, SDK import, and build behavior; they are **not** proof of general correctness or legal compliance.

### Code review — scope, findings and open work

**Review status: limited internal technical review, 17 October 2026.** This is a review of the distributed files and documented behavior, **not** an independent audit, external certification, penetration test, or vendor approval.

| Area | Observation / limitation | Follow-up |
| --- | --- | --- |
| Architecture | Standalone HTML, reproducible source modules and synthetic fixtures support inspection of project behavior. | Keep build output and source in sync; review changes before release. |
| Parsing | An observed STO v3 layout is supported; field mappings, units and vehicle coverage are incomplete. | Preserve unknown fields without implying physical accuracy; expand known-good tests. |
| Test coverage | Focused automated tests exist, including malformed input and selected escaping cases. | Add browser-based regression tests, fuzzing and independent test vectors. |
| Trust boundaries | Imported files and SDK JSON are untrusted inputs, distinct from bundled application resources. | Treat all newly added formats, profiles, plugins and exports as new review surfaces. |
| Availability | Pathological yet size-bounded inputs may still exhaust the main browser thread. | Add complexity budgets, work limits, or worker-based parsing. |
| Release discipline | A restrictive `.gitignore` helps prevent unintended files from being added. | Review the actual Git index, all commit history and packaged artifacts separately. |

**No claim of complete validation:** a correctly decoded field is not necessarily a verified vehicle parameter, and a passing test suite does not establish simulator compatibility.

### Security review — defensive posture

**Reviewed properties and controls (limited scope):**

- **Local-first:** the distributed HTML is self-contained and has no required network backend; the documented Content Security Policy restricts connections and external resources.
- **Input constraints:** the reader applies structural checks and a 16 MiB STO input limit; SDK JSON import has a 1 MiB size limit with additional structure/depth/value bounds.
- **Safer output:** reviewed UI paths use text rendering or output escaping; HTML reports have a restrictive policy, and CSV export includes mitigation for certain spreadsheet formula prefixes.
- **Read-only separation:** the browser viewer does not write source setups. The optional SDK helper is a distinct local script that reads exposed shared memory and writes local snapshot files; it does not inject code or issue simulator-control commands in the reviewed version.
- **No account integration:** the viewer is not designed to request account passwords, tokens, or login credentials.

**Residual risks and non-guarantees:**

| Category | Status / concern |
| --- | --- |
| Denial of service | Specially crafted files may freeze or slow the UI despite input-size checks. |
| File privacy | File names, notes, setup values and local source paths may appear in user-generated exports or helper reports. |
| Data integrity | Checksums and successful parsing do not establish authenticity, authorship, or correctness of third-party files. |
| Review coverage | No comprehensive fuzzing, multi-browser penetration test, supply-chain audit, or independent security assessment has been completed. |
| Future changes | New dependencies, network access, decoding profiles or publishing workflows require renewed review. |

Please do not put personal setups, private SDK captures, session data, credentials, tokens, customer identifiers, or proprietary third-party assets in issues, pull requests, examples, or public commits. Check exported files before sharing; `.gitignore` alone cannot erase tracked files or Git history.

For sensitive security reports, use a private reporting channel where available rather than including proof-of-concept exploits or private data in a public issue. Do not test against infrastructure or accounts you do not own or have explicit permission to assess.

### Compatibility, intellectual property and responsible research

STO Explorer is **independently developed** and is distributed without any claim of authorization from iRacing. iRacing and any other third-party names or trademarks are mentioned solely for factual identification and remain the property of their respective owners.

The repository contains format-analysis and decoding-related source code. **Its technical content may raise contractual or intellectual-property questions independently of the README's wording.** Describing the project as educational, interoperability-focused, local-only, read-only, or white-hat does **not** establish a legal exception, an iRacing authorization, or immunity from account restrictions.

The project is not intended to circumvent anti-cheat controls, tamper with an installed simulator, obtain unauthorized access, disclose other users' data, automate gameplay, or provide a competitive advantage. Do not use it in ways prohibited by applicable law, licenses, or service rules. Stop or remove any component for which required rights or permissions cannot be established.

**Before any public distribution or use connected to iRacing, independently review the current applicable terms and, if necessary, obtain qualified legal advice or written permission.** The publisher does not warrant that distribution or use is permitted or that an account will not be restricted.

Official references:

- [iRacing — Terms of Use and EULA](https://www.iracing.com/terms-use-eula/)
- [iRacing — Supplemental EU Terms](https://www.iracing.com/eu-terms-use-eula/)
- [iRacing — Third-Party Development guidance](https://support.iracing.com/support/solutions/articles/31000179757-third-party-development-please-review-the-iracing-terms)

### Project limitations

This is an **experimental file viewer**, not an official product, a game modification, a setup generator, a physics model, or a validation service. Its built-in native profile catalog is incomplete, and observations may cease to apply after third-party software updates. The optional SDK snapshot provides a separate view of values exposed during an active session; it does not reconstruct every setup from disk.

---

<a id="italiano"></a>
## Italiano

### Finalità e ambito

STO Explorer è uno strumento sperimentale utilizzabile nel browser per **ispezionare localmente, rappresentare e confrontare (A/B)** file di configurazione selezionati dall'utente. Il progetto è orientato alla ricerca didattica, allo studio dell'interoperabilità, alla riproducibilità e alla revisione difensiva del codice.

Il prototipo esamina una versione osservata del contenitore `.sto` associato a iRacing. Il riferimento identifica soltanto il formato oggetto di studio: **non** implica collaborazione, approvazione, certificazione di compatibilità o titolarità di tecnologie di terzi.

**Limiti dell'ambito**

- Il visualizzatore HTML funziona localmente: non richiede account iRacing, simulatore aperto, server o collegamento Internet.
- L'utente seleziona esplicitamente i file. Il visualizzatore non cerca setup personali sul disco, non modifica gli originali, non scrive configurazioni nel simulatore, non controlla il simulatore e non automatizza azioni competitive.
- Un helper Windows **facoltativo e separato** legge in sola lettura una mappatura di memoria condivisa esposta dall'SDK durante una sessione. Non è necessario per il viewer HTML. Anche l'uso dei dati SDK può essere soggetto a condizioni contrattuali di terzi.
- Gli esempi inclusi sono sintetici: servono per test e dimostrazioni dell'interfaccia, non per convalidare configurazioni ingegneristiche reali.
- I valori decodificati o mostrati **non** sono certificati come corretti, completi, ufficiali, sicuri per il veicolo o accettati dal simulatore.

### Avvio locale

Apri `STO_Reader_Offline.html` in un browser moderno e seleziona uno o due file, oppure utilizza la demo sintetica. Il viewer autonomo non richiede installazione.

I file importati vengono elaborati localmente nel browser. Il visualizzatore esaminato non li invia a servizi esterni. **Esportazioni, report scaricati e snapshot SDK possono però contenere nomi di file o informazioni sui setup: controllali prima di condividerli.**

### Build riproducibile e test

La generazione dell'HTML richiede Python 3.10+; per i test JavaScript serve Node.js 18+. Le istruzioni di build incluse non prevedono pacchetti aggiuntivi.

```bash
python build_sto_reader.py
python run_tests.py
```

Template e moduli vengono assemblati nel file HTML autonomo. I generatori di fixture sintetiche (`build_sto_demo.cjs` e `build_sto_garage_demo.cjs`) consentono dimostrazioni riproducibili. I test coprono specifici casi di decodifica, formattazione numerica, interfaccia, confronti, rendering, import SDK e build; **non** dimostrano correttezza generale né conformità legale.

### Code review — perimetro, rilievi e attività aperte

**Stato: revisione tecnica interna limitata, 17 ottobre 2026.** L'analisi riguarda i file distribuiti e le funzionalità documentate; **non** è un audit indipendente, una certificazione esterna, un penetration test o un'approvazione del produttore.

| Area | Osservazione / limite | Azione successiva |
| --- | --- | --- |
| Architettura | HTML autonomo, sorgenti riproducibili e fixture sintetiche agevolano la revisione. | Mantenere allineati HTML generato e sorgenti; esaminare ogni modifica prima del rilascio. |
| Parsing | È supportato un layout STO v3 osservato; mappature, unità e copertura dei veicoli sono incomplete. | Conservare i campi sconosciuti senza attribuire precisione fisica non verificata. |
| Test | Esistono test mirati anche per input malformati e alcuni casi di escaping. | Aggiungere test browser, fuzzing e vettori indipendenti. |
| Confini di fiducia | File e JSON SDK importati sono input non attendibili, separati dalle risorse dell'applicazione. | Rivalutare ogni nuovo formato, profilo, plugin o export. |
| Disponibilità | Input patologici possono bloccare il thread principale anche rispettando i limiti di dimensione. | Introdurre limiti di complessità e lavoro incrementale o in worker. |
| Pubblicazione | Una `.gitignore` restrittiva riduce gli inserimenti accidentali. | Verificare separatamente indice Git, cronologia completa e artefatti. |

**Nessuna convalida completa dichiarata:** leggere correttamente un campo non significa verificarne il significato tecnico; il superamento dei test non certifica la compatibilità con il simulatore.

### Security review — approccio difensivo

**Proprietà e controlli esaminati (perimetro limitato):**

- **Local-first:** l'HTML distribuito è autonomo e non richiede backend di rete; la Content Security Policy documentata limita connessioni e risorse esterne.
- **Limiti sugli input:** il reader verifica la struttura e limita i file STO a 16 MiB; l'import JSON SDK ha limite di 1 MiB e controlli su struttura, profondità e quantità dei valori.
- **Output più sicuro:** i percorsi UI esaminati utilizzano testo o escaping; i report HTML hanno una policy restrittiva e l'export CSV mitiga alcuni prefissi pericolosi nei fogli di calcolo.
- **Separazione in sola lettura:** il viewer non scrive setup. L'helper SDK opzionale è uno script locale distinto che legge memoria condivisa esposta e scrive snapshot locali; nella versione esaminata non inietta codice e non invia comandi al simulatore.
- **Nessun accesso all'account:** il viewer non è progettato per chiedere password, token o credenziali di accesso.

**Rischi residui e limiti delle verifiche:**

| Categoria | Stato / rischio |
| --- | --- |
| Disponibilità | File appositamente costruiti potrebbero rallentare o bloccare l'interfaccia. |
| Riservatezza | Esportazioni e report possono includere nomi, note, dati di setup o percorsi locali. |
| Integrità | Hash e decodifica riuscita non provano autenticità, provenienza o correttezza dei file. |
| Copertura | Non sono stati completati fuzzing estensivo, penetration test multi-browser, audit della supply chain o valutazioni indipendenti. |
| Modifiche future | Nuove dipendenze, connessioni, profili di decodifica e procedure di pubblicazione richiedono nuove revisioni. |

Non inserire setup personali, acquisizioni private SDK, dati di sessione, credenziali, token, identificativi degli utenti o risorse proprietarie di terzi in issue, pull request, demo o commit pubblici. Controlla i file esportati prima di condividerli: `.gitignore` non elimina dati già tracciati o presenti nella cronologia Git.

Per segnalazioni di sicurezza riservate usa, se disponibile, un canale privato invece di pubblicare exploit dimostrativi o informazioni personali. Non effettuare test su sistemi o account altrui senza autorizzazione esplicita.

### Compatibilità, proprietà intellettuale e ricerca responsabile

STO Explorer è **sviluppato in modo indipendente** e non dichiara alcuna autorizzazione da parte di iRacing. Nomi e marchi di terzi sono citati unicamente a scopo identificativo e appartengono ai rispettivi titolari.

La repository contiene sorgenti relativi all'analisi di formati e alla decodifica. **Tali contenuti possono sollevare questioni contrattuali o di proprietà intellettuale indipendentemente dal testo del README.** Le definizioni “educativo”, “interoperabile”, “locale”, “sola lettura” o “white-hat” **non** creano di per sé un'eccezione legale, un'autorizzazione di iRacing o un'immunità da limitazioni dell'account.

Il progetto non è destinato ad aggirare sistemi anti-cheat, alterare il simulatore installato, ottenere accessi non autorizzati, diffondere dati di altri utenti, automatizzare il gioco o fornire vantaggi competitivi. Non utilizzarlo in violazione di leggi, licenze o regolamenti applicabili. Sospendere l'uso o rimuovere i componenti per i quali non sia possibile accertare i diritti o i permessi necessari.

**Prima di distribuire pubblicamente il progetto o utilizzarlo in relazione a iRacing, esaminare i termini applicabili aggiornati e, se necessario, richiedere un parere legale qualificato o un permesso scritto.** Chi pubblica il progetto non garantisce che la distribuzione o l'utilizzo siano consentiti, né l'assenza di sanzioni sull'account.

Riferimenti ufficiali:

- [iRacing — Terms of Use and EULA](https://www.iracing.com/terms-use-eula/)
- [iRacing — Supplemental EU Terms](https://www.iracing.com/eu-terms-use-eula/)
- [iRacing — indicazioni per sviluppatori terzi](https://support.iracing.com/support/solutions/articles/31000179757-third-party-development-please-review-the-iracing-terms)

### Limiti del progetto

È un **visualizzatore sperimentale di file**, non un prodotto ufficiale, una modifica del gioco, un generatore di setup, un modello fisico o un servizio di certificazione. Il catalogo dei profili nativi è incompleto e le osservazioni potrebbero non valere dopo aggiornamenti del software di terzi. Lo snapshot SDK facoltativo mostra separatamente valori esposti durante una sessione attiva: non permette di ricostruire ogni setup presente su disco.
