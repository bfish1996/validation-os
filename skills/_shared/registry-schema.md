# Shared reference — Registry schema

The single source of truth for **what the registry's fields mean**. Cited by
every mode of `/assumptions` and by `/experiment-design`, `/find-evidence`,
`/meeting-prep`, and `/decisions`. When a field rule changes, change it here —
not in a skill body.

**Machine-readable companion: `ontology.yaml`** (same directory) — the
checkable form of this file: canonical select-option lists, relation
direction/cardinality, status-transition tables, derivation formulas, and the
cross-register integrity rules the audit modes run. Prose here explains
meaning; validators and audits check against the YAML. The two must never
disagree — change them in the same commit.

**Where the registry lives** is the connector's job, not this file's. Read
`validation-os.config.yaml` (walk up from the working directory; absent =
local-files defaults) and follow the matching doc in `connectors/` for how to
read and write records. This file defines the fields those records carry,
whatever the backend.

## The three registers

- **Assumptions** — every belief the business depends on, as a falsifiable
  sentence, scored and ranked by Risk. Built by `/assumptions`.
- **Experiments** — the Testing-side pre-registered container and its
  evidence. Conceptually an experiment is the **plan** (instrument by
  canonical link, protocol, one Feasibility, per-belief bar lines with
  planned rungs) and evidence arrives as **readings** — one per artifact ×
  belief actually addressed (`experiment-guardrails.md §0`). Created by
  `/experiment-design`, concluded by `/find-evidence` and the humans running
  the test.
- **Decisions & Terminology** — the decision log and the shared glossary.
  Owned by `/decisions`. Goals are **not** decisions
  (`decision-guardrails.md §9`).

> **Goal records — schema pending.** A goal is a first-class **Goal record**,
> not a Decision row: two bars fixed at commit time (`We're right if` /
> `We're wrong if`), a deadline, an owner, the instrument named in advance,
> `Based on assumption` links, and a `Draft → Active → Closed`
> (`Achieved`/`Missed`/`Dropped`) lifecycle. The model is settled
> (`docs/goals.md`) and `/goals` operates it; the **field map, body template,
> and which register it lives in are not decided here yet** — they land with
> the registry-schema rewrite, alongside the migration rule for legacy
> `Kind: Goal commitment` rows.

