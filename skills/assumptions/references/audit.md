# Audit mode — read-only, whole-register health report

Scan the entire register and report what's wrong — **without changing
anything**. This is the safe, casual "how healthy is the register?" pass:
run it any time, it can't hurt the data. Fixes happen afterwards, one at a
time, gated, through single mode.

## What it does

1. **Run the detection harness** — `../../_shared/register-audit.md`,
   **read-only**:
   - Phase A — Compliance (atomic / falsifiable / plain-language, per record)
   - Phase B — Dedup & contradiction panel (≥2 perspectives, union)
   - Phase C — Graph health (orphans, roots, dangling edges, cycles)
   Load every record via the connector (never a filtered view), so every
   assumption is in scope. Rules:
   `../../_shared/assumption-guardrails.md`.
2. **Synthesise one ranked findings report** — violations by record (with
   proposed fixes), merge/contradiction clusters, graph gaps. Read it back
   to the user.
3. **This harness mutates nothing.** When the user picks findings to fix,
   walk them one at a time through **single mode** (`single.md`) — each fix
   is its own gated grill. Scores and 5-Whys are never invented by the
   audit; they're flagged as gaps for the human to grill.

## When to use which whole-register mode

- **Audit (here)** — read-only report, then human-driven gated fixes.
  Default for "audit the register", "what's wrong across all assumptions",
  "health check".
- **Loop (`loop.md`)** — autonomous write-through; fills every record
  itself, no gates, run-log for rollback. Opt-in by explicit phrasing only.

Both diagnose with the **same** `register-audit.md` detection — audit stops
at the report; loop carries the findings into autonomous fixes.

## Stage-keyed Risk threshold (DEV-5890)

Flag each assumption against its **stage's threshold** — "cleared" requires
BOTH Risk ≤ the stage's Risk threshold AND Confidence ≥ the stage's
Confidence floor (the zero-evidence guard):

- **Cleared** (Risk ≤ threshold AND Confidence ≥ floor) → de-prioritized.
  The belief has enough evidence for its stage's stopping bar.
- **Needs evidence** (either condition fails) → testing-priority.

| Stage | Risk threshold | Confidence floor |
|---|---|---|
| Discovery | 30 | 10 |
| Validation | 15 | 25 |
| Scale | 10 | 40 |
| Maturity | 5 | 60 |

The Confidence floor prevents a low-Impact belief from being "cleared" with
zero evidence — Risk = Impact × (1 − 0/100) = Impact, so a belief with Impact
below the threshold would read "cleared" without any readings. The floor
requires at least a minimum Confidence signal before "cleared" is honest.
