# Shared helper — assumption guardrails

The canonical rules every assumption must satisfy. Cited by `/assumptions`
(the inline gauntlet) **and** by its audit path, so build and audit judge by
the same standard. When this changes, both paths change.

The schema (field map, status & derived views) lives in
`registry-schema.md`; this file is the operational ruleset.

---

## 1. Define — the 3-step framework

1. **Explicit.** Write it down as one sentence in the Description:
   `We assume [target user/system] will [behavior/action] because [reason]`.
   The title is a short handle, not the sentence.
2. **Falsifiable.** State what evidence would prove it wrong — concretely
   enough to read as a countable threshold ("≥N of M institutions sign",
   "≥X% of users do Y"), not a vague disproof. If nothing could disprove it,
   it's a belief/philosophy, not an assumption — reject it. Watch for: vague
   qualifiers ("meaningfully", "materially", "many", "better"), absolutes
   ("always", "only", "nothing else"), and placeholders ("benefits exist
   though unclear what they are"). Each needs an observable threshold.
   **This is a grill check, not a stored field** — there is no `Metric for
   truth` column (`OPS-1305`). It proves the claim is falsifiable in the
   moment; the concrete number is re-authored as the bar's `We're right if`
   when `/experiment-design` pre-registers a test against this belief
   (`experiment-guardrails.md §4`) — never copied forward automatically,
   because it was never stored.
3. **Assess risk.** Score **Impact** (§3) — the intrinsic seed, the only
   hand-scored number; Derived Impact, Confidence, and Risk are all computed.
   Focus energy on high-Risk.

**Plain language, no hyperbole.** "institutions will fund X", not "are
desperate for X". No marketing adjectives. The claim must read as a flat,
testable bet.

**Concise, not just plain.** Say it in the fewest plain words that still
name the who/what/why — one core clause plus one reason clause. No stacked
subordinate clauses, no jargon outside the glossary, no redundant hedging
or qualifier-stacking ("in many cases, it could potentially be argued
that…"). Rewrite test: for each clause, ask "does removing this change the
claim?" — if not, cut it. This is checked alongside hyperbole (both are
"plain language"), just a different failure mode: hyperbole overstates,
verbosity buries.

---

## 2. The why-trace (grill stage — builds Depends on / Enables, nothing stored)

Disciplined root-cause trace down to the foundational assumption — the
technique for building a healthy `Depends on` / `Enables` graph. **This is a
transient grill stage, not a stored field**: there is no `5 Whys` column and
no body to write the chain into (`OPS-1305`). The only durable output is the
relation itself — a `Depends on` edge to whatever existing or newly-created
assumption the trace converges on. Without discipline it becomes a rabbit
hole — so constrain both questions and answers.

**Question phrasing.** Always: *"What specific condition or action directly
caused [the previous answer]?"* — forces one step back, not three steps
sideways.

**Answer phrasing — three golden rules:**

- **A. Verifiable fact, not a guess.** No data/observation → stop; don't
  advance on speculation. ("The test script failed Tuesday", not "someone
  probably forgot".)
- **B. Within our sphere of influence.** If it bottoms out in an externality
  (weather, the economy, "the client changed their mind"), reframe to our
  process ("our intake allowed changes after the freeze date"). Externalities
  are dead ends, not roots.
- **C. Process flaw, not personal blame.** "the review checklist had no
  mobile step", not "the designer was careless". People fail because systems
  let them.

**The therefore-test.** Read the chain bottom→top inserting "therefore". If
any link is a leap, you went down a rabbit hole — fix that link.

- Broken: winter → flu season → dev sick → missed deadline. (One illness
  can't sink a project; the chain blamed weather, not process.)
- Valid: no cross-training time → only one dev knew the system → work stopped
  when they were sick → 5 days late → missed deadline.

**Closure — wire it, don't write it up.** Every "why" answer is **either an
existing assumption or a ground truth.** An *assumption* answer converges
onto a **real register record** — searched for and reused, never
paraphrased — and gets wired via `Depends on`. A **ground truth** (a
verified fact, settled reality, or accepted externality — not a bet) is
**not** a register record and needs no relation: it **terminates the
branch — no further why**, nothing written down anywhere. This makes the
graph self-completing without any prose trail to maintain.

- **Dedupe before you wire.** Search the register first and reuse the record
  that already says it. Create a new record only if none exists — and a
  near-duplicate step is merged into its neighbour, not given its own record.
- **The relation IS the closure.** There is no separate body tag to keep in
  sync (assumptions carry no body, `OPS-1305`) — wiring `Depends on` at the
  moment of convergence is the whole act.

**Depth is per-chain, not per-record.** The "5 Whys" is the trace from *this*
parent down its `Depends on` edges — depth accrues across records, so a
record never re-runs a fresh five. **"Five" is a name, not a target** — never
pad a chain to hit a count.

**Stop a branch at the FIRST of these (whichever comes soonest):**

1. **It converges** — the next "why" is an assumption you already have a
   record for. Wire `Depends on` to the existing record and stop. (This is
   the *ideal* close.)
2. **It hits a ground truth** — a settled fact, verified reality, or
   accepted externality (not a bet). No record, no relation, stop.
3. **It stops being load-bearing** — apply the test: *if this next answer
   turned out false, would it change the bet we're making or the experiment
   we'd run?* If no, you've already gone one layer too deep. Treat the
   parent as **root** and stop.

**Soft ceiling — the rabbit-hole tripwire.** In practice a chain hits one of
the three stops within **~3 new whys**. If you're at three *new* whys and
still inventing novel, increasingly abstract answers (no convergence, no
ground truth), that is the signal you've left the load-bearing zone — usually
because the chain has slid from a fact about *your users/market/product* into
a *general law of human behaviour or economics*. Stop, mark the deepest
decision-relevant node root, don't keep going to feel thorough. (Not a hard
truncation: a genuine 4th or 5th load-bearing layer is fine — the ceiling is
a prompt to re-check, not a cap.)

- A **leaf/root** node (the bottom of its chain) does not start its own new
  why-trace — being terminal satisfies it. Treat it as root; don't
  manufacture deeper whys. Every branch ends at one of: a foundational/root
  **assumption** (terminal — don't restart) or a **ground truth**.
- **Convergence is the goal.** The best close is the chain **looping back
  onto a record that already exists** (often one already in another branch):
  foundational assumptions are *shared*, so the graph converges into a DAG
  with common roots instead of exploding into duplicates. If following the
  chain would create a true `Depends on` cycle (A→…→A), the two nodes are the
  same assumption — **merge**, don't wire the loop.

---

## 3. Scoring — seed, propagation, Risk

**Impact (0–100, the seed) — if false, how much of the proposed *solution*
breaks?** The only hand-scored number. The direction itself is a given — it
is not under test; a top-band failure means *rethink the solution*, not
*abandon the direction*. Impact is damage-if-false, not likelihood. Anchored
bands:

- **90–100** — back to the drawing board on the solution (the core solution
  thesis doesn't hold).
- **60–80** — a core pillar of the solution (a lens / GTM motion) dies,
  direction survives.
- **30–50** — a major branch needs rework, recoverable.
- **10–20** — minor, adjust & move on.

**The seed is purely intrinsic severity.** Don't fold in what depends on the
record — no bump for dependents, committed plans, or decisions; the
propagation below applies dependents and standing decisions mechanically, and
hand-anchoring them too would double-count. An experiment (committed or not)
never enters the seed *or* the propagation at all (a plan never touches
Impact — see below).
**Being a root is not itself a signal** — a record with no outgoing
`Depends on` (it bottoms out a 5-Whys chain, §2) is normal; don't inflate
the seed because a record has nothing further to trace.

**Derived Impact (derived — recomputed on every touching write, Risk reads it).**
What depends on a belief is load it carries, and the graph already knows it:

```
Derived Impact = seed + (100 − seed) × S / (S + 100)
```

where `S` = the sum of the record's **dependents' pull**: the `Derived
Impact` of every assumption whose `Depends on` names this record, **plus 100
per standing decision** that names it via `Based on assumption` (a flat,
max-severity node — no per-Kind grading, no signed push, upward only).
**Experiments are not in `S`** — a plan never affects Impact (see below).
Computed in one reverse-topological pass over the DAG (dependents first;
cycles are impossible by §2's merge rule). Properties, by construction:

- a **leaf** (S = 0) keeps its pure hand score; a root the whole thesis
  leans on tends toward 100;
- bounded ≤ 100 and **floored at the seed** — propagation can never lower a
  score, and a catastrophic-but-leaf belief keeps its hand floor;
- one max-severity dependent lifts a record halfway to the ceiling — a
  decision-critical leaf surfaces for review instead of hiding under-ranked;
- only **standing** `Provisional`/`Active` decisions count — reverse or
  supersede one and its push vanishes at the next recompute, no stored state
  to clean up;
- a **moot** row (see below) is pinned at Derived Impact 0 and contributes
  nothing to its own `Depends on` targets.

The recompute is a **weekly, connector-agnostic script** (run in the weekly
ritual; re-run on demand after a seed override). `Derived Impact` is stale
between runs *by design* — mooting and the gating views stay
relation-derived and immediate. **Review by exception:** eyeball only the
queue top; disagree → edit the **seed band** or fix a wrong **graph edge**,
never the derived total.

**A standing decision is a propagation node, not a scoring prompt.** A
standing decision that leans on a belief (`Based on assumption`) raises that
belief's Derived Impact through `S` — mechanically, flat, and auditable.
Don't also nudge the seed for it. Decision linkage is never a Confidence
input (deciding is not evidence) and never a queue condition: every `Live`
row competes on its own merits, linked or not (`registry-schema.md §Status
& derived views`).

**An experiment never affects Impact — not the seed, not the propagation.**
The business *acting on* a belief is already carried by the **decision**
behind the pursuit, which anchors Impact; an experiment (committed or not)
is the measuring instrument for that pursuit, not a second importance
signal, and anchoring both would double-count. Plans churn every cycle; the
dependency structure doesn't. A committed plan reaches Impact only
transitively and correctly: plan → evidence → Confidence on the beliefs its
bar lines decompose onto (`docs/goals.md §Out`) → informs a **decision** →
the decision anchors Impact. Never a direct node. Plan linkage stays an
evidence-plan view and an entry point, never a propagation node. Accepted
tradeoff: a low-seed belief that matters only because an active committed
plan rests on it no longer rises in the global queue — it's found via that
plan's own view (`docs/goals.md §Through`).

**Decision anchor (downward).** Decisions never close assumptions — they
change what's staked on them. A standing decision that carries a `Resolves
assumption` link to this record (`decision-guardrails.md §6`) has foreclosed
every path the question mattered on, so damage-if-false collapses: the seed
drops to **0** in the same gated write, Derived Impact pins to 0, and the
row goes moot (`registry-schema.md §Status & derived views`), with a dated
line in the *Scoring justification* recording the prior score and citing the
decision — so reversal can restore it (mootness dies with the decision,
`decision-guardrails.md §8`). If the chosen path still leans on the belief,
that's not a resolve at all — it's `Based on`, and the belief gains a
propagation node instead. An Impact-0 score justified only by a decision
that no longer stands is stale; audit flags it for a gated restore.

**Scoring justification carries three parts**, so the derived number stays
auditable: the hand-owned intrinsic reason ("scored 60: the GTM motion dies
if false"), the script-written propagation provenance ("Derived 82 = seed 60
+ pull from 6 dependents incl. the Q3 pricing decision"), and any dated
override/mootness lines.

**Risk (derived, never hand-written).**

```
Risk = Derived Impact × (1 − max(0, Confidence) / 100)
```

Risk ranges 0 to Derived Impact — never negative, never above Impact: a
belief the evidence is *against* routes to the kill review, not to more
testing budget. Moot → Derived Impact 0 → Risk 0, no special rule. Compute
at full precision and **sort on the unrounded value; display rounded**
(rounding before sorting manufactures ties). Risk is a two-term function of
Impact and Confidence only — effort/cost-to-test is a property of the test,
not the belief, and lives at the experiment-prioritisation layer
(`experiment-guardrails.md §2 Axis B`).

**Confidence is derived, not a score.** You move it by **logging evidence
readings**, never by typing a number. Signed, −100…100, 0 = no evidence: the
signed, strength-weighted average of the record's concluded readings with a
neutral prior (`w₀ = 100`) — full ruleset and the rung/magnitude/source
tables: `experiment-guardrails.md §2`, `docs/evidence-ladder.md`. It
asymptotes at ±99: an assumption is never validated, and "validated enough"
is a Risk judgment, not a Confidence number (`docs/validated.md`). The
**negative zone is the kill-o-meter**: evidence net-against lowers
Confidence — a re-test signal (Risk stays clamped), and at **≤ −50** audit
prompts a human-affirmed kill (never automatic).

**Volume lives in rung choice, not record count.** 100 people validating a
belief = one `Survey at scale` record, not 100 `Anecdotal` records — the
average is bounded by the strongest reading and same-source readings dedupe,
so weak records don't stack. Two filters before a signal counts at all: (a)
it must test *this* claim — evidence for a sibling or dependency doesn't
bear on this record (linkage is binary, one reading ↔ one belief); (b) a
*planned* test ("X wants a demo") isn't evidence yet — it's an experiment to
design.

**Always record the chosen Impact band + a one-line reason** in the body's
Scoring justification — so the number is auditable. A seed that contradicts
the record's own severity (e.g. "the thesis dies" scored 10) is a flag.

---

## 4. MECE — dedupe, atomicity, distinctness

- **Atomicity.** One assumption = one falsifiable claim. If the statement has
  "and"/"or"/";" joining separable claims, or needs two different metrics to
  disprove, **split it**.
- **Duplicate test (merge).** Two assumptions are duplicates if **the same
  pre-registered bar — the same reading — would resolve both**. Merge; keep
  the most specific wording. ("One experiment tests both" is *not* the
  test: one experiment legitimately bundles several distinct beliefs, each
  with its own bar — `experiment-guardrails.md §1b`.)
- **Distinctness test (keep).** They're distinct if their truth values are
  **independent** — one can be true while the other is false — i.e. each
  needs its own bar to fail independently. Distinct beliefs may still share
  a run.
- **Dependency ≠ duplicate.** "A builds on B" is a `Depends on` edge, not an
  overlap. Chains (need→feasibility, behaviour→why→threat) are kept, wired,
  not merged.
- **Contradictions.** Two flavours — the test that separates them is *"could
  one reading resolve both?"*
  - **(a) Direct contradiction (merge).** Two records asserting opposite
    truth values of the *same* proposition ("X IS a driver" / "X is NOT a
    driver") are **not two assumptions** — reconcile into **one**. The same
    bar resolves both, so this is a duplicate-by-negation: merge.
  - **(b) Tension (keep both, wire it).** Two *distinct, both-stated* claims
    that can't both hold in practice ("users want simplicity" / "users want
    deep customization") have **independent truth values resolved by
    different evidence** — they are genuinely two assumptions. **Keep both**,
    wire a **`Contradicts`** edge (set it both ways). The **Contradiction**
    check is a transient grill stage, not a stored tag (`OPS-1305`) — say
    which experiment will resolve the tension out loud in the grill session;
    there's no body to note it in, so the durable trail is whichever
    Experiment bar line eventually settles it, not a written provenance line.
    The bet is which one wins; evidence, not the grill, decides.
- **Enforcement (mandatory, not optional).** Before creating a record, search
  the register and surface the nearest 2–3 — every new stub runs the
  `Duplicate` check regardless of suspicion
  (`../assumptions/references/seed.md`), so this
  check always runs through single mode's dedup phase rather than being
  skipped when nothing looks like a duplicate. **This is a transient grill
  check, not a stored tag or body note** (`OPS-1305`): resolve it live —
  either merge (folding the redundant record's substance into the keeper), or
  confirm distinctness out loud by naming the concrete axis of difference
  (metric, lens, trigger, actor). A boundary statement that doesn't name a
  concrete axis doesn't satisfy this — but nothing about it gets written to
  the record either way.

---

## 5. Graph health (comprehensiveness — no gaps)

- **Closure.** Every node in every why-trace chain (§2) exists as a record.
- **Root check.** Every chain bottoms out in an **independently-testable
  root** (not an externality or blame). Identify the most-depended-on roots —
  they deserve the most test attention.
- **Orphan check.** A record with no `Depends on` **and** no `Enables` is
  isolated — flag it ("does this connect to the thesis at all?"). A large
  orphan share means whole dimensions float free of the spine.
- **Contradiction sweep.** Scan for pairs in tension (semantic / pairwise).
  An unexamined or unwired contradicting pair is a finding — wire
  `Contradicts` both ways. An *open* `Contradicts` edge is legitimate, not an
  error: it marks a real bet to be settled by evidence, chased by the audit's
  `contradiction-unwired` check (`ontology.yaml`) until an experiment bar
  line or decision names the resolving test — there is no stored tag or
  provenance line, only the relation and the eventual resolver. A direct
  contradiction (negation, §4a) left as two records is always a defect —
  merge it.

---

## 6. Guardrail summary (reject a candidate that fails any)

Atomic · Falsifiable (disproof stated, though not stored — §1) · Plain (no
hyperbole) · why-trace done + therefore-test passes (§2) · Scored against
bands with justification · Not a duplicate (or merged) · No unreconciled
contradiction (negation merged; tension wired via `Contradicts`) · Single
Lens · Themed · Related (`Depends on` / `Enables`) or consciously a root.
