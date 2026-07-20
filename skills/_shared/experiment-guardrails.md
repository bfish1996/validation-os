# Shared helper — experiment guardrails

The canonical rules every experiment **design** must satisfy — and the
lifecycle rules for what happens to it after (§6). Cited by
`/experiment-design` (the inline design + prep gauntlet, whose
`references/{interview-guide,prototype-brief,survey,fake-door}.md` playbooks
expand §3 into runnable artifacts — they cite this file, they don't fork it)
and by the evidence skills that conclude a designed test (`/find-evidence`,
via `historic-evidence.md`). When this
changes, all paths change.

An experiment exists to **kill or confirm the beliefs that honestly share
one run — as cheaply as it honestly can**. It is the single **pre-registered
container**, at any rung: a designed plan whose evidence arrives as
readings, Testing-grade or committed (Market-grade) alike — the Goal record
was unified into the Experiment; there is no separate record type, only a
committed plan carrying an optional Deadline and closure Outcome
(`OPS-1305`, `docs/goals.md`). It starts from each assumption's falsifiable
disproof (the grill check set by `/assumptions §1`, not a stored field) and
turns it into a runnable test with pre-registered per-belief bars. This file
is the operational ruleset for the *design* and the *lifecycle* — not for
running the test.

---

## 0. Data model (plan, readings, sources)

**An Experiment is one plan row** — the designed, pre-registered container:

- the **instrument** — the stimulus asset (prototype, fake-door page, survey
  form), referenced by its **canonical link**, never copied in. A pure
  interview has no instrument.
- the **protocol** — in the record body (§3); the guide/questionnaire/spec
  *is* the per-row protocol.
- one **`Feasibility`** — how hard the run is to execute: `High` (quick /
  cheap / access ready) · `Medium` · `Low` (slow / costly / access-blocked).
  **One value per plan row**, judged at design time over the whole run —
  bundling never splits it, because the instrument runs once against one
  population. Drivers worth remembering land as a line in the protocol body
  ("Low: no buyer access until Q3"). Consumed by exactly two things: rung
  choice (§2 Axis B) and cross-experiment ordering (§6). (Known future
  extension, deliberately not specced: a finer scale than H/M/L.)
- one **bar line per belief under test** — the pre-registered `We're right
  if` / `We're wrong if` pair **and the planned rung** for that belief (§1b,
  §4). There is **no run-level `Type` or `Strength`**: the rung lives per
  belief, the signed value per reading; anything experiment-level is a
  closure-time **report** (§6), never a Confidence input.

**Evidence is readings** — one reading per **artifact**, scored per belief
through an embedded `beliefs[]` array: one **entry per belief the artifact
actually addressed**. A rich artifact (an interview) bearing on N beliefs is
**one reading with N `beliefs[]` entries**, never N readings — they share the
row's source, `Source quality`, canonical link, and origin. Each `beliefs[]`
entry carries its own `Rung` (inherited from that belief's bar line at
logging; assigned honestly at logging for off-plan and bare readings),
`Result`, and derived signed `Strength` — the rung, result, and strength are
**per belief**, not per reading. Source identity and quality
(`Representativeness` / `Credibility` / `Source quality`) live once on the
row, because they describe the source, not the belief.

**Evidence is external — a reading records an observation from a source
OUTSIDE the team.** The generator behind every reading is a customer, user,
prospect, partner, third-party dataset, published source, or observed market
behaviour — the world talking back, never the team talking to itself. **Internal
meetings and discussions are not evidence:** a board meeting, a strategy or
planning session, a founder's or the team's opinion about the market is
**hypothesis and framing**, not a reading — it belongs in the assumption's
`Scoring justification` (its rationale) and **never contributes to
Confidence**. Logging team opinion as a reading is the failure mode this rule
exists to stop: it launders a bet into "evidence" for itself.

- **Exception — an internal meeting that *reports* a verifiable external
  fact** (a customer's decision, a user's observed behaviour, a partner's
  commitment) carries real evidence, recorded **second-hand**. Grade it on the
  **external event's** rung (what actually happened out there), set the reading's
  `Source` to that **external event/source** — the customer, the signed
  contract, the usage data — **not "the meeting"**, and set `Credibility` lower
  to reflect the second-hand relay (nobody on the team witnessed it directly).
  The meeting is the *channel*, never the source.

**Bars come from the plan; readings come from the artifacts.** Off-plan
readings — signal the run yielded on beliefs that weren't bundled — are
legitimate: they keep the experiment link as provenance and get **no bar**.
A round's reading count is bounded by actual signal, not the plan grid.

**Physical schema.** The split is real, not just conceptual
(`registry-schema.md §Field map — Experiments`, `OPS-1305`): the Experiment
row carries the plan (Instrument, Feasibility, Status, Deadline, Outcome);
each bundled belief gets its own composed **bar line** (`We're right if` /
`We're wrong if` / Planned rung / Bar verdict) realized backend-natively
inside the Experiment; the rung and signed value live on the Reading's
per-belief `beliefs[]` entry (`registry-schema.md §Field map — Readings`).
There is no run-level `Type` or `Strength`.

**Source artifacts — identity, routing, no Sources register:**

- Testing-side source artifacts are essentially **two kinds**: user
  interviews (calls/transcripts) and prototype/stimulus sessions. The
  artifact is the *interview*, not the person — the interviewee stays an
  attribute of the reading.
- **Identity = the canonical link.** Every reading carries its artifact's
  canonical URL (Fireflies transcript, prototype URL, Attio record, Drive
  file). **Same link ⇒ same source** — this is the key the independence
  dedupe (§2) runs on. Normalization rule: store the platform's stable
  resource URL — scheme + host + path/id — with query strings, fragments,
  and tracking parameters stripped; one artifact, one exact stored string.
  Audit sweeps for drift (two spellings of one artifact).
- **Routing = the config source-map.** `validation-os.config.yaml` carries a
  `source_map:` block mapping artifact kind → home → how to fetch
  (interviews → Fireflies; prototypes → the prototype repo; customers →
  Attio; end users → the product DB). Token-light, loaded once; the evidence
  skills use it to find and fetch artifacts, never to mirror them.
- **Reference, never mirror.** The register stores links to homes, never
  copies of their contents. A CRM entry is a *location* where an artifact or
  scoreboard number lives, not a third source kind.
- **Raw / pasted artifacts get a home.** An artifact that arrives by
  copy-paste (email thread, screenshot, unrecorded-call notes) is filed into
  the designated **"Raw evidence" Drive folder** (listed in the source-map
  like any other home), which mints its canonical link. Quoting an excerpt
  in the reading's `body` (its verbatim quote/excerpt — readings carry a `body`
  again, reversing that OPS-1305 slice) is fine — but the whole artifact lives
  exactly once, at its link; pasting it into rows as the primary copy is banned
  (it recreates N-copy drift).
