# Sweep mode — review your window of conversations, on demand

Pull every transcript since the last run, detect your evaluable moments,
score them against the rubric, and write the results to the private review
directory. Autonomous write for files under that directory, with a run-log
— register access stays read-only throughout.

Always invoked on demand. A recurring schedule is a separate, explicit ask
— not covered here.

## Read first

`references/rubric.md` (with `references/evals.json` as its machine
shadow), `references/storage.md`, and
`../../_shared/decision-guardrails.md §3` (attribution).

## Inputs

- **Window** — default: since the latest `— sweep` entry in the run-log
  (`storage.md §run-log`). No sweep entry yet → ask for a start date.
- **Sources** — whatever the config's `evidence_sources` lists that carries
  transcripts (search mechanics per source:
  `../../find-evidence/references/<source>.md`). Nothing transcript-capable
  configured → ask the user to paste or point at the material.
- **Profile** — `profile.md` (name + speaker aliases).

Normalize every transcript to `{title, date, attendees, link, turns:
[speaker, timestamp, text]}` — pasted text with speaker prefixes satisfies
it, so everything after this line is source-independent.

## Phases

**A — Enumerate and classify.** List the window's transcripts per source.
Keep only **internal team conversations where you spoke** (an alias matches
a speaker label). Skip and log everything else: external conversations
(evidence interviews, customer, investor, prospect calls — interview
technique belongs to `/find-evidence` and `/experiment-design`, and a pitch
*to a prospect* is `Pitch-deck reaction` evidence, not review material) and
internal meetings where you didn't speak.

**B — Detect your moments.** An evaluable **moment** is a stretch where
*you* either:

- **(pitch)** advocate a specific course of action *with an ask* —
  proposal language ("we should", "let's", "my recommendation", "can we
  commit to") attached to something buildable/decidable, pressing for
  commitment, resources, or agreement; or
- **(claims)** assert load-bearing claims or arguments others build on —
  claims that, if wrong, change what the team does.

Qualifiers, all three required: **sustained** (≥2 turns or ~150 words);
**internal audience**; **bounded** — the moment starts at your first
advocacy/claim turn and ends on topic change, ask resolved
(agreed/parked/refused), or someone else's counter-proposal taking over.
Logistics and status recitation are not moments. **Tie-break: unsure → not
a moment; log the skip with one line of why.** A missed moment costs
nothing (the next sweep catches a clearer one); a misread quote scored
against you poisons the trend line.

Run the diarization check (§3) per transcript before trusting that a
quote is yours.

**C — Evaluate.** Score each moment on the rubric's four dimensions —
quotes mandatory, fairness pass on every 0–1, registers read-only.

**D — Write locally.** Per `storage.md`: append sections to `history.md`
(idempotency check first), recompute `## Trends`, append the run-log
entry. Completion bar: **every transcript in the window is either scored
(has moments), or in the run-log's skipped list with a reason** — nothing
silently dropped.

**E — Report.** Render the private report: header (window, sources,
scanned/skipped counts) → one block per moment: scores, the most damning
and most creditable quote, the Read, trend deltas ("Decision fidelity flat
at 1 for three runs; 3rd reopening of DEC-012") → **Improve next** (≤3
actions, `rubric.md §Improve next`) → register recommendations → run-log
read-back.

## Autonomy rails

- **Autonomous, logged**: files under the review directory — history
  sections, Trends recomputes, run-log entries.
- **Gated, always**: profile edits, the first-run scaffold, the
  `.gitignore` append (`storage.md §first run`).
- **Read-only, always**: every register. Candidate decisions or
  assumptions the sweep notices — in anyone's turns; a recommendation
  carries no evaluation content — become run-log **recommendations**
  routed to `/decisions` Capture or `/assumptions` — never writes from
  here.
- **Ground, don't invent**: no quote → `n/a`, uncertain attribution →
  softened Read.

## Never

- Never schedule — sweep is on-demand only.
- Never write through the registry connector, or anywhere outside the
  review directory.
- Never score anyone but the profile's subject — teammates' words are
  context, not material.
- Never score an external conversation under this rubric.
