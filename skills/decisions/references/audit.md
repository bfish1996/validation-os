# Audit mode — read-only decision health report

Scan every `Type = Decision` record and report what's wrong — **without
changing anything**. Safe to run any time. Fixes happen afterwards, one at a
time, gated, through Capture mode.

## What it does

1. **Load the full register unfiltered first, then split by `Type`.** A
   `Type = Decision` fetch matches neither branch when `Type` is unset, so
   fetching pre-filtered would make untyped rows permanently invisible —
   they'd never surface as Decisions *or* Terminology, on any subsequent
   audit. Flag every row with no `Type` (`untyped-record`,
   `../../_shared/ontology.yaml`) before proceeding. Then work the Decision
   subset (never a filtered *view* either —
   `../../_shared/registry-schema.md`). Rules:
   `../../_shared/decision-guardrails.md`.
2. **Check each record against the guardrail summary**
   (`decision-guardrails.md §10`) and flag:
   - Missing **Owner**.
   - Missing **Agreed by**.
   - `Active` records with no **Decided date** or no **Source** — incomplete
     capture.
   - Unresolved **`Related tension`** pairs — both sides still `Active`
     (`decision-guardrails.md §4`). These need a human to resolve (mark one
     `Superseded`/`Reversed`, or confirm the tension is genuinely
     informational and both stand).
   - **Unanimity score** below the 30 band, still `Active` — a contested
     decision nobody has revisited.
   - Records whose attribution was flagged uncertain and never re-reviewed —
     flag for a human to re-check against a corroborating source.
   - Missing **Reversibility** classification
     (`decision-guardrails.md §8`).
   - `One-way door` records with a `Based on` link to an untested assumption
     and no risk-acceptance line in `## Rationale`.
   - **Stale resolutions**: `Reversed`/`Superseded` decisions whose
     `Resolves assumption` targets still sit moot at Impact 0 (and not
     re-resolved by the successor) — the retired question is open again;
     flag each for a gated restore of the prior Impact from the dated
     mootness line.
   - **Moot without a resolver**: assumptions at Impact 0 whose mootness
     line in the `Scoring justification` field cites a resolving decision that is
     no longer standing — same fix, from the assumption side; flag for the
     gated restore.
   - **Stale rationale**: `Active` decisions whose `Based on assumption`
     link points at a now-`Invalidated` assumption — the reason the decision
     rested on has been disproved; flag for re-affirm or revisit (highest
     severity when the decision is a `One-way door`).
   - **Retired goal-commitment rows**: any row still carrying `Kind: Goal
     commitment` — a goal is not a Decision row
     (`decision-guardrails.md §9`). Report it for migration to a Goal
     record; **do not** audit it as a goal (that's `/goals audit`) and do not
     re-type it in place.
   - Missing `Kind` on Decision rows — a nudge, never a block (legacy rows
     are untyped by design).
   These checks are the `/decisions audit` rules in
   `../../_shared/ontology.yaml §integrity_rules` — cite each finding by its
   rule `id` (`untyped-record`, `stale-resolution`, `stale-rationale`,
   `one-way-door-untested-basis`, `unresolved-tension`,
   `supersedes-tension-overlap`, `moot-without-resolver`, plus the
   structural rules).

**Goal health is not audited here.** Overdue risk-acceptances, unanswered
tripwires, unclosed goals, undecomposed outcomes, uncited goal links, stale
goal anchors, and anchor dilution all moved to `/goals audit`
(`../../goals/references/audit.md`) when goals stopped being decisions.
3. **Synthesise one ranked findings report** — by record, with the specific
   gap(s) and a suggested fix. Read it back to the user.
4. When the user picks findings to fix, walk them one at a time through
   **Capture mode** (`references/capture.md`).

## Never

- Never write anything — this mode is strictly read-only.
- Never invent an Owner, Agreed-by, or Unanimity score to make a record look
  complete — flag the gap, don't fabricate the fix.
- Never treat a resolved pair (one side `Superseded`/`Reversed`, linked via
  `Supersedes`) as an open `Related tension` finding — only both-`Active`
  pairs are unresolved.
