# Reports 5.2.11 — standard output formats and duplicate-report exclusion

This frontend-only release applies to the 25 reviewed NMRS report UUIDs, shared by the PEPFAR/GF variants. It does not change clinical queries, require an OMOD rebuild, or upgrade the framework/build dependencies.

## Dropdown changes

- The separate saved MISSED APPOINTMENT definition `121017a4-bc6e-47ad-95bb-62f44d11bee3` is excluded by UUID. The reviewed definition `319982d1-68dd-45f6-a0ef-ef1dc4e883dd`, which has matching reviewed SQL and CSV/Excel designs, stays available. This includes the earlier `5ac3dca` source fix that was not deployed in 5.2.10.
- New run-report and edit-schedule output lists show recorded `CsvReportRenderer` and `XlsReportRenderer` designs only, labelled CSV and Excel according to their actual renderer type. No format is inferred from its display name.
- For Viral Load Eligibility 2.0 (`9d363fa4-e132-4a39-962f-c9872e285172`), hide the specific misleading design `4af1952d-5443-40aa-b804-fa7c68469a5a`. Its saved name is “Export to Excel”, but its actual renderer is CSV. The separate proper CSV and Excel designs remain available.
- Web/HTML and other unverified renderer types are not selectable for these reviewed identities. Reintroducing Web is deferred, not part of this release.
- Unrelated/custom report UUIDs keep their configured formats. The format policy is not a name-based or application-wide renderer blacklist.

The shared `useReportDesigns` hook applies the policy to both dropdowns. A previously selected design that disappears from the allowed list cannot be submitted. When editing an existing Web schedule, the user must explicitly choose an allowed replacement before saving; the app does not silently convert or automatically save that schedule. It also does not disable existing schedules in the background.

## Preservation boundaries

No database definition/design is deleted, renamed or retired. Existing report requests, completed outputs and their history remain unchanged, including old Web downloads. The legacy interface keeps its configured formats. O3 Reports Webview is a separate feature and is not removed. No report is automatically generated to validate this change.

`reportingrest` 1.15.0 on server6 already exposes `rendererType` in the standard report-design response; no new endpoint is needed. If renderer metadata is absent or unrecognised for a reviewed report, its formats fail closed rather than guessing that an option called Excel must be an Excel renderer.

## Verification

- 124 tests passed across 15 reports-app suites. Coverage includes all 25 policy identities, renamed/mislabelled formats, missing renderer metadata, unrelated custom reports, no input mutation, stale selections, report switching and editing an existing hidden-format schedule.
- Full reports-package ESLint, TypeScript and production webpack checks passed. The build retains its large-asset warning and stale Browserslist-data notice; no dependency upgrade was attempted as part of this feature.
- Cross-project source regression checks passed: 13 Python contracts, five SQL-generator drift checks, 21 visibility inventory checks, mocked export tests and Reporting UI lifecycle checks.
- Read-only checks against server6's actual REST metadata found 65 active designs across the 25 reviewed reports. The implemented policy produces exactly 50 choices: one CSV and one Excel per report, excluding 14 HTML designs and the one misleading CSV design. Source metadata objects are unchanged by filtering. No clinical report was executed.
- Build into a new versioned staging output directory before packaging/deployment, so stale chunks from earlier local builds are not carried into this release.

## Local deployment

Deploy only the versioned `nmrs-community-esm-reports-app-5.2.11` assets, the reports-app import-map target and its matching route-registry version on server6. Preserve every other registry/import-map entry and the original pointer files. Serverda, the O3 shell and backend modules are not modified or restarted. Verify copied asset hashes and HTTP-served import-map/registry/assets before asking the user to reload the page.

Expected after a fresh browser load: one reviewed MISSED APPOINTMENT entry; CSV and Excel only for the reviewed reports, including Viral Load Eligibility 2.0. Full interactive browser verification is separate from the automated component tests, REST metadata checks and served-asset verification.

No npm publication, Git push, facility deployment or Web re-enablement is included.
