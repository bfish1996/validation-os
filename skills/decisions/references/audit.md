# Audit mode — read-only decision health report

Scan every `Type = Decision` record and report what's wrong — **without
changing anything**. Safe to run any time. Fixes happen afterwards, one at a
time, gated, through Capture mode.

## What it does

1. **Load every Decision record** from the register (never a filtered view —
   `../../_shared/registry-schema.md`). Rules:
   `../../_shared/decision-guardrails.md`.
2. **Check each record against the guardrail summary**
   (`decision-guardrails.md §8`) and flag:
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
