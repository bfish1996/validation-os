# Single mode — grill one assumption to guardrail-complete

The default mode. Take one assumption record from rough →
guardrail-complete: relentless, one question at a time, gated write. This is
the interactive heart of the registry, and the choreography every other mode
reuses — **seed mode** grills a freshly-created blank record through these
same phases, and **loop mode** runs this choreography in bulk with the gates
removed.

Rules come from `../../_shared/assumption-guardrails.md`; this file is the
*choreography*. The register schema and field map are in
`../../_shared/registry-schema.md`.

> **Plan mode.** This mode is an interactive interview that self-gates each
> write — it does not need the harness's plan mode, and plan mode fights it.
> If plan mode is forced on, keep conducting the interview — the questions,
> the 5 Whys trace, the scoring debate, the language pass are *not* writes
> and must still run one-at-a-time — and defer only the registry mutations
> to a single batched gated write after plan approval. Never end a grill at
> Statement/Lens; the 5 Whys and scoring justification are the substance.

## How this mode is entered

- "grill me on this assumption" / "grill <title or ID>", or
- from a Gaps queue (records filtered to a gap, sorted by Risk): take the
  top record, grill down the list, or
- from **seed mode** (`seed.md`), to flesh a freshly-created blank record.

## Before you start

1. Fetch the record via the connector: Description, Impact, Confidence,
   Status, **Gaps**, Depends on / Enables, and the body (including any
   `## Provenance & notes` section).
2. **The record's `Gaps` is the agenda** — only work the tags present. Empty
   `Gaps` = already done, skip it.

## How to grill (discipline)

- **One question at a time.** Never batch. Each question carries **your
  recommended answer** + a one-line why, so the user confirms or corrects
  fast.
- **Walk the decision tree** — resolve one branch before opening the next.
- **Relentless but bounded** — push until the gap is genuinely closed, then
  move on.
- Reflect each resolved answer into the body/field and **clear that `Gaps`
  tag**. The shrinking `Gaps` list is the progress bar.

## Work the gaps in this order (cheap reframes first, so the 5 Whys runs on a clean claim)

0. **Statement — 4-step "Explicit" (ALWAYS first, even if no gap tag).**
   Confirm the Description is one explicit, well-formed sentence in the
   canonical form `We assume [target user/system] will [behavior/action]
   because [reason]` — a real who, a real action, a real reason. If the
   who/action/reason is vague, missing, or the title is doing the work
   instead, fix it here before anything else.
1. **`Hyperbole`** → rewrite to a flat, testable sentence. Confirm wording.
2. **`Non-atomic`** → name the bundled claims; ask which is load-bearing.
   Keep the core here, spin siblings into new records (each its own grill),
   wire `Depends on`.
3. **`Unfalsifiable`** → "what observable evidence would prove this wrong?"
   If none exists it's a belief — reframe to a measurable claim or retire it.
