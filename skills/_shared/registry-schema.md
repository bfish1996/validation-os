# Shared reference — Registry schema

The single source of truth for **what the registry's fields mean**. Cited by
every mode of `/assumptions` and by `/experiment-design`, `/find-evidence`,
`/meeting-prep`, and `/decisions`. When a field rule changes, change it here —
not in a skill body.

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
- **Decisions & Terminology** — the decision log (including goal
  commitments — a goal lives as a Decision row, `decision-guardrails.md §9`)
  and the shared glossary. Owned by `/decisions`.

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
| Status | status | The **evidence** axis, hard transition triggers below: `Not Started` → `Experiment Needed` → `Testing` → `Validated` / `Invalidated` / `Inconclusive` / `Resolved by decision`. |
| Owner | person | Who voiced / champions the belief and is accountable for testing it. |
| Gaps | multi-select | What's missing/wrong: `5 Whys`, `Metric for truth`, `Scoring justification`, `Non-atomic`, `Unfalsifiable`, `Hyperbole`, `Lens check`, `Duplicate`, `Contradiction`, `Human review`. **Drives the grill queues.** Empty Gaps = guardrail-complete. `Human review` is the machine-grill sign-off gap: batch modes set it on every row they auto-grill and never clear it; only a gated session with the row's Owner clears it. |
| Depends on / Enables | self-relation | The dependency graph. Relationships live HERE, not in the body. |
| Contradicts | self-relation | Links two rows in **tension** (distinct claims that can't both hold). Set it on **both** rows; pairs with the `Contradiction` gap and a provenance note. Not for negation-duplicates — those merge (`assumption-guardrails.md §4`). |
| Experiments | relation | The tests designed against this belief. Inverse of the Experiment's `Assumption` relation. |

There is **no Goals field**: an assumption *gates a committed goal* when an
`Active` Decision with `Kind: Goal commitment` links it via `Based on
assumption` — the goal linkage is that relation read backwards
(`decision-guardrails.md §9`). Gating a committed goal is an Impact anchor
for the human scorer and a lens on the test-next queue, **never** a
Confidence input.

Record **body** holds the long-form the fields can't: `## 5 Whys`,
`## Metric for truth`, `## Scoring justification`, `## Provenance & notes`
(per-row caveats, merge/dedup outcomes, source provenance).

## Status flow — Assumptions (canonical; every skill enforces the same triggers)

`Status` stays purely on the **evidence** axis; it never encodes build quality
(that's `Gaps`) or "how much evidence" (that's the derived Confidence — a row
with no evidence is simply Confidence = 0, never a dedicated status).

```
Not Started ──(grill close-out: Gaps empties)──▶ Experiment Needed ──(/experiment-design
     │                                                  ▲             creates a Running
 (seed default)                        (Inconclusive →  │             experiment)──▶ Testing
     │                                  redesign)       │                              │
     │                                                  └──────────────────────────────┤
     │                                        Validated / Invalidated / Inconclusive ◀─┘
     │                                        (conclusive verdict, human-gated)
     └──(any state, via /decisions' gated Resolves-assumption action)──▶ Resolved by decision
```

- **`Not Started`** — seed default; the row is still being built and `Gaps` says
  what's missing.
- **`→ Experiment Needed`** — flipped at grill close-out, in the same gated write
  that clears the last gap. Checkable trigger: Gaps empty + no running experiment
  + no conclusive verdict. This is **the test-next queue marker** — queue =
  `Status = Experiment Needed` sorted by Risk descending.
- **`→ Testing`** — flipped only by `/experiment-design` (gated) when it creates
  an experiment with `Result = Running`.
- **`→ Validated / Invalidated / Inconclusive`** — flipped only when a conclusive
  experiment lands, human-gated. `Inconclusive` may loop back to
  `Experiment Needed` when a better test is worth designing.
- **Human-in-the-loop rule:** batch/loop modes **never flip Status** — they tag
  the `Human review` gap on every row they auto-grill, so a row can only enter
  the test-next queue once a human clears that gap in a gated session with the
  row's Owner.
- **`→ Resolved by decision`** — a terminal state entered **only** via
  `/decisions`' gated Resolves-assumption action; `/assumptions` never sets it.
  Behaves like a conclusive verdict for queue purposes. A decision merely
  *citing* an assumption as rationale never triggers this —
  `decision-guardrails.md §6`. Terminal only while the resolving decision
  stands: if that decision is later `Reversed`/`Superseded` (and not
  re-resolved by the successor), the assumption reopens in a gated session —
  back to `Experiment Needed` if Gaps are empty, else `Not Started`
  (`decision-guardrails.md §8`).

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
| Kind | select (optional) | Decision only | `Goal commitment` / `Direction` / `Operating`. Goal commitment = adopting a goal (the decision row IS the goal record — `decision-guardrails.md §9`); Direction = strategy/scope/path calls; Operating = process/tooling/how-we-work. Optional: absent on legacy rows = untyped; Audit nudges, never blocks. |
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
| Based on assumption | relation → Assumptions | Decision only | Rationale-only. **Never** touches the assumption's Status. |
| Resolves assumption | relation → Assumptions | Decision only | **Separate** relation from `Based on assumption` — never reuse one for the other. Setting it (gated) flips the linked assumption's Status to `Resolved by decision`. `decision-guardrails.md §6`. |

### Decision row body template

Verbatim-parsed headings — a row that breaks the template silently escapes
automated checks:

- `## Decision` — one-line statement of what was decided. For `Kind: Goal
  commitment`: the objective plus the measurable bar and its instrument
  ("3 signed paid pilots by Sep 30; measured in Attio, stage 'Pilot signed'").
- `## Rationale` — why; cites `Based on assumption` rows; carries the Unanimity
  scoring justification and any risk-acceptance lines (dated format:
  `decision-guardrails.md §9`).
- `## Alternatives considered` — options on the table and why they lost.
- `## Source` — the actual quote/link (mirrors the Source field).
- `## Outcome` — **`Kind: Goal commitment` rows only.** Empty until the goal
  closes; then the human verdict (`Achieved` / `Missed` / `Dropped`) with
  links per the close-out gate (`decision-guardrails.md §9`).

### Terminology row body template

- `## Definition` — the canonical meaning, one plain paragraph.
- `## Use / don't use` — the approved phrasing and the near-misses to avoid.
- `## Examples` — a correct usage in a real sentence.
