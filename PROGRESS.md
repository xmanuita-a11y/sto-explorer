# Project status

Last updated: 2026-10-27 · Release candidate: 1.0.0-rc.2

## Available

- Standalone, read-only STO v3 viewing with exact decimal A/B comparison.
- Model-aware reference grouping and conditional navigation for 98 observed model/schema combinations.
- Separate HTML setup-export and SDK snapshot views.
- Local result exports, synthetic demos and an English/Italian interface.
- Public, dependency-free build and source-syntax verification.

## Verification boundary

The private regression run passed 12 synthetic application suites, four SDK capture-lifecycle checks and isolated builds. Synthetic encrypted inputs exercised all 98 model/schema combinations without omitted or duplicated field identities. Browser smoke checks covered model navigation, central suspension, HTML import, notes and returning to an unchanged STO view.

These results are separate from full native-Garage equivalence, exhaustive browser coverage and simulator acceptance. Private tests, fixtures, sample data, local reports and investigation materials are not published.

## Remaining work

- Obtain independently verified, model/version-specific native control definitions before adding native profiles.
- Validate additional export variants and more complete browser/device coverage.
- Consider worker-based processing and progressive rendering for larger supported inputs.

The native profile catalog remains empty. Unknown values and unsupported native behavior remain explicit.
