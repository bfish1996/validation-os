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
becomes a **bare Reading** — no Experiment origin — with `Result` set once
at logging to the outcome the evidence already produced (Validated /
Invalidated / Inconclusive; a Reading has no other state, `OPS-1305`). The
assumption's `Confidence` then rolls up on its own.

This is the **retrospective sibling of `/experiment-design`**. That skill
designs a *new* forward-looking Experiment plan (`Status = Running`, no
evidence yet); this captures a Reading against a fact, observation, or test
that already exists — never a plan. Readings write to the Readings
register; `/experiment-design` writes to the Experiments register.

> **Confidence-only.** This procedure **never moves the assumption's
> `Status`.** Only a human-affirmed kill ever flips it
> (`Live → Invalidated`) — a separate, gated call.

|  | New evidence (`/experiment-design`) | Existing evidence (here) |
|---|---|---|
| Direction | Forward — designs a plan to run | Backward — finds what already exists |
| Record type | Experiment (the plan) | Reading (bare — no Experiment origin) |
| `Result` | n/a — the plan hasn't yielded evidence yet | Conclusive at logging (Validated / Invalidated / Inconclusive) — a Reading has no other state |
| `Date` | Today (start) | When the evidence occurred; for desk, the research date |
| Write-up | Protocol into the Experiment body | `Grading justification` field only — Readings carry no body |
| Touches assumption `Status`? | **Never** — a `Running` Experiment puts the row in the derived Testing view | **Never** (Confidence-only) |

---

## Inputs

```yaml
assumption:                     # the record the evidence attaches to
  id:               <record id>
  description:      <string>    # the atomic, falsifiable claim — evidence is
                                 # judged against THIS directly (no stored
                                 # `Metric for truth` field, `OPS-1305`)
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
search + verification keep the desk disciplines** — source tiering,
triangulation, recency, provenance-for-every-claim, and an adversarial
refute pass are what make a published fact trustworthy enough to write into
the register. (These disciplines graduate to a dedicated strength-of-evidence
rubric in future work; until it lands, §1 and §4 here are the bar.)

With **no internal sources configured**, the internal flavour degrades to
asking the user to paste or point at material (notes, a transcript file, an
export) — the triage and write below apply unchanged.

Schema: the field map, the 8-rung `Rung` ladder, and the `Result` options for
Readings are owned by `experiment-guardrails.md` (§0, §2) and
`registry-schema.md` (§Field map — Readings) — read them for the schema; do
not redefine it here. On the Notion connector, verify the Readings→
Assumption relation target before the first write
(`connectors/notion.md §Cautions`) — a record linked to the wrong register
rolls up Confidence nowhere.

---

## Procedure

One piece of evidence at a time.

### 1. Search the sources

Sweep the requested `sources` for material bearing on the assumption's
`description` + `lens`. **Search for the disconfirming case too**, not just
the supporting one — the whole point is an honest read.

**Pre-sweep — pull the assumption's open experiments first.** Before
touching the raw sources, query Experiments for plans whose composed bar
lines name this assumption **and** `Status = Running` — especially
interview guides and `Desk research` tests. Hold these as candidate
**close-out targets**: a `Running` plan is a test someone already committed
to running, so a transcript or note you find may be *the run of that plan*
rather than fresh evidence. Reconciling against the open record (§5) is what
stops the register filling with duplicates for the same interview.

**Routing — use the config `source_map`.** Locate and fetch artifacts through
the `source_map` (artifact kind → home → how to fetch —
`experiment-guardrails.md §0`): interviews from their transcript home,
prototype sessions from the prototype home, CRM records from Attio, and so on.
The register only ever stores the artifact's **canonical link**, never a
mirror of its contents. Material that arrives by copy-paste (an email thread,
a screenshot, unrecorded-call notes) is filed into the designated **"Raw
evidence"** home first — that mints its canonical link — before it can be
cited on a reading.

- **Internal**: cast wide across the configured sources — call transcripts
  (the primary internal source when available), notes, chat, email, CRM.
- **Desk / web**: decompose the assumption's `description` into
  document-answerable sub-questions, fan out searches per sub-question
  (including the counter-case), fetch and **tier** every source (A —
  primary/authoritative; B — reputable secondary; C — weak/self-interested,
  corroboration only; D — anecdotal, lead-generation only, never cited), and
  pull the **exact quote/figure + URL + publication date**. Load-bearing
  claims need ≥2 independent origins or one Tier-A primary — count origins,
  not restatements. No source, no claim: model priors are never evidence.

### 2. Triage each candidate

Does it genuinely bear on *this* claim? Map it to the assumption's
`description` + `lens` — evidence for a sibling or dependency doesn't count
for this record. Weigh it on the **say < do < commit** ladder (the rung),
**and** on *who* said it (`Source quality`, `experiment-guardrails.md §2`).
Drop anything that doesn't map; note it as considered-and-dropped so the
caller can show its work.

### 3. Set the record, per piece

A found piece of evidence becomes a **bare Reading** (`Experiment` relation
null) — never an Experiment row:

- **`Rung`** = the rung matching the evidence's strength
  (`experiment-guardrails.md §2`) — **Testing rungs only**: a hypothetical
  "I'd use that" → 🧪 `Opinion`; users describing something they **actually
  did**, unprompted → 🧪 `Anecdotal`; a structured questionnaire already
  run → 🧪 `Survey at scale`; regulation / published data / competitor
  fact → 🧪 `Desk research`; unpaid real use → 🧪 `Prototype usage`.
  **Found evidence never mints a 🎯 Market-rung reading** — there are no
  bare Market-rung readings (`experiment-guardrails.md §6`). A measured
  scoreboard number (product metric, CRM level) is Market-side: don't log
  it — surface it and route to `/experiment-design` to mint a forward
  committed plan calibrated off it (`docs/goals.md §Found numbers`).
- **`Source`** = the independence-dedupe key: the generator (person /
  dataset / cohort) only. **`Context links`** = whatever provenance detail
  (recording, CRM row, user id) rode along with it — 0..N, drives no math.
- **`Representativeness`** / **`Credibility`** = each picked from
  {1.0, 0.7, 0.5} (`experiment-guardrails.md §2`). `Source quality` is
  derived from their product. Scales the reading's weight **within** the
  rung, never its value across rungs.
- **`Result`** = Validated / Invalidated / Inconclusive, judged honestly
  against the assumption's **current** `description`.
- **`Date`** = when the evidence occurred (historic internal) or the
  research date (desk), never a future date.
- **`Owner`** if known.
- **`Grading justification`** — the one text field a Reading carries
  (readings have no body, `OPS-1305`): rung + magnitude anchor on Market
  rungs + the Rep×Cred picks with one-line justifications. For desk
  evidence, also fold in the per-sub-question findings with tier + dates +
  exact quotes, conflicts and how they were weighed, caveats (single-sourced
  or stale claims), and the sources considered & dropped — all in this one
  field.

### 4. Retrospective-honesty guardrail

No pass/kill bar was pre-registered, so the read is exposed to post-hoc fit.
Counter it deliberately — both flavours:

> **Exception — the run of a `Running` plan (§5).** When the evidence is the
> run of an existing `Running` plan that carries a pre-registered `We're right
> if` / `We're wrong if` bar line for a belief, judge that belief's reading
> against **that bar**, not this retrospective rail. The bar predates the
> evidence, so post-hoc fit isn't a risk — this is the *stronger* read. One
> artifact yields one reading **per bundled belief it actually addressed**,
> each judged against its own bar; signal on a belief the plan didn't bundle
> is an **off-plan reading** (no bar, experiment link as provenance —
> `experiment-guardrails.md §0`). Fall back to the rail below only for a
> belief with no bar written in the plan.

