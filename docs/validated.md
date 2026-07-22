# What "validated" means

"Validated" is used at two levels. Conflating them is how a team ends up
believing a bet is a fact.

## An experiment is validated — binary, and stays that way

A concluded experiment is **Validated** when a human renders that verdict
against the pre-registered `We're right if` bar (`experiment-guardrails.md
§4`). Because the bar was fixed before the run, the verdict can honestly be
binary. It is also a historical fact: *this test, on this population, at
this date, cleared its bar* — that never changes, and the record is never
edited retroactively. What can change is how much that fact is worth today.

## An assumption is validated — provisional, and never fully

An assumption is a bet about the world, and the world moves. So:

- **There is no "fully validated."** Confidence asymptotes at ±99
  (`evidence-ladder.md`) by design: even paying customers are evidence
  about the users you tested, in the market as it was. No pile of evidence
  turns a bet about the future into a certainty — and a single reading,
  however strong, lands only near half its rung; the ceiling takes a
  series.
- **A claim that *is* certain isn't an assumption.** Settled facts are
  ✅ ground truths — they live outside the register and terminate the
  `Depends on` why-cascade (`assumption-guardrails.md §2`). Graduating out
  of the register
  is the only "full" validation, and it means the question stopped being a
  bet (the regulation passed; the contract is signed), not that testing
  finished.
- **Assumption-level "validated" therefore always carries a rung.** Say
  "validated at Commitment, Confidence +42", never "validated" as if it
  were done. It is prose shorthand, nothing more.

## The asymmetry: you can invalidate, you can never validate

Evidence can conclusively refute a general claim; it can only ever
*support* one. The register makes that asymmetry structural: `Invalidated`
exists as a stored state — the rare, human-affirmed kill — and `Validated`
does not exist as a state at all. Evidence-against is a **score
decrement**: it lowers signed Confidence, which raises Risk — a re-test
signal, never a closure. The kill route runs through the score's negative
zone: Confidence sinking to −50 raises an audit prompt for a **human** kill
verdict — nothing flips automatically. Reaching it always takes real
evidence mass, never one reading in isolation (`evidence-ladder.md`), though
how much depends on the belief's Assumption Type: for a type whose ceiling
rung is Market/Operational (the Viability types, `ItWorks`) it takes a
series of missed committed-plan readings; for a type whose ceiling rung is
itself a Testing rung (e.g. `ProblemExists` via `Talk`) a short, strongly
disconfirming run can get there. An assumption's `Status` is only ever
`Draft` (still being built, `Completeness %` < 100), `Live` (ranked by Risk,
forever), or `Invalidated` (`registry-schema.md §Status & derived views`).
Validation is nothing but Confidence rising and Risk falling; "what we
currently know" is the derived proven-set view (`Live` + strongest
concluded experiment `Validated`), a filter you compute, not a state you
grant.

## "Graduated" is a Confidence-vs-Impact judgment, not a status

There is no global Confidence threshold above which an assumption counts
as validated. The stopping rule is the impact-scaled **graduation bar**
(`packages/core/src/derivation/graduation.ts`, the confidence-scoring
simplification — this replaced the old Stage-keyed Risk threshold):

```
graduationBar(derivedImpact) = min(40 + 0.5 × derivedImpact, 90)
```

Bigger bets (higher Derived Impact) need more proof before "done" — the
same evidence can be plenty for a minor belief and dangerously thin for one
a one-way-door decision rests on. An assumption progresses through a
derived, ever-recomputed state:

- **Untested** — no concluded reading with non-zero strength yet.
- **Signal** — some concluded evidence below the bar, positive or negative.
- **Graduated** — Confidence ≥ the bar for its current Derived Impact.

State recomputes on every write — a disconfirming reading can move an
assumption backwards, `Graduated → Signal`, on the very next recompute.
Graduation never flips `Status`: `Live` assumptions stay `Live` and ranked
forever regardless of where their Graduation state sits.

**Risk still governs attention, not "done"-ness:**

```
Risk = Derived Impact × (1 − max(0, Confidence)/100)
```

(The clamp is deliberate: a belief the evidence is *against* already sits
at full Risk for its Derived Impact — the negative zone routes to the kill
review, not to more testing budget.) Risk ranks the test-next queue —
cheapest honest test of the riskiest belief on top — while Graduation
answers a different question: has *this* belief earned enough proof for
its stakes. Both read the same two derived numbers (Confidence, Derived
Impact); neither is a property you set, and the register's job is keeping
both current, not marching every row to a finish line.

A minor belief (Derived Impact 20, bar ≈ 50) graduates on a modest reading;
a load-bearing belief a one-way-door decision rests on (Derived Impact 100,
bar = 90) needs a near-ceiling series first. There's no discrete
stage/threshold table any more — the bar is continuous in Derived Impact
(`evidence-ladder.md`).

## What puts a supported belief back in the queue

Nothing needs "reopening", because nothing closed: a `Live` row is ranked
forever, and re-testing is **event-driven** — there is no decay formula.
The row re-enters the queue when its Risk crosses back above the
threshold, which happens when:

- **New evidence lands against it** — a concluded negative reading lowers
  the signed Confidence, raising Risk in the same recompute.
- **Impact rises** — a new decision leans on it, or new dependents
  accrue in the graph, lifting its Derived Impact at the next propagation
  run, so the old Confidence no longer covers the new stakes.
- **A resolving decision is reversed** — its Impact is restored and
  mootness dies with the decision (`decision-guardrails.md §8`).
- **The evidence goes stale** — audit flags that the market, users, or
  product the evidence describes have since changed; a human re-renders
  the call. Staleness is a prompt to a person, never an auto-downgrade.

## What is permanent

Only two exits close the question:

- **True invalidation** — a conclusive kill. The rare, real closure.
- **Graduation to ✅ ground truth** — the claim stopped being a bet and
  leaves the register.

Validation is never closure: a validated assumption is an open question
whose price you've temporarily bought down. And a decision never validates
anything — a business call can retire a question or change what's staked
on it, but only evidence moves Confidence.

## Say / don't say

- Say **"validated at \<rung\>"** or give the Confidence number.
- Don't say **"fully validated"**, **"proven"** (of an assumption —
  records are proven, beliefs aren't), **"de-risked"**, or **"done"**.
- Don't write `Validated` into an assumption's `Status` — the value does
  not exist. The proven set is a filtered view, not a state.

Glossary entry: `registry/terminology.md §TERM-002`.
