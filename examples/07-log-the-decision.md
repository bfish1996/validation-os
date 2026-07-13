# 07 · Log the decision — `/decisions` (capture)

Same day. Before the interviews in EXP-001 even conclude, one decision is
already made and worth logging on its own: replacing this exact
walkthrough.

**You type:** "log this: we're replacing the fictional Ledgerly examples
with real ones from our own registry, decided today"

▎ Type = Decision, Kind = Direction, mode = capture. What was decided:
▎ replace the 7-scene `examples/` walkthrough and the 4
▎ `templates/registry/` seed rows with real content from validation-os's
▎ own register. Owner: Benji. Agreed by: Benji. Recommend Unanimity 100 —
▎ solo call, no recorded dissent to weigh against.

▎ One more check: this decision cites ASM-003 ("real examples build more
▎ trust than fictional ones") as rationale — a `Based on assumption`
▎ link. It does NOT resolve it: the row is untouched — still ungrilled,
▎ still able to accumulate evidence later. `Resolves assumption` is a
▎ separate gated action that makes a belief moot: Impact drops to 0 with
▎ the prior score recorded, Status untouched — not this.

One gated write:

```markdown
## DEC-002: Replace the fictional Ledgerly walkthrough with real examples
- **Type**: Decision · **Kind**: Direction · **Status**: Active
- **Area**: Docs & DX · **Owner**: Benji · **Agreed by**: Benji
- **Unanimity score**: 100 · **Reversibility**: Two-way door
- **Decided date**: 2026-07-09
- **Based on assumption**: ASM-003 · **Resolves assumption**: (none)
```

**What this shows:** a decision doesn't have to wait for an experiment to
conclude — this one only needed a cited rationale, not a verdict — and
citing an assumption as rationale is kept strictly apart from retiring
it, so the register stays honest about what's decided versus what's still
just believed.

That closes this thread — but not the loop. DEC-001's goal (≥4 of 6
friends demonstrate cold comprehension by 2026-07-23) is still open, and
EXP-001's interviews are still running. When they conclude, `/find-evidence`
closes EXP-001 out against its pre-registered bar, Confidence on ASM-001
moves for the first time, and the test-next queue reorders itself — same
loop, next lap.
