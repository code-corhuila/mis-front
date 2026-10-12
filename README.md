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
Direct Inventory writes, Catalog writes, production deployment and QA remain pending.
Native Angular ESM/JIT is development integration, not AOT production packaging.

Inventory now mounts the official sibling mis-inventory-portal reader; run its
`npm ci --ignore-scripts` first. INVENTORY_PORTAL_ROOT selects another checkout.
Only stock/movement GET queries and two bounded descriptive API reads are exposed;
CONSULTATION cannot request movements. Angular runtime modules are shared from
Catalog, with Inventory's locked runtime as fallback when Catalog is not installed.
The server serves only allowed source/runtime files, never arbitrary checkout files.
Direct Inventory writes, Catalog writes, production packaging and QA still remain.

The paired Suppliers reception increment adds ADMIN/INVENTORY start/resume and
ADMIN/INVENTORY/SUPERVISOR saga lookup, with a separate session-owned pending
body/key/result store. The scope denies compensation and arbitrary Workflow paths.
Reception uses real Workflow, not frontend orchestration or direct participant writes.
Unknown starts retain their original intent; logout/reload discards local memory.
Single-lot reception is now available. Direct stock writes/exits, Catalog writes,
visual adaptation to the mockup, production packaging and QA still remain.

## Branching

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
