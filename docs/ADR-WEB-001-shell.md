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
