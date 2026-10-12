# mis-front

> Front-end shell: packages the domain UIs

Part of the **Medicine Inventory System** distributed system — team `medicine-inventory-system`, Grupo 1.
Governance and documentation live in [`mis-docs`](https://github.com/code-corhuila/mis-docs).

## Local authentication increment

Requires Node.js 22+ and the existing dev gateway at http://localhost:8088.
Run `npm test`, then `npm start`; open http://localhost:5173. No npm dependencies
or installation are required. Use a configured account; no credentials are shipped.
The shell verifies login with /api/v1/auth/me and keeps the token only in memory.
Reloading logs out. `GATEWAY_ORIGIN` and `PORT` override public dev configuration;
the gateway must explicitly allow the chosen front origin. This server binds only
loopback and is not a production server. See [ADR-WEB-001](docs/ADR-WEB-001-shell.md).
The Catalog Angular reader is mounted from the sibling official mis-catalog-portal
checkout. Run `npm ci --ignore-scripts` in that checkout before starting this
server. `CATALOG_PORTAL_ROOT` overrides its local path. Runtime packages stay in
that portal's locked dependency tree; no CDN or token handoff is used.
Catalog failure leaves the account/navigation available; switching views or
logging out destroys the mounted application and invalidates its request context.
The Suppliers React portal needs `npm ci --ignore-scripts` and `npm run build`
in the sibling official mis-suppliers-portal checkout before starting this server.
SUPPLIERS_PORTAL_ROOT overrides its path; only dist/portal.js is served from it.
Its context allows supplier listing and ADMIN registration with an idempotency key,
never token access. Pending registration body/key survives view changes in memory,
but is cleared on logout/login/reload; backend authorization remains authoritative.
Production deployment and QA remain pending.
Native Angular ESM/JIT is development integration, not AOT production packaging.

Inventory now mounts the official sibling mis-inventory-portal reader; run its
`npm ci --ignore-scripts` first. INVENTORY_PORTAL_ROOT selects another checkout.
Stock/movement GET queries and two bounded descriptive API reads are exposed;
CONSULTATION cannot request movements. Angular runtime modules are shared from
Catalog, with Inventory's locked runtime as fallback when Catalog is not installed.
The server serves only allowed source/runtime files, never arbitrary checkout files.
An explicit ADMIN/INVENTORY capability also permits keyed POST /api/v1/exits.
Production packaging and QA still remain.

The paired Suppliers reception increment adds ADMIN/INVENTORY start/resume and
ADMIN/INVENTORY/SUPERVISOR saga lookup, with a separate session-owned pending
body/key/result store. The scope denies compensation and arbitrary Workflow paths.
Reception uses real Workflow, not frontend orchestration or direct participant writes.
Unknown starts retain their original intent; logout/reload discards local memory.
Single-lot reception, stock exits and Catalog maintenance are now available;
visual adaptation to the mockup, production packaging and QA still remain.
Exit intent uses a separate session-owned body/key/result store; navigation retains
it, while logout/login/reload clears it. No optimistic debit or automatic retry
is used. Inventory enforces permissions and stock availability independently.
Catalog also permits keyed ADMIN medication creation, with a separate session-owned
pending body/key/result store. Other roles keep read-only access; arbitrary writes,
extra headers and stale views are denied. Creation survives navigation, not logout
or reload. Catalog enforces code uniqueness and permissions; no database access or
token handoff is introduced. The portal's creation acceptance is operator-run.
Catalog maintenance adds ADMIN-only versioned resource GET, conditional PUT and
confirmed deactivate POST. Only data/ETag is returned, not arbitrary headers or
tokens. Pending body/version survives view changes, not login/logout/reload.
412 requires explicit state review; the shell never retries with a fresh version.
The existing gateway already exposes ETag and permits If-Match. Both paired PRs
must be applied before using the new maintenance screen.

## Demo-inspired shell increment

The user-provided mockup guides the desktop sidebar, workspace header, identity/role
display, login brand and mobile section selector. Only implemented Catalog,
Suppliers, Inventory and account views appear. Navigation uses the same portal
capabilities/teardown; authentication and pending-write semantics remain unchanged.
The reference PNG is reused unchanged; static Lucide icons retain their licenses.
No demo credentials, fake metrics, reports, user management or injected scripts
are copied. This is not a pixel-identical mockup or complete WEB-001 implementation.
Portal-internal styling is aligned in paired portal PRs. Worker-backed alerts,
production packaging and QA remain subsequent work.
See [shell acceptance](docs/WEB-001-demo-shell-acceptance.md).

## Real overview increment

Login now opens Resumen: independent owner metadata counts for medications,
suppliers and lots, a paginated expired-lot read, and the latest five confirmed
movements for ADMIN/INVENTORY/SUPERVISOR only. CONSULTATION does not request them.
Counts include inactive/zero-stock records as labeled. No heterogeneous units are
summed; expired status comes from Inventory, not a browser approximation.
Partial failures show unavailable, not zero. These independent queries are not
one atomic cross-domain snapshot. This read-only shell view is not a Worker alert
inbox and does not enable low-stock flags. See [acceptance](docs/WEB-001-overview-acceptance.md).

## Persisted Expiry Alerts

Alertas is a read-only shell view for human ADMIN/INVENTORY/SUPERVISOR; CONSULTATION
has no navigation/request capability. Filters state/severity/lotId, 20-row pages,
refresh and resolved history use only /api/v1/alerts/expiry through Gateway.
Rows show evaluated physical units and owner evaluation timestamp/window, not live
stock or browser classification. No evaluation, dismissal, acknowledgement or
low-stock command is exposed. Responses/filters are validated; denial/outage or
malformed data clears rows and shows an error, not an empty successful inbox.
See [acceptance and deployment dependency](docs/WEB-001-expiry-alerts-acceptance.md).

The verification server uses PORT=4200 because 5173 is already occupied; the existing
Gateway allows both origins. No dev credentials or flags were changed. Login works,
but active alert GET still returns 404 until Gateway/Inventory deployment alignment.
Frontend availability does not mean Worker alerts are operational or the HU closed.

## Branching Policy

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `mis-docs`.
