# Shared reference — Registry schema

The single source of truth for **what the registry's fields mean**. Cited by
every mode of `/assumptions` and by `/experiment-design`, `/find-evidence`,
`/goals`, `/meeting-prep`, and `/decisions`. When a field rule changes, change
it here — not in a skill body.

**Machine-readable companion: `ontology.yaml`** (same directory) — the
checkable form of this file: canonical select-option lists, relation
direction/cardinality, status-transition tables, derivation formulas, and the
cross-register integrity rules the audit modes run. Prose here explains
meaning; validators and audits check against the YAML. The two must never
disagree — change them in the same commit.

**Where the registry lives** is the connector's job, not this file's. Read
`validation-os.config.yaml` (walk up from the working directory; absent =
local-files defaults) and follow the matching doc in `connectors/` for how to
read and write records — the backends are local Markdown, SQL, and NoSQL. This
file defines the fields those records carry, whatever the backend.

## The six registers

- **Assumptions** — every belief the business depends on, as a falsifiable
  sentence, scored and ranked by Risk. Built by `/assumptions`.
- **Experiments** — one row per designed test **plan**. Groups one-or-more
  beliefs through per-belief **bar lines** (composed in, not a register).
  Carries no evidence value itself. Created by `/experiment-design`, closed by
  the humans running the test.
- **Readings** — one row per **artifact × belief**: the atomic unit Confidence
  reads. Born from an Experiment run, a Goal close, or found bare. Logged by
  `/find-evidence` and the humans concluding a test.
- **Goals** — one row per pre-registered commitment: the Goals-side evidence
  **container** (two bars, a deadline, an instrument), closing into per-belief
  Readings. Operated by `/goals`.
- **Decisions** — the decision log. Owned by `/decisions`. Goals are **not**
  decisions — a goal is a Goal record (`decision-guardrails.md §9`).
- **Glossary** — the shared glossary (the *ubiquitous-language* discipline;
  only the register is named "Glossary"). Owned by `/decisions`; enforcement
  rules in `ubiquitous-language.md`.

> ⚠️ **Always query the full register, never a filtered view or subset.**
> Auditing or looping a filtered slice silently skips rows.

## Field map — Assumptions

