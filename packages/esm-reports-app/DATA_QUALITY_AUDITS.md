# Structural data-quality audit visibility

The next source batch removes only these names from `EXCLUDED_REPORT_NAMES`:

- ERROR - DUPLICATE ART START DATES (`5c4758bf-b1be-45ca-8924-daddc3963b24`).
- ERROR - ENCOUNTER WITHOUT ADD PAST VISIT (`64b6148d-12b9-46df-bdba-896ae7504ae5`).

The backend must contain the corrected `dataset-DuplicateARTStartDate.xml` and `dataset-EncounterWithoutAddPastVisit.xml` from the backend's `docs/data-quality-audits-2026-10-23.md` batch **before** deploying a new frontend release. Backend 1.1.12 still contains the old SQL for these audits. This is unreleased source preparation, not an installation or a second publication of reports 5.2.9. Assign fresh release versions and deploy backend first, then verify installed definitions and exports before facility rollout.

The existing report names, UUIDs, parameters, renderers and permissions remain unchanged. Name gating is not authorization or a backend-version/SQL check. The frontend does not repair clinical data.

Interpretation:

- Duplicate ART-start candidates count active observations in the selected **observation-date** period, not lifetime distinct treatment dates. The backend distinguishes identical repetitions, multiple distinct date values and empty values. These are review candidates, not a new ART restart rule.
- Missing-visit candidates have `visit_id IS NULL` in the selected **encounter-date** period. The historical name does not prove Add Past Visit was omitted. Non-NULL dangling/voided/wrong-patient visit references are outside this audit.
- Configuration rows are not patient errors. Both reports retain their original columns and append audit/issue fields; fixed-width consumers must accommodate 10 and 11 columns respectively.

ART, HTS, Transit and the two reviewed pharmacy reports remain visible. Viral-load incompleteness, biometric reports, all other name gates and the legacy ART/SI-RADET UUID gates remain excluded. The list is still alphabetically sorted without mutating API results. Current policy: 61 name gates and two UUID gates.

Source verification: 65 tests across 12 suites, TypeScript, changed-file ESLint/Prettier and the production webpack build passed. Existing framework mock-store, asset-size and stale Browserslist warnings remain; no dependencies were upgraded. Backend synthetic validation covers duplicate identifiers, repeated/corrected observations, full end-day boundaries, renamed metadata IDs, strict SQL grouping and explicit metadata diagnostics. This is not a live clinical export, installed-definition or performance claim. The user deferred populated pharmacy-output acceptance and the XLSX/`.xls` filename mismatch; neither is changed here.
