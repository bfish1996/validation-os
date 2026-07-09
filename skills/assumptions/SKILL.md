---
name: assumptions
description: >-
  The one skill for the Assumption Registry — build, grill, audit, and
  bulk-complete the beliefs your business depends on. Enforces atomic,
  falsifiable, plain-language assumptions with a disciplined 4-step
  definition, mandatory 5 Whys, anchored Impact scoring (0–100, dependency-
  and goal-aware), dedup + contradiction reconciliation with named boundary
  statements, a healthy Depends-on/Enables graph, glossary-checked
  vocabulary, and retrospective evidence logging. Six modes; pick by the
  ask: single (default) — grill ONE record to guardrail-complete, gated
  ("grill this assumption", "flesh out ASM-4", "work the Gaps queue"); seed —
  turn a transcript or blank topic into new guardrail-clean records ("map
  assumptions", "pull assumptions from this call"); bootstrap — sweep an
  EXISTING business's whole history (years of calls, email, CRM wins/losses
  and lost-reasons, product telemetry) across every configured source in one
  pass, producing new assumption stubs that already carry evidence, reviewed
  as a single batch proposal ("onboard our existing business", "mine our
  history to build the register", "backfill assumptions from our
  calls/CRM/telemetry"); audit — read-only whole-register health report
  ("audit the assumption register", "what's wrong across all assumptions");
  loop — autonomous write-through completion with a run-log, opt-in by
  explicit phrasing ONLY ("grill the whole register without me",
  "batch-grill to completion"); triage — resolve accumulated comments and
  hand-tagged Gaps ("resolve the comments", "check what got flagged"). Use
  whenever the user wants to create, grill, stress-test, audit, fill in,
  triage, bootstrap, or find historic evidence for assumptions. Stops at
  the assumption — designing experiments is /experiment-design; standalone
  evidence logging is /find-evidence.
license: MIT
---

# Assumptions

Build and police the beliefs your business depends on. One skill, six
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

Worked examples: `../../examples/02-seed-from-a-call.md` (seed) ·
`../../examples/03-grill-an-assumption.md` (single) ·
`../../examples/08-bootstrap-existing-business.md` (bootstrap).

## Pick the mode (scope × gate)

Four of the six modes are two knobs — **scope** (one record vs. whole
register) and **gate** (gated vs. autonomous) — plus seeding, which is just
*what you point it at*. **Triage** is a fifth cell: its scope is a
**discovered subset** — records with open comments or hand-tagged `Gaps`.
**Bootstrap** is a sixth cell: scope is *everything a business's configured
sources hold*, and its gate is neither per-record nor silent-autonomous but
**batch** — one consolidated proposal at the end.

| Mode | Scope | Gate | Use when | Reference |
|---|---|---|---|---|
| **single** (default) | one record | gated, one question at a time | "grill this assumption", "flesh out ASM-4", working a Gaps queue | `references/single.md` |
| **seed** | new record(s) from raw input | gated (grills each stub via single) | "map assumptions", "pull assumptions from this call", a blank topic | `references/seed.md` |
| **bootstrap** | whole business's history, across every configured source | **batch** — one consolidated proposal, gated once | onboarding an existing business with real history in calls/email/CRM/telemetry — "onboard our existing business", "mine our history to build the register" | `references/bootstrap.md` |
| **audit** | whole register | **read-only** report; fixes gated after | "audit the register", "what's wrong across all assumptions" | `references/audit.md` |
| **loop** | whole register | **autonomous** write-through + run-log | "grill the whole register without me", "auto-fill every assumption" | `references/loop.md` |
| **triage** | discovered subset (open comments / tagged Gaps) | gated, one thread/gap at a time | "resolve the comments", "check what got flagged" | `references/triage.md` |

**Default = single + gated.** If the ask is ambiguous, do NOT pick loop —
its autonomous write-through is opt-in by *explicit* phrasing ("without me",
"on a loop", "the whole register unattended"). When unsure between single
and audit, ask; when unsure between audit and loop, default to audit
(read-only is safe). Bootstrap is also opt-in by context, not a default: only
offer it (typically from `/setup-validation-os`) when the business actually
has history in the configured sources — a brand-new idea with nothing to
mine is seed mode's job, not bootstrap's.

The 2×2 also legitimises the fourth cell — **one record, autonomous** — if a
user ever wants a single record filled without gates: run single mode's
choreography with loop's autonomy rails, scope of one. Rare; gated is the
norm.

## Router

1. **Read the shared sources your mode needs.** All modes:
   `registry-schema.md` (field map) + `assumption-guardrails.md` (rules).
   Audit/loop also: `register-audit.md` + the `/assumptions audit` checks in
   `ontology.yaml §integrity_rules`. The evidence step (single/loop/seed/
   bootstrap): `historic-evidence.md`. Bootstrap also: `seed.md` (stub
   mechanics it reuses) and the Batch gate section of
   `../_shared/gated-writes.md`.
2. **Classify the ask** into a mode via the table above; state which mode
   you're in and why in one line before acting.
3. **Dispatch** to the matching `references/*.md` and follow it. Modes
   compose: seed creates stubs then runs single per record; bootstrap fuses
   seed's stub extraction with the evidence sweep across every configured
   source, batch-gated, then hands its confirmed stubs to single's Gaps
   queue same as seed; audit produces a report then walks fixes through
   single; loop is single's choreography in bulk with gates off; triage
   discovers a subset then walks each through single (and, for wholly new
   assumptions raised in a comment, through seed).
4. **Honour the gate.** Gated modes (single, seed, audit-fixes, triage)
   confirm each write per `../_shared/gated-writes.md`. Bootstrap confirms
   once, as a batch, per that same file's Batch gate section. Loop writes
   autonomously but logs every mutation to a run-log for rollback.

## Guardrail summary

See `../_shared/assumption-guardrails.md §6`. Reject a candidate that fails
any: Atomic · Falsifiable · Plain (no hyperbole) · 5 Whys + therefore-test ·
Scored with justification (Impact anchored to goals *and* dependent count) ·
Not a duplicate (or merged, with the redundant dimension named) · Distinct
from its nearest neighbours, with the discriminating dimension named in the
body (checked on every new record, not just suspected overlaps) · No
unreconciled contradiction (negation merged; tension wired via `Contradicts`
+ tagged) · Single Lens · Themed · Related or consciously a root.

## Scope boundary

Enforce that a falsifiability statement exists, then **stop.**
Creating/running experiments is `/experiment-design`; logging existing
evidence standalone is `/find-evidence`. This skill only ever moves `Status`
`Goal Linked` → `Experiment Needed`, at grill close-out when `Gaps` empties
(gated, single/seed — loop never flips `Status`; it tags the `Human review`
gap instead). This skill never flips `Not Started` → `Goal Linked` — that's
`/decisions`' gated `Based on assumption` write on a standing Goal
commitment (`decision-guardrails.md §9g`); a fully-grilled row with no goal
link waits in `Not Started`, not `Experiment Needed`. `Testing` is
`/experiment-design`'s flip; verdicts are the evidence skills' — evidence
rolls up `Confidence` on its own. Full flow: `registry-schema.md §Status
flow`.

Bootstrap inherits every one of these boundaries: a stub it creates still
lands with `Gaps` set (including `Duplicate`) and still waits for single
mode's grill — evidence already attached from the sweep raises `Confidence`,
never `Impact`, and never substitutes for 5 Whys. Bootstrap never invents an
Impact score from history and never skips the grill because evidence already
exists.

## Safety

- **Gated writes** (single/seed/audit-fixes/triage) confirm the exact change
  before applying. **Bootstrap** confirms once, as a single batch proposal
  (`../_shared/gated-writes.md §Batch gate`) — nothing is written until that
  one confirmation lands. **Loop writes** autonomously but records every
  mutation to the run-log.
- **Never write `Risk`/`Confidence`/`Strength`** (derived) and **never
  renumber or rewrite identifiers** on existing records.
- **Never query a filtered view or subset** when a mode needs the register —
  every record must be in scope. Bootstrap is the one mode whose "register"
  scope is the business's external sources, not the register itself — it
  still must dedupe every candidate against the *whole* live register before
  proposing a new stub.
