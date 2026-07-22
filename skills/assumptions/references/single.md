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
> the why-trace, the scoring debate, the language pass are *not* writes
> and must still run one-at-a-time — and defer only the registry mutations
> to a single batched gated write after plan approval. Never end a grill at
> Statement/Lens; the why-trace and scoring justification are the substance.

## How this mode is entered

- "grill me on this assumption" / "grill <title or ID>", or
- from the **Draft queue** (`Status = Draft`, sorted by Risk): take the
  top record, grill down the list, or
- from **seed mode** (`seed.md`), to flesh a freshly-created blank record.

## Before you start

Fetch the record via the connector: Description, Lens, Impact, Derived
Impact, Confidence, `Completeness %`, Status, Depends on / Enables,
Contradicts. Assumptions carry no body (`the evidence-remodel slice`) — there is no stored
agenda to read. **This means the full gauntlet below runs every session**,
not just whichever gap a stored tag names: a slot that's already filled
gets a fast confirm rather than a fresh ask, but every check (hyperbole,
atomicity, falsifiability, dedup/contradiction, scoring, why-trace,
language) is re-verified live, because none of it is durable state. Only
the field values and the relation graph persist between sessions —
`Completeness %` tells you which of the six structural slots (Description,
Lens, Impact, Scoring justification, dependencies traced, **Question Type**)
are still empty, but it says nothing about which semantic checks were already
run. The `Question Type` slot (the question-type-aware evidence ladder) is the Live gate added by the
question-type-aware evidence ladder — see `docs/question-types.md`.

## How to grill (discipline)

- **One question at a time.** Never batch. Each question carries **your
  recommended answer** + a one-line why, so the user confirms or corrects
  fast.
- **Walk the decision tree** — resolve one branch before opening the next.
- **Relentless but bounded** — push until each check is genuinely settled,
  then move on.
- Reflect each resolved answer into the field. `Completeness %` recomputes
  on every touching write — watching it rise is the progress bar.

## Work the phases in this order (cheap reframes first, so the why-trace runs on a clean claim)

0. **Statement — 4-step "Explicit" (ALWAYS first).** Confirm the
   Description is one explicit, well-formed sentence in the canonical form
   `We assume [target user/system] will [behavior/action] because
   [reason]` — a real who, a real action, a real reason. If the
   who/action/reason is vague, missing, or the title is doing the work
   instead, fix it here before anything else.
1. **Hyperbole** → rewrite to a flat, testable sentence. Confirm wording.
2. **Non-atomic** → name the bundled claims; ask which is load-bearing.
   Keep the core here, spin siblings into new records (each its own grill),
   wire `Depends on`.
3. **Unfalsifiable** → "what observable evidence would prove this wrong?"
   If none exists it's a belief — reframe to a measurable claim or retire
   it. **This is a grill check, not a stored field** (`the evidence-remodel slice`) — the
   concrete number surfaces here, out loud, and is re-authored as the bar's
   `We're right if` when `/experiment-design` later pre-registers a test;
   nothing is written to the assumption itself
   (`assumption-guardrails.md §1`).
   **The falsification test drives the Question Type** (the question-type-aware evidence ladder). Once you
   have a concrete "we're wrong if…", infer the question type from it:
   - "no one reports this pain / no one describes this mechanism" → **Existence**
   - "the rate is below X% / fewer than N of N" → **Prevalence**
   - "the treatment group doesn't differ from control" → **CausalEffect**
   - "they don't pay / don't sign up / don't commit" → **WillingnessToPay**
   - "they stop using it / drop-off exceeds X" → **ValueUtility**
   - "the regulation prohibits / the regulator rules against" → **Regulatory**
   - "they can't complete the flow / the system can't do X" → **Feasibility**
   Confirm the inferred type with the user and set it on the record. This
   fills the **6th structural slot** (`Question Type`) — an assumption
   without a Question Type has `Completeness %` < 100 and **cannot go Live**.
   **The gaming guard:** the inferred type (from the falsification bar) must
   match the user's stated type. A team can't reframe "will users pay?" as
   "do users express willingness to pay?" (existence question, qual ceiling)
   to avoid running a market test — the falsification bar is what would
   prove the assumption WRONG, not what evidence is cheap. "Users will pay
   $50/mo" is falsified by offering it and watching them not pay →
   WillingnessToPay, full stop. Reject the Draft → Live promotion if the
   inferred and stated types disagree.