- **Quality stays per-reading** (`Source quality`, §2) — source identity
  dedupes, it never grades.

**Per-belief scoring, one entry per assumption.** The unit entering a belief's
Confidence average is one concluded `beliefs[]` entry against exactly one
assumption — bar, rung, `Result`, and `Strength` are all per-belief. A rich
artifact (an interview) that bears on N beliefs is **one reading carrying N
`beliefs[]` entries**, sharing one canonical link and one `Source quality`;
there is no partial-credit "directness" discount — a weak proxy for a claim
reads as a lower rung or `Inconclusive` in that belief's entry, never a
discounted strong reading. Evidence on a sibling or dependency never flows
across the graph into this belief's Confidence — an artifact scores a belief
only through its own `beliefs[]` entry, never by spillover from a sibling
entry.

**Ladder integrity, always:** the Confidence average is bounded by its
strongest reading's value, and source quality only scales weight — so weak
evidence never outranks strong, no matter how senior the source or how much
of it piles up.

---

## 1. Design discipline (reject a design that fails any)

- **Falsifiable — per belief.** The run must be able to come back
  **Invalidated on each bundled belief independently**. A bar that can't
  fail in this run doesn't belong in the bundle; a design where every
  plausible outcome reads "confirmed" is theatre — redesign it.
- **Pre-registered.** Every bundled belief's `We're right if` (pass bar)
  **and** `We're wrong if` (kill bar) are written **before** running. No
  moving the goalposts after seeing data.
- **Cheapest viable.** Buy the evidence at the lowest cost that can actually
  move the belief (the ladder, §2). Don't run interviews for something a
  public document settles; don't build a prototype when a pitch suffices.
