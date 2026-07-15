---
type: Desk research          # experiment_type rung (ontology.yaml)
tier: Researched
result: Inconclusive         # splits by joint (J3 supports, J2's hard gate contradicted, J1 novel); single verdict lands with the pending decision
source_quality: High         # load-bearing positive claims rest on Tier A primaries; absence claims capped, see caveats
strength: 0                  # gated: strength stays 0 while Result is not conclusive (register-audit `strength-not-gated`); re-derive when the decision fixes the claim
date: 2026-07-15
subject: Pending — role of goals; whose job is goal-making, and which of the three joints of docs/goals.md survive (OPS-1229)
owner: Benji
---

# Desk research — where do goals sit in validation methods, across the business lifecycle?

> Long-form evidence note under `docs/evidence/`, typed by the front-matter
> `type:` field (an `experiment_type` rung). Body shape follows
> `never-close-two-dial-model.md`: sub-questions → tiered dated findings →
> conflicts & how weighed → caveats → sources considered & dropped → verdict.

**Decision under validation (pending, stated as drafted):** `docs/goals.md`'s
three-joint model — a goal is a Decision row (`Kind: Goal commitment`);
Joint 1 (in): committing is evidence-gated (beliefs surfaced, tested first or
dated risk-acceptance); Joint 2 (through): goal linkage is a hard membership
condition of the test-next queue (an un-goaled belief cannot be prioritized,
whatever its Risk); Joint 3 (out): goal outcomes are decomposed into evidence
updating the beliefs underneath. Plus the boundary claim: goal-*making* is not
this repo's job (no goals register, no KR rows; external tools stay the
scoreboard).

**Research question:** Does published prior art support goals as an upstream
prioritisation gate on discovery (Joint 2), or as downstream commitments whose
outcomes feed back as evidence (Joint 3) — and whose job is goal-definition in
a validation stack? Standing constraint: the verdict must hold for a
continuous, all-stages OS (discovery, post-PMF, scale); a stage-varying answer
is a first-class finding.

**Researched:** 2026-07-15
**Overall verdict:** **Splits by joint.** The boundary claim and Joint 3 are
supported; Joint 2 survives as *anchor and lens* but is contradicted as a
*hard admission gate* — no comparable system excludes un-goaled work from
testing; Joint 1 is original — no published practice evidence-gates
goal-setting, though the failure it targets is well documented. Stage
matters, but the literature's own carve is binary (pre-PMF vs. after), and
Gilad's variable is per-goal evidence maturity, not company stage.

---

## Sub-questions → findings

### 1. Gilad's GIST — do goals gate what gets *tested*, or scope what gets *built*? — **Contradicts the hard gate (J2); Mixed on J1; near-silent on J3**

GIST was priced as the strongest prior-art case *for* the current model
(Goals top the stack; this repo already adopts his Confidence meter). On
inspection it runs on **scoring, not exclusion** — the opposite of Joint 2's
membership rule.

