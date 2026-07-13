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

- **There is no "fully validated."** Confidence tops out at 99
  (`evidence-ladder.md`) by design: even paying customers are evidence
  about the users you tested, in the market as it was. No pile of evidence
  turns a bet about the future into a certainty.
- **A claim that *is* certain isn't an assumption.** Settled facts are
  ✅ ground truths — they live outside the register and terminate 5-Whys
  branches (`assumption-guardrails.md §2`). Graduating out of the register
  is the only "full" validation, and it means the question stopped being a
  bet (the regulation passed; the contract is signed), not that testing
  finished.
- **Assumption-level "validated" therefore always carries a rung.** Say
  "validated at Signed intent, Confidence 60", never "validated" as if it
  were done. The `Validated` status is a snapshot — *the strongest
  concluded evidence currently supports this belief* — a resting state,
  not a terminal one.

## "Validated enough" is a Risk judgment, not a Confidence number

There is no global Confidence threshold above which an assumption counts
as validated. The stopping rule is **Risk**:

```
Risk = Impact × (1 − Confidence/100)
```

You stop testing a belief when its Risk falls below the working threshold
— not when Confidence crosses a magic number. Because Impact varies, the
same evidence can be plenty for a minor belief and dangerously thin for
one a one-way-door decision rests on. Attention is governed by the Risk
ranking, not by status: the register's job is to keep every belief's score
current and keep you working above the threshold, not to march every row
to a finish line. Where the threshold sits is a prioritisation rule, not a
property of the record.

## What sends a validated assumption back into play

Re-testing is **event-driven** — there is no decay formula. A validated
assumption re-enters the queue when its Risk crosses back above the
threshold, which happens when:

- **New evidence lands against it** — a concluded experiment at an equal
  or stronger rung contradicts the standing verdict.
- **Impact rises** — a new goal or decision leans on it, or new dependents
  accrue in the graph, so the old Confidence no longer covers the new
  stakes.
- **A resolving decision is reversed** — mootness dies with the decision
  (`decision-guardrails.md §8`).
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
- `Validated` (Status) means *currently supported by our strongest
  concluded evidence* — still a bet, still revisable.

Glossary entry: `registry/terminology.md §TERM-002`.
