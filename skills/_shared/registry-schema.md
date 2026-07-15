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
- **Experiments** — one row per test designed against an assumption; evidence
  rows and experiment rows are the same thing. Created by `/experiment-design`,
  concluded by `/find-evidence` and the humans running the test.
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

> ⚠️ **Always query the full register, never a filtered view or subset.**
> Auditing or looping a filtered slice silently skips rows.

## Field map — Assumptions

| Field | Type | Rule |
|---|---|---|
| Title | title | Short handle, plain. Not the full sentence. |
| Description | text | One-sentence falsifiable statement: `We assume [user/system] will [behavior] because [reason]`. Plain, no hyperbole. |
| Lens | select | The one audience whose decision this drives. **Single** — spans two → it's two assumptions; split. Define your own lens list in setup (example set: Commercial / Consumer / Investor). |
| Theme | multi-select | Topic; orthogonal to Lens. Example set: Go-to-market, Product, UX, Business model, Technology, Regulatory, Market & competition, Trust & data. |
| Impact | number 0–100 | **The only hand-scored number.** Anchored bands: `assumption-guardrails.md §3`. |
| Risk | derived | **Never hand-write.** = Impact × (1 − Confidence/100), ranges 0–100. Highest Risk is tested next. |
| Confidence | derived | **Never hand-type.** Base = `max` of proven linked Experiments' `Strength`, plus a capped corroboration bump held below the next rung's floor. Full rule: `experiment-guardrails.md §2`. |
| Corroboration count | number | Count of independent **proven** Experiment rows agreeing at this assumption's top proven rung. Maintained by the evidence skills at log time. 0 / empty = no bonus. |
| Status | select | The **lifecycle** and nothing else: `Draft` (Gaps non-empty — record not yet trustworthy) → `Live` (the default forever-state, ranked by Risk) → `Invalidated` (rare, human-gated kill). There is **no `Validated`** — `docs/validated.md`. Testing, queue membership, goal linkage, mootness: derived views, §Status & derived views. |
| Owner | person | Who voiced / champions the belief and is accountable for testing it. |
| Gaps | multi-select | What's missing/wrong: `5 Whys`, `Metric for truth`, `Scoring justification`, `Non-atomic`, `Unfalsifiable`, `Hyperbole`, `Lens check`, `Duplicate`, `Contradiction`, `Human review`. **Drives the grill queues.** Empty Gaps = guardrail-complete. `Human review` is the machine-grill sign-off gap: batch modes set it on every row they auto-grill and never clear it; only a gated session with the row's Owner clears it. |
| Depends on / Enables | self-relation | The dependency graph. Relationships live HERE, not in the body. |
| Contradicts | self-relation | Links two rows in **tension** (distinct claims that can't both hold). Set it on **both** rows; pairs with the `Contradiction` gap and a provenance note. Not for negation-duplicates — those merge (`assumption-guardrails.md §4`). |
| Experiments | relation | The tests designed against this belief. Inverse of the Experiment's `Assumption` relation. |

There is **no separate Goals field**: an assumption is *goal-linked* when a
standing (`Draft` or `Active`) Goal record links it via `Based on
assumption` — the linkage is that relation read backwards, computed, never
stored. It is an **Impact anchor** for the human scorer and a **queue view**
("what does this goal rest on?") — **never** a Confidence input, never in
the Risk formula, and **never a condition of queue membership**: every
`Live` row is queue-eligible on its own merits, linked or not
(§Status & derived views, `docs/goals.md`). A `Draft` goal counts, not only
`Active`, so a goal's own beliefs can be tested before it commits.

Record **body** holds the long-form the fields can't: `## 5 Whys`,
`## Metric for truth`, `## Scoring justification`, `## Provenance & notes`
(per-row caveats, merge/dedup outcomes, source provenance).

## Status & derived views — Assumptions (canonical; every skill enforces the same triggers)

`Status` stores the record's **lifecycle** and nothing else — three values.
An assumption is never validated (`docs/validated.md`): its standing is its
live Risk score, so every workflow state the old kanban would store is a
**derived view**, computed from the row's data, never written.

```
Draft ──(grill close-out: the last Gaps tag──▶ Live ──(conclusive kill at a rung ≥ the
  ▲      clears, gated session)                │  ▲     strongest validating rung,
  │                                            │  │     human-affirmed)──▶ Invalidated
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
- **`Invalidated`** — the rare, real closure: a linked experiment concluded
  `Invalidated` at a rung ≥ the row's strongest validating rung, and a human
  affirmed the kill. Reopens to `Live` only by human re-verdict (the killing
  experiment was flawed, or the world changed).

**Derived views (compute them; never write them):**

| View | Definition |
|---|---|
| Goal-linked | a standing (`Draft`/`Active`) Goal record links the row via `Based on assumption`. An Impact anchor and a queue **view** — never a membership condition (`docs/goals.md`) |
| Testing | `Live` + a linked experiment with `Result: Running` |
| Test-next queue | `Live` + no running experiment + Risk ≥ the working threshold, sorted by Risk descending. **Goal-agnostic** |
| Proven set | `Live` + strongest concluded experiment `Validated` — "what we currently know"; provisional, always |
| Moot | Impact = 0 via a standing decision's `Resolves assumption` action |

- **Evidence never flips Status.** A validating verdict moves Confidence →
  Risk → queue position, nothing else. Only a human-affirmed kill flips
  `Live → Invalidated`. An `Inconclusive` experiment contributes zero and
  leaves the row exactly where it was.
- **Goal linkage never gates the queue.** A fully-grilled, unlinked row is
  `Live` and queue-eligible like any other — the riskiest belief in the
  register is never invisible because no goal happens to sit near it. When a
  linking goal dies, nothing changes mechanically on the row: no status
  flips, no Impact edits, no reopen session; it keeps competing on its own
  Risk. Linkage remains an Impact anchor and a per-goal view only
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
| Assumption | relation | **One** assumption per experiment. A test that would also inform another belief → a second experiment record, never two beliefs blurred into one. |
| Type | select | The single 8-rung activity-and-strength ladder — `experiment-guardrails.md §2`. 🔴 Stated: Opinion · Pitch-deck reaction · Anecdotal. 🟡 Researched: Desk research · Survey at scale. 🟢 Revealed: Prototype usage · Signed intent · Paying users. |
| Source quality | select High/Medium/Low | How much *this* source's word is worth (seniority, authority, ICP-fit). Modulates Strength **within** the rung's band, never across. |
| Feasibility | select High/Medium/Low | How hard the test is to actually run (access, cost, time). Set at design time. |
| We're right if | text | The pre-registered pass bar. Concrete and countable. |
| Result | select | `Running` → `Validated` / `Invalidated` / `Inconclusive`. Design sets Running; conclusion is human-gated. |
| Strength | derived | **Never hand-write.** Rung band × source-quality modifier, **gated to a conclusive Result** — 0 while Running or Inconclusive. The assumption's Confidence reads this. |
| Date | date | Start date on creation; outcome date at conclusion. |
| Owner | person | Who runs the test. Optional at design time. |
| Interviewee | relation/text (optional) | Who was spoken to — useful for spotting repeat conversations. Set when known. |

Record **body** holds the protocol: the per-method template
(`experiment-guardrails.md §3`), `We're wrong if` (the kill bar), and results
notes.

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
| Based on assumption | relation → Assumptions | Decision only | Rationale. Never touches the assumption, on any `Kind`. (The Goal record carries a relation of the same name — that one, read backwards, is the goal linkage: an Impact anchor and a view, never a queue condition.) |
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
