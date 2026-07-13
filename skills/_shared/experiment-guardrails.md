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
  and how strong the evidence is, colour-grouped into three tiers (weakest →
  strongest):
  - 🔴 **Stated** (weak): `Opinion` · `Pitch-deck reaction` · `Anecdotal`
  - 🟡 **Researched** (medium): `Desk research` · `Survey at scale`
  - 🟢 **Revealed** (strong): `Prototype usage` (unpaid) · `Signed intent`
    (concept / fake-door / LOI) · `Paying users`
  Per-rung definitions and weights live in §2 — read them before picking a
  rung.
- **`Source quality`** (High / Medium / Low) = how much *this* source's word
  is worth — seniority, decision authority, company size, ICP-fit (§2, "the
  who"). It **modulates `Strength` within the rung's band**, never across a
  rung boundary.
- **`Strength`** (derived, read-only) = the rung band × source-quality
  modifier, **gated to a conclusive `Result`**: it holds the value when the
  record is `Validated`/`Invalidated`, and **0** while `Running` or
  `Inconclusive`. The assumption's **`Confidence`** (`max` over linked
  experiments) reads `Strength` directly, so Confidence only ever reflects
  **proven** evidence. Never set it by hand.
- **`Feasibility`** = how hard the experiment is to actually run — `High`
  (quick / cheap / access ready) · `Medium` · `Low` (slow / costly /
  access-blocked). Set at design time; it's the second axis of `Type` choice
  (§2).

**Confidence has three axes, not one.** The assumption's `Confidence` is a
function of **rung** (what *kind* of signal — `Type`) × **source quality**
(*who* gave it) × **corroboration** (*how many* independent proven records
agree — an assumption-side count, `assumption-guardrails.md §3`), all gated
to a conclusive `Result`. **Ladder integrity, always:** neither source
quality nor corroboration can lift a record past a stronger rung's floor —
weak evidence never outranks strong, no matter how senior the source or how
much of it piles up.

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
`Type` rungs, weakest → strongest, with indicative strength percentages. The
gaps *between* rungs reflect **commitment** — what the signal cost the
person to give:

