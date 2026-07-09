# Bootstrap mode — turn an existing business's history into the register

The other front door, for the other starting condition. **Seed** (`seed.md`)
turns *one* piece of raw material — a call, a topic — into a few stubs.
**Bootstrap** turns *everything a business has already lived through* —
years of calls, email, CRM wins and losses, product telemetry, across every
source the config declares — into a populated register in one pass: new
assumption stubs that already carry evidence, reviewed as a single batch
proposal.

It is not a new choreography. It is seed's stub-extraction and
`../../_shared/historic-evidence.md`'s search/triage/write mechanics, run
side by side across the whole business instead of one document, gated once
instead of once per record (`../../_shared/gated-writes.md §Batch gate`).

Typically offered by `/setup-validation-os` when a workspace belongs to an
existing business rather than a brand-new idea (`setup-validation-os/
SKILL.md` step 8) — but reachable directly any time the ask is "mine our
history," "onboard our existing business," or similar.

Worked example: `../../examples/08-bootstrap-existing-business.md`.

## Preconditions

- **There has to be real history to mine.** A brand-new idea with no calls,
  no customers, no usage yet has nothing for this mode to find — that's
  seed mode (or a blank-topic stub), not bootstrap. Confirm the business
  actually has a track record in at least one configured `evidence_sources`
  entry before starting.
- **An already-populated register changes the job.** If the register has
  substantial existing content, bootstrap's first duty is not to flood it
  with near-duplicates — dedupe every candidate against the *live* register
  (`../../_shared/assumption-guardrails.md §4`) before proposing a new stub,
  the same discipline seed mode already applies per-record.

## Procedure

### 1. Enumerate the sources

Read the config's `evidence_sources` (walk up from the working directory).
For each internal source, load its search guidance from
`../../find-evidence/references/` (`attio.md`, `fireflies.md`, `gmail.md`,
`slack.md`, `mixpanel.md` — whichever are declared). No internal sources
configured → bootstrap degrades to asking the user to paste or point at
material (exports, transcripts), same fallback as `/find-evidence`.

### 2. Wide extraction per source

Sweep every source **as fully as the source allows** — this is a first-pass
inventory, not a targeted search for one claim:

- **Calls / chat / email** (Fireflies, Slack, Gmail) — extract every
  candidate belief stated or implied, using seed mode's method (`seed.md`
  "Detect the seed" → "Stub, then grill" §1). Cast a wide net; dedup and
  triage come later.
- **CRM** (Attio, or any CRM the reference patterns transfer to) — pull
  **both** won and lost/churned records. A signed deal is candidate
  evidence for a stub the same way seed mode reads a call. A **lost or
  churned record's stated lost-reason is candidate disconfirming evidence**
  — treat it as a first-class input, not an afterthought
  (`../../find-evidence/references/attio.md` §Mining lost and churned
  records).
- **Product telemetry** (Mixpanel or equivalent) — pull measured usage,
  retention, and adoption metrics that bear on any candidate belief.
  A measured metric is real behaviour: revealed-tier evidence per
  `../../_shared/historic-evidence.md`'s existing rule, never a stub by
  itself — it only ever *supports or disconfirms* a belief someone actually
  stated (`../../find-evidence/references/mixpanel.md`).

### 3. Cluster into stubs

Group raw findings by the distinct, falsifiable belief they bear on — the
same atomicity discipline as seed mode's "one record per distinct
falsifiable belief." Signals from multiple sources about the same belief
(a call where a prospect says it, a CRM note confirming it, a telemetry
curve backing it up) collapse into **one** stub citing every contributing
source, not one stub per source. Dedupe-search the live register first
(`assumption-guardrails.md §4`) — an existing record absorbs the finding
instead of getting a twin.

### 4. Attach evidence as it's found

Unlike a seed stub (which starts blank, all `Gaps` set, `Confidence = 0`), a
bootstrapped stub can arrive with real Experiment records already proposed
against it — apply `../../_shared/historic-evidence.md` §§2–4 (triage against
the emerging Description + Lens, `Type`/`Source quality`/`Result`
assignment, the retrospective-honesty rail) to every qualifying piece found
in step 2. The stub still carries every phase `Gaps` untouched (Statement,
5 Whys, scoring, language) — evidence changes `Confidence`, never anything
that only single mode's grill is allowed to set.

### 5. Honesty rails — non-negotiable at this scale

- **Search the disconfirming case as hard as the supporting one**, per
  belief — the same rule as `/find-evidence`, easier to skip when sweeping
  years of material fast.
- **Never bury churn / lost-reason findings.** A lost-reason is often the
  single highest-value piece of disconfirming evidence a business has, and
  the easiest to omit by only reading won deals or a founder's favourite
  calls — surface every qualifying one in the batch proposal explicitly,
  even when it invalidates a belief the business is fond of.
- **A telemetry number is evidence of what already happened, never proof of
  a future behavioural claim.** Map it to a specific belief's Metric for
  truth; don't let an aggregate curve stand in for "will *our* users do X"
  — that's still `/experiment-design`'s territory if no real evidence
  exists yet.
- **No source, no claim** — every stub and every evidence line traces to a
  specific call, note, record, or metric view; nothing is written from
  inference alone.

### 6. Assemble the batch proposal

Render one consolidated proposal (`../../_shared/gated-writes.md §Batch
gate`), grouped:

- **New assumption stubs** — Description, Owner (who voiced/champions it,
  where determinable), contributing sources, `Gaps` (all phases + always
  `Duplicate`).
- **Evidence records** — per stub, each qualifying piece with `Type`,
  `Result`, source link, and the Confidence this stub would carry once
  written.
- **Considered and dropped** — material that didn't clear triage (wrong
  Lens, too vague, off-ICP source, Tier D desk fact), so the sweep is
  auditable.
- **Confidence before → after** for any *existing* assumption a finding
  attached to instead of a new stub.

### 7. One confirmation, then write

`y` writes every stub and evidence record shown; `n` writes nothing;
`edit <item>` / `drop <item>` amends the proposal and re-renders it before
another confirm — never a partial write without an explicit edit first.
After writing, report what landed exactly like a run-log: which stubs were
created, which existing assumptions gained evidence and their Confidence
delta.

### 8. Hand off

Confirmed stubs still have `Gaps` — they drop onto the Risk-sorted grill
queue exactly as seed's stubs do. Bootstrap populates the register; it
never finishes it. Point the user at single mode next: "grill top-down by
Risk" (`seed.md`'s closing guidance applies unchanged).

## Never

- Never invent an Impact score from history — Impact is still a human,
  goal-anchored judgment call (`assumption-guardrails.md`); a stub arriving
  with strong attached evidence gets high Confidence, not a free pass on
  scoring.
- Never skip 5 Whys because evidence already exists — a well-evidenced
  belief can still be badly stated, non-atomic, or a duplicate; hand every
  stub to single mode regardless of how much evidence it arrived with.
- Never cherry-pick — an unattended sweep over years of material is exactly
  where selective reading does the most damage; disconfirming and
  supporting findings get the same visibility in the batch proposal.
- Never treat pipeline stage, a planned test, or an unmeasured intention as
  evidence — same rule as `/find-evidence`; only what already happened.
- Never write partial results without the one batch confirmation — no
  per-source auto-apply, no writing-as-you-go.