- **Right population — and how *representative*.** Whoever you test must
  match the assumptions' `Lens` — a **hard gate**, and the same Lens across
  the whole bundle (§1b); wrong audience = confident, irrelevant evidence.
  Within the right Lens, quality is a **gradient, not a tick-box**: a senior
  decision-maker at a target-size, on-ICP organisation is worth far more
  than a junior at an off-ICP one. Record it in `Source quality` (§2).
- **Revealed > stated.** Prefer evidence of what people *did* (paid, signed,
  clicked, churned) over what they *say* they would do. Stated intent is
  weak evidence and gets discounted accordingly.
- **Shared run only.** Beliefs share an experiment only when one run
  honestly addresses each of them (§1b). A test that would also inform
  another belief either bundles it — with its own bar line — or notes it and
  leaves that belief to its own experiment. Never blur two beliefs into one
  bar.

## 1b. Grouping — when beliefs share one experiment

- **Membership rule.** Beliefs may share a plan row only when a **single run
  of one instrument, per one protocol, on one Lens-matched population**
  honestly addresses each of them. Same Lens is a hard gate. A belief that
  needs a different population, instrument, or rung to be tested honestly
  gets its own experiment. Grouping is by **shared execution, never by
  theme**.
- **Rung lives per belief.** Each belief's bar line pre-registers its bars
  **and** the rung its evidence will sit on — one session can honestly yield
  different-strength signal per belief (past-behaviour questions vs
  prototype-in-hand). Readings inherit the planned rung at logging.
- **Focus = honesty test, no cap.** No numeric limit on bundle size. Two
  design-time checks, fail either → separate experiment:
  1. the run must be able to come back Invalidated on **each** belief
     independently;
  2. no belief's measurement may compromise another's — pitching
     mid-interview to test desirability poisons the Mom-Test half; the §3
     anti-patterns apply **per belief**, and the ordering check is explicit:
     past-behaviour core before any stimulus.
- **The bundle is symmetric.** No lead-belief marker: every bundled belief
  has equal standing. Which belief prompted the design is origination
  provenance, not structure; ordering rules (§6) read "highest-Risk belief
  in the bundle" live.
- **Workflow instruments.** The instrument may span more surface than the
  beliefs under test. Bars exist only for the bundled beliefs; anything the
  run reveals on un-bundled surface enters as **off-plan readings** (§0) —
  experiment link as provenance, no bar. No obligation to pre-register every
  belief the instrument touches.
- **Reuse.** The instrument is a reusable **asset**, identified by its
  canonical link (§0). Every new round — new population, new beliefs, or new
  bars — is a **new experiment row** referencing the same instrument link.
  **A bundle never grows after design**: adding a belief mid-run is
  retro-registration, which origination forbids (§6). The **one exception is
  a merge** — consolidating several already-pre-registered plans that turn out
  to be one honest run into a single Experiment, every bar line carried
  verbatim (no bar invented or re-cut); `/experiment-design`'s Merge mode owns
  the procedure, archiving the folded-in plans.
- **Duplicate seam.** If the **same pre-registered bar — the same reading —
  would resolve two candidate beliefs, they are one assumption**: merge
  (`assumption-guardrails.md §4`). Beliefs that each need their own bar to
  fail independently are distinct — and may still bundle.

---

## 2. The evidence ladder + feasibility (two axes of rung choice)

Choosing each belief's **rung** is a trade-off of **two axes**, not one:

**Axis A — evidence strength (climb as high as the belief needs).** The 8
rungs, weakest → strongest, in **two categories**
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
    non-representative early users. Demand needs a Market rung.
- 🎯 **Market** (open-world targets with a deadline, two pre-registered
  bars, closed by the market — renamed from "Goals" with the Goal→Experiment
  unification, `OPS-1305`; `docs/goals.md`):
  - `Signed intent` (±55 / 68 / 80) — concept / fake-door / LOI / deposit: a
    **costly** commitment made *before* the thing is built. A fake-door test
    is a *short* committed plan.
  - `Paying users` (±75 / 88 / 99) — real money, A/B, signed contract.
    Strongest, priciest.

Revealed > stated: a costly action beats a "would you?" — within Testing
(`Prototype usage` > `Survey at scale`) and across the **commitment cliff**
(any Market rung beats every Testing rung). Push for the highest rung the
test can honestly reach.

