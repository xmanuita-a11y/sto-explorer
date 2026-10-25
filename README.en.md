# STO Explorer

[Italiano](README.md) | **English**

Offline viewer for iRacing setups — experimental demo, currently optimized for NASCAR Next Gen.

STO Explorer is an independent viewer for exploring iRacing `.sto` setup files and comparing two configurations. Its interface recreates a garage environment, with current support focused on NASCAR Next Gen cars, especially the Toyota Camry.

## Getting started

Download `STO_Reader_Offline.html` and open it in a modern browser. It is a standalone page: no installation, server, internet connection, or running simulator is required. Load one or two STO files, or try the included demo, which uses synthetic data.

Selected files are processed in your browser. The app does not upload them to a remote service. It provides A/B comparison, filters, notes, result exports, and an Italian/English interface. It does not modify the original setups.

## Demo status

The decoder supports the version 3 STO container observed during development. Compatibility with every car, simulator version, and update is not guaranteed.

The visual garage reconstruction and the interpretation of values are separate layers. The distributed native profile catalog is currently empty: the complete mapping from STO fields to all Next Gen garage controls and conversions is still incomplete. Unverified fields retain their original codes and are not presented as confirmed physical values. The synthetic demo illustrates the interface; it does not validate the simulator's calculations.

The modern garage frame incorporates selected details recovered from the client's XAML resources: the contextual side panel, compact file actions, selected colors and text styles, and Garage icon geometry. Parameter explanations retain their NextGen manual source, while SDK control styles keep simulator-observed values separate. Substitute fonts, the reference layout, and the incomplete catalog mean this is not yet an identical recreation of each car's garage.

You can also import a garage JSON snapshot from the iRacing SDK using the offline tools in File Actions. This displays the strings and units supplied by the simulator separately from STO files. The SDK layout is currently verified only for the Toyota Camry NextGen. A snapshot represents the current session state; it cannot reconstruct arbitrary setups offline. Controls requiring writes, physics simulation, or technical validation are disabled. The project does not generate compatible STO setups or certify that a setup will pass technical inspection.

## Optional SDK snapshot

On Windows, with an iRacing session running, execute:

```powershell
python capture_iracing_garage_sdk.py
```

The helper reads the SDK's public shared memory in read-only mode. It does not inject code into the simulator. It writes results to `private-reference/runtime-garage-sdk/`, which is excluded from Git. Import the resulting `car-setup-snapshot.json` into the viewer. Snapshots may contain setup and session details and remain local files.

## Source and verification

Rebuilding the HTML requires Python 3.10 or later and the source files in this folder. No additional packages are required.

```powershell
python build_sto_reader.py
```

The builder embeds the `sto-reader-ui.html.in` template, `sto-reader-*.js` and `sto-native-*.js` modules, `sto-sdk-garage.js`, and their JSON data into the HTML. The verification suite and development fixtures are maintained locally and are not included in the public distribution.

## Repository contents

The repository contains the app, its required sources, synthetic demo data, changelog, progress notes, and README files. It does not include personal or commercial setups, replays, session screenshots, development fixtures or test scripts, memory dumps, executables, game resource archives, or investigation logs. The `.gitignore` file permits only explicitly listed files: new source files must also be added to that list.

The technical material required for STO decoding is included in the source and HTML. It cannot be kept secret in a standalone offline viewer. It is not an iRacing account credential.

## Security review

The review dated October 17, 2026 covered the distributed viewer, builder, and SDK helper. It examined import, display, and export paths and relevant synthetic tests. It was not an independent audit, a complete penetration test, or an assessment of the simulator's or iRacing services' security.

### Existing controls

- **Local processing:** the HTML embeds the necessary code and data and loads no CDN libraries. The reviewed application modules contain no network calls or localStorage/sessionStorage writes. The Content Security Policy blocks network connections, external resources, and form submissions while permitting the inline scripts and styles needed by the standalone page.
- **Import validation:** `sto-reader-core.js` checks version, sizes, encrypted-body alignment, padding, and the terminator. STO input is limited to 16 MiB. SDK import in `sto-reader-ui.js` and `sto-sdk-garage.js` limits JSON input to 1 MiB and checks structure, depth, value count, and string lengths. Imported files are not executed as code.
- **Display and export:** imported names, notes, and values are displayed using `textContent`. HTML reports escape content and use a policy that disallows scripts; notes are included only when explicitly selected. The native renderer escapes HTML and treats profiles as trusted build sources; the distributed catalog is empty. CSV export quotes cells and prepends an apostrophe to formula prefixes handled by the code.
- **Read-only operation:** the viewer neither writes STO files nor controls the simulator. The Python helper reads public SDK shared memory and writes only selected local files. Existing tests cover corrupt input, hostile HTML strings, exports, source paths outside the project, and mismatched hashes. DOM fixtures do not constitute security testing across all browsers.

### Findings and limitations

| Severity | Finding | Recommendation |
| --- | --- | --- |
| Major, local availability | STO parsing, decimal arithmetic, and rendering have no separate row/digit budget and run on the main thread. The byte limit does not prevent pathological inputs from freezing the interface. | Before accepting hostile files, add complexity limits, progressive rendering or a worker, and dedicated tests. |
| Minor, sharing | CSV, reports, printouts, and SDK snapshots may contain file names and setup data; the helper report may include a local path. | Review exports before sharing and keep outputs out of Git. Check CSV protection in the spreadsheet applications you use. |
| Cryptographic limitation | Valid padding and SHA-256 do not establish setup authorship or authenticity. The decoder does not verify a producer signature. | Use hashes to identify bytes and compare files, not as certificates of authenticity or simulator validity. |

**Outcome:** usable as an offline demo within the stated scope; additional measures are required for robust handling of deliberately hostile input. The Content Security Policy cannot protect an HTML copy or build sources that have already been altered. Embedded decoder material is not a secret that can be protected on the client.

### Publication privacy

Distribution verification compares files downloaded from GitHub against approved files and checks Git metadata separately. `.gitignore` must be tracked, but it does not remove already tracked files or data from history. Commits use a `noreply` identity; publication credentials and tokens must never appear in files or commit messages. Recheck this rule after future changes.

## Why an independent reader was possible

The simulator must be able to read setups locally. In the examined build, the client implementation and the material needed for decoding were available on the computer. Reconstructing the transformation sequence made it possible to run it in an independent program. This did not require brute-forcing an AES key or accessing a remote account.

The STO v3 pipeline reproduced by the decoder combines two AES-256-CBC passes, per-file material from the header, static material associated with the build, and a table-based byte transformation. Reversing these steps yields text containing a car identifier and parameter value/name pairs. Notes are read separately as UTF-16LE; the binary tail remains uninterpreted. Synthetic generators allow verification that decoding returns exactly the expected text without distributing personal setups.

This result applies to the observed implementation and format. It does not demonstrate a mathematical weakness in AES, access to iRacing services, or compatibility with every future build. Keys and offline reading logic available to a client cannot be considered an absolute barrier to analysis of that client.

Reading parameters does not automatically reconstruct the garage. Labels, conversions, controls, and physical outputs require additional definitions. Screenshots guided the appearance; the public SDK provides values already formatted by the simulator during a session. This second source remains separate from STO decoding and does not replace the incomplete native mapping.

STO Explorer is an independent experimental project, neither affiliated with nor endorsed by iRacing. Names and trademarks belong to their respective owners.
