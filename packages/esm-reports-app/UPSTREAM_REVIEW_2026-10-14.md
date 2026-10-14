# Reporting app upstream review — 14 October 2026

Compared the NMRS fork (original HEAD `e1008df`, version 5.2.6) with the public OpenMRS `main` at `ca93062d2de732bd5a584cca10dd351c9d1b417f`, dated 11 October 2026. Common ancestor: `f03817f7a929ac0c726bdc51ec92d070a694a741`. This is a code/history comparison, not a merge. Upstream's version numbers and this fork's version numbers are independent.

## Feature changes worth adopting

| Upstream change | Recommendation for NMRS |
| --- | --- |
| [Refresh active report requests and remove dead routes (#418)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/c0a92a7950d8e23fe16e914562081f269762077f) | Active-list polling is included in the current feature work. Keep its numeric SWR interval so elapsed-clock renders do not postpone the next fetch. Review route removals separately against NMRS custom routes. |
| [Pin report-overlay action buttons to the bottom (#419)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/c727d81) and [space form fields with Carbon Stack (#423)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/827b70e) | High-value next UI cleanup: Run/Cancel stay reachable when parameters overflow. Preserve NMRS date validation, category filtering and report visibility rules when porting the layout. |
| [Reports page header/pictogram (#408)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/e497c33) and [headers for other Reports pages (#414)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/06a5b09) | Adopt the consistent O3 page layout after checking the framework version that provides PageHeader/ReportsPictogram. Keep the existing NMRS header-color customization. |
| [Fix literal `{parameters}` in missing-parameter errors (#376)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/f462a28) | Safe targeted fix for the webview workflow before enabling it: use the translation engine's correct interpolation and test that the actual missing names appear. That route is currently backlogged in NMRS. |
| [Framework modal for export-column selection (#352)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/e4a4e7e) | Adopt before enabling webview exports; brings the column selector into the standard modal workflow instead of the older custom overlay. It is not a new server-side export engine. |
| [Share SWR through module federation (#372)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/c57716b) | Coordinate with the framework/build upgrade; shared cache behavior is useful for cross-component refresh. Do not change federation dependencies blindly in an otherwise small feature release. |

## Engineering updates, not extra end-user report features

- [Remove observable-fetch dependency (#380)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/a79ac9c): use standard promise-based fetching consistently; preserve asynchronous report queuing.
- [Remove unused image-annotation dependency (#371)](https://github.com/openmrs/openmrs-esm-admin-tools/commit/94c7abe): useful dependency/bundle cleanup, after confirming NMRS has no references.
- Peer-dependency changes for Carbon and React DOM (#324/#391), framework upgrades through 10.x and 11.x (#295/#429), ESLint 9 (#325), Vitest (#277), Rspack and trusted npm publishing affect the wider monorepo/toolchain. Plan these as a coordinated upgrade, not cherry-picks bundled into report cancellation.
- Translation updates and CSS cleanup can be adopted selectively. Keep NMRS-specific strings and styles; translated text is not evidence of a new report feature.

## What this comparison does not justify

- No automatic un-hiding of Report schedule or Reports Webview. Their workflow readiness needs separate acceptance testing.
- No replacement of NMRS package identity, report UUID visibility rules, canonical ART selection, category support or date-range validation with upstream defaults.
- No evidence in the reviewed reporting changes of a new charting/ETL/dashboard engine or a real percentage-progress API.

## PR boundaries for the current work

1. Generic queued/running cancellation: standard Reporting REST, existing modal, exact paginated-cache invalidation, confirmation and tests.
2. Generic request/processing elapsed times and recorded timestamp stages, active-list polling and tests. Upstream already has #418; adapt only the additional timing work and avoid duplicating that fix in a PR.
3. Optional NMRS enrichment/cancel endpoint configuration: **exclude from a generic community PR** unless maintainers explicitly want a pluggable contract. It defaults to the NMRS endpoint only in this fork and can be disabled with `reportRequestStatusEndpoint: ""`.

Backend/Reporting UI 2.x work is in the separate `openmrs-module-nmrsreports` repository. These commits have not been pushed, published or submitted as a PR. Tests use mocked or synthetic requests; live UI/server cancellation still needs acceptance testing.
