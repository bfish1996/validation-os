---
name: find-evidence
description: >-
  Find and log EXISTING evidence for a single assumption, conclude a Running
  Experiment plan, or audit the whole Experiments register — three modes.
  Default flow: log evidence in two flavours of the same "go out, explore,
  come back" task: INTERNAL (historic calls and user interviews, notes, team
  chat, email — whatever evidence sources the config declares) and DESK/WEB
  research (published secondary sources — regulation, market sizing,
  competitor pricing/features, industry benchmarks, precedent). Picks the
  right flavour for the claim: world facts knowable without new participants
  → desk research; what you already heard from your own users/market →
  internal; can run both. Desk research runs under a trust harness
  (sub-question decomposition, A/B/C/D source tiering, triangulation,
  recency, provenance for every claim, an adversarial refute pass,
  base-rate≠validation). Each qualifying hit is triaged against the
  assumption's Description + Lens and written as a bare, conclusive Reading —
  gated per record. Confidence recomputes automatically (signed:
  evidence-against lowers it); the assumption's Status moves only on a
  human-affirmed kill (Confidence in the kill zone, ≤ −50, gated Live to
  Invalidated). Conclude mode: close a Running Experiment (Testing or
  committed Market-grade) — human verdict, hard-gated decomposition of the
  outcome into per-belief readings. Audit mode: read-only Experiments-register
  health report (overdue risk-acceptances, fired tripwires, unclosed plans,
  undecomposed outcomes). Use for "find evidence for this assumption", "what
  do we already know about X", "desk research this assumption", "what does
  the market/regulation/competition say about X", "size the market for Y",
  "are there historic interviews suggesting demand for X", "log existing
  evidence for <assumption>", "close out this experiment", "did we hit the
  target", "audit our experiments". For the full guardrail grill of a
  record, use /assumptions; to design a NEW forward test or commitment, use
  /experiment-design.
license: MIT
---

# Find evidence

Take one assumption and answer a single question: **what evidence do we
already have for or against it, and how strong is it?** The evidence lives
in two places — your own record (past calls, interviews, notes) and the
outside world (published, secondary sources). Both are the same task with a
different `sources` list: go out, explore, come back, and capture each
qualifying piece as a bare, conclusive Reading so `Confidence` reflects
what's actually known.

The **default flow** is a thin, on-demand entry point to the shared evidence
procedure — `../_shared/historic-evidence.md` owns the mechanics (search →
triage → write → Confidence roll-up); this file is only the wrapper that
resolves the assumption, **picks the flavour(s)**, runs that procedure, and
closes out. It deliberately does **not** grill: no splitting, no why-trace,
no scoring, no vocabulary pass. If the record needs that, it's an
`/assumptions` (single mode) job.

Two further modes live alongside it — **conclude** (close a `Running`
Experiment, hard-gated on decomposing its outcome) and **audit** (read-only
Experiments-register health report) — because closing and chasing a plan is
this skill's evidence-side job now, not `/experiment-design`'s.

## Pick the mode

| Mode | Scope | Gate | Use when | Reference |
|---|---|---|---|---|
| **default** | one assumption | gated per record | "find evidence for X", "desk research this" — the flow below | this file |
| **conclude** | one `Running` Experiment | gated, hard gate on decomposition | "close out this experiment", "did we hit the target", the deadline passed | `references/conclude-plan.md` |
| **audit** | whole Experiments register | read-only report | "audit our experiments", "what plans are overdue" | `references/audit.md` |

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
  what evidence already exists, internal **or** desk/web; or you want to
  conclude/audit the Experiments register. Backward-looking, gated.
- **`/assumptions` (single mode)** — full guardrail grill of a record; runs
  this evidence sweep as one phase. Reach for it when the *claim itself*
  still needs work.
- **`/experiment-design`** (and **`/meeting-prep`**) — design a *new*
  forward test or commitment (`Status = Running`), including interview
  guides and `Desk research` tests that this skill later **closes out**
  once they've actually been run.
- **`/assumptions` (loop mode)** — the whole register, autonomously.

## Default flow

### 1. Resolve the assumption

