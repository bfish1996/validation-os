# Rubric — four dimensions, 0–4, quote-backed

Score each of your evaluable **moments** on the four dimensions. The
machine-readable shadow of this file is `evals.json` — anchors, rules, and
report shape live there too; **change both in the same commit** (same
invariant as `registry-schema.md` ↔ `ontology.yaml`). All register reads
are through the active connector, **read-only**.

## Global rules

- **No quote, no score.** Every score cites ≥1 verbatim transcript quote
  with timestamp. Nothing quotable → `n/a — insufficient signal`, never a
  guessed number. Exception for clean D1 scores (3–4): absence of
  contradiction is proven by the register check plus the moment's framing
  quotes.
- **Fairness pass.** Before finalizing, run a skeptic over every 0–1 (the
  skeptic pass from `../../_shared/desk-research-rubric.md §5`, aimed
  inward): was that decision actually Active at the moment's date? Is the
  "claim asserted as fact" actually a Validated assumption? Does the quote
  carry the reading? A refutation that stands raises the score.
- **Attribution.** Diarization check per
  `../../_shared/decision-guardrails.md §3` per transcript. `Uncertain` →
  note it on every finding and soften the Read — flag, don't convict.

## Tone — the Read

Blunt, private, addressed to you ("you re-litigated…"). Verdict first, then
evidence. Every negative claim tied to a quote or a record ID. Name whether
it's a **pattern** (≥2 runs) or an **incident** (this run only).

## Improve next

Close every run with at most **3 concrete, checkable actions**, drawn from
the dimensions scored ≤2 — phrased for the next conversation ("name the
DEC-### before proposing anything near it", "state the kill bar out loud
before the ask"). Highest-leverage first; an action repeats across runs
until the dimension moves.

## D1 — Decision fidelity

*Do you honor settled decisions, or re-litigate them without new evidence?*

Reads: decisions register — fetch unfiltered and check `Type` before
splitting (the `untyped-record` rule, `../../_shared/ontology.yaml`), then
`Type = Decision`, `Status = Active`, scoped to the moment's `Area`
(`../../_shared/decision-guardrails.md §7`). Per matched decision read
`Reversibility` (§8), `Agreed by`, `Decided date`.

- **0** — Evidence-free re-litigation of an Active **one-way door**; being
  in that decision's `Agreed by` keeps it at 0 even with hedges.
- **1** — Evidence-free re-litigation of an Active decision (two-way door,
  or you weren't a party to it).
- **2** — The moment overlaps a settled decision's ground and ignores it —
  not contradicted, just unacknowledged.
- **3** — Respects settled decisions and acknowledges the directly
  relevant Active ones — including reopening a **one-way door** with
  genuine new evidence, the DEC-### named and the irreversibility
  acknowledged (legitimate, but the burden is heavier than a two-way
  reopen).
- **4** — No directly relevant settled decision is touched, **or** you
  explicitly reopen a **two-way door** citing the DEC-### and the new
  evidence that changes it. Reopening well is the system working — it
  scores top, by design.

## D2 — Assumption transparency

*Are your load-bearing claims named as assumptions, or asserted as facts?*

Reads: assumptions register (Title, Description, Status, Confidence).
Identify the moment's load-bearing claims — the ones that, if wrong, change
what the team does. A claim asserted flatly is penalty-free only when a
matching register record is Validated/high-Confidence or it's ground truth.

- **0** — Load-bearing untested claims asserted as facts.
- **1** — Claims hedged ("I think", "probably") but never named as
  assumptions.
- **2** — Some claims flagged as assumptions; none mapped to the register
  or proposed as new records.
- **3** — Load-bearing claims explicitly flagged; the key ones mapped to
  ASM-### or proposed as new.
- **4** — Every load-bearing claim either evidence-backed (says what
  evidence) or named as an assumption with an honest confidence read,
  mapped or proposed for the register.

## D3 — Experiment-first thinking

*Do you propose the cheapest honest test before asking for commitment?*

Reads: the evidence ladder — `../../_shared/ontology.yaml
vocabularies.experiment_type` — and the cheapest-falsifying-test discipline
in `../../_shared/experiment-guardrails.md`.

Scored fully on `pitch` moments (there's an ask). On `claims` moments with
no ask, `n/a` is the honest default — and a test you volunteered anyway is
recorded as a **credit note** beside the `n/a`.

- **0** — Asks for full commitment with no test; opinion treated as
  sufficient.
- **1** — Gestures at "we should validate" with no concrete test or bar.
- **2** — Proposes a test, but an expensive high-rung one where a cheaper
  rung could honestly falsify ("build it and see" where a fake door would
  do).
- **3** — Proposes a concrete falsifiable test at a sensible rung before
  the ask.
- **4** — Proposes the *cheapest* rung that can honestly move the belief,
  states a pass/kill bar (even informally), and stakes the ask on the
  outcome.

## D4 — Language concreteness

*Concrete and canonical, or abstract and undefined?*

Reads: the terminology check in `../../_shared/ubiquitous-language.md`,
audience `Internal` — count a hit only when the usage actually conflicts
with the `Avoid` bullet's rationale, not on any occurrence of the banned
string — plus an abstraction scan: load-bearing nouns with no glossary
record and no in-moment definition, weighed by the weight they carry.

- **0** — Built on undefined abstractions ("platform play", "synergy")
  and/or genuine banned-phrasing misuse.
- **1** — Mostly abstract; few numbers or named specifics; term misuse.
- **2** — Core claim concrete, supporting argument abstract, or several
  load-bearing unknown terms.
- **3** — Concrete (numbers, named customers, specific behaviours);
  canonical terms used correctly.
- **4** — Concrete throughout; every abstraction glossary-backed or
  defined in the moment itself.
