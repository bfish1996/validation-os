# Shared helper — historic evidence

The canonical procedure for **logging evidence that already exists** against
an assumption. Evidence "already exists" in two flavours of the same task —
*go out, explore, come back* — and both write the same kind of record:

- **Internal** — a past interview, call, survey, observation, or note
  sitting in your own record (call transcripts, notes, chat, email).
- **Desk (web)** — a published fact already out in the world: regulation,
  official statistics, competitor pricing, an industry benchmark, precedent.

The **only** thing that differs between them is the `sources` list; the
triage, the write, and the honesty rails are identical. Each qualifying hit
becomes a **conclusive** Experiment record — `Result` = the outcome the
evidence already produced (Validated / Invalidated / Inconclusive), never
`Running`. The assumption's `Confidence` then rolls up on its own.

This is the **retrospective sibling of `/experiment-design`**. That skill
designs a *new* forward-looking test (`Result = Running`, no evidence yet);
this captures a test, observation, or published fact that already exists.
Both write to the same Experiments register.

> **Confidence-only.** This procedure **never moves the assumption's
> `Status`.** Only a human-affirmed kill ever flips it
> (`Live → Invalidated`) — a separate, gated call.

|  | New evidence (`/experiment-design`) | Existing evidence (here) |
|---|---|---|
| Direction | Forward — designs a test to run | Backward — finds what already exists |
| `Result` at creation | `Running` | Conclusive (Validated / Invalidated / Inconclusive) |
| `Date` | Today (start) | When the evidence occurred; for desk, the research date |
| Body | Protocol + pre-registered pass/kill bar | Evidence summary + source link(s) + what it shows |
| Touches assumption `Status`? | **Never** — a `Running` record puts the row in the derived Testing view | **Never** (Confidence-only) |

---

## Inputs

```yaml
assumption:                     # the record the evidence attaches to
  id:               <record id>
  description:      <string>    # the atomic claim
  metric_for_truth: <string>    # evidence is judged against THIS
  lens:             <from config vocabulary.lens>  # who the evidence must come from
  confidence:       <current>   # so the caller can report before/after
gate_mode:  interactive | autonomous  # confirm each record, or run-log instead
sources:    <list>              # WHICH flavour(s) to sweep — see below
```

