# Changelog

## 1.0.0-rc.4 — 2026-11-05

- Remove HTML setup import and HTML report export.
- Default to English and keep language selection at the top right.
- Correct declared native conversion overrides; require exact car identity.
- Remove private observational payloads and machine-dependent build inputs.
- Ship public regression and privacy checks; document unresolved simulator calculations.


Notable user-facing changes are recorded here in reverse chronological order.
Pre-release versions remain experimental and do not imply simulator compatibility.

## [Unreleased] - 2026-11-02

### Added

- Native garage surface driven by one verified profile: 145 recovered control records attested by SHA-256 against the decoded `ui.cml`, `local.cro` and `common.cro`, with explicit metric/imperial unit branches, per-tab page mapping and a second SDK-style layout.
- `linkedInput` provenance markers: 15 recovered controls show the computed variable they feed through `data-linked-variable`, and the diagnostics explain the `<ni>` link even when the computed value itself is unavailable. Engine-side values without a recovered value render as `—` instead of an invented number.
- Declared-only section: values the setup file writes that have no recovered native control are listed once per garage page with their verified range and format, without claiming a native position for them.
- Native labels, tooltips and unit formats localized through the existing i18n layer; the English locale file only received additions.
- NextGen shared-layout equivalence, labelled on screen: the verified Camry profile also renders `chevycamarozl12022` (3 official presets) and `fordmustang2022` (41 official presets) through an explicit equivalence instead of a silent fallback. The banner and a `nextgen-shared-profile` limitation record the observed basis (identical 74-entry name sets across the 45 official presets, `ui.cml` declaring Camry and Camaro, 2112 preset values inside the declared ranges) and the declared exceptions: `steeringArmLength` is fixed at 0.1535 m for Camry/Camaro while 10 of the 41 Mustang presets carry 0.178 m, and `dashDisplayPage` is written by Mustang presets but is absent from the verified metadata.
- Per-vehicle garage reconstruction for every car in the local profile set (`sto-native-car-reconstruction.json` plus generated pages): each car shows its recovered parameter names, the min/mode/max range observed across its decoded setup files, and the native metadata status per control — `REALE` only where the control comes from the verified profile, `OSSERVATO` for the declared-equivalence cars, `INFERITO` where a same-named control has verified metadata on another car, and `BLOCCATO` where no native metadata was recoverable offline. Garage sections are derived from the field-naming model and never invented for an unclassified name.
- The reconstruction is now available inside the reader itself: a `Reconstructed garage` toggle in the garage tools renders the loaded setup over the reconstructed sections, showing the setup's own value next to the observed range and the native metadata status of each control. The toggle is only offered for cars without a verified native profile (verified cars keep the verified native render), and each entry flags when the observed range falls outside the declared range of the borrowed profile.
- Two more verified native profiles, each attested by SHA-256 against its decoded `ui.cml`, `local.cro` and `common.cro`: `ferrari296gt3-native-v1` (155 control records, 4 garage tabs `TIRES/AERO`, `CHASSIS`, `DAMPERS`, `NOTES`) and `porsche963gtp-native-v1` (217 control records, 5 garage tabs including `BRAKES/DRIVE UNIT`). Both render their own native tab strip, section titles, labels and tooltips in the reader.
- Native label dictionary (`sto-native-label-dictionary.json`): 231 control labels and 333 tooltips read byte-exact out of the three decoded `ui.cml` files (Camry 304 widgets, Porsche 963 GTP 193, Ferrari 296 GT3 145), each source recorded with its SHA-256 and widget counts. 2039 of the 4209 reconstructed fields now carry a real native label and 1732 carry the native tooltip. A label taken from another car's `ui.cml` is always marked `INFERITO` and names the source car together with how it was chosen: `(stessa classe)` when the source car races in the same class as the target, `(classe diversa)` otherwise, plus `etichetta identica su tutte le vetture decodificate che lo dichiarano` when every decoded car that declares that control shows the same text. 31 further fields match a native control only after normalizing the unit suffix in the name (`fBarDia` → `fBarDiam`), and those say the match is not on the exact name. When the same control name carries different native labels on different cars, the label is chosen by class affinity (`gt3`, `gt4`, `gte`, `gtp`, `cup`, `lmdh`, `gt2`, `stockcar`) and all 648 conflicting label occurrences keep every candidate visible in the entry tooltip instead of one being picked silently.