- 🔴 **Stated** (weak — what people *say*):
  - `Opinion` (~5%) — what someone says about a **hypothetical**: "I think
    users would like this". Includes self / team / advisor. Pure stated
    preference, no behaviour behind it.
  - `Pitch-deck reaction` (~10%) — a verbal "yes, I'd…" to a pitch or mock.
    Still stated, but to a concrete stimulus.
  - `Anecdotal` (~15%) — a report of something that **actually happened**: a
    specific past behaviour or an unprompted real complaint ("three users
    told us they've been doing this manually in a spreadsheet"). It
    references real behaviour, so it's a weak, small-N *shadow* of revealed
    preference — **that's why it sits above `Opinion`**, not below.
- 🟡 **Researched** (medium — what's *already knowable or asked at scale*):
  - `Desk research` (~25%) — regulation, published data, competitor /
    prior-internal facts. *Always ask first: "is this already knowable in
    hours, no participants?"*
  - `Survey at scale` (~40%) — a structured questionnaire at larger N. This
    is **where volume lives**: 100 people who validate a belief = **one
    `Survey at scale` record**, not 100 `Anecdotal` records.
- 🟢 **Revealed** (strong — what people *do* / commit), lowest → highest:
  - `Signed intent` (~60%) — concept / fake-door / LOI / deposit: a
    **costly** commitment made *before* the thing is built.
  - `Prototype usage` (~80%) — real use of a throwaway / Wizard-of-Oz build.
    Genuine behaviour, but no money changed hands, and it's
    novelty-biased and drawn from non-representative early users.
  - `Paying users` (~99%) — real money, A/B, signed contract. Strongest,
    priciest.

Revealed > Stated: a costly action beats a "would you?". Push for the
highest rung the test can honestly reach.

**Axis B — feasibility (can we actually run it?).** Set `Feasibility` for
how hard the test is to execute given **access to the right population,
cost, and time**. The strongest rung is worthless if you can't run it this
quarter.

**Pick the rung that maximises strength × feasibility.** Recommend the
highest strength rung that is still genuinely runnable, in one line
("`Signed intent` ideal but no buyer access yet → `Desk research` first,
`High` feasibility"). If the ideal rung is `Low` feasibility, drop a tier
and **say why** — don't design a test that won't get run. A high-Risk belief
often needs several records: a feasible weak test now, a stronger one when
access opens.

**The two modifiers (within a rung — never across).** Rung choice is the
coarse dial; two finer dials position a record *inside* its rung's band and
feed `Confidence`. Neither can lift a record past the next rung's floor.

- **Source quality — *the who*.** Seniority, decision authority, company
  size, ICP-fit of the source. A CFO at a target-size organisation is
  `High`; a junior at an off-ICP company is `Low`. A `High`-quality
  `Opinion` is still just an opinion — it never reaches `Anecdotal`'s band,
  let alone Revealed.
- **Corroboration — *how much*** (bounded bump;
  `assumption-guardrails.md §3`). When ≥K independent proven records agree
  at the top proven rung, the assumption's `Confidence` earns a small,
  capped uplift — replication is worth something, but it's capped below the
  next rung's floor, so 100 corroborating weak records still can't beat one
  stronger record.

**Strength computation (canonical — every backend implements exactly this).**
`Strength = rung base × source-quality modifier`, rounded, capped at 99, and
gated to a conclusive `Result` (0 while `Running` or `Inconclusive`):

- Rung base = the indicative percentage above: `Opinion` 5 ·
  `Pitch-deck reaction` 10 · `Anecdotal` 15 · `Desk research` 25 ·
  `Survey at scale` 40 · `Signed intent` 60 · `Prototype usage` 80 ·
  `Paying users` 99.
- Source-quality modifier: `High` ×1.15 · `Medium` ×1.0 · `Low` ×0.85.

The modifiers are sized so no rung's `High` reaches the next rung's floor —
ladder integrity holds by construction. Backends with native formulas (Notion)
encode this in the `Strength` formula; formula-less backends have the skill
compute it on every touching write.

**Volume lives in rung choice, not in a record count.** More records do
**not** stack: `Confidence` is a `max`, so 100 `Anecdotal` records roll up
exactly like one. If you have volume, it should change the *rung* — a
systematic ask of 100 people is a `Survey at scale` (medium), not 100
anecdotes (weak).

**Sample size (N) gates the `Result`; it is not a `Strength` multiplier.** A
test whose N is too small (or wrong-Lens) to mean anything comes back
`Inconclusive` — contributing **0** proven strength — rather than a shrunken
positive. State the minimum qualified N in the pass bar (`survey.md`,
`interview-guide.md`); below it, the result is noise, not weak validation.

> `Type` options are a real select — propose a genuinely new rung only as a
> gated schema change; never write a `Type` value that isn't live in the
> register.

---

## 3. Per-method playbooks (what goes in the experiment body)

The protocol lives in the record **body**. Pick the template by the chosen
`Type` rung's tier: 🟡 `Desk research` → desk template; 🔴
`Opinion`/`Anecdotal` + 🟡 `Survey at scale` → interview template; 🔴
`Pitch-deck reaction` + 🟢 Revealed → pitch/prototype template.

The checklists below are the **minimum bar**; the full prep skeletons live
in `/experiment-design`'s `references/` — `interview-guide.md` (guide
skeleton + how-to-ask rules, also the question discipline `survey.md`
inherits), `prototype-brief.md` (prototype-needed rule table §3b + brief
template), `fake-door.md` (stimulus / costly ask / instrumentation spec).

### 🔵 Desk research (🟡 `Desk research` rung)

- **Sub-questions.** Break the belief into the specific questions sources
  must answer (each maps to part of `We're right if`).
- **Sources.** Name where you'll look and what counts as **credible**
  (primary regulation / audited data > vendor marketing; recent > stale;
  independent > self-interested).
- **Decision rule.** What pattern across sources = pass vs. fail. Capture
  conflicting evidence, don't cherry-pick.

### 🟣 User interview (🔴 `Opinion` / `Anecdotal`, 🟡 `Survey at scale` rungs)

- **Recruit / screener.** Who qualifies (must match the `Lens`), how many
  (small-N, but name the target), how you'll reach them.
- **Questions.** Non-leading, behaviour-first. Ask about the **last time**
  they did X, not whether they "would". Open, then probe. No pitching
  mid-interview.
- **Signal.** What answer pattern clears `We're right if` (e.g. "≥N of M
  unprompted describe the problem we're betting on").

### 🟠 Pitch / Prototype (🔴 `Pitch-deck reaction`, 🟢 Revealed rungs)

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
