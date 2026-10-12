# WEB-001 - Demo-inspired shell acceptance

Operator-run Edge acceptance, 2026-10-12. Partial visual increment, not HU closure.

The supplied HTML is a visual reference only. Its unchanged PNG brand asset and
sidebar/header organization are reused, not its JavaScript, sample credentials,
fake metrics, data mutations, reports or user-management simulation. Static icons
come from the existing pinned Lucide package and include upstream licenses.

## Verification

- All 16 shell unit/client/asset tests passed; CI runs these tests only.
- Real development login and owner reads passed at 1366, 801, 800, 390 and 320 px.
  Desktop has the sidebar; widths at/below 800 use a labeled native section selector.
- Catalog, Suppliers, Inventory and account navigation kept selection/header state
  synchronized. Creation/edit forms opened and canceled without owner writes.
- Logout from desktop/mobile returned to login. CONSULTATION remained read-only
  in the mobile Catalog. Images/icons loaded and screenshots were inspected.
- At desktop/mobile, an intercepted UI-only creation returned 503 without contacting
  the owner. Navigation/remount/retry retained the same body/key and locked fields.
  This checks layout/navigation integration, not backend idempotency (covered earlier).
- No page exceptions or document-level horizontal overflow occurred. Wide portal
  tables intentionally retain their own horizontal scroll containers.

The host antivirus injected Kaspersky resources during the first run. The isolated
test browser blocked non-local requests for the successful rerun; no system/antivirus
settings were changed. Those resources are absent from repository HTML/source.
The browser driver and screenshots are local-only evidence, not this PR's CI suite.

## Remaining Scope

Portal-internal visual alignment, real summary/alert screens, production packaging
and integrated QA are not finished by this increment. No simulated dashboard totals
or unavailable commands are displayed. Real APIs and backend role checks remain
authoritative; token/pending-state persistence rules are unchanged.