**`sources` is the flavour switch.** Internal values (call transcripts,
chat, email, notes, CRM — whatever the config's `evidence_sources` declares;
per-source search guidance lives in `/find-evidence`'s `references/`) sweep
your own record; `web` sweeps published secondary sources (desk research).
**Default when a caller omits `sources`: the configured internal sources**,
so desk research is strictly opt-in. **When `web` is in `sources`, the
search + verification must follow `desk-research-rubric.md`** — source
tiering, triangulation, recency, provenance-for-every-claim, and an
adversarial refute pass are what make a published fact trustworthy enough to
write into the register.

With **no internal sources configured**, the internal flavour degrades to
asking the user to paste or point at material (notes, a transcript file, an
export) — the triage and write below apply unchanged.

Schema: the field map, the 8-rung `Type` ladder, and the `Result` options
are owned by `experiment-guardrails.md` (§0, §2) — read it for the schema;
do not redefine it here. On the Notion connector, verify the
Experiments→Assumption relation target before the first write
(`connectors/notion.md §Cautions`) — a record linked to the wrong register
rolls up Confidence nowhere.

---

## Procedure

One piece of evidence at a time.

### 1. Search the sources

Sweep the requested `sources` for material bearing on the assumption's
`description` + `metric_for_truth` + `lens`. **Search for the disconfirming
case too**, not just the supporting one — the whole point is an honest read.

**Pre-sweep — pull the assumption's open experiments first.** Before
touching the raw sources, query Experiments for records whose `Assumption`
relation is this assumption **and** `Result = Running` — especially
interview guides and `Desk research` tests. Hold these as candidate
**close-out targets**: a `Running` guide is a test someone already committed
to running, so a transcript or note you find may be *the run of that guide*
rather than fresh evidence. Reconciling against the open record (§5) is what
stops the register filling with duplicates for the same interview.

- **Internal**: cast wide across the configured sources — call transcripts
  (the primary internal source when available), notes, chat, email, CRM.
- **Desk / web**: follow `desk-research-rubric.md` — decompose the
  `metric_for_truth` into document-answerable sub-questions, fan out
  searches per sub-question (including the counter-case), fetch and **tier**
  every source (A/B/C/D), and pull the **exact quote/figure + URL +
  publication date**. No source, no claim.

### 2. Triage each candidate

Does it genuinely bear on *this* claim? Map it to the `metric_for_truth` +
`lens` — evidence for a sibling or dependency doesn't count for this record.
Weigh it on the **say < do < commit** ladder (the rung), **and** on *who*
said it (`Source quality`, `experiment-guardrails.md §2`). Drop anything
that doesn't map; note it as considered-and-dropped so the caller can show
its work.

### 3. Set the record, per piece

- **`Type`** = the rung matching the evidence's strength
  (`experiment-guardrails.md §2`): a hypothetical "I'd use that" → 🔴
  `Opinion`; users describing something they **actually did**, unprompted →
  🔴 `Anecdotal`; a structured questionnaire already run → 🟡
  `Survey at scale`; regulation / published data / competitor fact → 🟡
  `Desk research`; unpaid real use → 🟢 `Prototype usage`; payment / signed
  commitment observed → 🟢 `Signed intent` / `Paying users`. A *measured*
  product metric that bears on the Metric for truth is real behaviour —
  revealed-tier, with the analytics view as the source.
- **`Source quality`** = High / Medium / Low for the source's seniority /
  decision authority / ICP-fit. Modulates Strength **within** the rung,
  never across it.
- **`Result`** = Validated / Invalidated / Inconclusive, judged honestly
  against the **current** `metric_for_truth`.
- **`Date`** = when the evidence occurred (historic internal) or the
  research date (desk), never a future date.
- **`Interviewee` / `Owner`** if known.
- **Body** = a short evidence summary, the **source link(s)**, and what it
  shows vs. the claim. For desk evidence, use the body template in
  `desk-research-rubric.md`.

### 4. Retrospective-honesty guardrail

No pass/kill bar was pre-registered, so the read is exposed to post-hoc fit.
Counter it deliberately — both flavours:

> **Exception — closing out a `Running` guide (§5).** When the evidence is
> the run of an existing `Running` record that already carries a
> pre-registered `We're right if` / `We're wrong if` bar in its body, judge
> `Result` against **that bar**, not this retrospective rail. The bar
> predates the evidence, so post-hoc fit isn't a risk — this is the
> *stronger* read. Fall back to the rail below only when the record has no
> bar written in it.

- Judge against the `metric_for_truth` **as written** — don't reshape the
  bar to fit the hit you found.
- Prefer **Inconclusive** when the material wasn't built to test this
  belief (most incidental internal mentions are Inconclusive; so is desk
  evidence that only sets a **base rate** for a *your-user behaviour* —
  desk research can't validate what your own users will do, only what the
  world already shows; `desk-research-rubric.md §7`).
- Log disconfirming evidence as **Invalidated** — never silently drop the
  hits that cut against the bet. Cherry-picking supporting evidence is the
  failure mode this guardrail exists to stop.

### 5. Write — gated or logged, per `gate_mode`

- **`interactive`** → gated write (`gated-writes.md`). Render the record
  (Type, Result, Date, relations) + body, confirm, then create it and link
  the `Assumption` relation. One record per distinct piece of evidence.
- **`autonomous`** → write directly (no gate) and append to the run-log
  (record id, source link, Type, Result) so every mutation is auditable.

"Swept with no qualifying hit" is a valid, complete outcome — record the
absence; don't manufacture a weak record to fill space.

**Closing out an open experiment instead of duplicating it.** When a found
piece of evidence is *the run of* one of the `Running` records pulled in §1,
close **that** record out in place rather than creating a new one — flip
`Result` to the verdict (judged against its pre-registered bar per §4), set
the outcome `Date` / `Interviewee`, and write the findings into its body.
The match is **proposed, never assumed**: surface the candidate `Running`
record alongside the matching signals (interviewee, a date after the guide
was created, topic overlap) and let the caller confirm *close this out* vs
*log a new record*. If nothing plausibly matches, create a new conclusive
record as normal — never overwrite a `Running` record on a weak match.

### 6. After writing

`Confidence` rolls up from the new Experiment record (it reads only
**proven** evidence — `Strength` is 0 unless `Result` is
Validated/Invalidated), and `Risk` recomputes. On the local-files connector,
the skill recomputes and rewrites both in the same gated edit
(`connectors/local-files.md §Derived fields`). **Never** flip the
assumption `Status`.

**Corroboration (the one number to hand-maintain).** If the record you just
wrote is an **independent, proven** record that **agrees at the
assumption's current top proven rung** — not the same source, not a re-log —
increment the assumption's `Corroboration count`. A disagreeing record, a
lower-rung record, or a duplicate source does **not** count; leave the
number untouched.

---

## Never

- Never log a *not-yet-run* test as existing evidence — that's
  `/experiment-design`, and its record stays `Running` until run. But a
  `Running` record whose test **has** now happened is the opposite case:
  close it out in place (§5) — don't leave it stale or duplicate it.
- Never flip the assumption `Status` from logging evidence.
- Never cherry-pick supporting hits — log disconfirming evidence too, and
  capture conflicting sources.
- Never write a `Type` value that isn't live in the register.
- Never write a desk fact you didn't fetch and quote — no model priors as
  evidence (`desk-research-rubric.md §2`); and never mark a your-user
  behavioural claim Validated off desk evidence (base rate ≠ validation,
  §7).