- Judge against the assumption's `description` **as written** — don't
  reshape the bar to fit the hit you found.
- Prefer **Inconclusive** when the material wasn't built to test this
  belief (most incidental internal mentions are Inconclusive; so is desk
  evidence that only sets a **base rate** for a *your-user behaviour* —
  desk research can't validate what your own users will do, only what the
  world already shows).
- Log disconfirming evidence as **Invalidated** — never silently drop the
  hits that cut against the bet. Cherry-picking supporting evidence is the
  failure mode this guardrail exists to stop.

### 5. Write — gated or logged, per `gate_mode`

- **`interactive`** → gated write (`gated-writes.md`). Render the record
  (`Rung`, `Result`, `Date`, `Source`, `Context links`, relations,
  `Grading justification`) — no body — confirm, then create it and link the
  `Assumption` relation. One record per distinct piece of evidence.
- **`autonomous`** → write directly (no gate) and append to the run-log
  (record id, source link, `Rung`, `Result`) so every mutation is auditable.

"Swept with no qualifying hit" is a valid, complete outcome — record the
absence; don't manufacture a weak record to fill space.

**Logging a reading against an open plan instead of duplicating it.** When a
found artifact is *the run of* one of the `Running` plans pulled in §1,
conclude a **reading per bundled belief it addressed** against that plan —
judged against each belief's pre-registered bar (§4) — rather than minting a
fresh record; set the outcome `Date` and write the findings into
`Grading justification`. The match is **proposed, never assumed**: surface the
candidate `Running` plan alongside the matching signals (interviewee, a date
after the plan was created, topic overlap) and let the caller confirm *log
against this* vs *log a new record*. If nothing plausibly matches, create a
new conclusive record as normal — never overwrite on a weak match.

**A concluded reading is not a closed plan.** Logging the reading concludes
the *reading*; **closure of the plan** — rendering each per-belief bar verdict
against the full pre-registered N and writing the rollup report — is a
separate **human** act (`experiment-guardrails.md §6`), and those verdicts are
reports, never Confidence inputs (the readings already carried the evidence).
When the readings you just logged bring the plan to its pre-registered N,
**offer** closure — never perform it silently.

### 6. After writing

`Confidence` recomputes from the new reading (only **concluded**
Validated/Invalidated readings enter the signed weighted average — `Strength`
is 0 otherwise; same-source readings dedupe — `experiment-guardrails.md
§2`), and `Risk` follows. On the local-files connector, the skill recomputes
and rewrites both in the same gated edit (`connectors/local-files.md
§Derived fields`). **Never** flip the assumption `Status` — but if the
recomputed Confidence lands at or below **−50**, say so: the row is in the
kill lane and audit will chase a human kill verdict (`register-audit.md`).

There is no corroboration count to maintain — replication is just more
evidence mass in the average.

---

## Never

- Never log a *not-yet-run* test as existing evidence — that's
  `/experiment-design`, and its plan stays `Running` until run. But a
  `Running` plan whose test **has** now happened is the opposite case:
  close it out in place (§5) — don't leave it stale or duplicate it.
- Never flip the assumption `Status` from logging evidence.
- Never cherry-pick supporting hits — log disconfirming evidence too, and
  capture conflicting sources.
- Never write a `Rung` value that isn't live in the register.
- Never write a desk fact you didn't fetch and quote — no model priors as
  evidence; and never mark a your-user behavioural claim Validated off desk
  evidence (base rate ≠ validation).
- Never file a long-form research write-up outside evidence: in-repo notes
  live at `docs/evidence/<slug>.md` with front-matter carrying the record
  fields (`rung`, `result`, `source_quality`, `strength`, `date`, `subject`,
  `owner`) — never a `research/` or `notes/` folder. An untyped note is a
  claim with no place in the Confidence rollup.