| Field | Type | Rule |
|---|---|---|
| Title | title | Short handle, plain. Not the full sentence. |
| Description | text | One-sentence falsifiable statement: `We assume [user/system] will [behavior] because [reason]`. Plain, no hyperbole. |
| Lens | select | The one audience whose decision this drives. **Single** — spans two → it's two assumptions; split. Define your own lens list in setup (example set: Commercial / Consumer / Investor). |
| Theme | multi-select | Topic; orthogonal to Lens. Example set: Go-to-market, Product, UX, Business model, Technology, Regulatory, Market & competition, Trust & data. |
| Impact | number 0–100 | **The intrinsic seed — the only hand-scored number.** Pure severity-if-false on anchored bands; never folds in dependents, goals, or decisions — the seed is purely intrinsic. `assumption-guardrails.md §3`. |
| Derived Impact | derived | **Never hand-write.** = seed + (100 − seed) × S/(S + 100), where S sums the dependents' pull (dependent assumptions' Derived Impact + 100 per standing decision `Based on` node; a goal never contributes). **Recomputed on every touching write** alongside Confidence and Risk — no deliberate staleness (`OPS-1251`); the batch pass is only a backstop for writes that bypass the dashboard. `assumption-guardrails.md §3`. |
| Risk | derived | **Never hand-write.** = Derived Impact × (1 − max(0, Confidence)/100), ranges 0 to Derived Impact. Full-precision sort, rounded display. |
| Confidence | derived | **Never hand-type.** Signed −100…100, 0 = no evidence: strength-weighted average of concluded linked **Readings** with neutral prior w₀ = 100, deduped by source. ≤ −50 = the kill zone (human review prompt). Full rule: `experiment-guardrails.md §2`. |
| Status | select | The **lifecycle** and nothing else: `Draft` (Gaps non-empty — record not yet trustworthy) → `Live` (the default forever-state, ranked by Risk) → `Invalidated` (rare, human-gated kill). There is **no `Validated`** — `docs/validated.md`. Testing, queue membership, goal linkage, mootness: derived views, §Status & derived views. |
| Owner | person | Who voiced / champions the belief and is accountable for testing it. |
| Gaps | multi-select | What's missing/wrong — the **judgment-type** findings only: `Non-atomic`, `Unfalsifiable`, `Hyperbole`, `Lens check`, `Duplicate`, `Contradiction`, `Human review`. **Drives the grill queues.** Empty Gaps = semantically guardrail-complete (presence of `5 Whys` / `Metric for truth` / `Scoring justification` is a separate structural check, below). `Human review` is the machine-grill sign-off gap: batch modes set it on every row they auto-grill and never clear it; only a gated session with the row's Owner clears it. |
| 5 Whys | text | **First-class presence-gap field** (promoted from a body section, `OPS-1273`). The root-cause chain behind the belief. Its **presence** (non-empty) is a structural, blocking check — required to move to `Live`, the presence half of the Draft→Live gaps invariant (`OPS-1251`). May be empty while `Draft`. |
| Metric for truth | text | **First-class presence-gap field.** The number/observation that would settle the belief. Presence required to go `Live` (structural check). |
| Scoring justification | text | **First-class presence-gap field.** Why the seed `Impact` was scored as it was, incl. dated moot lines when a decision `Resolves` the belief (`decision-guardrails.md §8`). Presence required to go `Live` (structural check). |
| Depends on / Enables | self-relation | The dependency graph. Relationships live HERE, not in the body. |
| Contradicts | self-relation | Links two rows in **tension** (distinct claims that can't both hold). Set it on **both** rows; pairs with the `Contradiction` gap and a provenance note. Not for negation-duplicates — those merge (`assumption-guardrails.md §4`). |
| Readings | relation | The concluded Readings scored against this belief — **every Confidence input**, whatever its origin (experiment run, goal close, or bare). Inverse of the Reading's `Assumption` link. **Replaces the old `Experiments` relation** — the assumption never links an Experiment directly. |

There is **no stored `Experiments` relation** on the assumption. *Which
experiments test this belief* is a **derived view over the Experiments'
bar-lines** (each bar-line names one assumption) — computed for the `Testing`
view / test-next surface, never stored (§Status & derived views).

There is **no separate Goals field**: an assumption is *goal-linked* when a
standing (`Draft` or `Active`) Goal record links it via `Based on
assumption` — the linkage is that relation read backwards, computed, never
stored. It is a **per-goal queue view** ("what does this goal rest on?") and
nothing more — **never an Impact anchor** (a goal never enters the Derived
Impact propagation and never touches the seed — `assumption-guardrails.md
§3`), **never a Confidence input**, and **never a condition of queue
membership**: every `Live` row is queue-eligible on its own merits, linked
or not (§Status & derived views, `docs/goals.md`). A `Draft` goal counts,
not only `Active`, so a goal's own beliefs can be tested before it commits.

`5 Whys`, `Metric for truth`, and `Scoring justification` are **first-class
fields** (above), not body sections — so their presence is a cheap structural
check rather than markdown the audit has to parse (`OPS-1273`). Record
**body** now holds only `## Provenance & notes` (per-row caveats, merge/dedup
outcomes, source provenance).

## Status & derived views — Assumptions (canonical; every skill enforces the same triggers)

`Status` stores the record's **lifecycle** and nothing else — three values.
An assumption is never validated (`docs/validated.md`): its standing is its
live Risk score, so every workflow state the old kanban would store is a
**derived view**, computed from the row's data, never written.

```
Draft ──(grill close-out: the last Gaps tag──▶ Live ──(evidence net-against — Confidence
  ▲      clears, gated session)                │  ▲     in the kill zone (≤ −50) — and a
  │                                            │  │     human affirms)──▶ Invalidated
  └──(a new gap lands: audit finding, ─────────┘  │                             │
      contradiction, staleness flag)              └──(gated reopen: kill re-judged
                                                      flawed, or world changed)◀┘
```

- **`Draft`** — has open work, always (`draft-live-gaps-invariant`): a
  non-empty `Gaps`, **and/or** an empty presence field (`5 Whys` /
  `Metric for truth` / `Scoring justification`). The record isn't trustworthy
  yet — its Impact and Metric for truth are unproofed — so it is neither
  ranked nor queued. Seed default. Batch/loop modes tag `Human review`, which
  keeps (or returns) the row here; only a gated session with the Owner
  promotes it (`Gaps` cleared **and** all presence fields present).
- **`Live`** — the default forever-state. Ranked by Risk continuously; never
  "done". Evidence, Impact changes, and goal links move its Risk and its
  derived views — never its Status.
- **`Invalidated`** — the rare, real closure: the evidence has turned
  decisively against the belief (signed Confidence in the kill zone, ≤ −50 —
  only a series of missed Goal-rung readings can get there), and a human
  affirmed the kill. The crossing raises an audit prompt; it never
  auto-flips. Reopens to `Live` only by human re-verdict (the killing
  evidence was flawed, or the world changed).

**Derived views (compute them; never write them):**

| View | Definition |
|---|---|
| Goal-linked | a standing (`Draft`/`Active`) Goal record links the row via `Based on assumption`. A per-goal queue **view** only — never an Impact anchor or a membership condition (`docs/goals.md`) |
| Testing | `Live` + a linked Experiment (plan) whose bar-line on this belief is still open (Experiment `Status: Running`) |
| Experiments testing me | the Experiments whose bar-lines name this belief — a view over bar-lines, not a stored relation. Feeds `Testing` and the test-next surface |
| Test-next surface | **experiments, not assumptions** (there is no Risk-ranked belief queue): candidate/designed experiments on `Live` rows, ranked by `Feasibility` × the linked assumption's Risk, **goal-agnostic**. The exact ruleset, tie-breaks (most-negative signed Confidence first), and top-N cut are the experiment-prioritisation layer's |
| Kill lane | `Live` + Confidence ≤ −50 — surfaced by audit for a human kill verdict, out of the test-next surface |
| Proven set | `Live` + strongest (largest `\|Strength\|`) concluded Reading `Validated` — "what we currently know"; provisional, always |
| Moot | seed Impact = 0 via a standing decision's `Resolves assumption` action; Derived Impact pins to 0 |

- **Evidence never flips Status.** A validating verdict raises Confidence
  (lowering Risk); an invalidating one lowers it (raising Risk — a re-test
  signal, and past −50 a kill prompt), nothing else. Only a human-affirmed
  kill flips `Live → Invalidated`. An `Inconclusive` Reading contributes
  nothing and leaves the row exactly where it was.
- **Goal linkage never gates the queue.** A fully-grilled, unlinked row is
  `Live` and queue-eligible like any other — the riskiest belief in the
  register is never invisible because no goal happens to sit near it. When a
  linking goal dies, nothing changes mechanically on the row: no status
  flips, no Impact edits, no reopen session; it keeps competing on its own
  Risk. Linkage remains a per-goal view only, never an Impact anchor
  (`docs/goals.md`).
- **Mootness, not closure, for decisions.** A resolving decision lowers the
  assumption's Impact to 0 in the same gated write, with a dated line in the
  `Scoring justification` field recording the prior score and citing the
  decision; reversal restores it (`decision-guardrails.md §8`). There is no
  `Closed by decision` status.
- **The working Risk threshold** is a prioritisation setting, not a record
  property — rows above it are the queue; rows below it are dormant, not done.

## Field map — Experiments (the plan)

An Experiment is the **plan for a run**, not evidence. It carries no rung and
no strength; those live on the Readings the run produces. It bundles
one-or-more beliefs through **bar lines** (below).

| Field | Type | Rule |
|---|---|---|
| Title | title | The specific question the run is designed to answer. |
| Instrument | link | The reusable artifact the run is built on — an **interview or a dataset only** (analytics cohorts, payment events and the like are Goal instruments). Readings born from this run inherit it as their `Source`. |
| Feasibility | select High/Medium/Low | How hard the run is to execute (access, cost, time). A property of the *run*. Set at design time. |
| Status | select | `Running` (collecting) → `Closed`. **This is where `Running` lives — never on a Reading.** |
| Closure reason | select | `Completed` / `Early-stop` / `Kill` — why the run closed. Null while `Running`. |
| Owner | person | Who runs the test. Optional at design time. |
| Date | date | Designed date on creation; closed date at conclusion. |

**No `Type`, no `Strength`** — both are dead at plan level. Rung is per-belief
(on the bar line / Reading); Strength lives only on Readings.

### Bar lines — the per-belief pre-registration (composed into the Experiment)

Each bundled belief gets a **bar line**: an association-with-attributes
between the Experiment and one Assumption, written before any Reading exists.
It is **not a register** — each bar line belongs to exactly one Experiment and
is realized backend-natively (a child table in SQL, an embedded array in
NoSQL, a nested block keyed by belief in Markdown; see the connector schema
guides). Attributes:

- **We're right if** — the pre-registered pass bar for this belief. Concrete,
  countable.
- **We're wrong if** — the kill bar.
- **Planned rung** — the ladder rung the run is designed to reach for this
  belief.
- **Bar verdict** — at closure, `Validated` / `Invalidated` / `Inconclusive`,
  judged against the full pre-registered N. A **report only, never a
  Confidence input** — the Readings carry the evidence value; counting the bar
  verdict too would double-count it.

A bundle = one instrument × one protocol run × one Lens-matched population
(same Lens a hard gate); symmetric, no lead belief.

### Experiment body

- `## Method protocol` — the per-method playbook (`experiment-guardrails.md §3`).
- `## Closure rollup` — the closure report, written once at close.

## Field map — Readings (the evidence atom)

One row = **one artifact × one belief** — the atomic unit Confidence reads
(`OPS-1175`). A Reading exists only once observed; it has no draft/running
state. Its origin (an Experiment run, a Goal close, or none) lives here, never
on the assumption.

| Field | Type | Rule |
|---|---|---|
| Title | title | Short handle for the observation. |
| Source | link | **First-class** link to the artifact it came from — the **independence-dedupe key** (Readings sharing a source against one belief dedupe to the strongest, largest `\|Strength\|`, most recent on ties). Interview/dataset for experiment Readings; the query/cohort/payment-event link for goal Readings. Reference the artifact's home; never mirror it. |
| Assumption | relation | **Exactly one** belief this Reading bears on. Inverse of the assumption's `Readings`. |
| Experiment | relation (nullable) | The originating plan, as provenance. Null for goal and bare/found Readings. |
| Goal | relation (nullable) | The originating goal container. Null for experiment and bare Readings. |
| Rung | select | The ladder rung this Reading sits on — inherited from the bar line at logging, or set directly for goal/bare Readings. The single 8-rung activity-and-strength ladder (`experiment-guardrails.md §2`): 🧪 Testing — `Opinion` · `Pitch-deck reaction` · `Anecdotal` · `Desk research` · `Survey at scale` · `Prototype usage`; 🎯 Goals — `Signed intent` · `Paying users` (two pre-registered bars, magnitude bands). |
| Representativeness | select {1.0, 0.7, 0.5} | How well the source represents the ICP/Lens. |
| Credibility | select {1.0, 0.7, 0.5} | How much *this* source's word is worth. |
| Source quality | derived | **Never hand-write.** = `Representativeness × Credibility` — anchors {0.25, 0.35, 0.5, 0.7, 1.0}. Scales the Reading's *weight* in the Confidence average, within its rung, never across. |
| Result | select | `Validated` / `Invalidated` / `Inconclusive` — the sign of the evidence, set at logging. **No `Running`.** |
| Strength | derived | **Never hand-write.** The signed reading value `s`: rung anchor (Goal rungs: × magnitude band, Low/Typical/High from the absolute outcome) × sign(Result); 0 on `Inconclusive`. The assumption's Confidence reads this. |
| Date | date | When it was observed. |
| Owner | person (optional) | Who logged it. |

**Exactly one of `{Experiment, Goal}` is set, or neither** (a bare found
Reading) — never both (`reading-two-origins`).

### Reading body

- `## Grading` — its **own verbatim heading** (so `reading-ungraded` and the
  missing-heading check are presence checks, not prose-parsing): rung +
  magnitude anchor (on Goal rungs) justification; the `Representativeness` and
  `Credibility` picks with one-line justifications each; and the source
  person's name / role / company as prose — **fetched** from the CRM/DB the
  setup config names, never mirrored to a field.
- `## Notes`

## Field map — Goals (the commitment container)

The Goal record **is** the Goals-side evidence container (`docs/goals.md`): it
holds the pre-registration, and closing it emits per-belief **Readings** — the
same two-level shape as the Testing side, with the Goal playing the "plan"
role. It carries **one** goal-level bar pair (no Goals-side bar-line — the
deliberate divergence from Experiments); the single outcome is decomposed per
belief only at close.

| Field | Type | Rule |
|---|---|---|
| Title | title | The goal statement. |
| We're right if | text | Pre-registered pass bar. Fixed at commit. |
| We're wrong if | text | Pre-registered kill floor. Fixed at commit. **No floor → no negative Reading** (an uncontrolled absence of the outcome is `Inconclusive`). |
| Instrument | text/URL | The measuring instrument named in advance — CRM stage / analytics cohort / payment event. **Broader** than the Experiment plan's interview-or-dataset-only Instrument. |
| Deadline | date | When the bars are judged. |
| Owner | person | One accountable owner. |
| Status | select | `Draft` → `Active` → `Closed`. Pure lifecycle. |
| Outcome | select | `Achieved` / `Missed` / `Dropped` — null until `Closed`. |
| Date | date | Commit date; close date at conclusion. |

**No `Rung` field** — nothing mechanical reads a goal's rung before close (the
advisory bands read linked-belief Confidence; the test-next surface is
goal-agnostic). The rung lands on the **Reading** at close, guardrail-enforced
from instrument + what materialised (real money / live traffic → Paying users;
pre-build costly commitment → Signed intent; no pre-registered floor →
Inconclusive).

