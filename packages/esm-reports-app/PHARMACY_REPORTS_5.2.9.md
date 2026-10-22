# Reports 5.2.9 — pharmacy data-quality batch

This local NMRS release exposes two reviewed reports, in the existing alphabetically sorted Run report dropdown:

- ERROR - PHARMACY FORMS WITHOUT DURATION (`4d8abe9b-1ec7-4dd0-bc2f-727b79b9e7cf`).
- ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN (`5165f183-74f8-47ee-b84d-e18432524c13`).

Use with **nmrsreports 1.1.12 or a later release retaining these pharmacy fixes**. Deploy the corrected backend before this frontend: dropdown visibility does not verify backend SQL/version, and older modules still package the old queries. GF propagation is separate; do not assume an earlier GF version includes this batch.

## Approved scope

The backend audits missing prescribed duration or prescribed duration over 180 days across recorded medication groups, without substituting dispensed days. The regimen audit covers ART prescription encounters only, with explicit non-ART purpose exclusion and reviewed legacy ARV evidence. It fixes UUID mappings, same-day boundaries, duplicate selection, medication labels and quantities, and the child-third-line question. Backend documentation records full clinical/technical boundaries.

If metadata is missing/incompatible, an export can contain an explicit **IssueType=Configuration** diagnostic with blank patient identifiers. It is not a patient and must not be counted as one. Updated outputs add audit fields/reasons; the duration output renames misleading DispensedBy to EncounterProvider. Fixed-schema CSV consumers need the documented backend column contract, not just the old display names.

Only these two name exclusions were removed. The remaining **63 name exclusions and two UUID exclusions**, canonical ART name/identity, HTS, Transit, sorting and nonmutation rules are retained. Existing progress/cancellation, Webview, overlay/header and export-column features remain unchanged. No charts or analytics dependency was added. This is not a framework/router/security remediation or clearance of the separately deployed O3 host.

## Verification and release boundary

All 64 reports-package tests across 12 suites, TypeScript, changed-file ESLint and Prettier pass at the source checkpoint. The backend separately passes 45 synthetic MySQL assertions, five dataset contracts and nine inventory checks. Those are not live CSV/Excel or browser certification. Existing framework mock/store re-registration warnings remain visible in tests; they were not suppressed.

Version preparation, production build/package inspection and any dev-server verification are recorded separately when completed. No npm publication, push, facility rollout, clinical-source mutation or schedule enablement is implied. Publishing the package would not deploy its backend or select the package in a distro/import map.

From this package directory, use the existing installed workspace tools:

```powershell
npm.cmd run build
npm.cmd pack --dry-run --ignore-scripts
```

The repository still uses its existing Yarn workspace lock; no install, dependency upgrade, new lockfile or copied authentication file is required. Never include `.npmrc`/tokens in source, package evidence or commits. Real tarballs should be written outside this package directory so a later pack cannot include an earlier tarball.
