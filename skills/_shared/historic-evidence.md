# Shared helper — historic evidence

The canonical procedure for **logging evidence that already exists** against
an assumption. Evidence "already exists" in two flavours of the same task —
*go out, explore, come back* — and both write the same kind of record:

- **Internal** — a past interview, call, survey, observation, or note
  sitting in your own record (call transcripts, notes, chat, email).
- **Desk (web)** — a published fact already out in the world: regulation,
  official statistics, competitor pricing, an industry benchmark, precedent.

The **only** thing that differs between them is the `sources` list; the
triage, the write, and the honesty rails are identical. Each qualifying
artifact becomes **one Reading carrying a `beliefs[]` entry per belief it
addresses** — **bare** by default (`experimentId` null, no Experiment
origin) — with each entry's `Result` set once at logging to the outcome the
evidence already produced (Validated / Invalidated / Inconclusive; a Reading
has no other state, `OPS-1305`). The linked assumptions' `Confidence` then
rolls up on its own.

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
| Record type | Experiment (the plan) | Reading (one artifact row + a `beliefs[]` entry per belief; bare — `experimentId` null) |
| `Result` | n/a — the plan hasn't yielded evidence yet | Conclusive at logging, **per `beliefs[]` entry** (Validated / Invalidated / Inconclusive) — a Reading has no other state |
| `Date` | Today (start) | When the evidence occurred; for desk, the research date |
| Write-up | Protocol into the Experiment body | Verbatim quote/excerpt into the reading's `body`; per-belief scoring rationale into each entry's `Grading justification` |
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

Schema: the field map, the 7-rung `Rung` ladder, and the `Result` options for
Readings are owned by `experiment-guardrails.md` (§0, §2) and
`registry-schema.md` (§Field map — Readings) — read them for the schema; do
not redefine it here. On the Notion connector, verify the Readings→
Assumption relation target before the first write
(`connectors/notion.md §Cautions`) — a record linked to the wrong register
rolls up Confidence nowhere.

---

## Procedure

One artifact at a time — each becomes **one Reading** whose `beliefs[]`
entries cover every belief that artifact addresses.

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

**External-source gate (first — before anything else): is the source external
to the team?** Evidence is an observation from **outside the team** — a
customer, user, prospect, partner, third-party dataset, published source, or
observed market behaviour. **Internal opinion is not evidence:** a board /
strategy / planning meeting, a founder's or the team's view of the market, an
internal doc is **hypothesis/framing** — capture it as the assumption's
`Scoring justification` (rationale) via `/assumptions`, **not a reading**, and
it never moves Confidence. **From an internal meeting, extract only the
external facts it reports** (a customer's decision, a user's observed
behaviour, a partner's commitment) and attribute them to the **true external
source** — `Source` = that event, graded on its rung, `Credibility` lowered for
the second-hand relay (`experiment-guardrails.md §0`). If the candidate is
purely internal, drop it from the sweep (note it as considered-and-dropped,
"internal → framing, not evidence").

Does the artifact genuinely bear on *this* claim? Map it to the assumption's
`description` + `lens` — evidence for a sibling or dependency doesn't count as
an entry for this belief. Weigh it on the **say < do < commit** ladder (the
rung), **and** on *who* the source is (`Source quality`,
`experiment-guardrails.md §2`). If the **same artifact** also clearly
addresses other live beliefs, note them — they become **additional `beliefs[]`
entries on the same Reading** (§3), never separate Readings. Drop anything that
doesn't map; note it as considered-and-dropped so the caller can show its work.

### 3. Set the record, per artifact

A found artifact becomes **one Reading** — an artifact row plus one `beliefs[]`
entry per belief it addressed. **Reading-level fields (one value each,
describing the source and origin):**

- **`Source`** = the independence-dedupe key: the generator (person /
  dataset / cohort) only. **`Context links`** = whatever provenance detail
  (recording, CRM row, user id) rode along with it — 0..N, drives no math.
- **`Representativeness`** / **`Credibility`** = each picked from
  {1.0, 0.7, 0.5} (`experiment-guardrails.md §2`) — they grade the **source**,
  so one pick per Reading, shared across its entries. `Source quality` is
  derived from their product. Scales each entry's weight **within** its rung,
  never its value across rungs.
- **`Experiment`** (`experimentId`) = **default `null` — found evidence is
  bare.** Set it **only** when this Reading is the *direct output of executing
  a pre-registered plan* — i.e. the artifact was generated by concluding a
  committed `Running` experiment (confirm it against the one live plan first;
  that path is really conclude mode, `../find-evidence/references/conclude-plan.md`).
  **Never** set it just because the artifact happens to bear on a belief the
  experiment also tests. **Gate: "Was this generated by executing a
  pre-registered plan? If unsure, it's found"** → leave `experimentId` null.
  Its presence sets the reading-level `commitmentFactor` to 1.0 vs 0.85 for
  bare, so a mis-set origin silently inflates weight.
- **`Rung`** (**row-level — one rung per artifact**) = the rung matching **what
  the artifact shows**, graded once for the whole reading (`experiment-guardrails.md
  §2`) — **Testing rungs only**: a stated opinion or an unprompted report of a
  real past behaviour → 🧪 `Anecdotal` (the floor); a verbal yes to a mock →
  🧪 `Pitch-deck reaction`; regulation / published data / competitor fact →
  🧪 `Desk research`; a structured questionnaire already run → 🧪 `Survey at
  scale`; genuine hands-on unpaid use → 🧪 `Prototype usage`. **Found evidence
  never mints a 🎯 Market-rung reading** — there are no bare Market-rung
  readings (`experiment-guardrails.md §6`). A measured scoreboard number
  (product metric, CRM level) is Market-side: don't log it — surface it and
  route to `/experiment-design` (`docs/goals.md §Found numbers`). **One rung
  per artifact:** if the artifact genuinely spans two rungs (a call with a real
  prototype-usage demo **and** a past-behaviour discussion), **split it into
  separate readings, one per rung** — never average two rungs into one reading.
- **`Magnitude band`** (row-level) = only on a Market rung; omit on Testing
  (so, in practice, omitted for found evidence).
- **`Date`** = when the evidence occurred (historic internal) or the
  research date (desk), never a future date.
- **`Owner`** if known.
- **`body`** = the reading's **`## Quote` + `## Source`** body (canonical
  template, `registry-schema.md §Field map — Readings`): `## Quote` = the
  verbatim text of what the source said/did; `## Source` = who / when / link.
  Analysis stays out — the per-belief scoring rationale goes in each entry's
  `Grading justification`, never here. For desk evidence, the key quotes/figures
  with their URLs under `## Quote`, the publication + retrieval under `## Source`.