### Goal body

- `## Pre-registration` — Low / Typical / High **absolute** magnitude anchors +
  exact measurement detail (query/stage, window). Fixed at commit; the grading
  reference.
- `## Rationale` — beliefs bet on (cites `Based on assumption`), the per-belief
  band read at draft (`goals.md §In`), dated risk-acceptance lines.
- `## Closure` — written once at close: verdict, measured number, pointers to
  the decomposition Readings.

## Field map — Decisions

The decision log. Rules in `decision-guardrails.md`. Goals are **not**
decisions — a goal is a Goal record (`decision-guardrails.md §9`); a proposal
that is really a goal is routed to `/goals` by its **shape**, not by any field.

| Field | Type | Rule |
|---|---|---|
| Title | title | A short handle for the decision. |
| Status | select | `Active` (in force) / `Provisional` (tentative) / `Superseded` (replaced — paired with `Supersedes`) / `Reversed` (abandoned outright). |
| Area | select | Which domain of your product the row belongs to — define your own list in setup. Scopes the sweep-mode conflict search to same-Area pairs. |
| Owner | person | Who owns the decision. |
| Agreed by | person (multi) | Everyone who explicitly affirmed. |
| Unanimity score | number 0–100 | Anchored bands — `decision-guardrails.md §2`. The only hand-scored number on a Decision row. |
| Source | text/URL | Link to the transcript / thread / doc the decision came from. |
| Decided date | date | When it was decided; may differ from row creation. |
| Reversibility | select | `Two-way door` / `One-way door`. Unclear = one-way. Sets the evidence bar for `Based on` links — `decision-guardrails.md §8`. |
| Related tension | self-relation, two-way | Decision↔Decision: unresolved contradiction flag, resolved via `Supersedes`. |
| Supersedes / Superseded by | self-relation, two-way | Resolved, intentional override — distinct from `Related tension` (unresolved). |
| Based on assumption | relation → Assumptions | Rationale. **Never touches the assumption.** (The Goal record carries a relation of the same name — that one, read backwards, is the goal linkage: a per-goal view only, never an Impact anchor or a queue condition.) |
| Resolves assumption | relation → Assumptions | **Separate** relation from `Based on assumption` — never reuse one for the other. Setting it (gated) makes the linked assumption **moot**: Impact drops to 0, with a dated line recording the prior score; Status untouched. `decision-guardrails.md §6`. |