**Market rungs enter via a committed Experiment, commitment-first, always.**
A Market-rung design *is* a committed plan — both bars pre-registered,
Deadline set, instrument named in advance (`docs/goals.md`) — and its
evidence arrives as **one round of readings per bar line, at the
deadline**. A **found scoreboard number is never logged as evidence**: it
prompts minting a *forward* committed plan calibrated off the number
(`docs/goals.md §Found numbers`). There are no bare Market-rung readings
(§6).

**Axis B — feasibility (can we actually run it?).** Set `Feasibility` for
how hard the run is to execute given **access to the right population,
cost, and time** (§0 — one value per plan row). The strongest rung is
worthless if you can't run it this quarter. The categories embody the
trade: Testing is quick and feasible, Market is slow and expensive with a
high ceiling — test cheaply until a belief has earned a Market-tier bet.

**Pick the rung that maximises strength × feasibility — per belief.**
Recommend the highest strength rung that is still genuinely runnable, in one
line ("`Signed intent` ideal but no buyer access yet → `Desk research`
first, `High` feasibility"). If the ideal rung is `Low` feasibility, drop
down and **say why** — don't design a test that won't get run. A high-Risk
belief often needs several records: a feasible weak test now, a stronger one
when access opens.

**Reading value `s` (canonical — every backend implements exactly this).**
`Strength` holds the signed reading value **per `beliefs[]` entry** (one `s`
per belief the reading scores), gated to that entry's conclusive `Result`
(0 while `Running` or `Inconclusive`):

- `s = rung anchor × sign(Result)` — `Validated` positive, `Invalidated`
  negative. Symmetric: a −95 is as strong, and as hard to earn, as a +95.
- Rung anchors: `Opinion` 3 · `Pitch-deck reaction` 6 · `Anecdotal` 10 ·
  `Desk research` 15 · `Survey at scale` 25 · `Prototype usage` 30 ·
  `Signed intent` 55/68/80 · `Paying users` 75/88/99.
- **Magnitude (Low / Typical / High) exists only on the Market rungs** —
  picked from what actually materialised (commitment size × count ×
  activity depth) on absolute anchors, **never %-of-target**. Target 1,
  land 1 → Low; target 10, land 4 → the magnitude of 4 real customers. No
  ambition term: sandbagging can't inflate, stretch is never punished.
- **Market-rung sign comes from the two bars:** hit/beat `We're right if` →
  full positive; at/below `We're wrong if` → negative; between → interpolate
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
signed, strength-weighted average of the concluded `beliefs[]` entries scored
against it (across all readings), shrunk toward 0 by a neutral prior:

```
Confidence = (w₀·0 + Σ wᵢ·sᵢ) / (w₀ + Σ wᵢ)
             w₀ = 100,  wᵢ = |sᵢ| × source_qualityᵢ × commitmentFactorᵢ
```

- **`commitmentFactor`** discounts *found* (non-experiment) evidence: it is
  `1.0` when the entry's reading carries an `experimentId` (the reading is the
  direct output of concluding a committed Experiment) and `0.85` otherwise (a
  bare/found reading). It is a **reading-level** factor — every `beliefs[]`
  entry of one reading shares it — reflecting that a pre-registered, executed
  plan is worth marginally more than the same signal stumbled on after the
  fact. `0.85` is the one commitment knob; leave it there unless the
  scoring-model owner changes it.
- **Rung dominates — `commitmentFactor` never reorders rungs (invariant).**
  Like `source_quality`, `commitmentFactor` scales an entry's *weight*, never
  its value `sᵢ` (the rung sets the ceiling). So the average stays bounded by
  the strongest entry's `|s|`, and a discounted found reading can never
  outrank a stronger experiment-born one: a found `Prototype usage` still
  beats an experiment `Opinion`. The discount changes how fast Confidence
  approaches a ceiling, never which ceiling applies.

- **Signed, −100…100; no evidence = 0.** Stored signed; Risk clamps the
  negative zone to 0 (`assumption-guardrails.md §3`).
- **Only concluded `Validated` / `Invalidated` readings enter** —
  `Inconclusive` is excluded from numerator *and* denominator (a reading has
  no other pre-conclusion state, `registry-schema.md §Field map —
  Readings`); a belief with only inconclusive tests sits at the prior
  because it has no mass.