Identify the record the user means (a title, a link/ID, or "the one we were
just looking at"). Fetch it via the connector and read: Description, Lens,
current Confidence, Status.

If the reference is ambiguous, query the register and show the top matches
with their Description — confirm which one before searching. Evidence
logged against the wrong record is worse than none.

### 2. Pick the flavour (which `sources` fit this claim)

The flavour is the `sources` list. Choose by what could actually settle the
claim — honour an explicit ask ("desk research this" → `web`; "what have we
heard" → internal), otherwise reason from the claim:

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
  stage count, a product-DB figure) are **Market-side, never logged here.**
  A measured scoreboard number is a *Market-rung reading* — degree of
  achievement against pre-set bars — not a Testing rung, and there is no
  retro path (`docs/goals.md §Found numbers`). Surface it and route to
  `/experiment-design` ("24 of 34 are paying — mint a committed plan on
  this?"): a forward commitment calibrated off the found number. A
  discovery sweep of analytics **writes nothing** — it only surfaces and
  routes. World-facts (market size, regulation) are unaffected: those stay
  Testing-side desk research.

You may run **both** flavours for one assumption when both bear on it —
each qualifying piece becomes its own record.

### 3. Run the evidence sweep

Hand off to `../_shared/historic-evidence.md` with:

```yaml
assumption: { id, description, lens, confidence }  # step 1
gate_mode:  interactive       # confirm each Reading before writing
sources:    <the flavour(s) chosen in step 2>
```

That procedure does the searching, triage (against the assumption's
Description + Lens), Rung/Result/Date/source-link assignment, the
retrospective-honesty check, the gated write, and the Confidence roll-up.
Follow it verbatim — don't re-derive the schema here. It first **pulls the
assumption's open `Running` plans** (interview guides, `Desk research`
tests) so that a found transcript which is *the run of* one of those plans
**closes that bar line out** — logs the reading against it, judged against
the pre-registered bar — rather than creating a duplicate. The match is
proposed and confirmed at the gate, never auto-applied. **When `web` is in
`sources` it applies the desk disciplines in `../_shared/historic-evidence.md`
§1 and §4** — tiering, triangulation, exact quotes with dates, the
counter-case search — the rigor that makes a published fact trustworthy
enough to write into the register.

**Show your work as you go.** For each candidate surface: source + link,
one line of what it shows, the rung you'd assign and why, and the honest
`Result`. For desk evidence include the tier + publication date, and the
counter-sources you checked. Include the hits you considered and
**dropped** (wrong Lens, only bears on a dependency, too vague, Tier D) so
the read is auditable. Search the disconfirming case too.

### 4. Close out

- Report what changed: for each record, say whether it was a **new** bare
  Reading or a reading logged against an existing `Running` plan's bar line,
  with links, and Confidence before → after.
- Any verdict changes nothing on the assumption beyond Confidence — an
  invalidating one lowers it (re-test signal). If the recompute lands the
  Confidence at or below **−50**, the row is in the kill lane: propose the
  gated `Live` → `Invalidated` flip, the human affirms; never auto-apply.
- "Swept, no qualifying hit" is a complete, honest outcome — say so plainly
  rather than logging a weak record to look productive.
- **Mid-cycle tripwire** (`../../docs/goals.md §Out`): if a conclusive verdict
  landed, query standing (`Draft`/`Running`) committed Experiments whose bar
  lines name this assumption (or that name it in a risk-acceptance line).
  For each, surface it: *"this committed plan rests on the belief this
  verdict just supported or killed — review it (re-cut, or re-accept the
  bet)?"* Surfacing only — never flip the plan's lifecycle or edit a bar
  here; the review itself is `/experiment-design`'s job (this is exactly
  the `experiment-tripwire-unreviewed` check `references/audit.md` chases
  if nobody answers it).
- If the sweep exposed that the assumption's Description is too vague to
  judge evidence against, that's a grill problem — flag it and point at
  `/assumptions` (single mode); don't fix it here.

**Plan close-out decomposition does *not* run in the default flow.** That's
**conclude mode** (`references/conclude-plan.md`) — a separate, hard-gated
entry point for closing a `Running` Experiment. What the default flow still
does is fire the **tripwire** above: a conclusive verdict surfaces the
standing committed plans resting on the belief.

## Never

- Never grill the record here (split / why-trace / score / vocabulary) —
  that's `/assumptions`. This skill only finds and logs existing evidence,
  concludes plans, and audits.
- Never flip the assumption `Status` on a verdict — Confidence-only. The
  one exception is the kill: Confidence at or below −50 flips `Live` →
  `Invalidated`, gated and human-affirmed.
- Never log a *not-yet-run* test as existing evidence — designing a future
  test is `/experiment-design`. But **do** log a reading against a
  `Running` plan's bar line once its interview has actually happened
  (that's the default flow's §3 reconciliation, not a duplicate).
- Never cherry-pick supporting hits — log disconfirming evidence
  (internal) and capture conflicting sources (desk).
- Never write a desk fact you didn't fetch and quote, and never mark a
  your-user behavioural claim Validated off desk research (base rate ≠
  validation).
