---
type: Desk research          # experiment_type rung (ontology.yaml)
tier: Researched
result: Validated            # world-knowable prior-art claim, not a your-user behaviour
source_quality: High         # load-bearing claims rest on Tier A/B primaries
strength: 29                 # round(base 25 × High 1.15), per derivations.strength
date: 2026-07-13
subject: DEC-003 — never-close, two-dial assumption model
owner: Benji
---

# Desk research — the never-close, two-dial assumption model

> Long-form evidence note under `docs/evidence/`, typed by the front-matter
> `type:` field (an `experiment_type` rung). Body shape: sub-questions →
> tiered dated findings → conflicts & how weighed → caveats → sources
> considered & dropped → verdict. Later notes follow this shape.

**Decision under validation (verbatim):** "Assumptions never close. There is
no terminal/resolved status. An assumption record only moves on two dials:
Impact (hand-scored 0–100; a decision that moots the question re-scores Impact
DOWN, to 0 when fully moot; a goal or decision that stakes more on the belief
pushes Impact UP) and Confidence (0–100, derived from the strongest concluded
evidence). Priority is derived: Risk = Impact × (1 − Confidence/100). Pruning
happens by records falling out of rankings, not by closing them."

**Research question:** Does published prior art in product validation,
decision theory, and forecasting support or contradict this model versus the
conventional status-machine (validated / invalidated / closed-by-decision)?

**Researched:** 2026-07-13
**Overall verdict:** **Supports**, with one mixed sub-question (the specific
"no `Validated` status" claim, where some Lean/PM practice diverges) and one
genuine operational caveat (register growth) that the model's own ranking
mechanism answers.

Note on scope: the model keeps a human-affirmed `Invalidated` kill status and
`Draft`/`Live`. The "never close" claim is narrow — that no decision or
evidence ever marks an assumption **resolved / validated / closed**. Findings
are judged against that narrow claim.

---

## Sub-questions → findings

### 1. Itamar Gilad's Confidence Meter — is confidence continuous and always revisable, and does he ever "close" an idea? — **Supports**

Confidence is a continuous evidence-derived score that keeps moving; there is
no predictive terminal "validated" state.