There is **no `Type` field** (the register itself is the discriminator — a row
in Decisions is a decision) and **no `Kind` field** (it drove nothing
mechanical; `Area` + `Reversibility` carry classification).

### Decision body template

Verbatim-parsed headings — a row that breaks the template silently escapes
automated checks:

- `## Decision` — one-line statement of what was decided.
- `## Rationale` — why; cites `Based on assumption` rows; carries the Unanimity
  scoring justification and any risk-acceptance lines (dated format:
  `decision-guardrails.md §8`).
- `## Alternatives considered` — options on the table and why they lost.
- `## Source` — the actual quote/link (mirrors the Source field).

## Field map — Glossary

The shared glossary (renamed from Terminology; the *discipline* stays
"ubiquitous language"). Enforcement rules: `ubiquitous-language.md`.

| Field | Type | Rule |
|---|---|---|
| Title | title | The term. |
| Status | select | `Active` (hard-enforce) / `Provisional` (advisory) / `Superseded` (flag-if-used). **No `Reversed`** — a term is superseded by a better one, never reversed. |
| Area | select | Bounded context — which domain the term belongs to. Scopes the conflict sweep to same-Area pairs. |
| Related tension | self-relation, two-way | Glossary↔Glossary: confusable-neighbour pairing (informational). |

