# Prep playbook — analytics instrumentation (live telemetry / native A-B)

Entered from SKILL.md step 7 when the chosen `Type` is `Prototype usage`,
`Signed intent`, or `Paying users` **and** the mechanism is a live,
instrumented measurement (telemetry, a platform-native A/B or feature
flag) rather than a hand-run/observed session. This is a **mechanism
fork**, orthogonal to the `Type` rung chosen in step 2 — the rung stays a
pure strength × feasibility call; this playbook only changes *how* it gets
measured. Same relationship `interview-guide.md`'s stimulus override has to
its own step.

**Delegate, don't reinvent.** Schema discovery, querying, and native
experiment/feature-flag creation are the connected platform's own skill's
job (PostHog: `PostHog/ai-plugin`; Mixpanel: `mixpanel/ai-plugins`; others:
search [skills.sh](https://skills.sh)). This playbook only pre-registers
the instrument and, if the platform supports it, invokes that skill's own
creation tools — it never hand-rolls schema introspection, query syntax, or
pre-launch checks the platform skill already ships.

## 0. The mechanism question (one gated question)

*"Is this measured live in \<platform\>, or by an observed/hand-run session
(interview, a manually-run prototype test)?"* Live/instrumented → this
playbook. Hand-run → the existing route (`prototype-brief.md` /
`fake-door.md` / guardrails §3 checklist inline) applies unchanged. Both
may combine when a build is also needed (e.g. a prototype whose usage is
also instrumented) — run `prototype-brief.md`'s build steps first, this
playbook's instrumentation steps second.

## 1. Resolve the metric

Hand off to `../../_shared/analytics-metric-resolution.md` — business-
context call → glossary check → the platform skill's own introspection
tools → gated disambiguation if ambiguous. Same procedure
`product-analytics.md` uses; the metric glossary is shared across both
directions, so a mapping confirmed here is reused (re-validated, not
re-asked) when `/find-evidence` closes this record out.

## 2. Pre-register the exact instrument — this IS the pass/kill bar

Apply `../../_shared/quant-analytics-rubric.md` at design time, not just
at close-out — the same rigor rubric `product-analytics.md` applies
retrospectively applies here prospectively. Fixed **before** the run
starts, written into the Experiment body:

- Exact metric/query definition (from step 1) — the identical spec that
  will be re-run at close-out.
- Segment/cohort definition, matching the assumption's `Lens`.
- Date range / window — fixed at design time, never extended after
  peeking (rubric §1, §5).
- Denominator definition (rubric §3).
- Minimum qualified N below which the result is `Inconclusive`
  (rubric §4).

## 3. Optional — create the native experiment/flag object (gated)

When the platform supports it and the design calls for a controlled
rollout: use the platform skill's **own** experiment/feature-flag creation
tools (e.g. Mixpanel's `Create-Experiment` / `Create-Feature-Flag`;
PostHog's equivalent), and its own setup-guidance / pre-launch-check tools
first if it has them (e.g. Mixpanel's `Get-Experiment-Setup-Guidance` /
`Run-Experiment-Pre-Launch-Checks`) — don't hand-roll a check the platform
already ships. Record only the resulting object's ID/key and a link in the
Experiment body, same pattern `fake-door.md` uses for its brief link —
never copy the platform object's own config into the registry as new
fields.

## Render into the Experiment body

```markdown
## Analytics instrumentation — <experiment question>

### Instrument
- Platform: <…> · Metric/event: <resolved definition — from analytics-metric-resolution.md>
- Segment: <Lens-matched population> · Denominator: <…>
- Window: <start–end, fixed> · Min qualified N: <…>

### Native experiment object (if created)
- Type: <A/B | feature flag> · ID/key: <…> · Link: <…>

### Signal → bar
- We're right if: <copied> · We're wrong if: <copied>
- Rigor: `quant-analytics-rubric.md` §1–§7 applied before close-out
```

## Handoff

Name the next step — *"let it run until \<date\>, then close out via
`/find-evidence`'s analytics flavour — re-run this exact query, don't
redefine it"* — and stop. Running the test, and recording `Result` /
findings, stay outside `/experiment-design`.

**Anti-patterns:** extending the window after peeking at an early trend ·
swapping the metric definition mid-run · treating a platform's own
"significant" flag as sufficient without checking `quant-analytics-rubric.md`
§4/§6 (N and confounds) yourself · copying a native object's full config
into the registry instead of just its ID/link.

**Terminology check:** `../../_shared/ubiquitous-language.md`, Internal
audience.

**Write gates:** the Experiment-body section, the glossary write-back (if
any, per `analytics-metric-resolution.md §6`), and the native
experiment/flag object (if created) are each gated
(`../../_shared/gated-writes.md`).
