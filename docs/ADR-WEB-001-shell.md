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

Exit increment: Inventory receives a separate session-owned intention store and
an explicit ADMIN/INVENTORY capability for POST /api/v1/exits only. The capability
requires a bounded body and Idempotency-Key, rejects extra headers/options and
remains revoked on navigation/logout. It exposes neither direct entries nor tokens.
The store keeps an uncertain immutable body/key across view remounts, not across
logout/reload. Only an acknowledged owner result triggers stock refresh; there is
no optimistic debit or automatic retry. Owner authorization is still authoritative.

Medication creation increment: extend only the Catalog context with keyed ADMIN
POST /api/v1/medications and a separate session-owned registration store. Pending
body/key/result survives view remounts, but is cleared on login/logout/reload.
Requests reject extra options/headers and are revoked with the captured view.
Only a validated acknowledgement refreshes owner listing; the UI never inserts an
optimistic record. PUT and deactivation are still absent: future maintenance must
carry the owner's If-Match version and explicitly handle conflicts.

Maintenance increment: the client adds a versioned response method returning only
data/ETag, keeping the ordinary JSON contract unchanged. Catalog's ADMIN context
permits exact UUID reads, PUT with If-Match and deactivate POST with empty body;
extra headers/options and stale contexts are rejected. A distinct session-owned
store retains an uncertain command's body/version through view remounts. A 412
never adopts a fresh ETag automatically: explicit review reads current state and
discards the old draft before a new command. This cannot attribute a concurrent
change to the previous request. Backend row/version checks remain authoritative.

Overview increment: the framework-neutral shell composes existing public read APIs
through a separate bounded capability. It shows owner metadata totals, not page
length or summed units across different medications. Expired rows use Inventory's
expired=true filter; no browser/worker alert persistence is inferred. Movements
are not requested for CONSULTATION. Partial failures remain unavailable, not zero;
independent owner queries are not an atomic cross-domain snapshot. Late/disposed
responses cannot publish after navigation/logout. No writes or raw token handoff.
