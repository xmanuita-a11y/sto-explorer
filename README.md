# STO Explorer

**English** · [Italiano](README.it.md) · [Changelog](CHANGELOG.md)

A standalone, read-only viewer for iRacing STO v3 setup files. Release candidate **1.0.0-rc.4**.

Download `STO_Reader_Offline.html` and open it in a current Edge, Chrome or Firefox browser. English is the default; the language selector is always at the top right. Open a setup or try the synthetic examples. No server, account, running simulator or installation is required.

## What it shows

- Original parameter values, technical names, notes and unparsed lines.
- Exact decimal A/B comparison, search, filters, CSV export and printing.
- Native layout reconstructions for exact Camry NextGen, Ferrari 296 GT3 and Porsche 963 GTP identities and supported content versions.
- Explicit unit conversions. Missing simulator outputs remain unavailable; unknown codes retain their original values.
- A reference layout and raw table for other cars. A shared field name does not establish shared physics or Garage limits.

HTML setup import and HTML report export have been removed. SDK JSON observations, if imported, remain separate from STO values. Raw values are available in the table and original-content panel even when no native control exists.

## Privacy

Selected files are processed in browser memory. The viewer uploads nothing, uses no analytics or accounts, and never modifies setup files. CSV and print output can contain the files you opened; share them deliberately.

The release tree contains synthetic demos and normalized compatibility metadata. It excludes personal setups, captured session data, memory dumps, archive keys, raw simulator resources and machine-specific paths. A Content Security Policy disables application network connections. Hosting providers can still receive ordinary page requests when visiting a hosted copy.

## Build and verification

Python 3.10+ builds the standalone file without packages:

```sh
python build_sto_reader.py
```

Python 3.10+ and Node.js 18+ run the public synthetic checks, source syntax and release privacy scan:

```sh
python run_tests.py
```

Optional browser verification uses Playwright (`node test_browser.cjs`). It checks the UI using synthetic values only.

Public builds need no private archive, source extraction, account or setup directory. The normalized metadata snapshot records source hashes for provenance. Hashes identify bytes; they do not certify complete Garage equivalence. The native view is read-only and incomplete: conditional limits, engine calculations and some layout details remain in [TODO.md](TODO.md).

Independent project, not affiliated with or endorsed by iRacing. MIT covers original project code; see [third-party notices](THIRD_PARTY_NOTICES.md).