**Then, one `beliefs[]` entry per belief the artifact addressed:**

- **`Assumption`** = the one belief this entry scores. The target belief
  always gets an entry; add further entries for any other live belief the
  **same artifact** clearly addresses (surfaced at the gate, §5).
- **`Result`** = Validated / Invalidated / Inconclusive for this belief,
  judged honestly against that assumption's **current** `description`. (Rung is
  the reading's, shared; only the sign is per belief.)
- **`Strength`** = derived per entry from the **reading's row-level `Rung`**
  anchor × sign(this entry's `Result`).
- **`Grading justification`** — the per-entry scoring rationale (distinct from
  the reading-level `body`, which holds the verbatim text): why this `Result`
  against the belief, how the reading's rung + Rep×Cred bear on it. For desk
  evidence, also fold in the per-sub-question findings with tier + dates, how
  conflicts were weighed, caveats (single-sourced or stale claims), and the
  sources considered & dropped — the reasoning here, the raw quotes in `body`.

### 4. Retrospective-honesty guardrail

No pass/kill bar was pre-registered, so the read is exposed to post-hoc fit.
Counter it deliberately — both flavours:

> **Exception — the run of a `Running` plan (§5).** When the artifact is the
> run of an existing `Running` plan that carries a pre-registered `We're right
> if` / `We're wrong if` bar line for a belief, judge that belief's `beliefs[]`
> entry against **that bar**, not this retrospective rail. The bar predates the
> evidence, so post-hoc fit isn't a risk — this is the *stronger* read, and it
> is the one case that sets `experimentId` (the artifact was generated by
> executing the plan). One artifact is **one Reading with a `beliefs[]` entry
> per belief it actually addressed**, each entry judged against its own bar;
> signal on a belief the plan didn't bundle is an **off-plan entry** (no bar,
> the same experiment origin as provenance — `experiment-guardrails.md §0`).
> Even then, grade the reading's **(row-level) `Rung`** from what the artifact
> shows, not from the bar. Fall back to the rail below only for a belief with no
> bar in the plan.

- Judge each entry against its assumption's `description` **as written** —
  don't reshape the bar to fit the hit you found.
- Prefer **Inconclusive** when the material wasn't built to test this
  belief (most incidental internal mentions are Inconclusive; so is desk
  evidence that only sets a **base rate** for a *your-user behaviour* —
  desk research can't validate what your own users will do, only what the
  world already shows).