- "Still, in the weeks and months after launch there's still some level of
  uncertainty about how the product is performing." Even at the top tier the
  guidance is to "keep processing the data and interviewing people to make
  sure you're not missing anything." — [Evidence scores — the acid test of
  your ideas](https://itamargilad.com/evidence-scores-the-acid-test-of-your-ideas/)
  · Tier A (author's primary site) · pub 2017-08-12.
- The Confidence Meter returns a 0–10 score from four ascending evidence
  classes (Opinions, Assessment, Data, Test results), used as a multiplier on
  expected value — i.e. a dial, not a status. — [Votito method
  card](https://www.votito.com/methods/confidence-meter/) · Tier C ·
  undated (corroboration only).
- The evidence-scoring ladder is already the named lineage for `Confidence`
  in this method (`docs/method.md`, "Lineage").

**Caveat / mild conflict:** Gilad's framework does award a retrospective "Good
Idea" badge after 12–24 months of sustained metrics. That is closest to a
terminal state, but it is *backward-looking confirmation of past performance*,
not a claim the belief is settled going forward — so it does not contradict
"never close." Noted honestly rather than suppressed.

### 2. Bland / Strategyzer Assumptions Mapping — is the importance × evidence map structurally the same two-dial model, and does it use terminal statuses? — **Mixed (structure supports; workflow diverges)**

The map is structurally the same two dials this decision uses. Assumptions
*move along the evidence axis* as evidence accrues; the map language is about
movement, not closure.

- Two axes: x = Evidence ("have evidence" ↔ "no evidence"), y = Importance
  ("important" ↔ "unimportant"). Focus goes to the top-right quadrant:
  "beliefs that are critical for success and yet have the least amount of
  evidence to support them." — [How Assumptions Mapping Can Focus Your Teams,
  David J. Bland](https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter)
  · Tier A (Strategyzer, co-author of *Testing Business Ideas*) · pub
  2020-08-04.
- This is the same construction as `Risk = Impact × (1 − Confidence/100)`:
  importance = Impact, evidence = Confidence, and the high-priority corner is
  high-importance / low-evidence = high Impact / low Confidence = high Risk.
  It is the second named lineage for this method (`docs/method.md`).

**Conflict:** Bland's *workflow* tooling — the Javelin / Validation
(Experiment) Board that grew out of the same Lean tradition — does stamp
assumptions **validated / invalidated**: "once the riskiest assumption is
validated, the team can move on to testing the next riskiest assumption." —
[Javelin / Validation Board writeups]
(https://connorgillivan.com/complete-the-javelin-board-and-speak-with-your-first-customers/)
· Tier C · undated. So the two-*dial* geometry supports the decision, but the
surrounding practice does mark a terminal "validated." Weighed below.

### 3. Riskiest Assumption Test (RAT) — is re-testing / continuous validation part of the canon? — **Mixed / weak sourcing**

RAT is explicitly a loop that continuously re-selects the current riskiest
assumption — consistent with "confidence keeps moving, next-riskiest always
surfaces." But the same canon also speaks of an assumption being "validated"
and then moving on, which is the terminal framing the decision rejects.

- "A RAT is designed as a loop: 'build, measure, learn' … it is the
  responsibility of the whole team to continuously ask … 'Is this the smallest
  thing we can do to test our riskiest assumption?'" — [Duodeka, Riskiest
  Assumption Test](https://duodeka.com/venture-building-blog/riskiest-assumption-test-rat/)
  · Tier C · undated.
- Decision-point framing: "conduct more testing if results are inconclusive;
  pivot … if not validated; or move forward if … validated." — same source ·
  Tier C.

All RAT sources found were vendor/practitioner blogs (Tier C/D); no Tier-A
primary. Per the rubric this sub-question is **single-tier** and its verdict
is capped — treat as directional, not load-bearing.

### 4. Bayesian epistemology — does formal theory support "never closed, only confidence moves"? — **Strongly supports**

Cromwell's rule is a direct formal statement of "never close": assigning a
belief probability 0 or 1 is exactly closing it, and doing so is a modelling
error because it makes the belief immune to all future evidence.

- "The use of prior probabilities of 1 … or 0 … should be avoided, except
  when applied to statements that are logically true or false." — [Cromwell's
  rule, Wikipedia](https://en.wikipedia.org/wiki/Cromwell's_rule) · Tier B ·
  accessed 2026-07-13.
- "If the prior probability assigned to a hypothesis is 0 or 1, then, by
  Bayes' theorem, the posterior probability is forced to be 0 or 1 as well; no
  evidence, no matter how strong, could have any influence." — same source.
- Named by statistician Dennis Lindley (primary attribution), after
  Cromwell's 1650 line "think it possible that you may be mistaken"; Lindley's
  gloss: leave "a little probability for the moon being made of green cheese …
  otherwise an army of astronauts returning with samples … will leave you
  unmoved." — same source · corroborated by [John D. Cook]
  (https://www.johndcook.com/blog/2008/01/12/musicians-drunks-and-oliver-cromwell/)
  · Tier C · 2008-01-12.

An empirical assumption is precisely the "not logically certain" case
Cromwell's rule says must stay strictly between 0 and 1. Confidence bounded
0–100 (never 100) and never terminally closed is the register-level
expression of the rule.

### 5. Superforecasting (Tetlock) and the psychology of closure (Kruglanski) — **Supports**

Best-in-class forecasting treats beliefs as permanently provisional and small-
increment revised; and the drive to *close* is a documented cognitive bias,
not a virtue to design for.

- "Superforecasters are 'perpetual beta' — like a software program that will
  be used, analyzed, and improved without being released in a final version."
  Perpetual beta is "roughly three times as powerful a predictor" of forecast
  skill as intelligence. — [Good Judgment, Inside a Superforecaster's Toolbox]
  (https://goodjudgment.substack.com/p/inside-a-superforecasters-toolbox)
  · Tier B (Tetlock's own organisation) · accessed 2026-07-13.
- Incremental updating: superforecasters "revise their beliefs often, and in
  small increments" (e.g. 0.6 → 0.65). — same source. Mirrors Confidence
  moving in evidence-sized steps rather than flipping to a closed state.
- Need for cognitive closure produces "seizing" (grab an answer fast) and
  "freezing" (hold it against new information), which "reduces hypothesis
  generation" and makes analysts "impervious to information suggesting
  alternative possibilities." — [Kruglanski & Webster, *Motivated closing of
  the mind: "seizing" and "freezing"*, Psychological Review 1996]
  (https://psycnet.apa.org/record/1996-01742-003) · Tier A (peer-reviewed) ·
  1996. A terminal "validated/closed" status is exactly a designed-in freeze.

### 6. Decision theory — does `Risk = Impact × (1 − Confidence)` match EVPI logic, and does a decision that moots a question drop its value to ~0? — **Strongly supports**

Both halves of the decision's mechanics map onto value-of-information theory.

- EVPI is "the price that one would be willing to pay in order to gain access
  to perfect information," and "the value of information can never be less than
  zero since the decision-maker can always ignore the additional information."
  — [EVPI, Wikipedia](https://en.wikipedia.org/wiki/Expected_value_of_perfect_information)
  · Tier B · accessed 2026-07-13. (Concept attributed to Ron Howard, 1966/67,
  in decision analysis.)
- **The Risk formula ≈ EVPI structure.** EVPI measures "the expected cost of
  … uncertainty" — the probability-weighted regret of choosing wrong. `Risk =
  Impact × (1 − Confidence/100)` is the same shape: cost-if-wrong (Impact) ×
  probability-still-wrong (1 − Confidence). Testing the highest-Risk
  assumption first is buying information where its expected value is highest.
- **"Decisions moot questions" ≈ EVPI → 0.** Value of information is zero when
  the information cannot change the chosen action: "EVPI = EV|PI − EMV … When
  perfect information wouldn't change which option you'd select, both values
  remain equal, resulting in zero." — same source. Once a decision forecloses
  the paths where a belief mattered, no achievable evidence changes any live
  action, so its information value is ~0 — which is exactly Impact re-scored to
  0 (moot), the record falling out of the ranking rather than being deleted.

### 7. Re-scoring importance when commitments change, and retaining rather than deleting — **Supports**

Risk-management practice already re-scores live entries on review and keeps
them on a living register rather than resolving-and-forgetting — the same
"move the dials, prune by ranking" pattern.

- ISO 31000's monitoring-and-review is continuous re-assessment, explicitly
  against the "one and done" habit: "Many companies have the 'one and done'
  attitude. A risk is identified. It is controlled … Then, it is forgotten …
  Context changes. Risks change." — [Accendo Reliability, ISO 31000 Monitoring
  and Review](https://accendoreliability.com/iso-31000-monitoring-and-review/)
  · Tier C · accessed 2026-07-13.
- Auditors "need to see a *living* risk register — reviewed regularly, updated
  after incidents," with "detailed records … decisions, actions, and
  outcomes" kept as an audit trail. — [Ideagen, ISO 31000: Monitoring and
  Reviewing Risk](https://www.ideagen.com/thought-leadership/blog/iso-31000-monitoring-and-reviewing-risk)
  · Tier B (established GRC vendor, methodology-stated) · accessed 2026-07-13;
  corroborated by [MetricStream ISO 31000 guide]
  (https://www.metricstream.com/learn/iso-31000-framework-guide.html) · Tier
  C. Standard: ISO 31000:2018, clause on monitoring & review (standard text
  paywalled — not fetched; see caveats).

Re-scoring Impact up when a goal/decision stakes more on a belief, and down to
0 when a decision moots it, is the register analogue of periodic likelihood/
impact re-assessment. Retaining the record (audit trail) rather than deleting
mirrors register practice.

---

## Adversarial refute pass

Default: refute unless the counter-argument can knock the claim down.

**(a) Unbounded register growth / review fatigue.** Real and documented:
treating the register as an ever-growing static list makes meetings "bogged
down, wasting time on … risks that aren't prioritized or actionable … the
register turns into a checklist that stalls progress." — [StrongMocha, risk
register mistake](https://strongmocha.com/business-policy/risk-register-mistake/)
· Tier C. **Does it knock the claim down? No — it targets the failure the
model's own design avoids.** The stated fix in the same literature is "review
… emphasizing high-priority risks, so the team concentrates on the most
critical." That is exactly "prune by falling out of rankings" via derived
Risk, not by closing. The concern survives only as an *operational
requirement*: the ranking must be the sole surface teams read, or the raw list
does become fatiguing. Logged as the model's main caveat.

**(b) Psychology of closure as motivating (Zeigarnik / GTD).** Open loops
create measurable cognitive tension (Zeigarnik effect); this looks like an
argument *for* terminal states. **But the same research refutes it:** closure
does not require completion — "simply making a concrete plan … is enough to
satisfy the brain's need for closure" (Baumeister & Masicampo, 2011), and
GTD's mechanism is to "capture every open loop in a trusted external system so
that … your brain stops nagging." — [summarised at NerdSip]
(https://nerdsip.com/blog/the-zeigarnik-effect-why-unfinished-tasks-haunt-you)
· Tier C, citing Baumeister & Masicampo 2011 (Tier A primary). A ranked
register *is* the trusted external system: it discharges the closure need by
recording-and-ranking, not by stamping "done." Counter neutralised, and it
actually reinforces the design.

**(c) Audit / compliance requiring closed states (ISO 31000, PMBOK "closed"
risk status).** PMBOK/ISO registers do carry a "closed" status. **But
inspection downgrades this as a counter:** in these frameworks "closed" retains
the record with its history as an audit trail (the register is *living* and
records are kept, per finding 7), it is not deletion; and it is applied to
risks that can no longer occur — the compliance analogue of Impact → 0 /
moot, not of "we validated the belief so stop tracking it." The model's
`Invalidated` kill status and its retained-but-unranked moot records already
provide the auditable terminal-*looking* states without claiming an assumption
was validated. Orthogonal, not contradictory.

**(d) Lean Startup validation board — validated/invalidated as argued-for
practice.** This is the strongest genuine counter. Lean tooling explicitly
stamps assumptions **validated** and moves on (finding 2, finding 3). **Weight:
partial hit, narrow.** It contradicts the literal "no `Validated` status"
only at the *workflow* layer, where "validated" is shorthand for "this
experiment cleared its bar, go test the next riskiest," a snapshot of a
board — not a claim the belief is epistemically settled forever (which
findings 4–5 say it never is). The model relocates that same signal into
Confidence (the experiment's verdict raises Confidence) while keeping the
belief open, which is a defensible reconciliation rather than a refutation.
Recorded as a real conflict, not smoothed over.

**(e) ADR status conventions (proposed/accepted/deprecated/superseded).**
Decision records *do* carry statuses and are immutable once accepted: "Once an
ADR is accepted, it should never be reopened or changed — instead it should be
superseded," giving "a clear log of decisions and how long they governed." —
[Fowler, Architecture Decision Record]
(https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) · Tier B ·
accessed 2026-07-13; term coined by Michael Nygard, 2011. **Does not weaken
the claim — it is orthogonal and, on the assumption side, aligned.** This
method *already* gives Decisions statuses and treats them as the focus
mechanism (`docs/method.md`, Habit 3). ADR practice is about *decisions*, not
*assumptions*; and even ADRs are never deleted or "closed by validation" —
they are superseded and *retained*, which is the same never-delete, keep-the-
audit-trail philosophy the assumption register uses. If anything it supports
the split the decision draws: decisions carry lifecycle status, the beliefs
under them do not get stamped "true."

---

## Conflicts & how weighed

- **Two-dial geometry vs terminal "validated" workflow (findings 2–3, adv d).**
  Every primary two-axis / two-dial source (Gilad, Bland's map, Bayesian
  credence, EVPI) supports *continuous confidence, no epistemic closure*. The
  terminal "validated" language appears only in *workflow* tooling (Javelin
  board, RAT decision-points), largely Tier C, and there it means "cleared
  this test, advance the queue" — which the model preserves as a Confidence
  bump. Weighed toward the decision: the higher-tier, more foundational
  sources are on the continuous side; the terminal framing is a UI convenience
  of lower-tier practitioner tools, and the model reproduces its useful
  content without the closure claim.
- **Closure psychology (adv b) cuts both ways.** The Zeigarnik/need-for-closure
  pull is real, but the primary research (Baumeister & Masicampo; GTD) says a
  *trusted record* discharges it. Weighed as net-supporting, with an
  operational caveat.
- **No source contradicts the moot/EVPI-→0 mechanism.** Finding 6 is the
  cleanest, highest-tier match and had no credible counter.

## Confidence & caveats

- **Strongest, best-sourced sub-questions:** 4 (Cromwell's rule) and 6 (EVPI)
  — established formal results, Tier A/B, exact quotes, no viable counter.
  Findings 1, 2, 5 rest on Tier-A/B primaries (authors' own sites, Strategyzer,
  Tetlock's org, a peer-reviewed 1996 paper).
- **Weakest sub-question:** 3 (RAT) — all Tier C/D practitioner blogs, no
  primary; treat as directional only, not load-bearing.
- **Single-source / stale flags:** ISO 31000 finding (7) leans on GRC-vendor
  secondaries (Ideagen Tier B, others Tier C); the standard text itself
  (ISO 31000:2018) is paywalled and was not fetched, so the clause-level claim
  is secondary-sourced — capped accordingly. Gilad's core page is 2017; the
  Confidence Meter has been iterated since, but the continuous-confidence
  principle is stable. Several corroborating pages are undated (flagged inline).
- **Independence:** book-summary pages for Superforecasting largely restate one
  origin (the book); counted as one origin, with Tetlock's own org (Good
  Judgment) as the load-bearing citation. Javelin-board pages likewise trace to
  one Lean Startup Machine origin — counted once.
- **The one real caveat to carry forward:** the never-close model only avoids
  register bloat / review fatigue (adv a) *if* the derived Risk ranking is the
  primary surface and raw record count is never what the team reads. That is a
  design constraint the decision implies but does not itself guarantee.

## Sources considered & dropped

- **statisticshowto.com, byteseismic, grokipedia** on Cromwell's rule — Tier
  C/D; dropped in favour of the Wikipedia article (quotes Lindley directly)
  and John D. Cook. Chased only to confirm the Lindley attribution.
- **Medium / HackerNoon "MVP is dead, long live the RAT" posts** — Tier C/D
  opinion; used one Tier-C source (Duodeka) to characterise RAT and did not
  lean on the rest.
- **Design Sprint Kit, Mural, Evelance, ProductCompass** on assumptions
  mapping — Tier C restatements of Bland's model; dropped in favour of the
  Strategyzer primary.
- **BeFreed / YouExec / various Superforecasting summaries** — Tier C/D book
  summaries; not independent of the book. Used Good Judgment (Tetlock's org)
  instead.
- **ISO.org standard page** — authoritative but paywalled; could not fetch the
  clause text, so cited the monitoring-and-review principle via GRC
  secondaries and flagged it.
- **Fatigue Risk Management System (FRMS) papers** — surfaced by the "review
  fatigue" search but are about worker fatigue, not register fatigue;
  irrelevant, dropped.

---

## Overall verdict

**Supports.** The core of the decision — an assumption that never reaches a
terminal validated/resolved state and instead moves only on Impact and
Confidence, with priority derived as `Risk = Impact × (1 − Confidence/100)` —
is corroborated by the strongest and most foundational prior art:

- Bayesian **Cromwell's rule** makes "never close" a formal requirement for any
  non-logical (empirical) belief: probabilities of 0/1 are the closed state,
  and they are a modelling error because they freeze the posterior against all
  evidence.
- **EVPI / value-of-information** gives the Risk formula its theory: priority
  to test = probability-of-being-wrong × cost-of-being-wrong, and information
  value drops to zero when no live decision depends on the uncertainty —
  exactly the "a decision moots the question, Impact → 0, it falls out of the
  ranking" mechanism.
- **Superforecasting's "perpetual beta"** and the **need-for-cognitive-closure**
  literature show that treating beliefs as permanently provisional predicts
  accuracy, while the urge to reach a closed verdict ("seizing/freezing") is a
  named bias — so designing *out* a terminal status is the epistemically
  healthier choice.
- The two named lineage sources, **Gilad's Confidence Meter** and **Bland's
  Assumptions Map**, both model belief as a continuous evidence score / an
  evidence-axis position, not a status.
- **ISO 31000 / risk-register** practice already re-scores live entries and
  keeps a living, audited register rather than resolving-and-forgetting.

**Where it is mixed, not clean:** the literal claim "there is no `Validated`
status" runs against real Lean Startup **validation-board** practice, which
does stamp assumptions validated/invalidated. That divergence is narrow — the
board's "validated" is a per-experiment workflow signal, and the model
faithfully preserves that signal as a Confidence increase while (consistent
with findings 4–5) refusing to call the belief permanently settled. **ADR
statuses** and **PMBOK "closed" risks** do not contradict the decision:
they concern *decisions* (which this method already gives statuses) or are
retained audit-trail states equivalent to the model's `Invalidated`/moot
records, not "the belief was proven true, stop tracking it."

**Carry-forward caveat:** the only substantive risk the literature raises —
register growth and review fatigue — is not refuted by theory but is answered
by the model's own design (pruning by falling out of the derived ranking).
That answer holds *only if* the ranked test-next queue, not the raw record
list, is what the team actually works from.

**File:** `docs/evidence/never-close-two-dial-model.md`