- **Independence dedupes per (belief, source):** `beliefs[]` entries sharing a
  canonical link against the **same linked assumption** count once — only the
  strongest (largest `|s|`; most recent on ties) enters that belief's sum. Two
  readings cut from one interview, or two entries against different beliefs,
  are handled independently per assumption; N corroborating entries on one
  belief from one source are one unit of mass, not N. **Market-rung readings
  are the deliberate exception:** each *closed committed plan* is its own unit —
  successive cycles on the same instrument never dedupe (a series of misses
  could otherwise never accumulate to the kill zone). Re-counting an
  unchanged world is prevented by the bar ratchet, not by dedupe
  (`docs/goals.md §Found numbers`).
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
  series of missed Market-rung readings can kill a belief.**

Backends never encode this in a native formula — a connector-agnostic script
(and the evidence skills, on every touching write) recomputes `Strength`,
`Confidence`, and `Risk` from the stored fields.

**The `Grading justification` field — what makes a reading auditable.**
Every concluded `beliefs[]` entry records its **scoring rationale** in this
per-entry field (distinct from the reading-level `body`, which holds the
verbatim quote/excerpt the entry is graded from), so the numbers are
reproducible from the record alone:

- the entry's **rung** and, on Market rungs, the **magnitude pick** with the
  absolute anchor it keys to ("2 paying pilots at £500/mo → Paying, Low");
- the reading's **Representativeness** and **Credibility** picks, one-line
  justification each (shared across the reading's entries — they grade the
  source, not the belief);
- the **source** — the artifact's canonical link the independence dedupe
  keys off.

A `beliefs[]` entry with an empty `Grading justification` can't be audited
into the average — the `reading-ungraded` check flags it (`ontology.yaml`).

**Volume lives in rung choice, not in a record count.** Same-source records
don't stack (the dedupe), and weak records can't out-average strong ones. If
you have volume, it should change the *rung* — a systematic ask of 100
people is a `Survey at scale`, not 100 anecdotes.

**Sample size (N) gates the `Result`; it is not a magnitude lever.** A test
whose N is too small (or wrong-Lens) to mean anything comes back
`Inconclusive` — contributing **nothing** — rather than a shrunken positive.
State the minimum qualified N in the pass bar (`survey.md`,
`interview-guide.md`); below it, the result is noise, not weak validation.

> Rung options are a real select — propose a genuinely new rung only as a
> gated schema change; never write a rung value that isn't live in the
> register.

---

## 3. Per-method playbooks (what goes in the experiment body)

The protocol lives in the record **body** — the guide / questionnaire /
spec *is* the per-row protocol. Pick the playbook by the **run's method**,
never by a rung (a bundle can hold mixed rungs; the run is still one
method): **interview** (± stimulus) → interview template · **prototype
session** → prototype path + usage guide · **survey** → questionnaire ·
**fake-door** → stimulus spec + costly ask + instrumentation · **desk** →
desk template · **pitch** → pitch checklist. One experiment → one playbook →
one protocol artifact, even for mixed-rung bundles.

The checklists below are the **minimum bar**; the full prep skeletons live
in `/experiment-design`'s `references/` — `interview-guide.md` (guide
skeleton + how-to-ask rules, also the question discipline `survey.md`
inherits), `prototype-brief.md` (prototype-needed rule table §3b + brief
template), `fake-door.md` (stimulus / costly ask / instrumentation spec).

### 🔵 Desk research

- **Sub-questions.** Break the belief into the specific questions sources
  must answer (each maps to part of `We're right if`).
- **Sources.** Name where you'll look and what counts as **credible**
  (primary regulation / audited data > vendor marketing; recent > stale;
  independent > self-interested).
- **Decision rule.** What pattern across sources = pass vs. fail. Capture
  conflicting evidence, don't cherry-pick.

### 🟣 User interview (± stimulus)

- **Recruit / screener.** Who qualifies (must match the `Lens` — one
  population for the whole bundle), how many (small-N, but name the target),
  how you'll reach them.
- **Questions.** Non-leading, behaviour-first. Ask about the **last time**
  they did X, not whether they "would". Open, then probe. No pitching
  mid-interview. Past-behaviour core **before** any stimulus.
