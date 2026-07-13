# 05 · Design the experiment — `/experiment-design`

**You type:** "design an experiment"

▎ Top of the test-next queue: ASM-001, Risk 85. Its Metric for truth is
▎ already countable. Design against it?

Rung and feasibility are weighed upfront, trade named:

▎ Ideal rung: Prototype usage (~80) — real people actually installing and
▎ using it. Feasibility today: Low — zero users yet, nothing to observe.
▎ Recommend Anecdotal interviews (~15), High feasibility: six friends who
▎ fit the Adopter profile, reading the README cold, past-behaviour and
▎ think-aloud questions only. Book Prototype usage as the follow-up once
▎ real installs exist to watch.

Both bars are pre-registered before anything runs — the pass bar carried
forward from the Metric for truth, the kill bar written new:

```markdown
## EXP-001: Do README + example readers understand the next step, cold?
- **Assumption**: ASM-001 · **Type**: Anecdotal
- **Feasibility**: High · **Result**: Running · **Date**: 2026-07-09
- **We're right if**: ≥4 of 6 friends, reading only the README + one
  example scene, state unprompted what problem it solves and the literal
  next command they'd run.

### We're wrong if
Fewer than 3 of 6 get it, or several describe it as something it's not
("a project tracker", "a notes app").
```

One gated write creates EXP-001; ASM-001's Status stays `Live` — with a
`Running` experiment now linked, it reads as Testing (a derived view)
and drops out of the test-next queue.
Prep follows from `references/interview-guide.md` — screener, target N,
non-leading questions ("walk me through the last decision that went
wrong," never "would you find this useful") — into the record body. Then
it stops: DMing friends and running the conversations is Benji's, not the
skill's.

**What this shows:** rung choice is strength × feasibility with the trade
named honestly (the ideal test needs users we don't have yet), pass and
kill bars are fixed before the test runs, and the skill ends at a
prepared instrument — a real, ready-to-send interview guide — never an
executed one.

Next: [06 — prep the friend DMs](06-meeting-prep.md).
