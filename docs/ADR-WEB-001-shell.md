# ADR-WEB-001 - Shell and session boundary

Team decision, 2026-10-12. Partial implementation of HU-WEB-001, not closure.
The framework-neutral shell in mis-front owns authentication, navigation and the
shared gateway client. Catalog and Inventory remain Angular portals; Suppliers
remains a React portal. Their implementation and composition are subsequent work.
Use same-document portal mounting, with lifecycle cleanup and an injected context
containing a restricted request function and immutable user identity. Do not pass
raw tokens through URLs, global variables, DOM attributes, messages or storage.
Portals must not implement their own login or contact domain services directly.

This first increment implements only login, identity verification, logout and
expiry. Bearer tokens stay inside a client closure, with no browser persistence;
reloading requires login. Authorization remains enforced by the backend, not UI
roles. Authentication verifies /auth/me before exposing the account view.
Requests have a 15-second timeout, omit cookies and refuse redirects. Writes will
need stable per-intention idempotency keys; no automatic write retry is implemented.

The loopback-only Node server is for local development, not production deployment.
GATEWAY_ORIGIN is public configuration, never a credential. Default front origin
http://localhost:5173 matches the existing dev gateway allowlist. Alternate ports
need their origin explicitly allowed. HTTPS packaging, portal failure isolation,
integrated reception and QA remain pending.

Reader increment: Catalog is mounted through createApplication/createComponent
with its own Shadow DOM boundary and teardown. A captured generation revokes
its request context on navigation/logout; only paginated medication GET reads
are exposed. Native ESM import maps resolve pinned packages from the sibling
portal checkout. This is local development composition, not production hosting.
Mount failures keep account/navigation usable; async stale mounts get independent
detached hosts so they cannot erase a newer portal. Future portals need their
own bounded capability context rather than inheriting this read-only scope.

Suppliers increment: the React reader/registration bundle has an independent
Shadow DOM root and teardown. Its session-owned registration store retains only
the pending body/key through navigation, never a bearer token. This store is
discarded on login/logout/reload, so process/session recovery is not guaranteed.
Only paginated Suppliers reads and keyed ADMIN creation are exposed. The shell
serves the compiled portal file, not Suppliers source, env or node_modules.

Inventory reader increment: use the same pinned Angular runtime as Catalog through
the shell import map, rather than loading a second Angular core. If Catalog's
runtime is absent, select the installed Inventory runtime. The Inventory context
permits bounded stock reads, role-gated movements and two descriptive API reads;
it does not expose stock writes or raw tokens. Owners still enforce authorization.

Reception adds a distinct session-owned intention store and delegates orchestration
to Workflow. Its capability permits human ADMIN/INVENTORY start/resume and
ADMIN/INVENTORY/SUPERVISOR lookup; it exposes neither compensation nor direct
receipt/entry writes. Pending/replay body/key is immutable, and resume is an explicit
separate command. Completed/compensated may start a new intention; FAILED/unknown
cannot be silently discarded. Session persistence and compensation UI remain absent.