- **Signal — per belief.** One block per bundled belief: what answer/
  behaviour pattern clears *that belief's* `We're right if` (e.g. "≥N of M
  unprompted describe the problem we're betting on"), with each question
  tagged to the belief(s) it feeds.

### 🟠 Pitch / Prototype / Fake-door (incl. 🎯 Market rungs)

A 🎯 Market-rung design (`Signed intent` / `Paying users`) is a **committed
plan**: both bars pre-registered, Deadline set, instrument named in advance
(`docs/goals.md`) — a fake-door is a short committed plan.

- **Stimulus.** The thing shown (mock, landing page, one-pager, demo) —
  realistic enough that the ask is real; referenced by canonical link (§0).
- **The ask.** A **costly** signal of intent: payment, deposit, signed LOI,
  calendar time, opting in. The cost is what makes it evidence.
- **Bar.** Per bundled belief: the count/rate of people taking the costly
  action that clears its `We're right if`.

**Anti-patterns (kill on sight in any method — applied per belief):**
leading or "would you…" hypotheticals · vanity metrics (impressions,
"interest") standing in for commitment · sample too small or wrong-Lens to
mean anything · confirmation bias (only logging evidence that fits the
bet) · a pass bar vague enough to always pass · a desirability bar on a
watched session (observation destroys desire signals —
`threats-to-validity.md`; a usage test measures comprehension/usability,
desire needs its own Revealed record) · one belief's measurement poisoning
another's (§1b).

Before finalizing the protocol, pressure-test it against
`references/threats-to-validity.md` (selection bias, novelty effects,
Hawthorne effect, regression to the mean, spillover, sample
representativeness, multiple comparisons, instrumentation drift,
survivorship bias) and its stopping-rule and ethics notes — name whichever
apply and either mitigate or explicitly accept them in the record body.

## 3b. When is a prototype needed? (rule table)