- Log disconfirming evidence as **Invalidated** — never silently drop the
  hits that cut against the bet. Cherry-picking supporting evidence is the
  failure mode this guardrail exists to stop.

### 5. Write — gated or logged, per `gate_mode`

- **`interactive`** → gated write (`gated-writes.md`). Render the record —
  reading-level fields (`Source`, `Context links`, `Representativeness`,
  `Credibility`, `Rung`, `Magnitude band`, `Experiment`, `Date`, and the
  `## Quote` + `## Source` `body`) plus each `beliefs[]` entry (`Assumption`,
  `Result`, `Grading justification`) — confirm, then create it and link each
  entry's `Assumption`. **One Reading per artifact** at **one `Rung`**, with as
  many `beliefs[]` entries as beliefs it addressed — never several Readings for
  one artifact, and split a genuinely mixed-rung artifact into one reading per
  rung.
- **`autonomous`** → write directly (no gate) and append to the run-log
  (record id, source link, and per entry: `Assumption`, `Rung`, `Result`) so
  every mutation is auditable.

"Swept with no qualifying hit" is a valid, complete outcome — record the
absence; don't manufacture a weak record to fill space.

**Logging entries against an open plan instead of duplicating it.** When a
found artifact is *the run of* one of the `Running` plans pulled in §1, add a
`beliefs[]` **entry per bundled belief it addressed** to one Reading — judged
against each belief's pre-registered bar (§4), with `experimentId` set to that
plan (the one origin-setting case, §3) — rather than minting fresh records; set
the `Date` and write each entry's findings into its `Grading justification`.
The match is **proposed, never assumed**: surface the candidate `Running` plan
alongside the matching signals (interviewee, a date after the plan was created,
topic overlap) and let the caller confirm *log against this* vs *log a bare
Reading*. If nothing plausibly matches, create a new **bare** Reading
(`experimentId` null) as normal — never overwrite on a weak match, and never
set the origin on a mere topic overlap.

**A concluded reading is not a closed plan.** Logging the reading concludes
the *reading*; **closure of the plan** — rendering each per-belief bar verdict
against the full pre-registered N and writing the rollup report — is a
separate **human** act (`experiment-guardrails.md §6`), and those verdicts are
reports, never Confidence inputs (the readings already carried the evidence).
When the readings you just logged bring the plan to its pre-registered N,
**offer** closure — never perform it silently.

### 6. After writing

Each linked assumption's `Confidence` recomputes from the new entry against it
(only **concluded** Validated/Invalidated entries enter the signed weighted
average — `Strength` is 0 otherwise; entries dedupe per (belief, source), and
each entry's weight carries the reading-level `commitmentFactor` — 0.85 for the
bare reading you just wrote — `experiment-guardrails.md §2`), and `Risk`
follows. A multi-entry Reading rolls up into **each** belief it named. On the
local-files connector, the skill recomputes and rewrites both in the same gated
edit (`connectors/local-files.md §Derived fields`). **Never** flip the
assumption `Status` — but if a recomputed Confidence lands at or below **−50**,
say so: the row is in the kill lane and audit will chase a human kill verdict
(`register-audit.md`).

There is no corroboration count to maintain — replication is just more
evidence mass in the average.

---

## Never

- Never log a *not-yet-run* test as existing evidence — that's
  `/experiment-design`, and its plan stays `Running` until run. But a
  `Running` plan whose test **has** now happened is the opposite case:
  close it out in place (§5) — don't leave it stale or duplicate it.
- Never flip the assumption `Status` from logging evidence.
- Never log internal opinion as evidence — a board/strategy/planning meeting or
  team view of the market is hypothesis/framing, not a reading (it goes in the
  assumption's `Scoring justification`). Evidence is external; from an internal
  meeting log only the external facts it reports, attributed to the external
  source at lower `Credibility` (`experiment-guardrails.md §0`).
- Never fan one artifact into several Readings **per belief** — one artifact at
  one rung is one Reading with a `beliefs[]` entry per belief it addressed. The
  **only** reason to make several Readings from one artifact is a genuine
  **rung split** (a call with a real prototype-usage demo + a discussion → one
  reading per rung), never one-per-belief.
- Never grade two rungs into one Reading — `Rung` is row-level, one per
  artifact; split a mixed-rung artifact instead.
- Never set `experimentId` on found evidence unless the Reading is the direct
  output of executing a pre-registered plan (§3 gate) — a shared topic with a
  running experiment is not an origin; if unsure, leave it bare.
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
