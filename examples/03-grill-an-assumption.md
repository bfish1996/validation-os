# 03 · Grill an assumption — `/assumptions` (single)

ASM-001 was seeded in [02](02-seed-from-a-call.md) with three open Gaps.

**You type:** "grill ASM-001"

One question at a time, each carrying a recommended answer. The 5 Whys
first — why do we believe this?

▎ Root so far: the README and examples are the entire onboarding surface —
▎ no salesperson, demo call, or onboarding flow sits behind them. We wrote
▎ it, so we're structurally blind to where a first-time reader gets lost.
▎ Accept as the 5-Whys root?

Then the Metric for truth:

▎ Proposed metric: TRUE if ≥4 of 6 friends, given only the GitHub link,
▎ state unprompted what problem validation-os solves and the literal next
▎ command they'd run. Countable, no leading, no "would you install this."

Then Impact, anchored rather than felt:

▎ Recommend Impact 85: if comprehension fails, install intent (ASM-002)
▎ and trust in real examples (ASM-003) collapse behind it — nearly
▎ everything downstream depends on this landing. Not 100 — the doc can
▎ still be iterated post-launch; this isn't a one-way door.

Benji confirms each answer; close-out is one gated write — body sections
filled, Gaps emptied:

```
Gaps: (none) · Status: Not Started
Impact 85 · Confidence 0 · Risk 85
```

▎ One more thing before this can queue: `Gaps` is empty, but `Status`
▎ stays `Not Started` — grilling and goal-linkage are independent gates.
▎ ASM-001 needs a standing goal to cite it via `Based on assumption`
▎ before it can reach `Experiment Needed`.

That link lands separately, the same day: DEC-001, a `Provisional` goal
commitment ("validate README comprehension before wider launch"), cites
ASM-001 in its `## Rationale`. That's what flips it —

```
Status: Not Started → Goal Linked → Experiment Needed
```

**What this shows:** the grill never batches questions, Impact is
justified against what actually depends on the belief, Confidence stays
derived (still 0 — grilling is not evidence), and an empty Gaps list only
promotes a belief onto the test-next queue once the separate goal-linkage
gate has also cleared.

Next: [04 — sweep existing evidence](04-find-evidence.md).
