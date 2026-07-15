# Shared helper — assumption guardrails

The canonical rules every assumption must satisfy. Cited by `/assumptions`
(the inline gauntlet) **and** by its audit path, so build and audit judge by
the same standard. When this changes, both paths change.

The schema (field map, status & derived views) lives in
`registry-schema.md`; this file is the operational ruleset.

---

## 1. Define — the 4-step framework

1. **Explicit.** Write it down as one sentence in the Description:
   `We assume [target user/system] will [behavior/action] because [reason]`.
   The title is a short handle, not the sentence.
2. **Falsifiable.** State what evidence would prove it wrong. If nothing
   could disprove it, it's a belief/philosophy, not an assumption — reject
   it. Watch for: vague qualifiers ("meaningfully", "materially", "many",
   "better"), absolutes ("always", "only", "nothing else"), and placeholders
   ("benefits exist though unclear what they are"). Each needs an observable
   threshold.
3. **Assess risk.** Score **Impact** (§3) — the only hand-scored number; Risk
   derives via Confidence (an evidence rollup). Focus energy on high-Risk.
4. **Metric for truth.** State the evidence that would turn it into a fact
   ("≥N of M institutions sign", "≥X% of users do Y"). This is the
   falsifiability statement; it later seeds an Experiment's `We're right if`.

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

## 2. Five Whys (mandatory, every assumption)

Disciplined root-cause trace down to the foundational assumption. Without
discipline it becomes a rabbit hole — so constrain both questions and answers.

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

**Closure — tagging-only (this is also the gap-finder).** Every "why" answer
is **either an existing assumption or a ground truth.** An *assumption*
answer is stated as an **inline reference to an existing register record**
(a page mention in Notion, an `ASM-###` link in local files), never as free
prose — the body carries only the connective logic ("→ because…") and the
therefore-test, while the *substance* lives in the referenced record. A
**✅ ground truth** (a verified fact, settled reality, or accepted
externality — not a bet) is **not** a register record, gets no reference, is
marked inline with a ✅, and **terminates the branch — no further why.** This
makes the register self-completing down each branch.

- **Dedupe before you tag.** Search the register first and reuse the record
  that already says it. Create a new record only if none exists — and a
  near-duplicate step is merged into its neighbour, not given its own record.
- **Body tags and relations must agree.** A node referenced in the body must
  also be wired via `Depends on`. Relations alone do **not** satisfy closure —
  the body must carry the references too; a prose paraphrase is a gap.

**Depth is per-chain, not per-record.** The "5 Whys" is the trace from *this*
parent down its `Depends on` edges — depth accrues across records, so a
record never re-runs a fresh five. **"Five" is a name, not a target** — never
pad a chain to hit a count.

**Stop a branch at the FIRST of these (whichever comes soonest):**

1. **It converges** — the next "why" is an assumption you already have a
   record for. Tag the existing record and stop. (This is the *ideal* close.)
2. **It hits a ✅ ground truth** — a settled fact, verified reality, or
   accepted externality (not a bet). No record, mark ✅ inline, stop.
3. **It stops being load-bearing** — apply the test: *if this next answer
   turned out false, would it change the bet we're making or the experiment
   we'd run?* If no, you've already gone one layer too deep. Mark the parent
   **root** and stop.

**Soft ceiling — the rabbit-hole tripwire.** In practice a chain hits one of
the three stops within **~3 new whys**. If you're at three *new* whys and
still inventing novel, increasingly abstract answers (no convergence, no
ground truth), that is the signal you've left the load-bearing zone — usually
because the chain has slid from a fact about *your users/market/product* into
a *general law of human behaviour or economics*. Stop, mark the deepest
decision-relevant node root, don't keep going to feel thorough. (Not a hard
truncation: a genuine 4th or 5th load-bearing layer is fine — the ceiling is
a prompt to re-check, not a cap.)

