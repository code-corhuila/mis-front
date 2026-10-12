# WEB-001: Persisted Expiry Alert Reader

Baseline: Front develop 3f45eb5; Gateway develop e300c28 includes the exact route.
Human ADMIN/INVENTORY/SUPERVISOR navigation mounts the shell reader with an active
read capability. CONSULTATION cannot navigate or request alerts. This convenience
scope is not authorization: Inventory still validates signed identity/roles.

Only paginated GET /api/v1/alerts/expiry is allowed. Unknown/repeated/empty query
parameters, extra request options and internal/mutating paths are rejected.
The model validates page bounds, row counts/duplicates, identity/date/state/quantity
and audit fields, plus matching filters. Resolved zero-unit history is valid.
No Worker evaluation or stock calculation is performed in the browser. Evaluated
timestamp/window/units are historical evidence, not current physical stock.
Late responses cannot publish after a newer query, navigation or logout teardown.
Unavailable/forbidden/malformed responses clear rows and do not fabricate zero.

2026-10-12: all 29 Node tests passed. Edge/Playwright with synthetic API responses
checked 28 alert fixtures, second page, resolved/filter/empty/invalid states,
503/403 recovery and all four roles. Screenshots at 1440, 1024, 768, 390 and 320
pixels verified no page overflow/control overlap and loaded assets. Mobile table
scroll stays within its frame. Lucide 1.55.0 icons retain provenance/licenses.
Browser fixtures verify rendering/context, not real Inventory SQL or permission
enforcement. No fixture data is shipped in the application.

A separate real browser check on localhost:4200 passed login and read-only dispatch;
active GET alerts returned 404, shown as a dependency error. No credentials were
printed/committed or data created. Existing localhost:5173 was left untouched.
GitHub merges are not live deployment: align all seven Inventory DB changesets,
its expiry HTTP API and Gateway image before positive real alert acceptance.
Worker activation/renewal, signed pipeline and QA remain pending. Neither WEB-001
nor WRK-001 is closed by this frontend increment; low-stock remains disabled.
