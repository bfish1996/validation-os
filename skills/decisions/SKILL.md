---
name: decisions
description: >-
  The one skill for your shared vocabulary AND your decision log — two
  separate registers, one skill. Terminology: look up the canonical word for
  a concept, build/edit Glossary terms with audience-specific phrasing
  (structured properties, not body prose), audit drafts against the
  glossary. Decisions: capture a decision made in a call/thread/note (gated,
  one at a time — what was decided, by whom, with what unanimity), sweep a
  date range for candidate decisions plus conflict and supersession
  detection, audit decision health. Decisions can moot an assumption via
  Resolves assumption (Impact to 0), kept strictly separate from citing one
  as rationale. Use for "glossary", "what's the canonical term for X", "how
  do we say X to <audience>", "log this decision", "what did we decide about
  X", "sweep decisions", "audit the decision log", "check terminology", "add
  a term". Skip for /assumptions (a decision citing an assumption is NOT the
  same as resolving it) and for /experiment-design (a committed evidence
  plan is NOT a decision row — it's an Experiment).
license: MIT
---

# Decisions & Terminology

One shared language, in one place, enforced in your outputs — **and** one
place where the team's actual decisions and how unanimous they really were
get recorded, so a business call can retire an open assumption without
pretending it was tested.

Read `validation-os.config.yaml` (walk up from the working directory) and
work each register through the active connector (`connectors/SPEC.md`).

> The terminology check procedure lives in `../_shared/ubiquitous-language.md`.
> The decision rules (unanimity scoring, attribution confidence,
> tension/supersedes discipline, the based-on-vs-resolves guardrail) live in
> `../_shared/decision-guardrails.md`. Both registers' field maps live in
> `../_shared/registry-schema.md`. Gate discipline:
> `../_shared/gated-writes.md`. Read the ones your mode needs.

## Pick the mode (Register × mode)

| Register | Mode | Scope | Gate | Reference |
|---|---|---|---|---|
| Glossary | Lookup | read-only | n/a | inline, below |
| Glossary | Build/edit | one record | gated | inline, below |
| Glossary | Audit/lint | draft check | n/a | inline, below |
| Decisions | Capture | one record | gated | `references/capture.md` |
| Decisions | Sweep | date range, many records | autonomous write + run-log — never for Resolves-assumption | `references/sweep.md` |
| Decisions | Audit | whole register | read-only report | `references/audit.md` |

**Classify the ask, state which register + mode you're in and why, in one
line before acting.** Glossary and Decisions are separate registers
(`the evidence-remodel slice`) — a session only ever works one at a time. Sweep is always
invoked on demand, never scheduled.

## Terminology modes (Glossary register)

Same vocabulary, rendered for the reader — the audience list comes from the
config's `vocabulary.audiences`. Pick the mode from how the user invoked it;
one question at a time; recommend an answer each time. Modes can chain
(lookup → build a missing term; audit → edit a record).

The Glossary register carries **all properties, no body** (`the evidence-remodel slice` — the
terminology check parses structure directly): Title, Status (`Active` /
`Provisional` / `Superseded` — no `Reversed`, a term is superseded by a
better one, never reversed), Area, `Definition` (text, one sentence per
applicable audience), `Avoid` (structured `[{audience, phrase, fix}]`), `How
it differs` (text, pairs with `Related tension`).

### 1. Lookup (read-only — default for a question)

"What's the canonical word for X?" / "How do we say X to <audience>?"

- Query the Glossary register, match the user's phrase against Title; read
  the matched term's fields.
- Return the canonical Title and its `Definition` for the audience asked (or
  all audiences if unspecified). Note `Avoid` hits and `Superseded` status.
  No write.

### 2. Build / edit (gated write)

Add a new term or flesh out an existing one. Gap-filling — ask only for
what's missing:

- **Dedup first.** Search Title + `Definition` for near-matches; surface the
  nearest 2–3. If the concept exists, **edit that one record** — a
  different audience is a new `Definition` sentence or `Avoid` entry, **not**
  a new record.
- Settle the fields: Title (canonical, plain), Area, Status (`Active` once
  agreed; `Provisional` while still forming), `Related tension` (link the
  confusable neighbours).
- **Fill `Definition`, `Avoid`, `How it differs`** — the three structured
  slots the check keys off (`../_shared/ubiquitous-language.md`): `Avoid` is
  the enforced field (if there's a phrasing to catch, it goes here as an
  `{audience, phrase, fix}` entry). When editing, **extend** the existing
  entries rather than rewriting.
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

## Decision modes (Decisions register)

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

**Committed evidence plans are not decisions**
(`../_shared/decision-guardrails.md §9`). A committed (Market-grade)
Experiment is its own record on its own register — `/experiment-design` and
`/find-evidence`. If a session lands on "log this goal" or "close out the
goal", hand off; if a source turns out to describe a commitment rather than
a decision, say so and route it.

**The one rule that spans all three:** `Based on assumption` (rationale) and
`Resolves assumption` (deliberate judgment that moots the target — Impact
to 0) are separate relations, always asked as separate questions, never
inferred from each other — `../_shared/decision-guardrails.md §6`.

## How other skills use this

The other validation skills (`/assumptions`, `/experiment-design`,
`/meeting-prep`) run the shared terminology check
(`../_shared/ubiquitous-language.md`) at their existing finalize/write gates —
they don't invoke this skill interactively, and none of them touch the
Decisions register. The check logic is shared so a glossary change updates
every consumer at once. This skill is the human entry point for terminology
lookup/build/audit and for all decision capture/sweep/audit.
