# Changelog

Notable user-facing changes are recorded here in reverse chronological order.
Pre-release versions remain experimental and do not imply simulator compatibility.

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
