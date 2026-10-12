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
Suppliers/Inventory portals, business writes, reception, production and QA remain
pending. Native ESM/JIT is a development integration, not AOT production packaging.

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