- A **leaf/root** node (the bottom of its chain) does not start its own new 5
  Whys — its `5 Whys` gap is satisfied by being terminal. Mark it root; don't
  manufacture deeper whys. Every branch ends at one of: a foundational/root
  **assumption** (terminal — don't restart) or a **✅ ground truth**.
- **Convergence is the goal.** The best close is the chain **looping back
  onto a record that already exists** (often one already in another branch):
  foundational assumptions are *shared*, so the graph converges into a DAG
  with common roots instead of exploding into duplicates. If following the
  chain would create a true `Depends on` cycle (A→…→A), the two nodes are the
  same assumption — **merge**, don't wire the loop.

---

## 3. Scoring — anchored bands

**Impact (0–100) — if false, how much of the proposed *solution* breaks?**
The direction itself is a given — it is not under test; a top-band failure
means *rethink the solution*, not *abandon the direction*. Impact is
damage-if-false, not likelihood.

- **90–100** — back to the drawing board on the solution (the core solution
  thesis doesn't hold).
- **60–80** — a core pillar of the solution (a lens / GTM motion) dies,
  direction survives.
- **30–50** — a major branch needs rework, recoverable.
- **10–20** — minor, adjust & move on.

**Goal anchor.** If a standing (`Draft` or `Active`) Goal record links this
assumption via `Based on assumption`, named in the goal's rationale
(`../../docs/goals.md`) — score `Impact` toward the top of its band: a belief
a company target depends on matters more. This is a **prompt to the human
scorer, not a formula** — Impact stays the one hand-scored number, and a goal
link never touches Confidence or the Risk formula. Cite the goal in the
*Scoring justification*. The check runs **both ways**: a goal-linked record
scored low needs a justification, and a top-band score justified *only* by a
goal that is no longer standing is stale — audit flags both.

**The Impact anchor is all a goal link does.** It is not a queue condition:
every `Live` row is eligible for the test-next queue on its own merits,
linked or not (`registry-schema.md §Status & derived views`). A
fully-grilled, unlinked row is queued like any other — the anchor changes
where it ranks, never whether it competes.

**Dependency anchor.** Before finalizing the score, glance at the record's
`Enables` relation — the set of other records that name *this* one in their
`Depends on`. The more records depend on this one, the more of the register's
chains break if it turns out false, so score `Impact` toward the top of its
matched band the more load-bearing the record is. Also a **prompt, not a
formula** — dependent count is eyeballed, never counted by a field. Cite it
in the *Scoring justification* (e.g. "6 downstream records depend on this;
scored 85 within the 60–80 band"). **Being a root is not itself a signal** —
a record with no outgoing `Depends on` (it bottoms out a 5-Whys chain, §2) is
normal; don't inflate Impact just because a record has nothing further to
trace. Only a high *incoming* `Enables` count moves the score.

**Decision anchor (downward).** The goal anchor's mirror: decisions never
close assumptions — they change what's staked on them. A standing
(`Provisional`/`Active`) decision that carries a `Resolves assumption` link
to this record (`decision-guardrails.md §6`) has foreclosed every path the
question mattered on, so damage-if-false collapses: Impact drops to **0**
in the same gated write and the row goes moot (`registry-schema.md §Status
& derived views`), with a dated line in the *Scoring justification*
recording the prior score and citing the decision — so reversal can restore
it (mootness dies with the decision, `decision-guardrails.md §8`). If the
chosen path still leans on the belief, that's not a resolve at all — it's
`Based on`, and the score stays where the bands put it. Never a Confidence
input: deciding is not evidence. The staleness check mirrors the goal
anchor's — an Impact-0 score justified only by a decision that no longer
stands is stale; audit flags it for a gated restore.

**Impact is the only hand-scored number.**
`Risk = Impact × (1 − Confidence/100)` (derived, never hand-written) ranges
0–100; highest Risk is tested next.

**Confidence is derived, not a score.** It comes from the record's linked
Experiments (evidence) — you raise it by **logging evidence records**, never
by typing a number. It caps at 99: an assumption is never validated, and
"validated enough" is a Risk judgment, not a Confidence number
(`docs/validated.md`). So the less accumulated evidence a record has, the higher
its Risk, automatically. Confidence is a function of **three axes** (full
ruleset: `experiment-guardrails.md §2`):

- **Rung** — the evidence `Type` on the say < do < commit ladder. The
  dominant dial: the rollup takes the `max` proven rung, so 🟢 Revealed beats
  any pile of 🔴 Stated.
- **Source quality** — a within-rung High/Medium/Low weight for the source's
  seniority / authority / ICP-fit. Positions a record inside its rung, never
  across.
- **Corroboration** — a **bounded bump** when ≥K independent proven records
  agree at the top proven rung (tracked in `Corroboration count`), capped
  below the next rung's floor. Replication earns a little; it can't
  manufacture a higher rung.

**Volume lives in rung choice, not record count.** 100 people validating a
belief = one `Survey at scale` record, not 100 `Anecdotal` records — because
the rollup is a `max`, extra weak records don't stack. Two filters before a
signal counts at all: (a) it must test *this* claim — evidence for a sibling
or dependency doesn't bear on this record; (b) a *planned* test ("X wants a
demo") isn't evidence yet — it's an experiment to design.

**Always record the chosen Impact band + a one-line reason** in the body's
Scoring justification — so the number is auditable. A score that contradicts
the dependency graph (e.g. a load-bearing root scored Impact 10) is a flag.

---

## 4. MECE — dedupe, atomicity, distinctness

- **Atomicity.** One assumption = one falsifiable claim. If the statement has
  "and"/"or"/";" joining separable claims, or needs two different metrics to
  disprove, **split it**.
- **Duplicate test (merge).** Two assumptions are duplicates if **one single
  experiment would validate/invalidate both**. Merge; keep the most specific
  wording.
- **Distinctness test (keep).** They're distinct if their truth values are
  **independent** — one can be true while the other is false.
- **Dependency ≠ duplicate.** "A builds on B" is a `Depends on` edge, not an
  overlap. Chains (need→feasibility, behaviour→why→threat) are kept, wired,
  not merged.
- **Contradictions.** Two flavours — the test that separates them is *"could
  one experiment's result speak to both?"*
  - **(a) Direct contradiction (merge).** Two records asserting opposite
    truth values of the *same* proposition ("X IS a driver" / "X is NOT a
    driver") are **not two assumptions** — reconcile into **one**. The same
    experiment resolves both, so this is a duplicate-by-negation: merge.
  - **(b) Tension (keep both, wire it).** Two *distinct, both-stated* claims
    that can't both hold in practice ("users want simplicity" / "users want
    deep customization") have **independent truth values resolved by
    different evidence** — they are genuinely two assumptions. **Keep both**,
    wire a **`Contradicts`** edge (set it both ways), tag both with the
    **`Contradiction`** gap, and note the resolving experiment in the body's
    `## Provenance & notes`. The bet is which one wins; evidence, not the
    grill, decides.
- **Enforcement (mandatory, not optional).** Before creating a record, search
  the register and surface the nearest 2–3 — every new stub sets the
  `Duplicate` gap regardless of suspicion
  (`../assumptions/references/seed.md`), so this
  check always runs through single mode's dedup phase rather than being
  skipped when nothing looks like a duplicate. The outcome must be recorded
  in the body's `## Provenance & notes`: either merge (naming the redundant
  dimension in the keeper's notes), or a line of the form
  `Distinct from <record> because: <dimension>` — a boundary statement that
  doesn't name a concrete axis of difference (metric, lens, trigger, actor)
  doesn't satisfy this.

---

## 5. Graph health (comprehensiveness — no gaps)

- **Closure.** Every node in every 5-Whys chain exists as a record.
- **Root check.** Every chain bottoms out in an **independently-testable
  root** (not an externality or blame). Identify the most-depended-on roots —
  they deserve the most test attention.
- **Orphan check.** A record with no `Depends on` **and** no `Enables` is
  isolated — flag it ("does this connect to the thesis at all?"). A large
  orphan share means whole dimensions float free of the spine.
- **Contradiction sweep.** Scan for pairs in tension (semantic / pairwise).
  An unexamined or unwired contradicting pair is a **gap** — tag both
  `Contradiction` and wire `Contradicts`. An *open* `Contradicts` edge is
  legitimate, not an error: it marks a real bet to be settled by evidence —
  but it must carry the tag + a provenance line naming the experiment that
  resolves it. A direct contradiction (negation, §4a) left as two records is
  always a defect — merge it.

---

## 6. Guardrail summary (reject a candidate that fails any)

Atomic · Falsifiable (disproof stated) · Plain (no hyperbole) · 5 Whys done +
therefore-test passes · Scored against bands with justification · Not a
duplicate (or merged) · No unreconciled contradiction (negation merged;
tension wired via `Contradicts` + tagged + noted) · Single Lens · Themed ·
Related (`Depends on` / `Enables`) or consciously a root.
