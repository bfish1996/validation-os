# Audit mode — read-only decision health report

Scan every `Type = Decision` record and report what's wrong — **without
changing anything**. Safe to run any time. Fixes happen afterwards, one at a
time, gated, through Capture mode.

## What it does

1. **Load every Decision record** from the register (never a filtered view —
   `../../_shared/registry-schema.md`). Rules:
   `../../_shared/decision-guardrails.md`.
2. **Check each record against the guardrail summary**
   (`decision-guardrails.md §9`) and flag:
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
     `Resolves assumption` links point at assumptions still marked
     `Resolved by decision` (and not re-resolved by the successor) — the
     retired question is open again; flag each for a gated reopen.
   - **Stale rationale**: `Active` decisions whose `Based on assumption`
     link points at a now-`Invalidated` assumption — the reason the decision
     rested on has been disproved; flag for re-affirm or revisit (highest
     severity when the decision is a `One-way door`).
   These checks are the `/decisions audit` rules in
   `../../_shared/ontology.yaml §integrity_rules` — cite each finding by its
   rule `id` (`stale-resolution`, `stale-rationale`,
   `one-way-door-untested-basis`, `unresolved-tension`,
   `supersedes-tension-overlap`, `resolved-without-resolver`, plus the
   structural rules).
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
