---
name: find-evidence
description: >-
  Find and log EXISTING evidence for a single assumption — in two flavours of
  the same "go out, explore, come back" task: INTERNAL (historic calls and
  user interviews, notes, team chat, email — whatever evidence sources the
  config declares) and DESK/WEB research (published secondary sources —
  regulation, market sizing, competitor pricing/features, industry
  benchmarks, precedent). Picks the right flavour for the claim: world facts
  knowable without new participants → desk research; what you already heard
  from your own users/market → internal; can run both. Desk research runs
  under a trust harness (sub-question decomposition, A/B/C/D source tiering,
  triangulation, recency, provenance for every claim, an adversarial refute
  pass, base-rate≠validation). Each qualifying hit is triaged against the
  assumption's Metric for truth + Lens and written as a conclusive
  Experiment record — gated per record. Confidence recomputes automatically
  (signed: evidence-against lowers it); the assumption's Status moves only
  on a human-affirmed kill (Confidence in the kill zone, ≤ −50, gated Live
  to Invalidated). Use for "find evidence for this
  assumption", "what do we already know about X", "desk research this
  assumption", "what does the market/regulation/competition say about X",
  "size the market for Y", "are there historic interviews suggesting demand
  for X", "log existing evidence for <assumption>". For the full guardrail
  grill of a record, use /assumptions; to design a NEW forward test, use
  /experiment-design.
license: MIT
---

# Find evidence

Take one assumption and answer a single question: **what evidence do we
already have for or against it, and how strong is it?** The evidence lives
in two places — your own record (past calls, interviews, notes) and the
outside world (published, secondary sources). Both are the same task with a
different `sources` list: go out, explore, come back, and capture each
qualifying piece as a conclusive Experiment record so `Confidence` reflects
what's actually known.

This skill is a **thin, on-demand entry point** to the shared evidence
procedure — `../_shared/historic-evidence.md` owns the mechanics (search →
triage → write → Confidence roll-up); this file is only the wrapper that
resolves the assumption, **picks the flavour(s)**, runs that procedure, and
closes out. It deliberately does **not** grill: no splitting, no 5 Whys, no
scoring, no vocabulary pass. If the record needs that, it's an
`/assumptions` (single mode) job.

Read `validation-os.config.yaml` (walk up from the working directory): the
connector for register access, `evidence_sources` for what's sweepable, and
the `source_map` for where each artifact kind lives and how to fetch it
(`../_shared/experiment-guardrails.md §0`). Per-source search guidance lives
in `references/` (one file per source type). No internal sources configured →
the internal flavour still works by asking the user to paste or point at
material — pasted material is filed into the "Raw evidence" home first, so a
canonical link exists to store on the reading.

## When to reach for this vs. its siblings

- **`/find-evidence` (here)** — you have a record and want to know & log
  what evidence already exists, internal **or** desk/web. Backward-looking,
  one record, gated.
- **`/assumptions` (single mode)** — full guardrail grill of a record; runs
  this evidence sweep as one phase. Reach for it when the *claim itself*
  still needs work.
- **`/experiment-design`** (and **`/meeting-prep`**) — design a *new*
  forward test (`Result = Running`), including interview guides and
  `Desk research` tests that this skill later **closes out** once they've
  actually been run.
- **`/assumptions` (loop mode)** — the whole register, autonomously.

## Procedure

### 1. Resolve the assumption

