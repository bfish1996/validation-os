---
"@validation-os/api": minor
---

Server-side identity stamp + membership gate (OPS-1348). `authenticate` now
returns the raw verified subject (`{ subject }`), and `createApi` takes a
`roster` of `{ name, authSubject }` team members. A caller whose subject
resolves to a member may write (any register); an unmapped subject is a 403.
`Owner` defaults to the caller when a create omits it, and any `Owner` /
`Agreed by` the client sends must name a roster member (else 400) — the request
body is never trusted for who is writing. This is the API-side change the
`remote-api` connector's authenticated per-user writes depend on.
