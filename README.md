# STO Explorer

**English** · [Italiano](README.it.md) · [Changelog](CHANGELOG.md)

[![Build verification](https://github.com/xmanuita-a11y/sto-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/xmanuita-a11y/sto-explorer/actions/workflows/build.yml)

A standalone, read-only browser tool for inspecting and comparing iRacing setup files. Built with vanilla JavaScript, WebCrypto and a dependency-free Python build script.

**Experimental release candidate.** Supports observed STO v3 containers. Model-aware reference layouts are available; a complete native Garage replica and simulator validation are outside the current release.

This is an independent project, not affiliated with, endorsed by or supported by iRacing. Third-party names and trademarks belong to their respective owners.

## Try it locally

1. Download [STO_Reader_Offline.html](STO_Reader_Offline.html) using GitHub's **Download raw file** action.
2. Open it in a current Chrome, Edge or Firefox browser.
3. Load one or two files you are authorized to use, or open **Compare and offline tools → DEMO · SYNTHETIC**.

No installation, server, account, network connection or running simulator is required for the viewer. Selected files are processed locally; the app does not upload them or modify the original setups.

## Features

- **A/B comparison:** exact decimal differences, search, change-only filtering and per-field provenance.
- **Model-aware reference panels:** wheel, axle, heave, third and central suspension, aerodynamics, drivetrain, electronics and fuel.
- **Structural coverage:** 53 model/content-version identities, 89 global field schemas and 98 model/schema combinations. Matching field names do not imply equivalent vehicle behavior.
- **Separate observations:** optional SDK JSON snapshots and the supported HTML setup-export subset retain their own values, units and notes.
- **Local result exports:** CSV, printable HTML and bilingual English/Italian presentation.
- **Read-only design:** no setup writing, simulator control or technical-inspection claims.

In **Compare and offline tools**, choose **Open iRacing HTML export** to inspect a supported exported document. Its values remain separate from any STO files already open.

## Engineering approach

The project separates byte decoding, original parameter values, reference presentation and externally supplied observations. Unknown values retain their technical names and original codes; missing simulator outputs are not synthesized.

| Component | Responsibility |
| --- | --- |
| [Reader](sto-reader-core.js) | Bounded STO parsing, source hashes, duplicate-field identity and exact comparison |
| [Presentation](sto-reader-presentation.js) | Explicit decimal formatting and qualified field descriptions |
| [Model layout](sto-model-layout.js) | Reference grouping without inheriting another model's control semantics |
| [HTML export reader](sto-native-export.js) | Inert-text parsing of the supported export subset |
| [SDK view](sto-sdk-garage.js) | Display of separately imported session observations |
| [Builder](build_sto_reader.py) | Reproducible, self-contained HTML without external dependencies |

## Build

Requires Python 3.10 or later. No pip or npm packages are needed.

```sh
python build_sto_reader.py
```

The build embeds the reviewed sources, catalogs and synthetic demo data into the standalone HTML. The public workflow verifies the build and source syntax on Linux and Windows. Tests, development fixtures, local audit reports and session data are intentionally kept outside the public repository.

## Optional SDK capture

On Windows, with a suitable session already running:

```sh
python capture_iracing_garage_sdk.py
```

The optional helper reads the public SDK shared mapping and writes each acquisition to a new, excluded local directory. It does not open a simulator process handle or inject code. Import the resulting snapshot through the viewer's offline tools. Captures can contain setup and session details; review them before sharing.

## Scope and limitations

- Compatibility is limited to observed file variants; future updates may change the format.
- Reference layouts and name-based unit conversions are qualified interpretations, not verified native control catalogs.
- The distributed native-profile catalog is empty. No complete ranges, enums, setup physics or technical-inspection results are provided.
- SHA-256 identifies file bytes; it does not establish authorship, authenticity or simulator acceptance.
- Processing remains on the browser's main thread. Input budgets reduce resource use but are not an assurance against every hostile input.

See [Security](SECURITY.md), [Contributing](CONTRIBUTING.md) and [Project status](PROGRESS.md) for the verification boundary and remaining work.

## Privacy and license

Only explicitly allowlisted application sources, sanitized documentation and embedded synthetic demo data are published. Personal/commercial setups, captures, tests, logs, workstation paths and internal investigation materials are excluded.

Original project code is available under the [MIT License](LICENSE). This grants no rights in third-party products, services, trademarks or materials; see [Third-party notices](THIRD_PARTY_NOTICES.md). Use only files you are authorized to access and respect applicable terms.
