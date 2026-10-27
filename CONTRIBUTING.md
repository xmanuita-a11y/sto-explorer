# Contributing

Keep changes focused, read-only and explicit about their evidence boundary. This project is independent of iRacing; do not imply affiliation, endorsement or simulator compatibility beyond demonstrated support.

## Local build

Use Python 3.10 or newer:

```sh
python build_sto_reader.py
```

No package installation is required. Open the generated HTML and use the embedded synthetic demo for a basic browser smoke check. The public workflow also checks Python syntax, the built JavaScript and reproducible HTML output on Linux and Windows.

The behavioral regression suite and development fixtures are maintained privately and are not part of this repository. Do not document private commands as publicly reproducible checks.

## Source changes

- Keep parsing, raw values, reference presentation and imported observations separate.
- Preserve duplicate fields, original values and unknown data; do not guess missing simulator outputs.
- Add a public source file only through an explicit `.gitignore` allowlist entry.
- Regenerate the standalone HTML whenever an embedded source or catalog changes.
- Add a concise, user-facing entry to `CHANGELOG.md` for meaningful behavior changes.
- Use focused commit subjects such as `fix(parser): reject oversized numeric tokens` or `docs: clarify model coverage`.

## Privacy

Do not commit test files, development fixtures, setup files, session captures, screenshots containing personal data, logs, local paths, credentials or investigation dumps. Use a public handle and a `noreply` email for Git commits. Bug reports should describe the behavior without attaching private or commercially supplied setups.

## License

Contributions of original project code are accepted under the repository's MIT license. Do not contribute third-party material that you cannot authorize for redistribution.
