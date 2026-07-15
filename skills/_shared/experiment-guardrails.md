# Shared helper — experiment guardrails

The canonical rules every experiment **design** must satisfy. Cited by
`/experiment-design` (the inline design + prep gauntlet, whose
`references/{interview-guide,prototype-brief,survey,fake-door}.md` playbooks
expand §3 into runnable artifacts — they cite this file, they don't fork it)
and by the evidence skills that conclude a designed test (`/find-evidence`,
via `historic-evidence.md`). When this
changes, all paths change.

An experiment exists to **kill or confirm one assumption as cheaply as it
honestly can**. It starts from an assumption's *Metric for truth* (the
falsifiability statement set by `/assumptions`) and turns it into a runnable
test with a pre-registered pass bar. This file is the operational ruleset
for the *design* — not for running the test or recording results.

---

## 0. Data model (how the registry encodes an experiment)

Field map: `registry-schema.md §Field map — Experiments`. The load-bearing
points:

- **One activity-and-strength field: `Type`.** There is no separate "method"
  field. `Type` is the single 8-rung select that names *both* what you do
  and how strong the evidence is, grouped into **two categories** by how the
  evidence is produced (`docs/evidence-ladder.md`):
  - 🧪 **Testing** (recruited-sample instruments; plateau ±30): `Opinion` ·
    `Pitch-deck reaction` · `Anecdotal` · `Desk research` · `Survey at
    scale` · `Prototype usage` (unpaid)
  - 🎯 **Goals** (open-world targets, two pre-registered bars, closed by the
    market): `Signed intent` (concept / fake-door / LOI) · `Paying users`
  Per-rung values live in §2 — read them before picking a rung.
- **`Source quality`** (number) = how much *this* source's word is worth:
  `Representativeness × Credibility`, each picked from `{1.0, 0.7, 0.5}`
  (§2, "the who"). It scales the reading's **weight** in the Confidence
  average, within its rung — never its value across rungs.
- **`Strength`** (derived, read-only) = the reading's **signed value `s`**:
  the rung anchor (× magnitude band on Goal rungs), positive when
  `Validated`, negative when `Invalidated`, **gated to a conclusive
  `Result`** — **0** while `Running` or `Inconclusive`. The assumption's
  **`Confidence`** (signed weighted average over linked readings) reads it
  directly, so Confidence only ever reflects **concluded** evidence. Never
  set it by hand.
- **`Feasibility`** = how hard the experiment is to actually run — `High`
  (quick / cheap / access ready) · `Medium` · `Low` (slow / costly /
  access-blocked). Set at design time; it's the second axis of `Type` choice
  (§2) and, with the linked assumption's Risk, what ranks the test-next
  surface (`registry-schema.md §Status & derived views`).

**One reading ↔ one belief, linkage binary.** The unit entering the
Confidence average is one concluded reading against exactly one assumption —
bar, rung, `Result`, and `Strength` are all per-belief. A rich artifact (an
interview) that bears on N beliefs fans into up to N readings sharing a
source; there is no partial-credit "directness" discount — a weak proxy for
the claim reads as a lower rung or `Inconclusive`, never a discounted strong
reading. Evidence on a sibling or dependency never flows across the graph
into this belief's Confidence.

**Ladder integrity, always:** the Confidence average is bounded by its
strongest reading's value, and source quality only scales weight — so weak
evidence never outranks strong, no matter how senior the source or how much
of it piles up.

---

## 1. Design discipline (reject a design that fails any)

- **Falsifiable.** The test must be able to come back **Invalidated**. If
  every plausible outcome would be read as "confirmed", it's theatre —
  redesign it.
- **Pre-registered.** `We're right if` (pass bar) **and** `We're wrong if`
  (kill bar) are written **before** running. No moving the goalposts after
  seeing data.
- **Cheapest viable.** Buy the evidence at the lowest cost that can actually
  move the belief (the ladder, §2). Don't run interviews for something a
  public document settles; don't build a prototype when a pitch suffices.