There is **no `Type` field** (the register is the discriminator).

### Glossary body template

The three verbatim headings the terminology check keys off — full rules and
per-audience bullet format: `ubiquitous-language.md`.

- `## Definition` — one bullet per applicable audience (a single bullet if
  uniform). Context, not enforced.
- `## Avoid / don't say` — the must-fix source: per-audience banned phrasings
  + the fix.
- `## How it differs` — 2–5 `- **vs <neighbour>:**` bullets against
  confusable neighbours (pairs with `Related tension`).

## Migration rules (existing registry rows)

The registry is local and nested-git; **stating** the rules is this file's job,
**running** the migration is handoff. Score calibration (w₀, kill threshold)
stays with the risk-scoring model — not re-checked here.

1. **Split the Experiments register into Experiments + Readings + bar lines.**
   Every legacy Experiment row was a `(reading, assumption)` pair. For each:
   (a) an **Experiment (plan)** row keyed by its instrument + protocol run,
   dropping `Type` and `Strength`; (b) a **Reading** row carrying the old
   `Type` → `Rung`, the `Source quality` product → back-filled
   `Representativeness × Credibility` picks (where only the product is known,
   record it and flag `stale-representativeness`), `Result`, `Strength`,
   `Date`, and the artifact as first-class `Source`; (c) a **bar line** on the
   Experiment for the belief, carrying `We're right if` / `We're wrong if`
   (from the old body) + planned rung + the closure bar-verdict. Rows co-run on
   one instrument/population collapse to one Experiment with N bar lines.
   Bare/found evidence rows with no plan → a Reading with null `Experiment`.
   **Drop `Interviewee`** — who/role/company move to the Reading's `## Grading`
   prose (the CRM/DB lookup fills them).
2. **Rename the assumption relation** `Assumption / Experiments` →
   `Assumption / Readings`; drop the stored `Experiments` relation (the
   "experiments testing me" view is derived over bar-lines).
3. **Goals.** Convert legacy `Kind: Goal commitment` Decision rows (e.g.
   `DEC-001`) to **Goal records** under the field map above (already scoped by
   `OPS-1230`). Analytics/"fact" rows become a Goal or a Reading per the
   two-record model — there is **no Fact record type**.
4. **Decisions register.** Drop the `Type` column **and** the `Kind` column
   from every legacy Decision row; the register is now the discriminator.
   `Status` keeps `Active/Provisional/Superseded/Reversed`.
5. **Glossary register.** Rename `Terminology` → `Glossary` everywhere
   (directory / table / collection); drop the `Type` column; re-map any
   `Reversed` Glossary status to `Superseded`.
6. **New registers.** Create `Readings` and `Goals` empty; back-fill `Readings`
   from the Experiments split (rule 1).
