# Reports 5.2.10 — reviewed NMRS report dropdown

This release packages the already-reviewed visibility changes made after 5.2.9. Use with **NMRS Reports 1.1.13 on release/pepfar**, or a later backend retaining these fixes. Install and verify the corrected backend before loading this frontend. An older GF build is not automatically equivalent.

## Expected All Categories list

When all corresponding active report definitions are returned by the backend, the following 25 packaged reports are visible, sorted alphabetically:

1. Active Patient By Regimen
2. AHD Line List
3. ART Linelist
4. Biometric Line List
5. CLINIC VISIT
6. Drug Consumption By Date
7. Drug Consumption By Month
8. ERROR - DUPLICATE ART START DATES
9. ERROR - ENCOUNTER WITHOUT ADD PAST VISIT
10. ERROR - PHARMACY FORM WITHOUT REGIMEN LINE OR REGIMEN
11. ERROR - PHARMACY FORMS WITHOUT DURATION
12. HI - Fingerprint Statistics
13. HTS EXPORT
14. LAB - Viral Loads
15. MISSED APPOINTMENT
16. NCD Report
17. OTZ Line List
18. Patient Ever Enrolled
19. Pediatric Regimen Analysis By Weight
20. PHARMACY - DRUG EXPORT
21. Regimen Analysis by TXNEW
22. SCHEDULED APPOINTMENT
23. Transit Client Linelist
24. Tx_NEW
25. Viral Load Eligibility 2.0

This is the expected NMRS packaged inventory, not a hard-coded frontend allowlist or a guarantee about a facility's installed definitions. Other modules can supply additional nonexcluded reports. Category selection narrows the list. Dropdown visibility is not authorization, installed-query verification, clinical acceptance or permission to run a report.

## Preserved boundaries

- The canonical ART UUID remains `fba05caa-7445-4bf4-acfc-d16d655e2500`; its display name is ART Linelist. The obsolete ART and SI-RADET UUIDs remain excluded.
- All remaining 43 name exclusions are retained. Seven match packaged reports: Child Birth Registration, Child Follow Up Report, CTD-Linelist, ERROR - INCOMPLETE VIRAL LOAD DATA, EXITS, GENERAL ANTENATAL EXPORT and Maternal Cohort. The other names can refer to stored definitions or other modules.
- The existing progress/cancel, export-column, Webview, header and overlay features are retained. There are no analytics/chart additions, dependency/framework changes or new backend endpoints.
- No report is automatically executed. Clinical reconciliation and performance acceptance remain separate; the deferred populated pharmacy case and Excel-filename investigation are not resolved by this frontend release.

## Packaging and local deployment

Run the reports package's tests, TypeScript and production build with the installed workspace tools. A combined regression test checks all 25 expected names together, alphabetical ordering, canonical ART naming, preservation of API objects and all remaining name/UUID exclusions.

Build production assets in a separate versioned staging folder and pack only committed package source plus those assets. Never copy `.npmrc`, tokens, previous tarballs or development hot-update files into the package. No dependency installation or lockfile rewrite is required for this version-only workspace change.

For server6, install the versioned production assets in its frontend folder and change only the reports-app import-map target and matching route-registry asset references. Preserve the original files for rollback and leave the O3 shell, other packages and serverda untouched. A successful file copy is not a successful HTTP/browser check: verify the served version after server6 is running, then reload the browser (and remove any old reports-app development override if necessary).

This package preparation and local testing do not publish to npm, push Git, deploy to facilities or enable scheduled jobs. Publishing, if requested separately, does not update a distro or its import map.
