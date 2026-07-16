# Draft mode — one goal, gated

Turn "here's our Q3 goal" into one Goal record with both bars fixed, the
instrument named, and the beliefs underneath surfaced and read back honestly.

**This mode never refuses to write a goal.** Every check below produces
advice, a challenge, or a line in the record — never a block. The user
decides; the record remembers.

## Read first

`../../../docs/goals.md` (the model — all of it, incl. §Found numbers). Field
map: `../../_shared/registry-schema.md`. Risk-acceptance line format:
`../../_shared/decision-guardrails.md §8`. When the instrument is a
product-analytics / telemetry number: `../../_shared/analytics-metric-resolution.md`.
Terminology check: `../../_shared/ubiquitous-language.md`. Gate:
`../../_shared/gated-writes.md`.

## Entry

The user states a goal, or asks to set one. No source document is required —
unlike a decision, a goal is being *made* here, not recovered from a
transcript.

One entry is the **found number**: a scoreboard reading surfaced by a
`/find-evidence` sweep or by the user ("24 of 34 are paying — mint a goal on
this?"). Analytics is Goals-side and there is **no retro path** — a found
number is never logged as evidence; it *prompts minting a forward goal*
calibrated off it (`../../../docs/goals.md §Found numbers`). Draft it like any
other goal, with the found-number calibration and ratchet below.

## Phases

1. **Dedup.** Search standing (`Draft`/`Active`) Goal records for one already
   covering this outcome. If found, this is a **re-cut** — supersede the old
   record rather than editing its bar (see Re-cuts below).

2. **Settle the bars.** Both, before anything else, and both fixed from here:
   - **`We're right if`** — the target. Concrete, countable, decidable by
     reading one number.
   - **`We're wrong if`** — the kill floor. Ask for it explicitly; a user who
     has only thought about success hasn't finished thinking. "What result
     would tell you this didn't work?"

3. **Check the bar is SMART, and say so plainly:**
   - **Specific** — an outcome, never an activity. "Run 10 interviews" is an
     experiment plan; route it to `/experiment-design`.
   - **Measurable, instrument named in advance** — which number, read from
     where. Unambiguous at the deadline. **If the instrument is a
     product-analytics / telemetry number**, resolve it to one concrete,
     queryable event/metric *now*, via `../../_shared/analytics-metric-resolution.md`
     (platform + `glossary_file` from the config `analytics:` block) —
     delegate to the platform's own skill, never assume an event name exists.
     A number nobody can query unambiguously isn't named. The resolved
     definition is what the deadline read (`close.md`) re-validates and runs.
   - **Assignable** — exactly one Owner.
   - **Realistic — challenge the target number.** It must cite calibration
     evidence: a register Confidence, a current metric, a comparable. A
     number nobody can justify is hyperbole — the same rule as an
     assumption's Description. Propose a re-cut the evidence can carry.
     Stretch targets are fine **when labelled as such**.
   - **Time-bound** — a deadline.

   A goal missing these is incomplete; say which part and offer to fix it.
   If the user declines, write it anyway and note the gap.

4. **Mine the beliefs.** Every "because" behind the goal is either a ground
   truth or an assumption. A load-bearing belief with no record gets proposed
   as a new row (hand off to `/assumptions` single mode), then linked via
   `Based on assumption` and **named in the rationale prose** — a bare
   relation with no reasoning behind it is noise in the per-goal view and
   unaudited rationale (`goal-link-uncited`, `../../_shared/ontology.yaml`).

   **A `Draft` goal's links count.** This is what lets a goal's own beliefs
   be tested before it commits — grill a linked row clean (Gaps empty,
   `Draft → Live`) and it competes in the test-next queue like any other row.
   It does **not** need the goal to get there, and the goal doesn't move it
   up the ranking either: a goal never touches Impact
   (`../../_shared/assumption-guardrails.md §3`). What the goal gives is the
   per-goal view onto which beliefs it rests on (`../../../docs/goals.md
   §Through`).

5. **Read the bands.** Per linked belief, report its Confidence band and what
   the band means (`../../../docs/goals.md §In`):

   | Band | Reading | Ask |
   |---|---|---|
   | **≥ +30** | Plateaued in Testing. | Nothing — the goal is the next instrument. |
   | **0 … +30** | A gamble. | A dated risk-acceptance line. |
   | **< 0** | Betting against your own evidence. | Strongest flag — the line must say why the evidence is wrong or that it's knowingly accepted. |
   | **≤ −50** | The belief is in the kill lane. | Surface its kill review first, then proceed if they still want to. |

   Where a band asks for a line, use the parseable dated format
   (`../../_shared/decision-guardrails.md §8`) so Audit can chase it:

   ```
   Risk-acceptance: <assumption ref> — <why committing now beats testing first> — revisit by <YYYY-MM-DD>
   ```

   Offer test-before-commit where a cheap probe could run first (leave the
   goal `Draft`, route to `/experiment-design`) — as an option, not a
   condition. **Then proceed either way.** If the user wants to commit
   against a `< 0` belief, write the goal and the line. That is a supported
   outcome, not a failure.

6. **Lifecycle.** `Draft` while forming; `Active` once committed. Activation
   re-reads the bands (step 5) — evidence may have moved since drafting, and
   this is the last honest moment before the bars lock.

7. **Terminology check.** Run `../../_shared/ubiquitous-language.md` over the
   bars and rationale, audience = Internal.

## Found-number mint & the ratchet

When the goal is minted off a **found scoreboard number**
(`../../../docs/goals.md §Found numbers`):

- **A short first cycle is legitimate** — "read on Aug 31" a few weeks out is
  fine; the point is a *real future deadline*, not a long one.
- **Both bars pre-registered at mint, calibrated off the found number** — on
  **absolute anchors, never %-of-target**. "15 customers today → we're right
  if ≥20, wrong if <15" — not "wrong if we miss target by 25%". Sandbagging
  buys nothing: magnitude keys to what materialises, not to how the target
  was set.
- **The ratchet.** Each next mint re-prices "no progress" **from the current
  level**, so the kill floor rises: "5 new customers; wrong if 0 new". An
  unchanged world then reads at the kill floor — a commitment-grade negative —
  instead of re-banking the same standing number. This is what prevents
  re-counting an unchanged world; dedupe doesn't (each closed goal is its own
  aggregation unit, `close.md`).
- **The discovered truth banks once, at the first close** — an interpolated
  positive at the magnitude of what actually materialised. That's `close.md`'s
  job, not draft's; draft only sets the bars that let it happen.

Draft-time mining of the beliefs underneath (phase 4) is the ordinary
machinery — a found-number goal births missing belief rows exactly like any
other goal. No new rule.

## Re-cuts

Re-cutting or dropping a goal creates a **new record that supersedes the
old** — never a silent edit of a bar. A bar that moves to meet the result
measures nothing, and the outcome stops being evidence.

Re-cut freely and often; the discipline is bookkeeping, not permission.

## Gate

Gated write (`../../_shared/gated-writes.md`), one record at a time. If
drafting also creates new assumption rows, render **sequential cards** — the
assumptions first, then the goal linking them — never one bundled write.

## Never

- **Never block a commitment.** No band, no missing calibration, no untested
  belief is grounds for refusing to write the goal. Report, ask for the line,
  write it.
- Never edit a bar in place after activation — supersede.
- Never write a goal as a Decision row with `Kind: Goal commitment` — retired
  (`../../_shared/decision-guardrails.md §9`).
- Never auto-create experiments from mined beliefs — `/experiment-design` is
  a gated human step.
- Never infer the kill floor from the target. Ask.
