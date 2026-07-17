# Shared reference — Registry schema

The single source of truth for **what the registry's fields mean**. Cited by
every mode of `/assumptions` and by `/experiment-design`, `/find-evidence`,
`/meeting-prep`, and `/decisions`. When a field rule changes, change
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

## The five registers

- **Assumptions** — every belief the business depends on, as a falsifiable
  sentence, scored and ranked by Risk. Built by `/assumptions`.
- **Experiments** — the unified evidence **plan** (Testing and Market-grade
  both live here — the Goal record is gone, `OPS-1305`). One row per designed
  test, groups one-or-more beliefs through per-belief **bar lines** (composed
  in, not a register). Carries no evidence value itself. A committed plan
  carries an optional Deadline and closes with an Outcome — the
  commitment-grade behaviour a Goal used to give. Created by
  `/experiment-design`, closed by `/find-evidence` and the humans running the
  test.
- **Readings** — one row per **artifact × belief**: the atomic unit Confidence
  reads. Born from an Experiment run, or found bare — the Goal origin is gone.
  Logged by `/find-evidence` and the humans concluding a test.
- **Decisions** — the decision log. Owned by `/decisions`.
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
| Impact | number 0–100 | **The intrinsic seed — the only hand-scored number.** Pure severity-if-false on anchored bands; never folds in dependents or decisions — the seed is purely intrinsic. `assumption-guardrails.md §3`. |
| Derived Impact | derived | **Never hand-write.** = seed + (100 − seed) × S/(S + 100), where S sums the dependents' pull (dependent assumptions' Derived Impact + 100 per standing decision `Based on` node; an experiment never contributes). **Recomputed on every touching write** alongside Confidence and Risk — no deliberate staleness (`OPS-1251`); the batch pass is only a backstop for writes that bypass the dashboard. `assumption-guardrails.md §3`. |
| Risk | derived | **Never hand-write.** = Derived Impact × (1 − max(0, Confidence)/100), ranges 0 to Derived Impact. Full-precision sort, rounded display. |
| Confidence | derived | **Never hand-type.** Signed −100…100, 0 = no evidence: strength-weighted average of concluded linked **Readings** with neutral prior w₀ = 100, deduped by source. ≤ −50 = the kill zone (human review prompt). Full rule: `experiment-guardrails.md §2`. |
| Completeness % | derived | **Never hand-write.** = filled slots / all slots × 100, over five structural slots: Description, Lens, Impact, Scoring justification, dependencies traced (≥1 `Depends on`/`Enables` link). The Draft⇔open-work readiness meter — 100 = Live-ready, below 100 = open work. Replaces the retired Gaps/presence-field machinery (`OPS-1305`; `assumption-guardrails.md §3`). |
| Status | select | The **lifecycle** and nothing else: `Draft` (Completeness % < 100 — record not yet trustworthy) → `Live` (the default forever-state, ranked by Risk) → `Invalidated` (rare, human-gated kill). There is **no `Validated`** — `docs/validated.md`. Testing, queue membership, mootness: derived views, §Status & derived views. |
| Owner | dashboard user | Who voiced / champions the belief and is accountable for testing it. A reference to the auth-sourced dashboard-users list (`validation-os.config.yaml`), not free text and not a register (`OPS-1305`). |
| Scoring justification | text | Why the seed `Impact` was scored as it was, incl. dated moot lines when a decision `Resolves` the belief (`decision-guardrails.md §8`). The one hand-typed rationale left on an assumption — narrowed to the Impact-seed reason only: the why-trace lives in `Depends on`/`Enables`, falsifiability is enforced by the grill, and the concrete threshold lives on the experiment bar (`OPS-1305`). |
| Depends on / Enables | self-relation | The dependency graph. Relationships live HERE, not in the body. |
| Contradicts | self-relation | Links two rows in **tension** (distinct claims that can't both hold). Set it on **both** rows; pairs with a provenance note naming the resolving experiment. Not for negation-duplicates — those merge (`assumption-guardrails.md §4`). |
| Readings | relation | The concluded Readings scored against this belief — **every Confidence input**, whatever its origin (experiment run or bare). Inverse of the Reading's `Assumption` link. **Replaces the old `Experiments` relation** — the assumption never links an Experiment directly. |

There is **no stored `Experiments` relation** on the assumption. *Which
experiments test this belief* is a **derived view over the Experiments'
bar-lines** (each bar-line names one assumption) — computed for the `Testing`
view / test-next surface, never stored (§Status & derived views).

Assumptions carry **no body** (`OPS-1305`) — `Scoring justification` is the
only hand-typed rationale, and `Completeness %` (derived) replaces the retired
`5 Whys` / `Metric for truth` / `Gaps` presence-gap machinery. The audit trail
lives in dashboard history, not a `## Provenance & notes` section.

## Status & derived views — Assumptions (canonical; every skill enforces the same triggers)

`Status` stores the record's **lifecycle** and nothing else — three values.
An assumption is never validated (`docs/validated.md`): its standing is its
live Risk score, so every workflow state the old kanban would store is a
**derived view**, computed from the row's data, never written.

```
Draft ──(grill close-out: Completeness ─────▶ Live ──(evidence net-against — Confidence
  ▲      % reaches 100, gated session)           │  ▲     in the kill zone (≤ −50) — and a
  │                                               │  │     human affirms)──▶ Invalidated
  └──(a slot empties, or a grill ─────────────────┘  │                             │
      finding reopens it)                             └──(gated reopen: kill re-judged
                                                           flawed, or world changed)◀┘
```

- **`Draft`** — has open work, always
  (`draft-live-completeness-invariant`): Completeness % < 100 — an empty
  structural slot (Description, Lens, Impact, Scoring justification,
  dependencies traced) or an unresolved grill finding. The record isn't
  trustworthy yet — its Impact is unproofed — so it is neither ranked nor
  queued. Seed default. A gated session with the row's Owner promotes it once
  every slot is present and the grill's transient semantic findings are all
  resolved (Completeness % = 100).
- **`Live`** — the default forever-state. Ranked by Risk continuously; never
  "done". Evidence and Impact changes move its Risk and its derived views —
  never its Status.
- **`Invalidated`** — the rare, real closure: the evidence has turned
  decisively against the belief (signed Confidence in the kill zone, ≤ −50 —
  only a series of missed Market-rung readings can get there), and a human
  affirmed the kill. The crossing raises an audit prompt; it never
  auto-flips. Reopens to `Live` only by human re-verdict (the killing
  evidence was flawed, or the world changed).

**Derived views (compute them; never write them):**

| View | Definition |
|---|---|
| Testing | `Live` + a linked Experiment (plan) whose bar-line on this belief is still open (Experiment `Status: Running`) |
| Experiments testing me | the Experiments whose bar-lines name this belief — a view over bar-lines, not a stored relation. Feeds `Testing` and the test-next surface |
| Test-next surface | **experiments, not assumptions** (there is no Risk-ranked belief queue): candidate/designed (`Draft`) experiments on `Live` rows, ranked by `Feasibility` × the linked assumption's Risk. The exact ruleset, tie-breaks (most-negative signed Confidence first), and top-N cut are the experiment-prioritisation layer's |
| Kill lane | `Live` + Confidence ≤ −50 — surfaced by audit for a human kill verdict, out of the test-next surface |
| Proven set | `Live` + strongest (largest `\|Strength\|`) concluded Reading `Validated` — "what we currently know"; provisional, always |
| Moot | seed Impact = 0 via a standing decision's `Resolves assumption` action; Derived Impact pins to 0 |

**Derived facets (display-only; never stored — `OPS-1305`):** a reading's
**quant vs qual** character is inferred from its `Rung` + instrument (a
system-number instrument reads *quant*; recruited-sample testing rungs read
*qual*), never a stored flag. An experiment's **commercial vs consumer**
character reads through from the tested assumption's `Lens` / `Theme`, never
set on the experiment — so the fact lives in one place. Neither is a field and
no rule forks on them; the display computation is the dashboard layer's.

- **Evidence never flips Status.** A validating verdict raises Confidence
  (lowering Risk); an invalidating one lowers it (raising Risk — a re-test
  signal, and past −50 a kill prompt), nothing else. Only a human-affirmed
  kill flips `Live → Invalidated`. An `Inconclusive` Reading contributes
  nothing and leaves the row exactly where it was.
- **Mootness, not closure, for decisions.** A resolving decision lowers the
  assumption's Impact to 0 in the same gated write, with a dated line in the
  `Scoring justification` field recording the prior score and citing the
  decision; reversal restores it (`decision-guardrails.md §8`). There is no
  `Closed by decision` status.
- **The working Risk threshold** is a prioritisation setting, not a record
  property — rows above it are the queue; rows below it are dormant, not done.

## Field map — Experiments (the plan)

An Experiment is the **plan for a run** — the unified evidence plan (Testing
and Market-grade both live here; the Goal record is gone, `OPS-1305`). It
carries no rung and no strength; those live on the Readings the run produces.
It bundles one-or-more beliefs through **bar lines** (below). A committed plan
carries an optional `Deadline` and closes with an `Outcome` — the
commitment-grade behaviour a Goal used to give.

| Field | Type | Rule |
|---|---|---|
| Title | title | The specific question the run is designed to answer. |
| Instrument | link | The reusable artifact the run is built on — an interview, a dataset, an analytics cohort, or a payment event (broadened with the unification, `OPS-1305`, to cover the instruments a Goal used to carry). Readings born from this run inherit it as their `Source`. |
| Feasibility | select High/Medium/Low | How hard the run is to execute (access, cost, time). A property of the *run*. Set at design time. |
| Status | select | `Draft` (pre-commit) → `Running` (collecting) → `Closed`. **This is where `Running` lives — never on a Reading.** |
| Closure reason | select | `Completed` / `Early-stop` / `Kill` — why the run closed. Null while `Draft`/`Running`. |
| Deadline | date (optional) | When a committed plan's bars are judged. Fixed at commit. Folded in from the retired Goal (`OPS-1305`). |
| Outcome | select | `Achieved` / `Missed` / `Dropped` — null until `Closed`. Folded in from the retired Goal. |
| Owner | dashboard user | Who runs the test. Optional at design time. |
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
state. Its origin (an Experiment run, or none) lives here, never on the
assumption — the Goal origin is gone (`OPS-1305`).

| Field | Type | Rule |
|---|---|---|
| Title | title | Short handle for the observation. |
| Source | link | **First-class** link to the artifact it came from — narrowed to the **independence-dedupe key**: the generator (person / dataset / cohort) only (Readings sharing a source against one belief dedupe to the strongest, largest `\|Strength\|`, most recent on ties). Reference the artifact's home; never mirror it (`OPS-1305`). |
| Context links | multi-link (optional) | Provenance — recording, dashboard, CRM row, user id. 0..N. Drives no math and never keys dedupe (`OPS-1305`). |
| Assumption | relation | **Exactly one** belief this Reading bears on. Inverse of the assumption's `Readings`. |
| Experiment | relation (nullable) | The originating plan, as provenance. Null for bare/found Readings — the Goal origin is gone (`OPS-1305`). |
| Rung | select | The ladder rung this Reading sits on — inherited from the bar line at logging, or set directly for bare Readings. The single 8-rung activity-and-strength ladder (`experiment-guardrails.md §2`): 🧪 Testing — `Opinion` · `Pitch-deck reaction` · `Anecdotal` · `Desk research` · `Survey at scale` · `Prototype usage`; 🎯 Market — `Signed intent` · `Paying users` (two pre-registered bars, magnitude bands). Renamed from "Goals" with the unification (`OPS-1305`). |
| Representativeness | select {1.0, 0.7, 0.5} | How well the source represents the ICP/Lens. |
| Credibility | select {1.0, 0.7, 0.5} | How much *this* source's word is worth. |
| Source quality | derived | **Never hand-write.** = `Representativeness × Credibility` — anchors {0.25, 0.35, 0.5, 0.7, 1.0}. Scales the Reading's *weight* in the Confidence average, within its rung, never across. |
| Result | select | `Validated` / `Invalidated` / `Inconclusive` — the sign of the evidence, set at logging. **No `Running`.** |
| Strength | derived | **Never hand-write.** The signed reading value `s`: rung anchor (Market rungs: × magnitude band, Low/Typical/High from the absolute outcome) × sign(Result); 0 on `Inconclusive`. The assumption's Confidence reads this. |
| Grading justification | text | Rationale for the rung / representativeness / credibility picks — presence-checked (`reading-ungraded` warns when empty). Promoted from the `## Grading` body (`OPS-1305`). |
| Date | date | When it was observed. |
| Owner | dashboard user (optional) | Who logged it. |

A Reading has **one origin type**: an `Experiment`, or none (a bare found
Reading) — the Goal origin is gone (`OPS-1305`).

Readings carry **no body** (`OPS-1305`) — `Grading justification` (above)
replaces the `## Grading` heading; the `## Notes` section is cut.

## Field map — Decisions

The decision log. Rules in `decision-guardrails.md`.

| Field | Type | Rule |
|---|---|---|
| Title | title | A short handle for the decision. |
| Statement | text | The one-line statement of what was decided. Promoted from the `## Decision` body (`OPS-1305`). |
| Status | select | `Active` (in force) / `Provisional` (tentative) / `Superseded` (replaced — paired with `Supersedes`) / `Reversed` (abandoned outright). |
| Area | select | Which domain of your product the row belongs to — define your own list in setup. Scopes the sweep-mode conflict search to same-Area pairs. |
| Owner | dashboard user | Who owns the decision. A reference to the dashboard-users list, not free text (`OPS-1305`). |
| Agreed by | dashboard user (multi) | Everyone who explicitly affirmed. |
| Unanimity score | number 0–100 | Anchored bands — `decision-guardrails.md §2`. The only hand-scored number on a Decision row. |
| Unanimity justification | text | Why the score was scored as it was. Promoted from `## Rationale` (`OPS-1305`). |
| Source | text/URL | Link to the transcript / thread / doc the decision came from. |
| Decided date | date | When it was decided; may differ from row creation. |
| Reversibility | select | `Two-way door` / `One-way door`. Unclear = one-way. Sets the evidence bar for `Based on` links — `decision-guardrails.md §8`. |
| Related tension | self-relation, two-way | Decision↔Decision: unresolved contradiction flag, resolved via `Supersedes`. |
| Supersedes / Superseded by | self-relation, two-way | Resolved, intentional override — distinct from `Related tension` (unresolved). |
| Based on assumption | relation → Assumptions | Rationale. **Never touches the assumption.** |
| Resolves assumption | relation → Assumptions | **Separate** relation from `Based on assumption` — never reuse one for the other. Setting it (gated) makes the linked assumption **moot**: Impact drops to 0, with a dated line recording the prior score; Status untouched. `decision-guardrails.md §6`. |

There is **no `Type` field** (the register itself is the discriminator — a row
in Decisions is a decision) and **no `Kind` field** (it drove nothing
mechanical; `Area` + `Reversibility` carry classification).

### Decision body template

Verbatim-parsed headings — a row that breaks the template silently escapes
automated checks:

- `## Rationale` — why; cites `Based on assumption` rows; carries any
  risk-acceptance lines (dated format: `decision-guardrails.md §8`).
- `## Alternatives considered` — options on the table and why they lost.

`## Decision` (promoted to `Statement`) and the unanimity-scoring rationale
(promoted to `Unanimity justification`) are now fields, not body sections;
`## Source` is cut outright — it only mirrored the `Source` field
(`OPS-1305`).

## Field map — Glossary

The shared glossary (renamed from Terminology; the *discipline* stays
"ubiquitous language"). Enforcement rules: `ubiquitous-language.md`. All
properties, no body (`OPS-1305`) — the terminology check parses structure
directly.

| Field | Type | Rule |
|---|---|---|
| Title | title | The term. |
| Status | select | `Active` (hard-enforce) / `Provisional` (advisory) / `Superseded` (flag-if-used). **No `Reversed`** — a term is superseded by a better one, never reversed. |
| Area | select | Bounded context — which domain the term belongs to. Scopes the conflict sweep to same-Area pairs. |
| Definition | text | The definition, one sentence per applicable audience if it diverges. Promoted from the `## Definition` body (`OPS-1305`). |
| Avoid | structured `[{audience, phrase, fix}]` | Per-audience banned phrasing + the fix. Promoted from the `## Avoid / don't say` body. |
| How it differs | text | Confusable-neighbour distinctions (pairs with `Related tension`). Promoted from the `## How it differs` body. |
| Related tension | self-relation, two-way | Glossary↔Glossary: confusable-neighbour pairing (informational). |

There is **no `Type` field** (the register is the discriminator).

## Migration rules (existing registry rows)

The registry is local and nested-git; **stating** the rules is this file's job,
**running** the migration is handoff. Score calibration (w₀, kill threshold)
stays with the risk-scoring model — not re-checked here.

1. **Goals → Experiments.** Convert every legacy Goal record to an Experiment:
   its `We're right if` / `We're wrong if` become a bar line against the same
   assumption(s), its `Instrument` and `Deadline` carry over directly, and its
   `Status` maps `Draft → Draft`, `Active → Running`, `Closed → Closed`; its
   `Outcome` carries over unchanged. Drop the `goals` collection/table/directory
   once every row is migrated.
2. **Retire `people`.** Drop the collection/table/directory. Rewrite every
   `Owner` / `Agreed by` value from a person-record reference to the matching
   `dashboard_user` config entry (`vocabulary.dashboard_users`); add one if no
   match exists.
3. **Assumptions.** Drop `5 Whys`, `Metric for truth`, and `Gaps` from every
   row; drop the `## Provenance & notes` body (assumptions carry no body now).
   `Completeness %` is derived — recompute, never back-fill by hand.
4. **Readings.** Split the old `Source` value into `Source` (keep only the
   generator — person/dataset/cohort) and populate `Context links` from
   whatever provenance detail (recording, CRM row, user id) rode along on the
   old value. Replace the `## Grading` body with the `Grading justification`
   field (carry the prose over verbatim); cut `## Notes`. Drop the `Goal`
   relation — a Reading that pointed at a Goal now points at the Experiment
   created in rule 1.
5. **Decisions.** Promote the `## Decision` body to `Statement`, and the
   unanimity-scoring rationale (wherever it lived in `## Rationale`) to
   `Unanimity justification`. Cut `## Source` (it mirrored the `Source`
   field — keep the field). Rewrite `Owner`/`Agreed by` as `dashboard_user`
   refs (rule 2).
6. **Glossary.** Move `## Definition`, `## Avoid / don't say`, and `## How it
   differs` body content into the `Definition`, `Avoid` (parsed into the
   `{audience, phrase, fix}` shape), and `How it differs` fields. Drop the
   body.
