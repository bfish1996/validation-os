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

## Graduation bar (the confidence-scoring simplification)

Flag each assumption against its **impact-scaled graduation bar** — there is
no Stage-keyed threshold any more (`docs/validated.md`,
`packages/core/src/derivation/graduation.ts`):

```
graduationBar(derivedImpact) = min(40 + 0.5 × derivedImpact, 90)
```

- **Graduated** (Confidence ≥ the bar) → de-prioritized. The belief has
  enough evidence for its stakes.
- **Untested / Signal** (no effective evidence yet, or below the bar) →
  testing-priority.

Graduation state recomputes on every write — a disconfirming reading can
move a row backwards, `Graduated → Signal`, on the very next recompute. The
bar itself has no "zero-evidence guard" to reason about separately: the
`Untested` state already holds a belief with no concluded reading regardless
of how low its bar sits (Derived Impact alone never "clears" it).
