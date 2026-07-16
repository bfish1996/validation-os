# Shared helper — quantitative-analytics trust rubric

Read by `../goals/references/close.md` — the deadline read of a goal measured
from telemetry or a scoreboard. A goal's closing number becomes `Confidence`
on the beliefs underneath (via decomposition, `close.md`), which the whole
team reads off. A sloppy read doesn't just get a wrong answer, it gets a
**confident** wrong answer that moves live beliefs on evidence that never
actually settled them. Every goal closed against a number sourced from
telemetry must clear this rubric.

This guards against a bad *query* — the "source" here is your own data, read at
the deadline, which invites a particular self-deception: reshaping the read
after seeing where the number landed. The goal's instrument, segment, and
window were **fixed at commit time** (`docs/goals.md`); this rubric is how the
close honours that.

---

## 1. Definition stability (schema drift)

Check whether the event/property/metric definition changed between commit and
deadline (a renamed event, a redefined property, an edited metric formula). A
series that crosses a definition change is not one series — split it at the
change point or cap the read at **Inconclusive**. Note the drift in the metric
glossary (`analytics-metric-resolution.md`) so the next cycle doesn't silently
reuse a mapping that no longer means what it used to.

## 2. Denominator discipline

Read the exact denominator the goal's instrument named — the qualified
population matching the goal's `Lens`. A denominator that narrows or widens at
the deadline to hit the bar is invalid: the instrument was fixed in advance,
and moving it now is the same tampering as editing a bar.

## 3. Segment size + Simpson's paradox

Honour the minimum qualified N per segment below which the result is
**Inconclusive**, not a shrunken positive — the same floor
`experiment-guardrails.md §2` sets for sample size generally. When the goal
reads across segments, check the aggregate trend against each segment's own
trend: a reversal (aggregate moves one way, every segment the other) must be
surfaced, never hidden by reporting only the cut that favours the bet.

## 4. Date-range discipline

The window was fixed at commit time and cannot move at the deadline. State it
as the goal pre-registered it ("the full quarter to Sep 30", not "the five
best days"). Reading a different window because it clears the bar is the core
violation this rubric exists to catch.

## 5. Correlation vs. caused-by-the-goal's-work

Before attributing a metric move to what the team actually did, check the same
window for confounds — other launches, seasonality, channel-mix shifts,
pricing changes. A platform-native A/B with a real control settles this on its
own; a plain pre/post comparison without a control never fully does — cap the
read at **Inconclusive** if a named confound can't be ruled out. (This matters
at decomposition: a number that moved for reasons other than the belief being
true is weak evidence for that belief.)

## 6. Multiple comparisons / p-hacking

Reading many segments or cuts and reporting only the one that clears the bar
invalidates the read. If multiple cuts were examined, report all of them — the
ones that missed are part of the honest record, not a discarded draft.

## 7. The verdict — interpolated against the two bars

Map the read onto the goal's pre-registered `We're right if` / `We're wrong
if`, as **degree of achievement**, not a binary threshold flip
(`experiment-guardrails.md §2`):

- **Hit or beat `We're right if`** → full positive; magnitude picked from what
  actually materialised (commitment size × count × activity depth) on absolute
  anchors, **never %-of-target**.
- **At or below `We're wrong if`** → negative, at the commitment-grade
  magnitude the miss earned.
- **Between the two bars** → interpolate — a partial positive at the magnitude
  of what landed. Say plainly where the number sits and let the human read the
  verdict (`Achieved` / `Missed`); the rubric grades the reading, it never
  auto-flips the goal.
- **Any of §1–§6 unmet** → cap at **Inconclusive** regardless of where the
  number sits: schema drifted, N too small in the relevant segment, an
  unruled-out confound, or a window/segment read differently than
  pre-registered. A goal read that can't clear the rubric contributes no
  evidence.

---

## Body template (write into the goal close-out)

```markdown
## Deadline read — <goal name>
**Instrument:** <resolved definition — from analytics-metric-resolution.md>
**We're right if:** <pre-registered pass bar>   **We're wrong if:** <kill floor>
**Segment:** <Lens-matched population>   **Denominator:** <exact definition, as fixed>
**Window:** <start–end, as fixed at commit>   **Min qualified N:** <threshold>
**Read on:** <YYYY-MM-DD>   **Verdict:** <Achieved | Missed | Inconclusive>

### Result
<the number(s), per-segment N, and where they sit between the two bars>

### Rigor check (quant-analytics-rubric.md)
- Definition stability: <stable | drift noted, see glossary>
- Confounds in window: <none material | named confound, capped Inconclusive>
- Cuts examined: <this one only | list all examined, not just the hit>

### Caveats
<small-N segments, anything that qualifies the read>
```

Keep it auditable: a teammate should be able to re-run the exact read and get
the same number, or see exactly where they'd disagree with the verdict.