### Fixed

- The reconstructed garage no longer borrows metadata from the first catalog profile only: each car now uses its own verified profile when one exists, and otherwise borrows each control from whichever verified profile declares it, so a car can no longer be described by the wrong car's ranges or formats.

- A setup name that the verified profile cannot describe no longer aborts the whole render: it is reported as an explicit unmatched-entry limitation, and only in the labelled equivalence path. The exact-identity path stays strict.
- The equivalence note no longer emits stray separators between its sentences.

### Verification

- 96 of 96 available setups render natively (52 through exact identity, 44 through the labelled equivalence), 0 failures.
- Browser check of the built offline file with a decoded Mustang preset: all four garage pages render, the Chassis tab shows 74 controls with 15 `linkedInput` markers, and the equivalence banner is visible with its exceptions.
- Per-vehicle garage reconstruction: `sto-native-car-reconstruction.json` covers 63 cars / 4209 parameter occurrences (3383 grouped into native garage sections, 826 left unclassified), with 1 verified profile, 2 declared-equivalence cars and 60 cars whose native metadata stays blocked; 64 generated pages under `garage/cars/`.
- Browser check of the built offline file with a decoded `porsche911rgt3` preset: the reconstruction toggle renders 86 controls across 8 reconstructed sections plus 10 without a section (42 `OSSERVATO`, 44 `INFERITO`), 84 controls show the setup's own value, 20 entries flag an observed range outside the borrowed declared range, and the console stays clean. With a verified Camry preset the verified native render is kept and the toggle is disabled.

## [1.0.0-rc.3] - 2026-10-27

### Added

- Direct Garage demo selector with synthetic Camry NextGen, Acura GTP and Ferrari GT3 A/B examples.
- Public functional verification of demo decoding, content hashes, ordered model fields and exact comparison differences.
- Explicit synthetic-value disclosures and bilingual instructions for trying the app without personal files.

### Fixed

- Build comparison table rows only when the table view is active; clear the hidden table when returning to Garage.

## [1.0.0-rc.2] - 2026-10-27

### Added

- Model-aware reference panels for heave, third and central suspension, aerodynamics, drivetrain, electronics and fuel.
- Exact structural lookup for 53 model/content-version identities and 89 global field schemas, represented by 98 model/schema combinations.
- Local import of the observed iRacing HTML setup-export format, retaining document labels, ordered values and notes.
- Separate views for SDK snapshots from other models without inheriting Camry control semantics.
- Setup search, difference filtering, swap, reset and comparison summaries in the Garage sidebar.
- Public build verification on Linux and Windows with pinned Actions and read-only workflow permissions.

### Fixed

- Preserve additional SDK domains instead of omitting them from the Garage view.
- Keep diffuser, differential, hybrid and central-suspension parameters in distinct reference panels.
- Reject inferred metadata in verified native profiles and disclose unsupported native control assets.
- Preserve earlier SDK captures by creating a new output directory for every acquisition.
- Show load and comparison warnings outside the collapsed reader panel.
- Keep model navigation compact without overlapping the setup caption.
- Bound decoded text, line counts, parameter counts and numeric-token length before rendering.

### Documentation

- Make English the primary overview and retain a maintained Italian guide.
- Add MIT licensing for original project code, third-party notices and concise contribution/security guidance.
- Keep private verification files and internal investigation reports outside the public repository.

### Validation

- The private regression run covers 12 synthetic application suites, four SDK capture-lifecycle checks and isolated builds.
- Synthetic encrypted inputs cover all 98 observed model/schema combinations without omitted or duplicated field identities.
- Browser smoke checks cover model navigation, central suspension, HTML export import, notes and return to STO mode.
- Native control catalogs remain incomplete; reference grouping does not establish native units, enums or physics behavior.

## [1.0.0-rc.1] - 2026-10-17

### Added

- Standalone, read-only STO v3 viewing and A/B comparison.
- Garage-first presentation with Italian and English interface text.
- Local result exports and optional public-SDK snapshot viewing.
- Embedded synthetic demos without personal setup files.

### Changed

- Kept setup notes in the Garage Notes view instead of a separate home-page panel.
- Restricted repository contents to explicitly reviewed public files.

### Documentation

- Added an English README and language navigation on 2026-10-25.