4. **`Lens check`** → "whose decision does this drive?" Set the single Lens
   (from the config's `vocabulary.lens`); if it genuinely drives two, that's
   a split (back to 2).
5. **`Duplicate` / `Contradiction` — reconcile vs the register.** One
   semantic search over the register; show the nearest cluster + a
   recommended-keep. Classify each near-match into one of four outcomes
   (recommend one, one-line why):
   - **duplicate** → **merge** (one experiment resolves both →
     redirect/retire this record); write into the **keeper's**
     `## Provenance & notes` which specific dimension made the loser
     redundant (not just "merged X into Y" — name the actual overlap: same
     metric, same trigger, same claim restated); clears `Duplicate`.
   - **distinct** → **keep**: independent truth values → **required**, not
     optional — write a line under `## Provenance & notes` in the fixed form
     `Distinct from <record> because: <dimension>`, naming the actual
     discriminating axis (different Metric for truth · different Lens ·
     different trigger/actor · different Theme), not a vague "feels
     different." A boundary line that doesn't name a concrete dimension
     doesn't satisfy this — push back before clearing `Duplicate`.
   - **direct contradiction** (the *same* proposition asserted with opposite
     truth values) → **not two assumptions**: reconcile into **one** record
     (`assumption-guardrails.md §4a`). A merge, not a `Contradicts` edge.
   - **tension** (two *distinct, both-stated* claims that can't both hold in
     practice) → **keep both**, wire the **`Contradicts`** relation both
     ways, and write a one-line reason + resolution path under
     `## Provenance & notes` ("which experiment decides which holds"). Set
     the `Contradiction` tag if not already present.
   - **Clearing `Contradiction`** = the tension has been *examined, wired,
     and noted*. It does **not** require *resolving* the tension; one side
     winning is an evidence verdict, owned by the evidence skills.
6. **`Scoring justification`** → **Impact is the only hand-scored number.**
   Quote the matched Impact band (`assumption-guardrails.md §3`),
   confirm/adjust the score, and write band + one-line reason into the body
   so it's auditable. (Re-score flagged contradictions — e.g. a load-bearing
   root scored low.)
   **Then handle evidence → Confidence (derived, never typed):** pull the
   record's linked `Experiments` and quote what you already know, and
   **actively ask for any *unlinked* signal too:** *"What else bears on this
   — a customer reaction, an interview quote, a support ticket, one
   person's opinion, analogous data?"* Map each signal to *this* claim
   before it counts (evidence for a sibling/dependency doesn't bear on this
   record), and weigh it on the evidence ladder (say < do < commit). A
   *planned* test ("X wants a demo") is not evidence yet — it's an
   experiment to design → hand off to `/experiment-design`. **Boundary:**
   loose informal signal (a passing opinion, a remembered reaction) just
   gets noted in the body. But if a piece is **concrete historic evidence**
   — a past user interview, a survey already run, desk research already
   done, a real revealed-preference signal — formalise it via **§ Log
   existing (historic) evidence** below. Either way, **never move `Status`**
   here — Confidence-only.
7. **`Metric for truth`** → "what specific result turns this into a fact?"
   Pin a concrete threshold (e.g. "≥N of M say/do X"). Write into the body.
8. **`5 Whys`** (last — needs a clean, atomic, falsifiable claim) → full
   disciplined trace per `assumption-guardrails.md §2`:
   - Question form: *"What specific condition or action directly caused
     [prev]?"*
   - Each answer: verifiable fact · in our control · process not blame.
   - **Therefore-test** bottom→top; fix any leap.
   - **Closure (tagging-only):** each "why" answer is **either an assumption
     or a ground truth.** An assumption → write it as an **inline reference
     to an existing record** (page mention in Notion, `ASM-###` in local
     files — not prose); dedupe-search first, reuse the record that already
     says it and wire `Depends on`, else offer to create it. A **✅ ground
     truth** (settled fact, not a bet) gets no record — mark it ✅ inline and
     stop. Body references and `Depends on` edges must agree.
   - **Depth is per-chain:** trace from this parent down `Depends on`; depth
     accrues across records, so don't re-run. **"Five" is a name, not a
     target — never pad.** Stop a branch at the FIRST of: (1) it
     **converges** onto an existing record (ideal close — tag + stop); (2) a
     **✅ ground truth**; (3) it **stops being load-bearing** — *if the next
     answer were false, would it change the bet or the experiment? If no,
     mark parent root, stop.* **Soft ceiling:** chains hit a stop within ~3
     new whys; still inventing abstract answers at three (usually you've
     slid from a fact about your users into a general law of human
     behaviour) is the rabbit-hole tripwire — stop, mark root. A true cycle
     means the two are one assumption → merge.
   - Write the connective chain + therefore-test into the body (substance
     lives in the referenced records).