Identify the record the user means (a title, a link/ID, or "the one we were
just looking at"). Fetch it via the connector and read: Description,
**Metric for truth**, Lens, current Confidence, Status.

If the reference is ambiguous, query the register and show the top matches
with their Description — confirm which one before searching. Evidence
logged against the wrong record is worse than none.

### 2. Pick the flavour (which `sources` fit this claim)

The flavour is the `sources` list. Choose by what could actually settle the
`Metric for truth` — honour an explicit ask ("desk research this" → `web`;
"what have we heard" → internal), otherwise reason from the claim:

**Desk / web (`web`)** — *world facts knowable in hours without new
participants:* market sizing / TAM, regulation & compliance, competitor
pricing/features/funding, published benchmarks & base rates,
precedent/feasibility.

**Internal (the config's internal `evidence_sources`)** — *what your own
users, customers, or market have already said or done:* demand signal from
past calls/interviews, a survey already run, an observation in a note or
thread. Call transcripts are the primary internal source when available.

**Neither — don't force a flavour:**

- **"Will *our* users do/pay/engage X?"** is a behavioural claim. Desk
  research can set a *base rate* but can't validate it, and there may be no
  internal signal yet → say so and point to `/experiment-design`. Log a
  base rate as context only (`Inconclusive`), never as validation.
- **Your own product metrics / scoreboard numbers** (a PostHog cohort, a CRM
  stage count, a product-DB figure) are **Goals-side, never logged here.** A
  measured scoreboard number is a *goal reading* — degree of achievement
  against pre-set bars — not a Testing rung, and there is no retro path
  (`docs/goals.md §Found numbers`). Surface it and route to `/goals` draft
  ("24 of 34 are paying — mint a goal on this?"): a forward goal calibrated
  off the found number. A discovery sweep of analytics **writes nothing** —
  it only surfaces and routes. World-facts (market size, regulation) are
  unaffected: those stay Testing-side desk research.

You may run **both** flavours for one assumption when both bear on it —
each qualifying piece becomes its own record.

### 3. Run the evidence sweep

Hand off to `../_shared/historic-evidence.md` with:

```yaml
assumption: { id, description, metric_for_truth, lens, confidence }  # step 1
gate_mode:  interactive       # confirm each Experiment record before writing
sources:    <the flavour(s) chosen in step 2>
```

That procedure does the searching, triage (against Metric for truth +
Lens), Type/Result/Date/source-link assignment, the retrospective-honesty
check, the gated write, and the Confidence roll-up. Follow it verbatim —
don't re-derive the schema here. It first **pulls the assumption's open
`Running` records** (interview guides, `Desk research` tests) so that a
found transcript which is *the run of* one of those guides **closes that
record out** — flips its `Result`, sets the outcome date, writes findings —
rather than creating a duplicate. The match is proposed and confirmed at the
gate, never auto-applied. **When `web` is in `sources` it applies the desk
disciplines in `../_shared/historic-evidence.md` §1 and §4** — tiering,
triangulation, exact quotes with dates, the counter-case search — the rigor
that makes a published fact trustworthy enough to write into the register.

**Show your work as you go.** For each candidate surface: source + link,
one line of what it shows, the rung you'd assign and why, and the honest
`Result`. For desk evidence include the tier + publication date, and the
counter-sources you checked. Include the hits you considered and
**dropped** (wrong Lens, only bears on a dependency, too vague, Tier D) so
the read is auditable. Search the disconfirming case too.

### 4. Close out

- Report what changed: for each record, say whether it was a **new**
  conclusive record or an existing `Running` guide you **closed out**
  (`Running` → verdict), with links, and Confidence before → after.
- Any verdict changes nothing on the assumption beyond Confidence — an
  invalidating one lowers it (re-test signal). If the recompute lands the
  Confidence at or below **−50**, the row is in the kill lane: propose the
  gated `Live` → `Invalidated` flip, the human affirms; never auto-apply.
- "Swept, no qualifying hit" is a complete, honest outcome — say so plainly
  rather than logging a weak record to look productive.
- **Goal tripwire** (`../../docs/goals.md §Out`): if a conclusive verdict
  landed, query standing (`Draft`/`Active`) Goal records that link this
  assumption via `Based on assumption` (or name it in a risk-acceptance
  line). For each, surface it: *"this goal rests on the belief this verdict
  just supported or killed — review it (re-cut, or re-accept the bet)?"*
  Surfacing only — never flip a goal's lifecycle or edit a bar here; the
  review itself is a `/goals` job.
- If the sweep exposed that the assumption's Metric for truth is too vague
  to judge evidence against, that's a grill problem — flag it and point at
  `/assumptions` (single mode); don't fix it here.

**Goal close-out decomposition does *not* run here.** When `/goals` closes a
goal, it decomposes the outcome into per-belief readings **in-skill** (`/goals`
close — `docs/goals.md §Out`); this skill no longer owns that step. What
`/find-evidence` still does for goals is fire the **tripwire** above: a
conclusive verdict surfaces the standing goals resting on the belief.

## Never

- Never grill the record here (split / 5 Whys / score / vocabulary) —
  that's `/assumptions`. This skill only finds and logs existing evidence.
- Never flip the assumption `Status` on a verdict — Confidence-only. The
  one exception is the kill: Confidence at or below −50 flips `Live` →
  `Invalidated`, gated and human-affirmed.
- Never log a *not-yet-run* test as existing evidence — designing a future
  test is `/experiment-design`. But **do** close out a `Running` guide once
  its interview has actually happened (flip it in place, don't duplicate
  it).
- Never cherry-pick supporting hits — log disconfirming evidence
  (internal) and capture conflicting sources (desk).
- Never write a desk fact you didn't fetch and quote, and never mark a
  your-user behavioural claim Validated off desk research (base rate ≠
  validation).
