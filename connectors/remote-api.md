# Connector — remote API

A hosted-register backend, worked entirely through HTTP: the agent makes the
calls itself (`curl`/Bash), no code package ships. Use this connector when the
registry lives behind a deployed, Clerk-gated (or any IdP-gated) dashboard
instead of a repo you have local access to. Field semantics:
`skills/_shared/registry-schema.md`.

## Config

```yaml
connector: remote-api
remote_api:
  api_base_url: ""    # the hosted API root, given to you by the dashboard
  token_env: ""        # name of the env var holding your bearer token
```

Both keys come from the dashboard's **Connect Claude Code** page, which mints
you a personal token and hands back one ready-to-paste command that writes
this file and exports the token — you never type either by hand. The token
itself lives only in the named env var, never in this file: this connector is
IdP-agnostic, it reads a bearer token and knows nothing about Clerk or any
other identity provider.

## Setup

There is nothing to provision here. The backend already exists — the
deployment owns it. Setup for this connector is *connect*, not *build*: paste
the dashboard's command, then let `/setup-validation-os` make one authenticated
read to confirm the connection works. There is no `remote-api-schema.md` and
no automated `create_backend` / `migrate_schema` — those apply to backends you
stand up yourself, not ones you're a guest on.

## Operations

Every call carries `Authorization: Bearer $<token_env>`.

- **Query all** — `GET {api_base_url}/{register}`. Returns every record; never
  a filtered subset.
- **Fetch one** — `GET {api_base_url}/{register}/{id}`.
- **Search** — no search endpoint exists. Fall back to Query all and judge
  similarity yourself over the returned records. This is a known degradation
  next to backends with native or full-text search — say so if a skill asks
  for a search and this connector is active.
- **Create** — `POST {api_base_url}/{register}` with the record fields as the
  JSON body. Returns the created record, including its generated `id`.
- **Update** — `PATCH {api_base_url}/{register}/{id}` with `{ "version": N,
  ...fields }` — the numeric `version` from the last fetch, plus only the
  fields that changed. A `409` means someone else edited the record first:
  re-fetch it, re-apply your change on top of the current version, and retry.
  Never retry with the stale version.
- **Link** — `POST {api_base_url}/link` with `{ "relation": ..., "from": {
  "register": ..., "id": ... }, "to": { "register": ..., "id": ... } }`. The
  server sets both ends of two-way relations; you send the call once.

## Derived fields — the server computes them here (inverted from every other connector)

Every other connector doc in this directory tells the skill to compute
Confidence, Risk, Derived Impact, Source quality, and Strength itself, because
its backend has no native formulas. **This connector is the exception: do not
compute or send any derived field.** The server runs the same canonical
formulas from `skills/_shared/experiment-guardrails.md` §2 on every write that
could move them, before it returns the record. Sending your own value for a
derived field is at best ignored and at worst a confusing diff — leave those
fields out of every Create and Update body entirely.

`POST {api_base_url}/recompute` exists as a **backstop**, not a normal write
step — it re-derives everything in bulk (after a formula change, or a bulk
import that bypassed this connector). Do not call it after a routine
create/update; the server already derived on that write.

## Identity

Do not send `Owner` or `Agreed by` to mean "me" — the server stamps the
caller's own name (resolved from the bearer token) as `Owner` on create when
you omit it. Only set `Owner` or `Agreed by` explicitly when the domain calls
for naming someone else on the team (creating on another member's behalf, a
multi-party agreement). Any name you do send must be a member of the register's
team; an unrecognized name is rejected.

## Gated writes

Same contract as every connector — propose before you commit — but the
proposal and the confirmation are two separate HTTP calls here, and a third
call closes the loop:

1. **Preview** — show the user the exact JSON body you're about to send
   (Create) or the fields you're about to change (Update).
2. **Write** — on confirmation, make the `POST`/`PATCH` call.
3. **Fetch back** — immediately `GET` the record you just wrote and report its
   server-computed derived values (Confidence, Risk, Strength, …) back to the
   user. Other connectors show these because the skill just computed them
   locally; this connector has to ask the server for them, so this extra read
   is how the CLI user still sees the scores.

## Cautions

- `401` — the token is missing, expired, or wasn't exported into the env var
  named by `token_env`. Tell the user to re-paste the connect command from
  their dashboard.
- `403` — the token is valid but the caller isn't on the register's team.
  There is no per-register or per-role scoping yet: membership is all-or-
  nothing, so this means "ask an admin to add you," not "ask for a narrower
  grant."
- Never store the bearer token in `validation-os.config.yaml` — only its env
  var *name* lives there. If the env var isn't set, stop and tell the user
  which one to export.
- A `409` on Update is normal under concurrent editing, not a failure — re-
  fetch, re-apply, retry once. If it happens repeatedly, stop and tell the
  user someone else is actively editing the same record.
- Search is read-all-and-judge, not native — expect it to be slower and less
  precise than a backend with real search, and say so rather than presenting
  it as authoritative.
