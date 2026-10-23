# API and domain map

All `/api` responses are no-store. Browser writes require JSON, exact APP_ORIGIN and X-Ellis-Request: 1. Session cookies are HttpOnly; production requires HTTPS. Account context comes from the verified session, never request-supplied account IDs. Unexpected write fields are rejected.

| Area | Endpoints |
|---|---|
| Identity | POST /auth/register, /auth/login, /auth/logout, /auth/activation-info, /auth/activate; GET /me |
| Patients/clients | GET/POST /patients; GET/PATCH /patients/:id; GET /clients; PATCH /clients/:id |
| Visits | POST /visits; POST /visits/:id/state |
| Companion notes | POST /notes; PATCH /notes/:id; POST /notes/:id/sign |
| Work | GET/POST /tasks; GET/PATCH /tasks/:id; POST /tasks/:id/state, /contact, /handover, /reassign |
| Handovers | GET /handovers; POST /handovers/:id/decide |
| Clinic staff | GET/POST /team; PATCH /team/:id; POST /team/:id/rotate, /disable; GET /people |
| Administration | PATCH /settings; POST /ownership/transfer; GET /audit; GET /export?type=...&offset=... |
| Health | GET /health checks PostgreSQL connectivity |

Successful writes return committed records or `{ok:true}`. Errors are `{error:string}`; 400 validation, 401 session, 403 capability/origin, 404 scoped missing record, 409 version/state/unique conflict, 429 auth throttle. Unexpected errors omit internal details.

List endpoints use bounded pagination (50 by default, export 500). Task filters `view=all|open|mine|today` and `kind=all|follow_up` apply before pagination. Today uses account timezone in PostgreSQL, while input date/time explicitly uses the device timezone and is converted to UTC. Overdue is computed, not a saved status. Patient-detail visit/note and contact-attempt histories currently return the latest 100 entries; additional history paging is a known pilot limit.

State transitions and expected versions are explicit request fields. Signed notes cannot be changed; create an amendment referencing the signed note and give a reason. A task owner remains responsible until a handover is accepted. Forced reassignment requires a reason and produces a visible task notice. Revocation escalates unfinished tasks to the owner and cancels pending handovers. A final owner cannot be disabled; ownership transfer requires another active principal and typed practice code. Clinical permissions are not added by ownership transfer.

Audit endpoints expose no mutation routes. Application code writes audit entries in the same transaction as domain changes. The system does not claim cryptographic or administrator-proof immutability.
