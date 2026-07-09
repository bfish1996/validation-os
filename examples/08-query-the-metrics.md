# 08 · Query live telemetry for evidence — `/find-evidence` (analytics)

Three weeks after DEC-002 launched flat £40/mo, Ledgerly connected
Mixpanel and added `analytics` to `evidence_sources`. ASM-004 ("owners
will pay £40/mo") still sits at Confidence 15 — interview-only, from
EXP-003's Anecdotal rung. Real subscriptions can now settle it directly.

**You type:** "check Mixpanel for how ASM-004 is actually holding up"

The skill resolves ASM-004, and this time the flavour is obvious — a
measured metric beats another round of interviews:

▎ "Owners will pay £40/mo" is now directly measurable — real charges beat
▎ stated intent. Sweeping analytics.

Business context first, then the glossary — empty, this is the first
analytics sweep — so it falls to introspection, and introspection comes
back ambiguous:

▎ Mixpanel lists two candidate events for "paying £40/mo": `Subscription
▎ Started` (fires on card charge) and `Plan Selected` (fires on choosing a
▎ tier, before payment succeeds). Which counts as the evidence for
▎ ASM-004 — the charge, or the selection?

You confirm `Subscription Started` — the costly one. The mapping is
written to `analytics-glossary.md`:

```markdown
| owner pays £40/mo | mixpanel | event `Subscription Started`, `plan=flat_40` | 2026-08-25 | alex | ASM-004 |
```

The query runs — window 2026-08-04→2026-08-25 (launch to today), segment
= qualified ICP trial starts, denominator = the same — and the rigor
check runs before anything is written: definition stable (event unchanged
since launch), no concurrent price change or promo in the window, N = 34
trials, well above the floor.

▎ 24 of 34 qualified ICP trials converted at flat £40/mo (71%) — no
▎ confound in the window. Clears `We're right if` comfortably.

One gated write:

```markdown
## EXP-004: Are ICP owners actually paying £40/mo, post-launch?
- **Assumption**: ASM-004 · **Type**: Paying users
- **Result**: Validated       · **Date**: 2026-08-25
- **Source**: Mixpanel — `Subscription Started`, plan=flat_40,
  2026-08-04→2026-08-25, 24/34 qualified trials
```

Confidence on ASM-004: 15 → 99 (the rollup is a `max` over proven
evidence — the strongest concluded experiment wins, weak evidence doesn't
stack).

**What this shows:** telemetry is read live through Mixpanel's own tools,
never a hardcoded event name; an ambiguous mapping is resolved once,
confirmed, and cached; and the rigor rubric (confound check, stable
definition, sufficient N) runs before the verdict, not after.

Next: [09 — pre-register a live A/B](09-instrument-the-experiment.md).