- **Right population — and how *representative*.** Whoever you test must
  match the assumption's `Lens` — a **hard gate**; wrong audience =
  confident, irrelevant evidence. Within the right Lens, quality is a
  **gradient, not a tick-box**: a senior decision-maker at a target-size,
  on-ICP organisation is worth far more than a junior at an off-ICP one.
  Record it in `Source quality` (§2).
- **Revealed > stated.** Prefer evidence of what people *did* (paid, signed,
  clicked, churned) over what they *say* they would do. Stated intent is
  weak evidence and gets discounted accordingly.
- **One belief in focus.** One assumption per experiment
  (`registry-schema.md`). A test that would also inform another belief gets
  a second experiment record.

---

## 2. The evidence ladder + feasibility (two axes of `Type` choice)

Choosing the experiment is choosing **one `Type` rung** — and it's a
trade-off of **two axes**, not one:

**Axis A — evidence strength (climb as high as the belief needs).** The 8
`Type` rungs, weakest → strongest, in **two categories**
(`docs/evidence-ladder.md`). The gaps *between* rungs reflect **commitment**
— what the signal cost the person to give:

- 🧪 **Testing** (instruments run on a sample you can enumerate; plateau ±30):
  - `Opinion` (±3) — what someone says about a **hypothetical**: "I think
    users would like this". Includes self / team / advisor. Pure stated
    preference, no behaviour behind it.
  - `Pitch-deck reaction` (±6) — a verbal "yes, I'd…" to a pitch or mock.
    Still stated, but to a concrete stimulus.
  - `Anecdotal` (±10) — a report of something that **actually happened**: a
    specific past behaviour or an unprompted real complaint ("three users
    told us they've been doing this manually in a spreadsheet"). It
    references real behaviour, so it's a weak, small-N *shadow* of revealed
    preference — **that's why it sits above `Opinion`**, not below.
  - `Desk research` (±15) — regulation, published data, competitor /
    prior-internal facts. *Always ask first: "is this already knowable in
    hours, no participants?"*
  - `Survey at scale` (±25) — a structured questionnaire at larger N. This
    is **where volume lives**: 100 people who validate a belief = **one
    `Survey at scale` record**, not 100 `Anecdotal` records.
  - `Prototype usage` (±30) — real use of a throwaway / Wizard-of-Oz build.
    Genuine behaviour, but it measures **comprehension / usability /
    engagement**, not demand — and it's novelty-biased, drawn from
    non-representative early users. Demand needs a Goal rung.
- 🎯 **Goals** (open-world targets with a deadline, two pre-registered bars,
  closed by the market — `docs/goals.md`):
  - `Signed intent` (±55 / 68 / 80) — concept / fake-door / LOI / deposit: a
    **costly** commitment made *before* the thing is built. A fake-door test
    is a *short* goal.
  - `Paying users` (±75 / 88 / 99) — real money, A/B, signed contract.
    Strongest, priciest.

Revealed > stated: a costly action beats a "would you?" — within Testing
(`Prototype usage` > `Survey at scale`) and across the **commitment cliff**
(any Goal rung beats every Testing rung). Push for the highest rung the test
can honestly reach.

**Axis B — feasibility (can we actually run it?).** Set `Feasibility` for
how hard the test is to execute given **access to the right population,
cost, and time**. The strongest rung is worthless if you can't run it this
quarter. The categories embody the trade: Testing is quick and feasible,
Goals are slow and expensive with a high ceiling — test cheaply until a
belief has earned a Goal-tier bet.

**Pick the rung that maximises strength × feasibility.** Recommend the
highest strength rung that is still genuinely runnable, in one line
("`Signed intent` ideal but no buyer access yet → `Desk research` first,
`High` feasibility"). If the ideal rung is `Low` feasibility, drop down
and **say why** — don't design a test that won't get run. A high-Risk belief
often needs several records: a feasible weak test now, a stronger one when
access opens.

**Reading value `s` (canonical — every backend implements exactly this).**
`Strength` holds the signed reading value, gated to a conclusive `Result`
(0 while `Running` or `Inconclusive`):

- `s = rung anchor × sign(Result)` — `Validated` positive, `Invalidated`
  negative. Symmetric: a −95 is as strong, and as hard to earn, as a +95.
- Rung anchors: `Opinion` 3 · `Pitch-deck reaction` 6 · `Anecdotal` 10 ·
  `Desk research` 15 · `Survey at scale` 25 · `Prototype usage` 30 ·
  `Signed intent` 55/68/80 · `Paying users` 75/88/99.
- **Magnitude (Low / Typical / High) exists only on the Goal rungs** —
  picked from what actually materialised (commitment size × count ×
  activity depth) on absolute anchors, **never %-of-target**. Target 1,
  land 1 → Low; target 10, land 4 → the magnitude of 4 real customers. No
  ambition term: sandbagging can't inflate, stretch is never punished.
- **Goal sign comes from the two bars:** hit/beat `We're right if` → full
  positive; at/below `We're wrong if` → negative; between → interpolate
  (degree of achievement). **No pre-registered floor → no negative** — an
  uncontrolled absence of sales is `Inconclusive`, never a kill reading
  (the base-rate guard is structural). Churn is a *retention*-belief
  negative at `Prototype usage` grade, never a clean `Paying users` kill.

**Source quality — *the who* (a weight, within a rung, never across).** Two
judged sub-scores, each picked from `{1.0, 0.7, 0.5}`; the field stores the
product:

- **Representativeness** — does this source generalise to our ICP? (folds
  ICP-fit + company size): `1.0` dead-centre ICP profile & size · `0.7`
  adjacent segment/size · `0.5` off-ICP but on-topic. An unknown or
  uncertain ICP caps the achievable pick — you can't claim `1.0` without a
  committed Lens/ICP to point at.
- **Credibility** — how much to trust their word? (folds seniority +
  decision authority + independence/bias): `1.0` senior decision-maker,
  independent · `0.7` relevant role, minor distance or mild bias · `0.5`
  junior / no authority / conflicted.

`source_quality = Representativeness × Credibility ∈ [0.25, 1.0]` — anchors
`{0.25, 0.35, 0.5, 0.7, 1.0}` (0.49 rounds to 0.5). The floor is 0.25, not
0: a weak but on-topic source still nudges Confidence; genuinely irrelevant
evidence is zeroed upstream by the **Lens** gate, never here. **The trust
test** decides whether a future factor belongs in source quality: it belongs
**iff it changes how much you trust the source's word, holding the signal
and the segment fixed.** (End-user activity and amount paid are the
*signal* — they set magnitude; market/sub-vertical size is *segment value* —
it rides the Impact seed. Neither is source quality.)

**Confidence (canonical aggregation).** The assumption's Confidence is the
signed, strength-weighted average of its concluded readings, shrunk toward 0
by a neutral prior:

```
Confidence = (w₀·0 + Σ wᵢ·sᵢ) / (w₀ + Σ wᵢ)     w₀ = 100,  wᵢ = |sᵢ| × source_qualityᵢ
```

- **Signed, −100…100; no evidence = 0.** Stored signed; Risk clamps the
  negative zone to 0 (`assumption-guardrails.md §3`).
- **Only concluded `Validated` / `Invalidated` readings enter** — `Running`
  and `Inconclusive` are excluded from numerator *and* denominator; a belief
  with only inconclusive tests sits at the prior because it has no mass.
- **Independence dedupes by source:** readings sharing a `Source` against
  the same belief count once — only the strongest (largest `|s|`; most
  recent on ties) enters the sum. N readings cut from one interview are one
  unit of corroborating mass, not N.
- **No corroboration bump** — replication is just more mass reducing
  shrinkage; there is no separate uplift mechanic.
- **Volume reaches toward the rung ceiling, never past it** (the average is
  bounded by the strongest reading), and a lone top-grade reading lands near
  half its rung (one max hit ≈ +49; one max miss ≈ −49) — approaching ±99
  takes a series (Cromwell's rule, both directions).
- **`w₀ = 100`** is the one empirical knob (hard floor ≥ 98, so no single
  reading can reach the kill zone). **Kill zone: Confidence ≤ −50** raises
  the audit flag for a human-affirmed kill (`register-audit.md`) — never an
  automatic `Invalidated`. Testing negatives asymptote at −30: **only a
  series of missed Goals can kill a belief.**

Backends never encode this in a native formula — a connector-agnostic script
(and the evidence skills, on every touching write) recomputes `Strength`,
`Confidence`, and `Risk` from the stored fields.

**The grading block (write-up convention — what makes a reading auditable).**
Every concluded reading documents its grading in the record body (under
`Results notes`), so the numbers are reproducible from the record alone:

- the **rung** and, on Goal rungs, the **magnitude pick** with the absolute
  anchor it keys to ("2 paying pilots at £500/mo → Paying, Low");
- the **Representativeness** and **Credibility** picks, one-line
  justification each;
- the **source** (person/artifact) the independence dedupe keys off.

A reading missing its grading block can't be audited into the average —
audit flags it.

**Volume lives in rung choice, not in a record count.** Same-source records
don't stack (the dedupe), and weak records can't out-average strong ones. If
you have volume, it should change the *rung* — a systematic ask of 100
people is a `Survey at scale`, not 100 anecdotes.

**Sample size (N) gates the `Result`; it is not a magnitude lever.** A test
whose N is too small (or wrong-Lens) to mean anything comes back
`Inconclusive` — contributing **nothing** — rather than a shrunken positive.
State the minimum qualified N in the pass bar (`survey.md`,
`interview-guide.md`); below it, the result is noise, not weak validation.

> `Type` options are a real select — propose a genuinely new rung only as a
> gated schema change; never write a `Type` value that isn't live in the
> register.

---

## 3. Per-method playbooks (what goes in the experiment body)

The protocol lives in the record **body**. Pick the template by the chosen
`Type` rung: `Desk research` → desk template; `Opinion`/`Anecdotal` +
`Survey at scale` → interview template; `Pitch-deck reaction` +
`Prototype usage` + the 🎯 Goal rungs → pitch/prototype template.

The checklists below are the **minimum bar**; the full prep skeletons live
in `/experiment-design`'s `references/` — `interview-guide.md` (guide
skeleton + how-to-ask rules, also the question discipline `survey.md`
inherits), `prototype-brief.md` (prototype-needed rule table §3b + brief
template), `fake-door.md` (stimulus / costly ask / instrumentation spec).

### 🔵 Desk research (`Desk research` rung)

- **Sub-questions.** Break the belief into the specific questions sources
  must answer (each maps to part of `We're right if`).
- **Sources.** Name where you'll look and what counts as **credible**
  (primary regulation / audited data > vendor marketing; recent > stale;
  independent > self-interested).
- **Decision rule.** What pattern across sources = pass vs. fail. Capture
  conflicting evidence, don't cherry-pick.

### 🟣 User interview (`Opinion` / `Anecdotal` / `Survey at scale` rungs)

- **Recruit / screener.** Who qualifies (must match the `Lens`), how many
  (small-N, but name the target), how you'll reach them.
- **Questions.** Non-leading, behaviour-first. Ask about the **last time**
  they did X, not whether they "would". Open, then probe. No pitching
  mid-interview.
- **Signal.** What answer pattern clears `We're right if` (e.g. "≥N of M
  unprompted describe the problem we're betting on").

### 🟠 Pitch / Prototype (`Pitch-deck reaction`, `Prototype usage`, 🎯 Goal rungs)

A 🎯 Goal-rung design (`Signed intent` / `Paying users`) is a **goal**: both
bars pre-registered, deadline set, instrument named in advance
(`docs/goals.md`) — a fake-door is a short goal.

- **Stimulus.** The thing shown (mock, landing page, one-pager, demo) —
  realistic enough that the ask is real.
- **The ask.** A **costly** signal of intent: payment, deposit, signed LOI,
  calendar time, opting in. The cost is what makes it evidence.
- **Bar.** The count/rate of people taking the costly action that clears
  `We're right if`.

**Anti-patterns (kill on sight in any method):** leading or "would you…"
hypotheticals · vanity metrics (impressions, "interest") standing in for
commitment · sample too small or wrong-Lens to mean anything · confirmation
bias (only logging evidence that fits the bet) · a pass bar vague enough to
always pass · a desirability bar on a watched session (observation destroys
desire signals — `threats-to-validity.md`; a usage test measures
comprehension/usability, desire needs its own Revealed record).

Before finalizing the protocol, pressure-test it against
`references/threats-to-validity.md` (selection bias, novelty effects,
Hawthorne effect, regression to the mean, spillover, sample
representativeness, multiple comparisons, instrumentation drift,
survivorship bias) and its stopping-rule and ethics notes — name whichever
apply and either mitigate or explicitly accept them in the record body.

## 3b. When is a prototype needed? (rule table)

Keyed to **what the experiment is discovering** — never to enthusiasm for
building. Default follows the `Type` rung; the one human override is the
interview stimulus question ("will you show a prototype in the interview?").

| Discovering… | Build | Rung it belongs on |
|---|---|---|
| Problem **existence / severity** — did it happen, how often, how painful (past behaviour) | **Nothing** — interview without stimulus | `Opinion` / `Anecdotal` |
| Solution **comprehension / usability / engagement** — do they get it, can they use it, do they come back | **Prototype** (throwaway; Wizard-of-Oz allowed) | `Prototype usage` |
| **Willingness to commit** before anything is built | **Fake-door / landing page** — not a full prototype | `Signed intent` |
| Facts **already knowable** from published sources | **Nothing** — desk research | `Desk research` |

A prototype spec is a **prototype brief** — a throwaway-build spec, never a
production PRD. Interviews that show a prototype still require the full
interview guide — a prototype without a guide is a demo, not an experiment.

---

## 4. `We're right if` / `We're wrong if`

Turn the assumption's *Metric for truth* into two concrete, observable
thresholds fixed before the run:

- **`We're right if`** (the field) — the result that turns the assumption
  into a fact. Concrete and countable: `≥N of M say/do X`, `≥X% convert`,
  `regulation explicitly permits Y`. No qualifiers without a number.
- **`We're wrong if`** (body) — the kill bar. The result that should make
  you drop or pivot the assumption. Naming it up front is what stops
  post-hoc rescue.

If you can't state both as observable thresholds, the design isn't done — go
back to the assumption's *Metric for truth* (or flag that the assumption
itself is unfalsifiable, which is `/assumptions`' problem, not this
skill's).

---

## 5. Relations & the two axes

- **One experiment ↔ one assumption** (`registry-schema.md`). A high-Risk
  assumption often needs **several** experiments (e.g. desk research then a
  pitch) — that's fine; they accrue as separate records.
- **Two separate axes, do not conflate:**
  - **Assumption `Status`** = `Draft` / `Live` / `Invalidated` — the
    lifecycle and nothing else; Testing, queue membership, and goal linkage
    are derived views computed from the row's data (`registry-schema.md
    §Status & derived views`). `/experiment-design` never flips any status:
    creating a `Running` experiment makes a `Live` row show in the derived
    Testing view automatically.
  - **Experiment `Result`** = **Running** →
    Validated/Invalidated/Inconclusive. `/experiment-design` only ever sets
    **Running**. Concluding a `Result` is the evidence skills' job — a
    verdict moves Confidence and Risk, never the assumption's `Status`;
    only a human-affirmed kill flips `Live → Invalidated`.