> **Experiment/reading split — schema pending.** The concept is settled
> (`experiment-guardrails.md §0, §1b, §6`): an experiment is the
> pre-registered plan; readings are the evidence, one per artifact × belief,
> each bundled belief carrying its own bar pair and planned rung; off-plan
> readings keep the experiment link as provenance. The **field map below
> still describes the live single-row encoding** — one row per belief under
> test, the row doubling as that belief's bar line and its reading, a shared
> run expressed by the shared instrument link + protocol, every new round a
> new row. The split's field map, relation shapes, and where the planned
> rung sits land with the registry-schema rewrite.

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
| Derived Impact | derived | **Never hand-write.** = seed + (100 − seed) × S/(S + 100), where S sums the dependents' pull (dependent assumptions' Derived Impact + 100 per standing decision `Based on` node; a goal never contributes). Written by the weekly recompute script; stale between runs by design. `assumption-guardrails.md §3`. |
| Risk | derived | **Never hand-write.** = Derived Impact × (1 − max(0, Confidence)/100), ranges 0 to Derived Impact. Full-precision sort, rounded display. |
| Confidence | derived | **Never hand-type.** Signed −100…100, 0 = no evidence: strength-weighted average of concluded linked readings with neutral prior w₀ = 100, deduped by source. ≤ −50 = the kill zone (human review prompt). Full rule: `experiment-guardrails.md §2`. |
| Status | select | The **lifecycle** and nothing else: `Draft` (Gaps non-empty — record not yet trustworthy) → `Live` (the default forever-state, ranked by Risk) → `Invalidated` (rare, human-gated kill). There is **no `Validated`** — `docs/validated.md`. Testing, queue membership, goal linkage, mootness: derived views, §Status & derived views. |
| Owner | person | Who voiced / champions the belief and is accountable for testing it. |
| Gaps | multi-select | What's missing/wrong: `5 Whys`, `Metric for truth`, `Scoring justification`, `Non-atomic`, `Unfalsifiable`, `Hyperbole`, `Lens check`, `Duplicate`, `Contradiction`, `Human review`. **Drives the grill queues.** Empty Gaps = guardrail-complete. `Human review` is the machine-grill sign-off gap: batch modes set it on every row they auto-grill and never clear it; only a gated session with the row's Owner clears it. |
| Depends on / Enables | self-relation | The dependency graph. Relationships live HERE, not in the body. |
| Contradicts | self-relation | Links two rows in **tension** (distinct claims that can't both hold). Set it on **both** rows; pairs with the `Contradiction` gap and a provenance note. Not for negation-duplicates — those merge (`assumption-guardrails.md §4`). |
| Experiments | relation | The tests designed against this belief. Inverse of the Experiment's `Assumption` relation. |

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

Record **body** holds the long-form the fields can't: `## 5 Whys`,
`## Metric for truth`, `## Scoring justification`, `## Provenance & notes`
(per-row caveats, merge/dedup outcomes, source provenance).

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

- **`Draft`** — `Gaps` non-empty, always (`draft-live-gaps-invariant`). The
  record isn't trustworthy yet — its Impact and Metric for truth are unproofed
  — so it is neither ranked nor queued. Seed default. Batch/loop modes tag
  `Human review`, which keeps (or returns) the row here; only a gated session
  with the Owner promotes it.
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
| Testing | `Live` + a linked experiment with `Result: Running` |
| Test-next surface | **experiments, not assumptions** (there is no Risk-ranked belief queue): candidate/designed experiments on `Live` rows, ranked by `Feasibility` × the linked assumption's Risk, **goal-agnostic**. The exact ruleset, tie-breaks (most-negative signed Confidence first), and top-N cut are the experiment-prioritisation layer's |
| Kill lane | `Live` + Confidence ≤ −50 — surfaced by audit for a human kill verdict, out of the test-next surface |
| Proven set | `Live` + strongest (largest `\|Strength\|`) concluded reading `Validated` — "what we currently know"; provisional, always |
| Moot | seed Impact = 0 via a standing decision's `Resolves assumption` action; Derived Impact pins to 0 |

- **Evidence never flips Status.** A validating verdict raises Confidence
  (lowering Risk); an invalidating one lowers it (raising Risk — a re-test
  signal, and past −50 a kill prompt), nothing else. Only a human-affirmed
  kill flips `Live → Invalidated`. An `Inconclusive` experiment contributes
  nothing and leaves the row exactly where it was.
- **Goal linkage never gates the queue.** A fully-grilled, unlinked row is
  `Live` and queue-eligible like any other — the riskiest belief in the
  register is never invisible because no goal happens to sit near it. When a
  linking goal dies, nothing changes mechanically on the row: no status
  flips, no Impact edits, no reopen session; it keeps competing on its own
  Risk. Linkage remains a per-goal view only, never an Impact anchor
  (`docs/goals.md`).
- **Mootness, not closure, for decisions.** A resolving decision lowers the
  assumption's Impact to 0 in the same gated write, with a dated line in
  `## Scoring justification` recording the prior score and citing the
  decision; reversal restores it (`decision-guardrails.md §8`). There is no
  `Closed by decision` status.
- **The working Risk threshold** is a prioritisation setting, not a record
  property — rows above it are the queue; rows below it are dormant, not done.

## Field map — Experiments

| Field | Type | Rule |
|---|---|---|
| Title | title | The specific question being tested — a question, not a topic. |
| Assumption | relation | **One** assumption per row. Beliefs that honestly share one run *bundle* — each with its own bar pair and planned rung (`experiment-guardrails.md §1b`); in the live encoding a bundled run is one row per belief, sharing the instrument link + protocol. Never two beliefs blurred into one bar. |
| Type | select | The single 8-rung activity-and-strength ladder — `experiment-guardrails.md §2`. 🧪 Testing: Opinion · Pitch-deck reaction · Anecdotal · Desk research · Survey at scale · Prototype usage. 🎯 Goals: Signed intent · Paying users (two pre-registered bars, magnitude bands). Conceptually **per belief** — the row's value is its belief's planned rung; there is no run-level rung (`experiment-guardrails.md §0`). |
| Source quality | number | How much *this* source's word is worth: `Representativeness × Credibility`, each from {1.0, 0.7, 0.5} — anchors {0.25, 0.35, 0.5, 0.7, 1.0}. Scales the reading's *weight* in the Confidence average, within its rung, never across. Picks + justifications live in the body's grading block (`experiment-guardrails.md §2`). |
| Feasibility | select High/Medium/Low | How hard the run is to actually execute (access, cost, time). Set at design time; **one value per run** — rows sharing a run carry the same value (`experiment-guardrails.md §0`). |
| We're right if | text | The pre-registered pass bar. Concrete and countable. |
| Result | select | `Running` → `Validated` / `Invalidated` / `Inconclusive`. Design sets Running; conclusion is human-gated. |
| Strength | derived | **Never hand-write.** The signed reading value `s`: rung anchor (× magnitude band on 🎯 Goal rungs), positive on `Validated`, negative on `Invalidated`, **gated to a conclusive Result** — 0 while Running or Inconclusive. The assumption's Confidence reads this. |
| Date | date | Start date on creation; outcome date at conclusion. |
| Owner | person | Who runs the test. Optional at design time. |
| Interviewee | relation/text (optional) | Who was spoken to — useful for spotting repeat conversations. Set when known. |

Record **body** holds the protocol: the per-method template
(`experiment-guardrails.md §3` — for interviews, the guide *is* the
protocol, with the instrument slot holding only the stimulus asset's
canonical link), `We're wrong if` (the kill bar), and results notes —
including, once concluded, the **grading block** (rung, magnitude anchor on
Goal rungs, Representativeness × Credibility picks with one-line
justifications, and the source artifact's canonical link the independence
dedupe keys off — `experiment-guardrails.md §2`).

## Field map — Decisions & Terminology

One register, split by a `Type` select into Terminology rows (the glossary) and
Decision rows (the decision log). Terminology enforcement rules live in
`ubiquitous-language.md`; Decision rules in `decision-guardrails.md`.

| Field | Type | Scope | Rule |
|---|---|---|---|
| Title | title | shared | The term, or a short handle for the decision. |
| Type | select | shared | `Terminology` / `Decision`. Determines which fields apply. |
| Kind | select (optional) | Decision only | `Direction` / `Operating`. Direction = strategy/scope/path calls; Operating = process/tooling/how-we-work. **No `Goal commitment`** — a goal is its own record (`decision-guardrails.md §9`); legacy rows carrying it migrate. Optional: absent on legacy rows = untyped; Audit nudges, never blocks. |
| Status | select | shared, different meaning per Type | `Active` / `Provisional` / `Superseded` / `Reversed`. Terminology: Active = hard-enforce, Provisional = advisory, Superseded/Reversed = flag-if-used. Decision: Active = in force, Provisional = tentative, Superseded = replaced (paired with `Supersedes`), Reversed = abandoned outright. |
| Area | select | both (Terminology docs may call it "Bounded context") | Which domain of your product the row belongs to — define your own list in setup. Scopes the sweep-mode conflict search to same-Area pairs. |
| Related tension | self-relation, two-way | shared | Terminology: confusable-neighbour pairing. Decision: unresolved contradiction flag, resolved via `Supersedes`. |
| Owner | person | Decision only | Who owns the decision. |
| Agreed by | person (multi) | Decision only | Everyone who explicitly affirmed. |
| Unanimity score | number 0–100 | Decision only | Anchored bands — `decision-guardrails.md §2`. The only hand-scored number on a Decision row. |
| Source | text/URL | Decision only | Link to the transcript / thread / doc the decision came from. |
| Decided date | date | Decision only | When it was decided; may differ from row creation. |
| Reversibility | select | Decision only | `Two-way door` / `One-way door`. Unclear = one-way. Sets the evidence bar for `Based on` links — `decision-guardrails.md §8`. |
| Supersedes / Superseded by | self-relation, two-way | Decision only | Resolved, intentional override — distinct from `Related tension` (unresolved). |
| Based on assumption | relation → Assumptions | Decision only | Rationale. Never touches the assumption, on any `Kind`. (The Goal record carries a relation of the same name — that one, read backwards, is the goal linkage: a per-goal view only, never an Impact anchor or a queue condition.) |
| Resolves assumption | relation → Assumptions | Decision only | **Separate** relation from `Based on assumption` — never reuse one for the other. Setting it (gated) makes the linked assumption **moot**: Impact drops to 0, with a dated line recording the prior score; Status untouched. `decision-guardrails.md §6`. |

### Decision row body template

Verbatim-parsed headings — a row that breaks the template silently escapes
automated checks:

- `## Decision` — one-line statement of what was decided.
- `## Rationale` — why; cites `Based on assumption` rows; carries the Unanimity
  scoring justification and any risk-acceptance lines (dated format:
  `decision-guardrails.md §8`).
- `## Alternatives considered` — options on the table and why they lost.
- `## Source` — the actual quote/link (mirrors the Source field).

### Terminology row body template

The three verbatim headings the terminology check keys off — full rules and
per-audience bullet format: `ubiquitous-language.md`.

- `## Definition` — one bullet per applicable audience (a single bullet if
  uniform). Context, not enforced.
- `## Avoid / don't say` — the must-fix source: per-audience banned phrasings
  + the fix.
- `## How it differs` — 2–5 `- **vs <neighbour>:**` bullets against
  confusable neighbours (pairs with `Related tension`).
