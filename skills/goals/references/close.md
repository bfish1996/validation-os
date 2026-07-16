# Close mode — the outcome becomes evidence

Closing a goal is the joint that earns the rest. A goal that closes without
being read back onto its beliefs is an OKR ceremony: the scoreboard updates,
the register learns nothing, and the next goal gets committed on the same
stale beliefs.

**The one hard gate in this skill lives here** — and note what it gates. It
does not stop you *setting* goals or *missing* them. It stops you closing one
as `Achieved`/`Missed` without decomposing the outcome. Everything the method
spends on goals is repaid at this step.

## Read first

`../../../docs/goals.md §Out` (and §Found numbers, for banking). The deadline
read of a telemetry / scoreboard number runs under
`../../_shared/quant-analytics-rubric.md` — re-validating the instrument via
`../../_shared/analytics-metric-resolution.md` first. **Decomposition runs
in-skill here**, using the shared evidence procedure
`../../_shared/historic-evidence.md` — not handed to `/find-evidence`. Gate:
`../../_shared/gated-writes.md`.

## Entry

The deadline passed, the user asks, or Audit surfaced an unclosed goal.

## Phases

1. **Read the bars.** Both, from the record, before looking at the result —
   `We're right if` and `We're wrong if` as they were fixed at commit time.
   If the record's bar was edited after activation, stop and say so: the
   instrument was tampered with and the outcome can't be read as evidence.

2. **Get the measured result** from the named instrument — ask the human, or
   read it if the source is connected. **If the instrument is a telemetry /
   scoreboard number**, re-validate its resolved mapping
   (`../../_shared/analytics-metric-resolution.md` — schemas drift) and read
   it under `../../_shared/quant-analytics-rubric.md`. The segment, denominator,
   and window were **fixed at commit time** — reading any of them differently
   now to clear the bar is the same tampering as editing a bar; a read that
   can't clear the rubric caps at **Inconclusive**.

3. **Take the verdict — from the human.** `Achieved` / `Missed` / `Dropped`,
   read against the pre-registered bars. Never inferred from a threshold,
   never auto-flipped. Where the result sits between the two bars, say so
   plainly and let them call it.

4. **Decompose — the hard gate** (`Achieved`/`Missed` only). The outcome must
   be read back onto the linked beliefs, **one verdict per belief**, run
   **in-skill** here — the shared evidence procedure
   (`../../_shared/historic-evidence.md`), same gates, each reading linking the
   closing goal. This is no longer a `/find-evidence` handoff; `/goals` owns
   its side end to end.
   - A hit is revealed-tier evidence for the beliefs underneath — real
     commitment, really given.
   - A miss usually invalidates one belief specifically. Find which. "We
     missed" is a scoreboard fact; "we missed *because* ASM-15 was wrong" is
     what the register is for.
   - **Grade the reading by interpolation**, not a threshold flip: hit/beat
     `We're right if` → full positive; at/below `We're wrong if` → negative;
     between → a partial positive at the magnitude of what materialised
     (absolute anchors, `experiment-guardrails.md §2`).
   - **First close of a found-number goal banks the discovered truth — once.**
     The standing level (the 15 customers that already exist at the deadline)
     reads as an interpolated positive at the magnitude of what materialised.
     One time only; the ratchet (`draft.md`) stops the next cycle re-banking
     an unchanged world.
   - **Each closed goal is its own aggregation unit** — cycle readings on the
     same instrument **never dedupe** (`experiment-guardrails.md §2`), so a
     series of misses can accumulate toward the kill zone instead of
     collapsing to one.
   - **A goal cannot close as Achieved/Missed with zero per-belief readings**
     (`ungated-outcome`, `../../_shared/ontology.yaml`). If the user wants to
     skip it, that is a refusal to close: leave the goal `Active`, say why,
     and offer to come back to it.

5. **`Dropped` instead.** Exempt from decomposition — a goal abandoned
   because the world changed has nothing to read back, and forcing a fake
   evidence row is worse than nothing. Requires the superseding record, or a
   one-line reason the goal stopped mattering. **Dropped emits no evidence**:
   only a goal that actually closed against its bars reads.

6. **Write the close-out.** Verdict, date, the measured number, a one-line
   cause, and links to the evidence readings (or the superseding record).
   Lifecycle → `Closed`.

7. **Let the loop run.** A miss's negative readings drop the underlying
   beliefs' Confidence; the queue routes them back into testing on the
   ordinary flow. No new machinery, nothing to do by hand.

Nothing else changes mechanically: no assumption Status flips, no Impact
edits. Linked rows keep competing on their own Risk — their queue membership
never depended on this goal. Stale goal-anchored Impact justifications are
Audit's job (`stale-goal-anchor`).

## Gate

Gated write (`../../_shared/gated-writes.md`). Decomposition writes evidence
readings **before** the close-out card, as sequential cards — the goal closes
last, once the learning is actually recorded.

## Never

- Never auto-flip a verdict from a threshold. The human reads the bars.
- Never close Achieved/Missed without per-belief decomposition — the gate
  exists for exactly the moment the user is in a hurry.
- Never let a Dropped goal emit evidence.
- Never rewrite a bar to match the outcome. If the bar was wrong, the goal
  was superseded mid-cycle or it wasn't — and if it wasn't, the miss is real.