4. **Lens check** → "whose decision does this drive?" Set the single Lens
   (from the config's `vocabulary.lens`); if it genuinely drives two, that's
   a split (back to 2). Fills a structural slot.
5. **Duplicate / Contradiction — reconcile vs the register.** One
   semantic search over the register; show the nearest cluster + a
   recommended-keep. Classify each near-match into one of four outcomes
   (recommend one, one-line why) — **transient grill checks, not stored
   tags** (`the evidence-remodel slice`; assumptions carry no body to note them in):
   - **duplicate** → **merge** (one experiment resolves both →
     redirect/retire this record); say out loud, in the grill session,
     which specific dimension made the loser redundant (not just "merged X
     into Y" — name the actual overlap: same metric, same trigger, same
     claim restated).
   - **distinct** → **keep**: independent truth values → confirm
     distinctness out loud by naming the actual discriminating axis
     (different falsifiability threshold · different Lens · different
     trigger/actor · different Theme), not a vague "feels different." A
     boundary statement that doesn't name a concrete dimension doesn't
     satisfy this — push back before moving on. Nothing is written to
     either record either way.
   - **direct contradiction** (the *same* proposition asserted with
     opposite truth values) → **not two assumptions**: reconcile into
     **one** record (`assumption-guardrails.md §4a`). A merge, not a
     `Contradicts` edge.
   - **tension** (two *distinct, both-stated* claims that can't both hold in
     practice) → **keep both**, wire the **`Contradicts`** relation both
     ways. Say out loud which experiment will decide which holds — that
     provenance lives with the eventual resolving Experiment bar line, not
     a written note on either assumption.
   - **Passing this check** = the tension or overlap has been *examined and
     wired* (if a `Contradicts` edge applies). It does **not** require
     *resolving* the tension; one side winning is an evidence verdict,
     owned by the evidence skills.
6. **Scoring justification** → **Impact (the seed) is the only
   hand-scored number — pure intrinsic severity.** Quote the matched Impact
   band (`assumption-guardrails.md §3`), confirm/adjust the score, and
   write band + one-line reason into `Scoring justification` so it's
   auditable. Don't fold in dependents, committed plans, or decisions — the
   seed is purely intrinsic. The propagation applies dependents and
   standing decisions to `Derived Impact` mechanically on every touching
   write; an experiment never touches Impact at all. (Re-score flagged
   contradictions — e.g. "the thesis dies" scored 10.)
   **Then handle evidence → Confidence (derived, never typed):** pull the
   record's linked `Readings` and quote what you already know, and
   **actively ask for any *unlinked* signal too:** *"What else bears on this
   — a customer reaction, an interview quote, a support ticket, one
   person's opinion, analogous data?"* Map each signal to *this* claim
   before it counts (evidence for a sibling/dependency doesn't bear on this
   record), and weigh it on the evidence ladder (say < do < commit). A
   *planned* test ("X wants a demo") is not evidence yet — it's an
   experiment to design → hand off to `/experiment-design`. **Boundary:**
   loose informal signal (a passing opinion, a remembered reaction) is
   noted in conversation only, nowhere to write it. But if a piece is
   **concrete historic evidence** — a past user interview, a survey already
   run, desk research already done, a real revealed-preference signal —
   formalise it via **§ Log existing (historic) evidence** below. Either
   way, **never move `Status`** here — Confidence-only. Fills the Impact
   and Scoring justification slots.
7. **Why-trace** (last — needs a clean, atomic, falsifiable claim) → full
   disciplined trace per `assumption-guardrails.md §2`. **This is a
   transient grill stage — nothing is stored beyond the relation** it
   produces:
   - Question form: *"What specific condition or action directly caused
     [prev]?"*
   - Each answer: verifiable fact · in our control · process not blame.
   - **Therefore-test** bottom→top; fix any leap.
   - **Closure — wire it, don't write it up:** each "why" answer is
     **either an assumption or a ground truth.** An assumption → dedupe-search
     first, reuse the record that already says it and wire `Depends on`,
     else offer to create it (its own grill, seeded via `seed.md`). A
     **ground truth** (settled fact, not a bet) needs no record and no
     relation — it terminates the branch on the spot.
   - **Depth is per-chain:** trace from this parent down `Depends on`; depth
     accrues across records, so don't re-run. **"Five" is a name, not a
     target — never pad.** Stop a branch at the FIRST of: (1) it
     **converges** onto an existing record (ideal close — wire `Depends on`
     + stop); (2) a **ground truth**; (3) it **stops being load-bearing** —
     *if the next answer were false, would it change the bet or the
     experiment? If no, treat the parent as root, stop.* **Soft ceiling:**
     chains hit a stop within ~3 new whys; still inventing abstract answers
     at three (usually you've slid from a fact about your users into a
     general law of human behaviour) is the rabbit-hole tripwire — stop,
     treat as root. A true cycle means the two are one assumption → merge.
   - Fills the "dependencies traced" slot — at least one `Depends on` /
     `Enables` link (or a conscious, stated root).
8. **Language, glossary & concision** (runs last, once the wording is
   stable) → grill the *vocabulary* and the *phrasing*, not just the claim,
   so the register speaks one language and says it in as few plain words
   as possible.
   - Run the terminology check (`../../_shared/ubiquitous-language.md`) over
     the **final** title + Description, audience = Internal.
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
   - Passes when both checks are clean (zero outstanding must-fix/verbose
     findings) and any unknown term is either added or consciously left.

## Log existing (historic) evidence → Readings (optional, retrospective)

When phase 6 surfaces a piece of **concrete historic evidence** — a past user
interview, a survey already run, desk research already done, a real
revealed-preference signal — formalise it by running the shared procedure in
`../../_shared/historic-evidence.md`, gated. That helper owns the full flow
(search the configured evidence sources → triage against Description +
`Lens` → set `Rung` / `Result` / date / source link → the
retrospective-honesty check → gated write → Confidence roll-up) and is the
same procedure `/find-evidence` (standalone) and loop mode (autonomous) use,
so all three stay in lockstep.

Pass it the record you're grilling (ID, Description, Lens, current
Confidence). It writes each qualifying piece as a **bare, conclusive**
Reading (`Result` = Validated / Invalidated / Inconclusive, never
`Running` — a Reading has no other state), one at a time, gated.
**Confidence-only — logging evidence never moves the assumption's
`Status`; the sole exception, a human-affirmed kill (`Invalidated` at a
rung ≥ the strongest validating rung), is a separate gated `Live` →
`Invalidated` write.**

