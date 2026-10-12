# WEB-001 authentication acceptance

Operator-run on 2026-10-12, America/Bogota. This source increment was tested
against the existing dev gateway at localhost:8088 and Security, without changing
their deployment. Playwright/Edge used desktop 1366x900 and mobile 390x844.

Observed: invalid admin password returned 401 and stayed on the login form;
valid configured admin credentials reached the account view via login then me.
Passwords were cleared after submission. Logout and page reload removed access
to the account view. localStorage/sessionStorage remained empty. No page errors
or horizontal overflow were observed. Screenshots were inspected locally and
are not published with credentials or tokens.

Reproduce manually with a configured dev account: run npm start, open
http://localhost:5173, submit an invalid password, then the valid password,
verify the account/role, reload, log in again and log out. Never copy the
development env file or credentials into a test artifact.

npm test executes six unit cases. Expiry, late responses, malformed login,
protected 401/403 and external paths use mocks. CI runs these unit cases only.
This is not live one-hour expiry evidence, other-role acceptance, integrated
business-flow acceptance, QA promotion or complete WEB-001 acceptance.
