# WEB-001 - Real overview acceptance

Operator-run Edge acceptance, 2026-10-12. Partial WEB-001 increment, not HU closure.
The default post-login view is Resumen; account remains accessible from navigation.

## Sources and meaning

- Catalog/Suppliers metadata totals include inactive records.
- Inventory stock total includes zero-unit lots. Expired total and its paginated
  rows use expired=true; registered physical units are displayed per lot, not summed.
- The latest five confirmed movements and their metadata total are requested only
  for ADMIN/INVENTORY/SUPERVISOR. CONSULTATION sees no movement section/request.
- Reads are independent owner snapshots, not one atomic system-wide snapshot.
  Failure is unavailable, not zero. No database access, write, token handoff or
  automatic worker/low-stock flag activation is introduced.

## Verification

All 23 shell/model/client/asset tests passed. Six overview tests cover metadata
counts, expiry paging, role-aware movements, empty states, partial/malformed data,
retry, stale results and disposal; one additional scope test rejects writes/stale
contexts. CI runs those tests, not browser/backend acceptance.

Real login/read checks passed at 1366/390 ADMIN, 320 CONSULTATION, 801 INVENTORY
and 800 SUPERVISOR. Rendered counters matched the real owner response metadata.
Navigation returned from Catalog to Resumen and logout removed the view. No page
exceptions or document horizontal overflow; desktop/mobile screenshots were inspected.

For ADMIN desktop/mobile only, a browser-intercepted Suppliers 503 showed unavailable
while other counters stayed readable; removing the interception restored the count.
An isolated 25-expired-lot fixture tested page 1 (20 rows), page 2 (5 rows), total
and disabled terminal pagination. The real development expiry query returned zero
at test time; populated expiry rows were not created in the backend for this test.
No owner writes were sent. Non-local host antivirus injection was blocked only
in the isolated browser, without changing system antivirus settings.

The driver/screenshots are local-only. This is an expired-stock query, not persisted
Worker alerts, acknowledgement/dismissal, near-expiry or low-stock processing.
Worker alert runtime integration, production packaging, QA and formal HU closure
remain separate work. No complete mockup parity is claimed.
