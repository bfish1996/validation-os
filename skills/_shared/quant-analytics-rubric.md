# Shared helper — quantitative-analytics trust rubric

Read by `../find-evidence/references/product-analytics.md` (retrospective)
and `../experiment-design/references/analytics-instrumentation.md`
(prospective).
The quantitative-data analogue of `desk-research-rubric.md`: same reason it
exists — a queried number logged against an assumption becomes `Confidence`
the whole team reads off. A sloppy query doesn't just get a wrong answer, it
gets a **confident** wrong answer that retires a live risk on evidence that
never actually settled it. Every load-bearing number in a
`Prototype usage` / `Signed intent` / `Paying users` Experiment record
sourced from telemetry must clear this rubric.

Where `desk-research-rubric.md` guards against a bad *source*, this guards
against a bad *query* — the failure modes are different because the "source"
here is your own data, queried on demand, which invites a different kind of
self-deception: peeking at the result before fixing the question.

---

## 1. Pre-register the query, don't discover it after peeking

Prospective use (`analytics-instrumentation.md`) does this naturally — the
instrument is fixed before the test runs, same discipline as any other
pre-registered bar (`experiment-guardrails.md §4`). Retrospective use
(`product-analytics.md`) has to simulate it: derive the metric, segment,
and window from the assumption's `Metric for truth` **wording alone**, run
it once, and treat any adjustment made *after* seeing the number as the
exact failure mode this rubric exists to catch.

## 2. Definition stability (schema drift)

Check whether the event/property/metric definition changed mid-series (a
renamed event, a redefined property, an edited metric formula). A series
that crosses a definition change is not one series — split it at the
change point or cap the read at **Inconclusive**. Note the drift in the
metric glossary (`analytics-metric-resolution.md`) so the next sweep
doesn't silently reuse a mapping that no longer means what it used to.

## 3. Denominator discipline

Name the exact denominator — the qualified population matching the
assumption's `Lens` — **before** computing any rate. A metric whose
denominator can narrow or widen to hit a target is invalid, same failure
class as desk research's "no source, no claim": no fixed denominator, no
rate.

## 4. Segment size + Simpson's paradox

State the minimum qualified N per segment below which the result is
**Inconclusive**, not a shrunken positive — the same floor
`experiment-guardrails.md §2` already sets for sample size generally. When
slicing by segment, check the aggregate trend against each segment's own
trend: a reversal (the aggregate moves one way, every segment moves the
other) must be surfaced, never hidden by reporting only the cut that
favours the bet.

## 5. Date-range discipline

No cherry-picked windows. State *why* this window is the natural, complete
one ("the full month following launch," not "the five best days"). For
prospective use the window is literally fixed at pre-registration and
cannot move once the test starts; for retrospective use, picking a window
after seeing which one clears the bar is the same violation as §1.

## 6. Correlation vs. caused-by-the-tested-change

Before attributing a metric move to the thing being tested, check the same
window for confounds — other launches, seasonality, channel-mix shifts,
pricing changes. A platform-native A/B with a real control settles this on
its own; a plain pre/post comparison without a control never fully does —
cap the read at **Inconclusive** if a named confound can't be ruled out.

## 7. Multiple comparisons / p-hacking

Querying many segments or cuts and reporting only the one that clears the
bar invalidates the read, exactly as `desk-research-rubric.md §6` requires
capturing conflicting sources rather than cherry-picking. If multiple cuts
were examined, report all of them — the ones that missed the bar are part
of the honest record, not a discarded draft.

## 8. The verdict

Map the query result onto `We're right if` / `We're wrong if`:

- **Validated** — the query clears `We're right if`, on a stable
  definition (§2), a fixed denominator (§3), sufficient N (§4), a
  pre-registered or clearly-justified window (§1, §5), with no unruled-out
  confound (§6).
- **Invalidated** — the query clears `We're wrong if` on the same
  standards. Log it — a killed assumption from clean telemetry is a cheap,
  valuable win.
- **Inconclusive** — any of §2–§7 can't be cleared: schema drifted
  mid-series, N too small in the relevant segment, an unruled-out confound,
  or — the rule that matters most — **the window or segment was chosen
  after seeing the data.** However clean the resulting number looks, a
  post-hoc-chosen cut caps the verdict at Inconclusive.

---

## Body template (write into the Experiment record)

Two variants, same fields — the pre-registration block
(`analytics-instrumentation.md` writes this before the test runs) and the
retrospective finding (`product-analytics.md` writes this when the
evidence already exists). Dates and verdict differ; the instrument fields
don't.

```markdown
## Analytics — <assumption short title>
**Metric for truth:** <verbatim from the assumption>
**We're right if:** <pre-registered pass bar>   **We're wrong if:** <kill bar>
**Platform:** <platform>   **Metric/event:** <resolved definition — from analytics-metric-resolution.md>
**Segment:** <Lens-matched population>   **Denominator:** <exact definition>
**Window:** <start–end, fixed>   **Min qualified N:** <threshold>
**Queried / measured:** <YYYY-MM-DD>   **Verdict:** <Running (pre-registration) | Validated | Invalidated | Inconclusive>

### Result
<the queried number(s), per-segment N, and how they map onto the bar>

### Rigor check (quant-analytics-rubric.md)
- Definition stability: <stable | drift noted, see glossary>
- Confounds in window: <none material | named confound, capped Inconclusive>
- Cuts examined: <this one only | list all examined, not just the hit>

### Caveats
<small-N segments, base-rate-only limits, anything that qualifies the read>
```

Keep it auditable: a teammate should be able to re-run the exact query and
get the same number, or see exactly where they'd disagree with the
verdict.
