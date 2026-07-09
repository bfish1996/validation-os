# 08 · Bootstrap an existing business — `/assumptions` (bootstrap)

A different starting condition than the rest of this thread. Fenwick Ops has
been running for three years — not a fresh pilot call, a real business:
Fireflies call recordings, a Gmail inbox, an Attio CRM with two years of won
**and** lost deals, and a Mixpanel project tracking their self-serve
product. They just installed Validation-OS and ran `/setup-validation-os`;
step 8 asked "brand-new idea, or an existing business?" — they picked the
latter.

**You type:** "onboard our existing business — mine our history to build
the register"

▎ Mode: bootstrap. This sweeps every source `evidence_sources` declares
▎ (fireflies, gmail, attio, mixpanel) across your whole history, proposes
▎ new assumption stubs with evidence already attached, and gates the whole
▎ result as one batch — nothing writes until you confirm it together.

The sweep runs source by source, showing its work as it goes:

▎ **Fireflies** (41 calls, last 18 months): recurring claim across 6 calls
▎ with different ops managers — "we'd pay for automated exception routing,
▎ triage eats ~2hrs/day." Candidate stub, Lens Commercial.
▎
▎ **Attio** — 14 Lost-stage deals read, not just the 22 Won ones. 5 of 14
▎ cite a lost-reason: "too expensive vs. Zapier" (3), "missing SSO" (2). The
▎ pricing one is disconfirming evidence against the stub above — logging it
▎ as Invalidated, not dropping it because it's bad news.
▎
▎ **Mixpanel** — self-serve cohort, `auto_routing_enabled = true`: 68% W4
▎ retention vs. 31% for cohorts without it (n=340, 6-month window).
▎ Measured behaviour → 🟢 Prototype usage evidence for the same stub.
▎
▎ **Gmail** — one signed-intent email ("confirming we'll roll this out to
▎ the whole team next quarter") from an account already in Attio as Won —
▎ same source, not counted as independent corroboration.
▎
▎ Considered and dropped: 3 Fireflies mentions too vague to map to a Metric
▎ for truth; 2 Attio notes where the "lost reason" was a blank stage change;
▎ one Mixpanel funnel with too little volume (n=12) to read.

One consolidated proposal, not four separate gates:

```
─────────────────────────────────────────────
BOOTSTRAP PROPOSAL — batch gate
─────────────────────────────────────────────
NEW ASSUMPTION STUBS
  ASM-011  Ops managers pay for automated exception routing
           because manual triage costs ~2hrs/day
           Lens: Commercial · Gaps: 5 Whys, Scoring justification,
                 Language, Duplicate
           Confidence (from evidence below): 0 → 34

EVIDENCE RECORDS (attach to ASM-011 on write)
  EXP-014  Type: Anecdotal · Result: Validated (context)
           Source: 6 Fireflies calls, ops-manager ICP · Source quality: High
  EXP-015  Type: Paying users (base) · Result: Invalidated
           Source: Attio, 3 Lost deals, reason "too expensive vs Zapier"
  EXP-016  Type: Prototype usage · Result: Validated
           Source: Mixpanel, auto-routing cohort, 6mo retention curve

DROPPED (shown, not written)
  3 vague Fireflies mentions · 2 blank Attio lost-reasons ·
  1 low-volume Mixpanel funnel (n=12)
─────────────────────────────────────────────
Confirm? [y / n / edit <item>]
```

**You type:** "y"

▎ Written: ASM-011 + EXP-014/015/016, linked. Confidence lands at 34 — an
▎ Invalidated pricing signal sitting alongside real usage evidence, not
▎ smoothed away. ASM-011 still carries `Gaps` — bootstrap populates, it
▎ doesn't finish. It's the first stop in the single-mode grill queue,
▎ sorted by Risk, same as any seeded stub.

**What this shows:** bootstrap reads lost deals as deliberately as won ones,
a batch confirms everything found in one pass instead of four separate
gates, dropped material stays visible so the sweep is auditable, and a
newly-arrived stub still owes the full grill — evidence changes
`Confidence`, never a substitute for 5 Whys or scoring.
