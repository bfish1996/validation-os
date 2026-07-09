---
name: decisions
description: >-
  The one skill for your shared vocabulary AND your decision log — one merged
  register, split by Type. Terminology: look up the canonical word for a
  concept, build/edit glossary terms with audience-specific phrasing, audit
  drafts against the glossary. Decisions: capture a decision made in a
  call/thread/note (gated, one at a time — what was decided, by whom, with
  what unanimity), sweep a date range for candidate decisions plus conflict
  and supersession detection, audit decision health. Decisions can retire
  assumption records via Resolves assumption, kept strictly separate from
  citing one as rationale. Use for "glossary", "what's the canonical term for
  X", "how do we say X to <audience>", "log this decision", "what did we
  decide about X", "sweep decisions", "audit the decision log", "check
  terminology", "add a term". Skip for /assumptions (a decision citing an
  assumption is NOT the same as resolving it).
license: MIT
---

# Decisions & Terminology

One shared language, in one place, enforced in your outputs — **and** one
place where the team's actual decisions and how unanimous they really were
get recorded, so a business call can retire an open assumption without
pretending it was tested.

Read `validation-os.config.yaml` (walk up from the working directory) and
work the register through the active connector (`connectors/SPEC.md`).

> The terminology check procedure lives in `../_shared/ubiquitous-language.md`.
> The decision rules (unanimity scoring, attribution confidence,
> tension/supersedes discipline, the based-on-vs-resolves guardrail) live in
> `../_shared/decision-guardrails.md`. The register's field map lives in
> `../_shared/registry-schema.md`. Gate discipline:
> `../_shared/gated-writes.md`. Read the ones your mode needs.

## Pick the mode (Type × mode)

| Type | Mode | Scope | Gate | Reference |
|---|---|---|---|---|
| Terminology | Lookup | read-only | n/a | inline, below |
| Terminology | Build/edit | one record | gated | inline, below |
| Terminology | Audit/lint | draft check | n/a | inline, below |
| Decision | Capture | one record | gated | `references/capture.md` |
| Decision | Sweep | date range, many records | autonomous write + run-log — never for Resolves-assumption | `references/sweep.md` |
| Decision | Audit | whole register (Decision records) | read-only report | `references/audit.md` |

**Classify the ask, state which Type + mode you're in and why, in one line
before acting.** Terminology and Decision are independent — a session only
ever works one Type at a time. Sweep is always invoked on demand, never
scheduled.

Every fetch must filter/confirm `Type` before treating a record as either
kind — the two Types share a title and little else.

## Terminology modes

Same vocabulary, rendered for the reader — the audience list comes from the
config's `vocabulary.audiences`. Pick the mode from how the user invoked it;
one question at a time; recommend an answer each time. Modes can chain
(lookup → build a missing term; audit → edit a record).

The fields are the word's audience-agnostic facts: Title, `Type:
Terminology`, Status (`Active` / `Provisional` / `Superseded` / `Reversed`),
Area, Related tension (the confusable neighbours). Per-audience definitions
and bans live in the record **body** — one record per word, audience in the
body, never one record per audience.

### 1. Lookup (read-only — default for a question)

"What's the canonical word for X?" / "How do we say X to <audience>?"

- Query the register (Type = Terminology), match the user's phrase against
  Title; read the matched term's body.
- Return the canonical Title and its `## Definition` for the audience asked
  (or all audiences if unspecified). Note `## Avoid / don't say` hits and
  `Superseded`/`Reversed` status. No write.

### 2. Build / edit (gated write)

Add a new term or flesh out an existing one. Gap-filling — ask only for
what's missing:

- **Dedup first.** Search Title + bodies (Type = Terminology) for
  near-matches; surface the nearest 2–3. If the concept exists, **edit that
  one record** — a different audience is a new body bullet, **not** a new
  record.
- Settle the fields: Title (canonical, plain), `Type: Terminology`, Area,
  Status (`Active` once agreed; `Provisional` while still forming), Related
  tension (link the confusable neighbours).
- **Write the body from the template** — the three fixed headings the check
  keys off (`../_shared/ubiquitous-language.md`): `## Definition` (bullet per
  applicable audience), `## Avoid / don't say` (the enforced section — if
  there's a phrasing to catch, it goes here), `## How it differs` (2–5
  `- **vs <neighbour>:**` bullets). When editing, **extend** existing
  bullets rather than rewriting.
- **Gated write** (`../_shared/gated-writes.md`) — one record at a time.

### 3. Audit / lint (no register write)

Given a text + an audience, run the shared check and report.

- Resolve the **audience** from the user. If unknown, **ASK** — never guess.
- Run the check in `../_shared/ubiquitous-language.md` over the draft for
  that audience.
- Render the findings block (must-fix / should-fix / note) with suggested
  replacements.
- Offer to (a) apply accepted suggestions to a copy of the text, and/or (b)
  open Build/edit for any unknown term worth adding. Never rewrite silently.

## Decision modes

Track what the team decided, how unanimous it really was, and whether it
settles an open assumption. Full choreography lives in `references/`; read
`../_shared/decision-guardrails.md` first for every mode.

- **Capture** (`references/capture.md`) — gated, one decision at a time,
  pointed at a specific transcript/thread/note.
- **Sweep** (`references/sweep.md`) — on-demand over a user-given date range,
  across the evidence sources the config declares; autonomous write +
  run-log for new records and relations, but never for `Resolves assumption`.
- **Audit** (`references/audit.md`) — read-only health report across
  Decision records; fixes gated afterward through Capture.

**The one rule that spans all three:** `Based on assumption` (rationale) and
`Resolves assumption` (deliberate, status-flipping judgment) are separate
relations, always asked as separate questions, never inferred from each
other — `../_shared/decision-guardrails.md §6`.

## How other skills use this

The other validation skills (`/assumptions`, `/experiment-design`,
`/meeting-prep`) run the shared terminology check
(`../_shared/ubiquitous-language.md`) at their existing finalize/write gates —
they don't invoke this skill interactively, and none of them touch the
Decision side. The check logic is shared so a glossary change updates every
consumer at once. This skill is the human entry point for terminology
lookup/build/audit and for all decision capture/sweep/audit.