9. **Language, glossary & concision** (runs last, once the wording is
   stable) → grill the *vocabulary* and the *phrasing*, not just the claim,
   so the register speaks one language and says it in as few plain words
   as possible.
   - Run the terminology check (`../../_shared/ubiquitous-language.md`) over
     the **final** title + Description + *Metric for truth*, audience =
     Internal.
   - Run the concision check (`../../_shared/assumption-guardrails.md §1`)
     over the same text: one core clause + one reason clause, no stacked
     subordinate clauses, no jargon outside the glossary, no redundant
     hedging. Apply the rewrite test per clause.
   - Walk findings one at a time (recommend + one-line why):
     - **must-fix / should-fix (terminology)** → reword the assumption to
       the canonical term. Reflect it into the field; re-read to confirm
       the claim still says the same thing.
     - **note (unknown term)** → the concept has no glossary record. Grill
       the user to a plain internal **definition**, then add it to the
       glossary following `/decisions`' Terminology Build procedure:
       `Status: Provisional` (suggest, don't hard-enforce — the vocab owner
       promotes to Active later). Gated write.
     - **verbose/overwrought** → propose a plain rewrite that keeps every
       load-bearing word and drops the rest; confirm it still says the same
       claim before reflecting it into the field.
   - This phase has no `Gaps` tag of its own; it always runs at the tail of
     a grill. Clears when both checks are clean (zero outstanding
     must-fix/verbose findings) and any unknown term is either added or
     consciously left.

## Log existing (historic) evidence → Experiments (optional, retrospective)

When gap #6 surfaces a piece of **concrete historic evidence** — a past user
interview, a survey already run, desk research already done, a real
revealed-preference signal — formalise it by running the shared procedure in
`../../_shared/historic-evidence.md`, gated. That helper owns the full flow
(search the configured evidence sources → triage against *Metric for truth*
+ `Lens` → set `Type` / `Result` / date / source link → the
retrospective-honesty check → gated write → Confidence roll-up) and is the
same procedure `/find-evidence` (standalone) and loop mode (autonomous) use,
so all three stay in lockstep.

Pass it the record you're grilling (ID, Description, Metric for truth, Lens,
current Confidence). It writes each qualifying piece as a **conclusive**
Experiment record (`Result` = Validated / Invalidated / Inconclusive, never
`Running`), one at a time, gated. **Confidence-only — logging evidence
never moves the assumption's `Status`; the sole exception, a
human-affirmed kill (`Invalidated` at a rung ≥ the strongest validating
rung), is a separate gated `Live` → `Invalidated` write.**

> Standalone, outside a grill? Use `/find-evidence` — the thin wrapper
> around the same helper for when you only want the evidence sweep.

## Close out

- All tags cleared → `Gaps` empty → record is guardrail-complete; **flip
  `Status` `Draft` → `Live` in the same gated close-out write** — the row
  is now ranked by Risk, and it enters the derived **test-next** queue
  (`Live` + no running experiment, sorted by Risk) on its own — **no goal
  link required**. A standing Goal record linking it via `Based on
  assumption` anchors its Impact and so moves it up the queue, but never
  decides whether it's in one; that link is `/goals`' write, not this
  skill's. Full flow: `registry-schema.md §Status & derived views`.
- **`Human review` gap** (present when a loop run auto-grilled this record):
  clear it only after walking the machine's answers (5 Whys, score, metric)
  past the record's `Owner` in this gated session — it counts like any other
  gap, so the `Draft` → `Live` flip can't happen without that sign-off.
- **Terminology** — confirm zero outstanding must-fix before the record
  write; if the wording changed after Phase 9, re-run the check once more.
- **Gate the write:** show final title / Description / scores / body /
  relations and confirm before writing. One record at a time.
- Offer the next record in the queue (next-highest Risk with the same gap).

## Never

- Never invent 5-Whys facts to "finish" a record — leave the prompt and move
  on if the user doesn't have the fact. A blank-but-honest chain beats a
  fabricated one.
- Never write `Risk` / `Confidence` / `Strength` (derived). Never renumber
  identifiers.
- Never log a *planned/future* test as historic evidence — that's
  `/experiment-design`. A historic Experiment record's `Result` is
  conclusive at creation, never `Running`.
- Never flip the assumption `Status` from logging evidence —
  Confidence-only; the one exception, the human-affirmed kill (`Live` →
  `Invalidated`), is the evidence skills' gated call, not this grill's.
- Never cherry-pick supporting hits — log disconfirming historic evidence
  too.
- Never wire a `Contradicts` edge in place of a real merge: same proposition
  with opposite truth values = one assumption — merge it.
- Never hard-enforce a term you add mid-grill — it goes in as `Provisional`.
  And never silently rewrite the claim to a glossary term — recommend the
  swap, the user confirms.