> Standalone, outside a grill? Use `/find-evidence` — the thin wrapper
> around the same helper for when you only want the evidence sweep.

## Close out

- **`Completeness % = 100`** (every structural slot present) **and** every
  semantic check above resolved this session → record is guardrail-complete;
  **flip `Status` `Draft` → `Live` in the same gated close-out write** — the
  row is now ranked by Risk and competes as a test candidate on its own —
  **no plan link required**. A standing committed Experiment linking it via
  its own bar line gives a view onto it but never lifts its Impact or
  decides whether it competes — a plan never touches Impact; that link is
  `/experiment-design`'s write, not this skill's. Full flow:
  `registry-schema.md §Status & derived views`.
- **Machine-grilled record (this run's loop output):** a record loop
  touched but left `Draft` at `Completeness % = 100` is exactly the
  hand-off signal — walk it here, past the record's `Owner`, before the
  `Draft → Live` flip; there is no stored review tag to clear
  (`the evidence-remodel slice`), the queue is just "Draft at 100."
- **Terminology** — confirm zero outstanding must-fix before the record
  write; if the wording changed after phase 8, re-run the check once more.
- **Gate the write:** show final title / Description / scores / relations
  and confirm before writing. One record at a time.
- **Deep link to the record.** After the close-out write, if
  `validation-os.config.yaml` sets `dashboard_url`, emit a one-line markdown
  link to the record's page — `[ASM-014](<DASHBOARD_URL>#assumption/ASM-014)`
  where `DASHBOARD_URL` is the configured `dashboard_url` value — so the user
  can open it in the dashboard. If `dashboard_url` is unset (local-files, no
  deployed dashboard), skip the link; never guess a host.
- Offer the next record in the Draft queue (next-highest Risk).

## Never

- Never invent why-trace facts to "finish" a record — leave the prompt and
  move on if the user doesn't have the fact. A blank-but-honest chain beats
  a fabricated one.
- Never write `Risk` / `Confidence` / `Derived Impact` / `Completeness %`
  (all derived). Never renumber identifiers.
- Never log a *planned/future* test as historic evidence — that's
  `/experiment-design`. A historic Reading's `Result` is conclusive at
  creation, never `Running` (a Reading has no other state).
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
