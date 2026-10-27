# Security and data handling

STO Explorer is a local, read-only viewer. Its threat model does not include validating or controlling the simulator, proving setup authenticity, or protecting a modified build from its distributor.

## Input and rendering boundary

- STO containers: at most 16 MiB. Decoded parameter text: at most 1 MiB, 16,384 lines, 4,096 characters per line, 4,096 parameters and 128 characters per numeric token.
- SDK JSON: at most 1 MiB, with bounded depth, field count and formatted-string lengths.
- HTML setup exports: at most 1 MiB within an explicit tag/attribute subset. Active markup is rejected; parsed values are rendered as text.
- Original imported names, notes and values are displayed with `textContent`. HTML result reports escape data and prohibit scripts.
- The standalone page does not fetch remote libraries or send selected files to a service. Its Content Security Policy blocks external resources, connections and form submissions.
- The optional SDK helper reads public shared memory and writes local files. It does not open a simulator process handle or inject code.

The viewer still runs on the browser's main thread. Input limits reduce complexity but are not a complete denial-of-service defense. The dependency-free build does not imply an independent security audit.

## Publication and sharing

The public source allowlist excludes personal/commercial setups, captures, tests, development fixtures, logs and local reports. Commit metadata must use a public handle and a `noreply` email address.

Exports and SDK captures can contain setup data, file names and session details. Review outputs before sharing. A valid hash or successful decode does not authenticate an input.

## Reporting a concern

Do not upload private setups, credentials, captures or workstation paths to public issues. Use GitHub's private vulnerability reporting when available. Otherwise provide only a minimal, non-sensitive description and request a private contact route.
