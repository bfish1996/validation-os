# 09 · Pre-register a live A/B as the pass bar — `/experiment-design` (analytics instrumentation)

A new belief is on the queue: ASM-008, "existing multi-bank ICP owners
will still convert at £55/mo for multi-account support" — untested, Risk
68, Metric for truth already countable.

**You type:** "design an experiment for ASM-008"

Rung and feasibility are weighed first, same as any design:

▎ Ideal rung: Paying users (~99) — a live price test, not a survey; we
▎ already have the payment flow and Mixpanel wired in. Feasibility: High.
▎ Recommend Paying users directly — no need to step down.

Both bars are pre-registered before anything runs, then step 7's router
asks the one new question:

▎ Measured live in Mixpanel, or by a hand-run session? — Live routes to
▎ `analytics-instrumentation.md`.

Resolving the metric hits the glossary from EXP-004 — reused, not
re-asked:

▎ Glossary has a confirmed mapping: `Subscription Started` (event still
▎ live, re-checked). Reusing it — same charge event, new segment.

The instrument is pre-registered into the record body before the test
starts:

```markdown
## Analytics instrumentation — Do multi-bank ICP owners convert at £55/mo?

### Instrument
- Platform: Mixpanel · Metric/event: `Subscription Started`, plan=flat_55 (treatment) vs flat_40 (control)
- Segment: ICP trials with ≥2 connected bank accounts · Denominator: qualified multi-bank trial starts
- Window: 2026-09-01 → 2026-09-29, fixed · Min qualified N: 30/arm

### Native experiment object
- Type: A/B (feature flag) · Key: `price-test-multibank-55` · Link: <mixpanel experiment URL>

### Signal → bar
- We're right if: treatment conversion ≥ control conversion − 5pp
- We're wrong if: treatment conversion drops ≥10pp vs control
```

Mixpanel's own pre-launch checks run before the flag goes live — sample
size and traffic-split sanity, not a hand-rolled one. Two gated writes:
create EXP-005, then flip ASM-008 `Status → Testing`.

▎ Let it run to 2026-09-29, then close out via `/find-evidence`'s
▎ analytics flavour — re-run `Subscription Started` segmented by arm,
▎ don't redefine it.

**What this shows:** the mechanism question (live vs. hand-run) is
orthogonal to the rung choice already made; the metric glossary is reused
across skills without re-resolving the same ambiguity twice — proving the
"resolved once" claim concretely; and the pre-registered instrument is the
literal pass/kill bar, fixed before the flag goes live.