- Goals scope prioritisation via a metric hierarchy, and any idea can attach
  to *some* level up to the company north star: "ICE can flexibly be used to
  estimate on any metric — from the company north star or top business
  metric, down to a quarterly key result," and Impact asks "how much does
  this idea stand to improve the key metric we want to grow." —
  [Prioritization techniques](https://itamargilad.com/prioritization-techniques-2/),
  [ICE scores](https://itamargilad.com/ice-scores/) · Tier A (author primary)
  · undated. Weakly-linked ideas score low; they are never barred from entry.
- Un-goaled ideas persist rather than being excluded: the idea-bank model
  keeps an "Untriaged" bank for new ideas and a "Parked" bank for rejected
  ones. — same source · Tier A. No passage anywhere states "no goal link →
  do not test/score" — a notable absence given how thorough his
  prioritisation writing is.
- Discovery ranges wider than goals: "some of the most important ideas don't
  come from opportunity mapping," and "if you test your ideas rigorously,
  accurate prioritization is of far lower importance. You could pull ideas
  from a hat and still do OK." — [5 Ways Product Discovery Breaks Down, part 2](https://itamargilad.com/discovery-problems2/)
  · Tier A · undated. This is a direct argument against letting the goal
  layer decide what may be tested.
- Goal-setting sits upstream of GIST, from strategy: a top-down (annual) /
  bottom-up (quarterly) / finalize OKR cycle, targets set "using existing
  data or educated guesses, adjusted as new information emerges." — Tier C
  (Medium summary of *Evidence-Guided*; verify against the book before
  quoting). Not evidence-gated in Joint 1's sense.
- The Joint-1-adjacent mechanism he does have is **confidence-conditioned,
  not stage-conditioned**: when a goal spans quarters or uncertainty is
  high, "start by setting OKRs for research and discovery first." —
  [OKR FAQ](https://itamargilad.com/okr-faq/) · Tier A · undated.
- Stage: he splits pre-PMF from post-PMF operating modes ("Before PMF it's
  best to conserve cash and have a very small team work quickly to discover
  the market") — [False predictability](https://itamargilad.com/false-predictability/)
  · Tier A · undated — but his goal-process rule keys off each goal's
  evidence maturity, a second axis independent of company stage.
- Joint 3: only a thin mechanism found — score OKR completion % at cycle end,
  framed as ambition calibration ([5 ways your company may be misusing OKRs](https://itamargilad.com/5-ways-your-company-may-be-misusing-okrs/)
  · Tier A) — no explicit outcome-to-belief decomposition step.

### 2. OKR practice across stages — is committing to outcome targets discipline or premature, and does anyone evidence-gate it? — **J1: nobody gates (novel); J2: silent; J3: supports; stage carve is binary**

- Doerr's sequence presupposes settled strategy: "You achieve your mission
  through a set of strategies… From there, you are ready to craft your
  OKRs." — [whatmatters.com](https://www.whatmatters.com/okrs-explained/okrs-strategy-and-execution)
  · Tier A · undated. His site carries a founder's crisis caveat (Jini Kim:
  OKRs "all go out the window when you're in an emergency… When you're
  fighting for survival, there are no best-laid plans") — [Why Startups Should Use OKRs](https://www.whatmatters.com/)
  · Tier A hosting, 2018 panel republished 2025 — but no pre-/post-PMF rule
  from Doerr himself.
- Wodtke gives the cleanest stage model: "I often joke that if you are a
  startup, the only OKR you need is 'get to product market fit,'" and three
  OKR types by maturity — Exploratory (vague ideas; "OKRs were originally
  designed for exploiting… not for exploring unknown possibilities"),
  Hypothesis (Objective = a value-proposition hypothesis, KRs the metrics
  that prove/disprove it), Milestone (mature, multi-quarter). —
  [The Goal Fits the Team](https://cwodtke.com/the-goal-fits-the-team/) ·
  Tier A · 2020-07-04.
- The anti case pre-PMF: "OKRs are almost certainly harmful for pre-P/M fit
  startups because it causes teams to optimize towards goals as opposed to
  constantly asking if the goal is even the right one to begin with." —
  Andrew Chen (a16z), LinkedIn/Twitter · 2019-09 · Tier A authorship, quote
  reconstructed via three agreeing secondaries (primary unfetchable) — treat
  wording as high-confidence, not byte-exact.
- Rick Klau's 2022 retraction of his own OKR-evangelism corrects *practice*
  maturity, not stage: skip individual OKRs at first, KRs must "quantify
  impact and/or outcomes, not progress," and "OKRs should not do double-duty
  as your performance review system." — [tins.rklau.com](https://tins.rklau.com/)
  · Tier A · 2022-01-16.
- **Joint 1 gap (the negative finding):** searches for evidence-based OKRs,
  calibrated targets, OKR pre-mortems, and assumption-checking in OKR-setting
  found no published practice that requires surfacing/testing the beliefs
  behind a target before committing. Nearest analogues: Wodtke's hypothesis
  OKRs (the whole objective held as provisional) and Gilad's warning that
  "'Doing Y will indeed accomplish X' and 'Y is the best way to achieve X'
  are leaps of faith… virtually every project I worked on or observed
  invalidated some or all of these assumptions" ([misusing OKRs](https://itamargilad.com/5-ways-your-company-may-be-misusing-okrs/)
  · Tier A) — a diagnosis of exactly the problem Joint 1 mechanizes, with no
  mechanism attached.
- **Joint 3 support:** aspirational OKRs grade to an expected ~0.7 with
  "reflection is a learning exercise" ([grading OKRs](https://www.whatmatters.com/okrs-explained/grading-okrs)
  · Tier A · undated); "not a performance weapon" (Doerr via consistent
  secondaries, Tier C); and recurring retrospective practice asks "which
  assumptions in the definition of the key results have turned out to be
  incorrect or incomplete?" (multiple independent practitioner guides, Tier
  C/D — conventional wisdom with no single origin). Missed goals as belief
  updates is established direction; §9f's hard evidence-link gate formalizes
  it beyond any found practice.

### 3. Commitment-based framings — does the goal attach at the commitment (DEC-004's shape) or precede and direct discovery? — **Goal-precedes where stated; the seam claim finds support only at Amazon's initiative level; no stage flip found**

- Bezos's one-way/two-way doors and "disagree and commit" (2016 shareholder
  letter, [aboutamazon.com](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders)
  · Tier A · 2016) are about reversibility and velocity — **silent on goal
  timing**. Any "commit then set the goal" reading of Bezos is inference,
  not text. (The repo already uses the door framework for decision gating;
  that use is untouched.)
- Amazon's actual mechanics split by **altitude**: OP1 sets top-down targets
  *before* initiative selection ("Each business unit… takes top-down
  guidance and develops… SMART goals for metrics, initiatives, and resources
  to achieve the top-down targets"), while a specific initiative's success
  criteria lock at the PR/FAQ go/no-go ("At some point… a go, no-go decision
  can be made… resources… a rough timeline" spelled out then). —
  [workingbackwards.com](https://workingbackwards.com/concepts/amazon-operating-cadence/)
  · Tier B · undated. Portfolio-level direction precedes; the measurable
  initiative goal attaches at commitment. Both readings are true at
  different altitudes.
- Cagan: team objectives are assigned *before* discovery — "giving them a
  problem to solve rather than a feature to build" — and discovery is scoped
  to that problem; only the numeric target "will need to come from the
  team." — [Team Objectives — Overview](https://www.svpg.com/team-objectives-overview/)
  · Tier A · 2020-02-24. His OKR criticism is org-structure-contingent
  (feature teams), not sequence-contingent.
- Maurya, explicitly pre-PMF, puts the goal first: GO LEAN step 1 is "Goal
  (establish 90-day targets)… Getting clear on your next 90-day goal is key
  to driving focus on the immediate obstacles in your way," with
  riskiest-assumption ranking operating *inside* the goal period. —
  [LEANFoundry](https://www.leanfoundry.com/articles/how-to-systematically-prioritize-and-tackle-the-riskiest-assumptions-in-your-business-model)
  · Tier A/C boundary (author's own platform) · 2024-09-07. Structurally the
  closest published match to "goal directs focus, risk sorts within" — as
  focus, not as a register-membership rule.
- No source frames the attachment point as flipping with stage; the
  strongest stage-relevant datum (Maurya) puts goals first at the *earliest*
  stage, cutting against "early = goal follows learning."

### 4. Separation of concerns — is goal-definition its own layer that validation consumes? — **Supports, at every stage sourced; no comparable system enforces a linkage admission gate; layers collapse at tiny scale**

- Torres's Opportunity Solution Tree: the root outcome is negotiated with
  leadership and *scopes* discovery — "The outcome at the top of an
  opportunity solution tree sets the scope for discovery… keeps them focused
  on the right types of solutions" ([producttalk.org](https://producttalk.org/opportunity-solution-trees/)
  · Tier A · 2023-12-06); giving teams that strategic context "is frankly a
  product leader's responsibility" ([defining product outcomes](https://producttalk.org/defining-product-outcomes/)
  · Tier A · 2022-12-21). Scope-setting and pruning discipline — a curation
  norm, not a mechanical gate.
- Risk registers presuppose objectives defined elsewhere: ISO 31000 defines
  risk as "effect of uncertainty on objectives" (ISO 31000:2018 §3.1, via
  secondary — standard text paywalled · Tier B), and COSO ERM makes
  objective-setting a formally prior component ("Objectives must be
  established before risk identification can occur") — NC State ERM
  Initiative · Tier B · undated. **No register practice found that refuses
  entries unlinked to an objective.**
- Hoshin Kanri / X-matrix / catchball is a whole discipline that owns goal
  cascade and definition — Tier C aggregators only this pass (Dennis and
  Jackson primaries not fetched); cited for existence, not load-bearing.
- Counterexample to *tool* separation: the GIST board holds goals and the
  validation engine on one artifact ("goals on the left side… ideas in the
  middle… steps to validate and deliver… on the right" —
  [gist-framework](https://itamargilad.com/gist-framework/) · Tier A ·
  undated) — though goal-*making* still happens in a separate OKR cycle
  feeding it.
- Stage threshold: Chen (above) argues against forcing the goal layer
  pre-PMF; practitioner aggregators put the OKR-adoption threshold around
  10–15 people (Tier C/D, no named authority). At a 5-person pre-PMF
  company the two layers collapse into the same brains — no source treats
  that as a violation of the boundary, only as prematurity of the formal
  layer.

---

## Conflicts & how weighed

- **"Goals direct discovery" vs. "goals gate the queue" (findings 1, 3, 4 vs.
  Joint 2 as drafted).** Every sourced system — GIST, Cagan's team
  objectives, Torres's OST, Maurya's GO LEAN, Amazon's OP1 — puts goals
  upstream as scope, anchor, or focus. **None makes goal-linkage an
  admission condition**: Gilad scores unlinked ideas low and keeps them;
  Torres prunes but doesn't refuse; ISO/COSO presuppose objectives without
  rejecting unlinked risks. The repo's own acknowledged trade ("the riskiest
  assumption in the whole register can sit idle if nobody's written a goal
  near it") is exactly the failure Gilad names ("some of the most important
  ideas don't come from opportunity mapping"). Weighed: the *direction* of
  Joint 2 (anchor Impact, lens the queue) is canon; the *exclusion* is an
  invention with the strongest prior art arguing against it.
- **Chen vs. Maurya on pre-PMF goals.** Chen: outcome goals pre-PMF are
  harmful (teams stop questioning the goal). Maurya: set a 90-day traction
  goal first, even pre-PMF. Reconciled by what the goal *is*: Maurya's
  90-day target is a learning/traction milestone directing validation;
  Chen's target is a committed outcome bet. Wodtke splits the same
  difference ("the only OKR you need is 'get to product market fit'").
  Weighed: pre-PMF goals survive as few, provisional, learning-scoped —
  consistent with `Provisional` goals and Joint 1's honesty framing, hostile
  to a many-goal admission gate.
- **Builder seam (commit → then goal) vs. goals-upstream.** The corpus
  favours goals-before-work wherever sequencing is stated, *but* Amazon's
  altitude split reconciles: standing *direction* precedes and scopes the
  work; the *measurable initiative goal* locks at the commitment (PR/FAQ
  go/no-go). In this repo's vocabulary that maps to `Kind: Direction`
  upstream and `Kind: Goal commitment` at the seam — a reconciliation the
  boundary grilling (OPS-1229) can use rather than a contradiction to pick a
  side of.
- **Joint 1 has no prior art either way.** Nobody gates; nobody argues
  against gating (the failure it prevents — "a guess wearing a number,"
  unexamined leaps of faith — is repeatedly documented by Gilad, Klau's
  outcomes-not-progress correction, and OKR retro practice). Weighed as
  *original mechanism, well-motivated, unvalidated by prior art* — support
  must come from this repo's own use, not the literature.

## Stage findings

- The literature's carve is **binary** — pre-PMF vs. everything after. No
  source treats post-PMF vs. scale as distinct regimes for goals. The
  three-stage frame this map uses is finer than anything published.
- Pre-PMF: Wodtke (one goal: find PMF), Chen (outcome OKRs harmful), Gilad
  (discovery-first OKRs under uncertainty) vs. Maurya (numeric traction goal
  first). Convergent reading: goals exist pre-PMF but as few, provisional,
  learning-scoped commitments — which makes a *many-goal admission gate*
  either vacuous (one goal links everything: instant anchor dilution) or
  harmful (Chen's freeze on questioning the goal).
- Post-PMF/scale: assigned outcome goals directing discovery are simply
  assumed (Cagan, Torres, Doerr, Amazon). The *soft* Joint 2 (anchor + lens)
  is uncontroversial there; the hard gate still has no precedent.
- **Gilad's second axis:** his process rule keys off each goal's evidence
  maturity (high-uncertainty goal → discovery OKRs first), not company age.
  For an OS that already scores per-belief Confidence, per-goal evidence
  maturity is a more native variable than business stage — the register can
  read it off the goal's linked assumptions instead of asking "what stage
  are we in."

## Confidence & caveats

- **Strongest-sourced findings:** GIST's scoring-not-exclusion (Tier A,
  multiple pages), Cagan's objectives-before-discovery (Tier A, dated),
  Torres's outcome-as-scope (Tier A, dated), Wodtke's stage model (Tier A,
  dated), Doerr grading-as-learning (Tier A). The Bezos negative finding
  (doors say nothing about goal timing) is primary-text-verified.
- **Absence claims are capped.** "No practice evidence-gates goal-setting"
  and "no system enforces a linkage admission gate" are conclusions from
  four targeted sweeps, not proofs — treat as strong-directional. They were
  searched for adversarially (the sweeps' explicit job was to find the
  gate), which raises confidence but cannot close it.
- **Quote fidelity:** agents extracted quotes via fetch-and-summarize;
  wording is high-fidelity but not guaranteed character-exact. Re-verify
  before quoting externally. Chen's quote is reconstructed from three
  agreeing secondaries (primary unfetchable); the *Evidence-Guided*
  three-step OKR cycle and "educated guesses" line are Tier C book-summary
  sourced — check against the book if load-bearing.
- **Not fetched:** ISO 31000:2018 clause text (paywalled), Dennis/Jackson
  Hoshin primaries, Maurya's traction-roadmap newsletter (DNS failure —
  snippet only), the 2015 Bezos letter (404; door language verified in 2016
  only).
- **Independence:** GIST restatements (airfocus, votito, mindtheproduct
  et al.) counted as one origin; Bezos-letter listicles and Cagan/Empowered
  recaps likewise.

## Sources considered & dropped

- **GIST echoes** (airfocus, funretrospectives, draft.io, votito,
  mindtheproduct) — restate itamargilad.com; counted once.
- **LinkedIn/Twitter primaries** (Chen's post, Gilad's PMF-methodology post)
  — unfetchable; quotes flagged as reconstructed where used.
- **SEC EDGAR 2016 letter** (403) and **aboutamazon 2015 letter** (404) —
  aboutamazon 2016 text used instead.
- **OKR content mills** (okrstool, okrinstitute, worxmate, mooncamp,
  learningloop-style retro guides) — Tier C/D; used only where the framing
  recurs independently, flagged as conventional-wisdom-without-origin.
- **Book-listing pages, video-only pages** (Amazon/Goodreads, MIT Sloan) —
  no substantive text.
- **CALIBER arXiv paper** — false positive from "calibrated targets."

---

## Overall verdict — per joint, stage-qualified

- **Boundary (whose job is goal-making): Supports the drafted stance.**
  Every sourced stack places goal-definition in a separate layer —
  leadership/strategy negotiation (Torres, Doerr, Amazon OP1), or a whole
  discipline of its own (Hoshin) — which validation systems *consume* (ISO:
  risk is defined only against objectives set elsewhere). "An interface, not
  a module" matches the field. Caveats: at ~5-person pre-PMF scale the
  layers collapse into the same people (prematurity, not violation), and
  GIST shows goals and validation can share one artifact while goal-making
  still lives in its own cycle.
- **Joint 1 (evidence-gated commitment): Novel — no prior art either way.**
  Nothing published gates goal commitment on surfacing/testing its beliefs;
  the nearest analogues (Wodtke's hypothesis OKRs, Gilad's discovery-first
  cycles) hold the goal provisional rather than gating it. The failure Joint
  1 targets is repeatedly documented. Keep it as an original bet or drop it;
  prior art can't carry it.
- **Joint 2 (prioritisation): Supports the anchor and lens; contradicts the
  hard admission gate — at every stage.** Goals directing discovery is
  canon post-PMF and present even pre-PMF (Maurya); goal-linkage as a
  *membership condition* on what may be tested has no precedent, and the
  best-matched Tier A source argues directly against exclusion. Pre-PMF the
  gate degenerates (one goal, everything linked, or Chen's freeze). If the
  gate survives, it survives on this repo's own argument, against the
  literature's grain.
- **Joint 3 (outcomes → evidence): Supports, at all stages.** Doerr's
  grading-as-learning, "not a performance weapon," and retro practice that
  asks which assumptions the missed KR invalidated all run in the drafted
  direction; §9f's hard evidence-link gate and `/find-evidence`
  decomposition formalize a norm the field states but does not enforce.
- **Stage:** the published carve is binary (pre-PMF / after), and the most
  useful stage variable found is not stage at all but per-goal evidence
  maturity (Gilad) — a quantity this register can already derive from a
  goal's linked assumptions.

**File:** `docs/evidence/goals-three-joints-prior-art.md`