Keyed to **what the experiment is discovering** — never to enthusiasm for
building. The one human override is the interview stimulus question ("will
you show a prototype in the interview?").

| Discovering… | Build | Rung it belongs on |
|---|---|---|
| Problem **existence / severity** — did it happen, how often, how painful (past behaviour) | **Nothing** — interview without stimulus | `Opinion` / `Anecdotal` |
| Solution **comprehension / usability / engagement** — do they get it, can they use it, do they come back | **Prototype** (throwaway; Wizard-of-Oz allowed) | `Prototype usage` |
| **Willingness to commit** before anything is built | **Fake-door / landing page** — not a full prototype | `Signed intent` |
| Facts **already knowable** from published sources | **Nothing** — desk research | `Desk research` |

A prototype spec is a **prototype brief** — the *experiment's constraints on
the instrument*: what must be REAL, what can be FAKED, and the
instrumentation, each keyed to the bundled beliefs' bars, plus how the
session uses it. Never a build spec or a production PRD — every HOW/design
question routes to `/prototype`, outside this system. Interviews that show a
prototype still require the full interview guide — a prototype without a
guide is a demo, not an experiment.

---

## 4. `We're right if` / `We're wrong if`

Turn each bundled assumption's falsifiability answer (`assumption-guardrails.md
§1` — a grill check, not a stored field) into two concrete, observable
thresholds fixed before the run — **one pair per belief**:

- **`We're right if`** — the result that turns *that* assumption into a
  fact. Concrete and countable: `≥N of M say/do X`, `≥X% convert`,
  `regulation explicitly permits Y`. No qualifiers without a number.
- **`We're wrong if`** — the kill bar. The result that should make you drop
  or pivot the assumption. Naming it up front is what stops post-hoc rescue.

Bars exist **only for the beliefs under test** — un-bundled surface the run
happens to touch yields off-plan readings, never a bar (§0). If you can't
state both thresholds for a belief, its part of the design isn't done — go
back to `/assumptions` and re-run the falsifiability check (or flag that the
assumption itself is unfalsifiable, which is `/assumptions`' problem, not
this skill's).

---

## 5. Relations & the two axes

- **One experiment ↔ the beliefs that share its run.** Each bundled belief
  keeps its own bar line (§1b); a belief the run can't honestly address gets
  its own experiment. A high-Risk assumption often needs **several**
  experiments (e.g. desk research then a pitch) — that's fine; they accrue
  as separate records. (Live encoding of the relation: `registry-schema.md
  §Field map — Experiments` — the composed bar line.)
- **Three separate axes, do not conflate:**
  - **Assumption `Status`** = `Draft` / `Live` / `Invalidated` — the
    lifecycle and nothing else; Testing, queue membership, and evidence-plan
    linkage are derived views computed from the row's data
    (`registry-schema.md §Status & derived views`). `/experiment-design`
    never flips any assumption status: committing an Experiment to `Running`
    makes each bundled `Live` row show in the derived Testing view
    automatically.
  - **Experiment `Status`** = `Draft` → `Running` → `Closed`, plus
    `Archived` (a Draft/Running plan retired without concluding — shelved out
    of the active and test-next views, never read back as evidence; distinct
    from `Closed`, which concluded against its bars). This is where `Running`
    lives, never on a Reading. `/experiment-design` only ever commits to
    `Running`; archiving is a separate retire action.
  - **Reading `Result`** = set once at logging, conclusive from the start
    (`Validated` / `Invalidated` / `Inconclusive` — no `Running`). Readings
    conclude rolling as evidence is logged (§6) — a verdict moves Confidence
    and Risk, never the assumption's `Status`; only a human-affirmed kill
    flips `Live → Invalidated`.

---

## 6. Lifecycle — origination, conclusion, closure, kill, ordering

**Origination — a reading is born exactly two ways. Never retroactively.**

1. **From an Experiment** — Testing-grade or committed (Market-grade)
   alike: created only via forward design — `/experiment-design`,
   queue-prompted or prototype-first *going forward* (bars fixed before the
   next round). Found evidence **never gets a wrapper experiment** minted
   after the fact. A committed (Deadline-bearing) plan's Market-rung
   readings enter at closure — **one round of readings per bar line, at the
   deadline**; the series-of-misses model runs across successive
   committed-plan cycles; mid-cycle check-ins are reviews, not evidence.
   **No bare Market-rung readings**: a found scoreboard number prompts
   minting a *forward* committed plan (`docs/goals.md §Found numbers`) — no
   backdated plans, no retro-registered bars, no plan born closed.
2. **Bare** (Testing rungs only): found evidence — desk research, evidence
   sweeps, back-fits. Prototype-first entry = bare readings back-fit to
   beliefs, plus optionally a new forward experiment.

Testing-grade and committed Market-grade plans are **one record type, one
lifecycle shape** (`Draft → Running → Closed`) — the Goal record was
unified into the Experiment (`OPS-1305`); they differ only in whether a
Deadline/Outcome is set, never in shape.

**Readings conclude rolling** — human-affirmed as logged (the
post-interview capture), signed strength fixed then; Confidence moves as
evidence lands. No draft state on a reading.

**Closure is one human act on the plan**: stop collecting; render each
pre-registered per-belief **bar verdict** (Validated / Invalidated /
Inconclusive — judged only now, against the full pre-registered N); write
the rollup summary into the record; for a committed plan, also set the
**Outcome** (Achieved / Missed / Dropped). Bar verdicts and the rollup are
**reports, never Confidence inputs** — the readings already carried the
evidence; counting the verdict again would double-count.

**Kill / early stop = the same closure gate, different reason code.**
Already-concluded readings survive (a mid-round LOI keeps its strength);
unmet bars close `Inconclusive`. Kill candidates are surfaced to the human
by sweeps (the weekly ritual / `register-audit.md`), prompted by:

- stale `Running` — no reading activity against the plan;
- the underlying assumption mooted (Impact 0) or merged away;
- superseded by a cheaper same-belief design;
- cost ballooned past the design-time `Feasibility`.

**Archive vs. close.** A plan that yielded readings and reached its bars
**closes** (bar verdicts rendered, evidence read back). A plan that will never
be read back — a Draft never committed, or a `Running` plan abandoned before it
produced attributable evidence — is **`Archived`** instead: it leaves the
active and test-next views without a closure rollup. A reading's `experimentId`
must point at a *live* (non-archived) experiment — archiving a plan that still
has readings attributed to it orphans them (`ontology.yaml`
`reading-orphaned-experiment`), so re-point or bare those readings first.

**Ordering: Risk picks the belief, Feasibility picks the experiment.** The
test-next queue (Risk alone) says which belief deserves testing; among
designed experiments, run `High` feasibility before `Medium` before `Low` —
for a bundle, read "the highest-Risk belief in the bundle". That sort is the
whole rule: Testing experiments live in one narrow, cheap band, so no
further machinery earns its keep. (Which committed plans to commit to per
cycle is commitment-prioritisation — future work, outside this file.)
