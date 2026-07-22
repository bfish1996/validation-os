---
name: assumptions
description: >-
  The one skill for the Assumption Registry — build, grill, audit, and
  bulk-complete the beliefs your business depends on. Enforces atomic,
  falsifiable, plain-language assumptions with a disciplined 3-step
  definition, a mandatory why-trace (grill-only, builds the Depends-on
  graph), anchored Impact scoring (0–100, a purely intrinsic seed), dedup +
  contradiction reconciliation, a healthy Depends-on/Enables graph,
  glossary-checked vocabulary, and retrospective evidence logging. Five
  modes; pick by the ask: single (default) — grill ONE record to
  guardrail-complete, gated ("grill this assumption", "flesh out ASM-4",
  "work the Draft queue"); seed — turn a transcript or blank topic into new
  guardrail-clean records ("map assumptions", "pull assumptions from this
  call", "pressure-test this idea"); audit — read-only whole-register health
  report ("audit the assumption register", "what's wrong across all
  assumptions"); loop — autonomous write-through completion with a run-log,
  opt-in by explicit phrasing ONLY ("grill the whole register without me",
  "batch-grill to completion"); triage — resolve accumulated comments
  ("resolve the comments", "check what got flagged"). Use whenever the user
  wants to create, grill, stress-test, audit, fill in, triage, or find
  historic evidence for assumptions. Stops at the assumption — designing
  experiments is /experiment-design; standalone evidence logging, concluding
  a plan, and auditing the Experiments register is /find-evidence.
license: MIT
---

# Assumptions

Build and police the beliefs your business depends on. One skill, five
**modes** — the per-record grill choreography is the core; every other mode
reuses it.

Read `validation-os.config.yaml` (walk up from the working directory) and
work the register through the active connector (`connectors/SPEC.md`).

> The deep ruleset (4-step definition, 5-Whys discipline, scoring,
> MECE/dedup, graph health) lives in `../_shared/assumption-guardrails.md`.
> The register schema and field map live in `../_shared/registry-schema.md`.
> The whole-register detection shape lives in
> `../_shared/register-audit.md`. Gate discipline:
> `../_shared/gated-writes.md`. These are the single sources of truth, cited
> by every mode — read the ones your mode needs.

## Pick the mode (scope × gate)

Four of the five modes are two knobs — **scope** (one record vs. whole
register) and **gate** (gated vs. autonomous) — plus seeding, which is just
*what you point it at*. **Triage** is a fifth cell: its scope is a
**discovered subset** — records with open comment threads.

| Mode | Scope | Gate | Use when | Reference |
|---|---|---|---|---|
| **single** (default) | one record | gated, one question at a time | "grill this assumption", "flesh out ASM-4", working the Draft queue | `references/single.md` |
| **seed** | new record(s) from raw input | gated (grills each stub via single) | "map assumptions", "pull assumptions from this call", "pressure-test this idea", a blank topic | `references/seed.md` |
| **audit** | whole register | **read-only** report; fixes gated after | "audit the register", "what's wrong across all assumptions" | `references/audit.md` |
| **loop** | whole register | **autonomous** write-through + run-log | "grill the whole register without me", "auto-fill every assumption" | `references/loop.md` |
| **triage** | discovered subset (open comment threads) | gated, one thread at a time | "resolve the comments", "check what got flagged" | `references/triage.md` |

**Default = single + gated.** If the ask is ambiguous, do NOT pick loop —
its autonomous write-through is opt-in by *explicit* phrasing ("without me",
"on a loop", "the whole register unattended"). When unsure between single
and audit, ask; when unsure between audit and loop, default to audit
(read-only is safe).

The 2×2 also legitimises the fourth cell — **one record, autonomous** — if a
user ever wants a single record filled without gates: run single mode's
choreography with loop's autonomy rails, scope of one. Rare; gated is the
norm.

## Router

1. **Read the shared sources your mode needs.** All modes:
   `registry-schema.md` (field map) + `assumption-guardrails.md` (rules).
   Audit/loop also: `register-audit.md` + the `/assumptions audit` checks in
   `ontology.yaml §integrity_rules`. The evidence step (single/loop/seed):
   `historic-evidence.md`.
2. **Classify the ask** into a mode via the table above; state which mode
   you're in and why in one line before acting.
3. **Dispatch** to the matching `references/*.md` and follow it. Modes
   compose: seed creates stubs then runs single per record; audit produces a
   report then walks fixes through single; loop is single's choreography in
   bulk with gates off; triage discovers a subset then walks each through
   single (and, for wholly new assumptions raised in a comment, through
   seed).
4. **Honour the gate.** Gated modes (single, seed, audit-fixes, triage)
   confirm each write per `../_shared/gated-writes.md`. Loop writes
   autonomously but logs every mutation to a run-log for rollback.
5. **Deep link on close-out.** When a record is written or closed out, if
   `validation-os.config.yaml` sets `dashboard_url`, emit a markdown deep
   link to the record's dashboard page
   (`DASHBOARD_URL#assumption/<id>`). Skip silently when `dashboard_url` is
   unset. See `connectors/SPEC.md §Deep links`.

## Guardrail summary

See `../_shared/assumption-guardrails.md §6`. Reject a candidate that fails
any: Atomic · Falsifiable (a grill check, not a stored field) · Plain (no
hyperbole, no unneeded verbosity) · why-trace + therefore-test ·
Scored with justification (a purely intrinsic seed — plans/dependents ride
the propagation, not the hand score) ·
Not a duplicate (or merged, with the redundant dimension named) · Distinct
from its nearest neighbours, with the discriminating dimension named out
loud (checked on every new record, not just suspected overlaps) · No
unreconciled contradiction (negation merged; tension wired via `Contradicts`)
· Single Lens · Themed · Related or consciously a root.

## Scope boundary

Enforce that a falsifiability check passes, then **stop.**
Creating/running experiments is `/experiment-design`; logging existing
evidence, concluding a plan, and auditing the Experiments register is
`/find-evidence`. This skill only ever flips `Status` `Draft` ⇔ `Live`:
`Draft` → `Live` at grill close-out when `Completeness % = 100` and every
semantic check has passed (gated, single/seed — loop never flips `Status`;
a record it brings to `Completeness % = 100` simply stays `Draft`,
awaiting a human hand-off session — there is no stored review tag,
`OPS-1305`), and `Live` → `Draft` when a slot empties or a grill finding
reopens it. Commitment linkage is never a status — it's
`/experiment-design`'s bar line on a standing (committed) Experiment, read
back as an evidence-plan view, never an Impact anchor, a Confidence input,
or a queue condition (`../../docs/goals.md`); a fully-grilled row with no
plan link is `Live` and queues like any other.
Testing is a derived view (`Live` + a `Running` experiment), never a flip;
verdicts are the evidence skills' — evidence rolls up `Confidence` on its
own, and only a human-affirmed kill flips `Live` → `Invalidated`. Full
flow: `registry-schema.md §Status & derived views`.

## Safety

- **Gated writes** (single/seed/audit-fixes/triage) confirm the exact change
  before applying. **Loop writes** autonomously but records every mutation
  to the run-log.
- **Never write `Risk`/`Confidence`/`Strength`** (derived) and **never
  renumber or rewrite identifiers** on existing records.
- **Never query a filtered view or subset** when a mode needs the register —
  every record must be in scope.
