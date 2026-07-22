# Commitment discipline — designing a Market-grade (committed) Experiment

Fires when step 2 of the main gauntlet lands on a **Market rung**
(`Signed intent` / `Paying users`) for a bundled belief. A Market-rung design
is not a different record — the Goal record was unified into the Experiment
(`the evidence-remodel slice`) — it is the **same Experiment row**, carrying an optional
`Deadline` and closing with an `Outcome` (Achieved / Missed / Dropped). This
file is the discipline that fires on that one trigger: **rung, not a
separate record type.**

**This discipline never blocks a commitment.** Every check below produces
advice, a challenge, or a line in the record — never a refusal. The user
decides; the record remembers.

## Read first

`../../../docs/goals.md` (the commitment model — all of it, incl. §Found numbers).
Field map: `../../_shared/registry-schema.md` (Experiment fields, incl.
`Deadline` / `Outcome`). Risk-acceptance line format:
`../../_shared/decision-guardrails.md §8`. When the instrument is a
product-analytics / telemetry number:
`../../_shared/analytics-metric-resolution.md`. Terminology check:
`../../_shared/ubiquitous-language.md`. Gate: `../../_shared/gated-writes.md`.

## Entry

The main gauntlet's step 2 recommends (or the user names) a Market rung for
one or more bundled beliefs — proceed here instead of the ordinary bar-pair
step (step 3) for those beliefs.

One entry is the **found number**: a scoreboard reading surfaced by a
`/find-evidence` sweep or by the user ("24 of 34 are paying — mint a
committed plan on this?"). Analytics is Market-side and there is **no retro
path** — a found number is never logged as evidence; it *prompts minting a
forward committed plan* calibrated off it (`../../../docs/goals.md §Found numbers`).
Design it like any other Market-grade experiment, with the found-number
calibration and ratchet below.

## Additional phases (run alongside / instead of the ordinary bar-pair step)

1. **Both bars, fixed from here.** Same pair as any bar line
   (`experiment-guardrails.md §4`), but at Market-rung stakes:
   - **`We're right if`** — the target. Concrete, countable, decidable by
     reading one number.
   - **`We're wrong if`** — the kill floor. Ask for it explicitly; a user who
     has only thought about success hasn't finished thinking. "What result
     would tell you this didn't work?"

2. **Check the bar is SMART, and say so plainly:**
   - **Specific** — an outcome, never an activity. "Run 10 interviews" is a
     Testing-grade plan, not a Market-rung one — design it as such instead.
   - **Measurable, instrument named in advance** — which number, read from
     where. Unambiguous at the deadline. **If the instrument is a
     product-analytics / telemetry number**, resolve it to one concrete,
     queryable event/metric *now*, via
     `../../_shared/analytics-metric-resolution.md` (platform +
     `glossary_file` from the config `analytics:` block) — delegate to the
     platform's own skill, never assume an event name exists. A number
     nobody can query unambiguously isn't named. The resolved definition is
     what the deadline read (`/find-evidence`'s
     `references/conclude-plan.md`) re-validates and runs.
   - **Assignable** — exactly one Owner.
   - **Realistic — challenge the target number.** It must cite calibration
     evidence: a register Confidence, a current metric, a comparable. A
     number nobody can justify is hyperbole — the same rule as an
     assumption's Description. Propose a re-cut the evidence can carry.
     Stretch targets are fine **when labelled as such**.
   - **Time-bound** — set `Deadline`.

   A design missing these is incomplete; say which part and offer to fix it.
   If the user declines, write it anyway and note the gap.

3. **Mine the beliefs.** Every "because" behind the commitment is either a
   ground truth or an assumption. A load-bearing belief with no record gets
   proposed as a new row (hand off to `/assumptions` single mode), then
   wired via that belief's own bar line on this Experiment — a bare relation
   with no reasoning behind it is noise, so name it in the protocol body.

   **A `Draft` Experiment's bar lines count.** This is what lets a
   committed plan's own beliefs be tested before it commits — grill a linked
   row clean (Completeness % = 100, `Draft → Live`) and it competes in the
   test-next queue like any other row. It does **not** need the plan to get
   there, and the plan doesn't move it up the ranking either: a plan never
   touches Impact (`../../_shared/assumption-guardrails.md §3`). What the
   plan gives is a view onto which beliefs it rests on (`../../../docs/goals.md
   §Through`).

4. **Read the bands.** Per bundled belief, report its Confidence band and
   what the band means (`../../../docs/goals.md §In`):

   | Band | Reading | Ask |
   |---|---|---|
   | **≥ +30** | Plateaued in Testing. | Nothing — this commitment is the next instrument. |
   | **0 … +30** | A gamble. | A dated risk-acceptance line. |
   | **< 0** | Betting against your own evidence. | Strongest flag — the line must say why the evidence is wrong or that it's knowingly accepted. |
   | **≤ −50** | The belief is in the kill lane. | Surface its kill review first, then proceed if they still want to. |

   Where a band asks for a line, use the parseable dated format
   (`../../_shared/decision-guardrails.md §8`) so `/find-evidence audit` can
   chase it:

   ```
   Risk-acceptance: <assumption ref> — <why committing now beats testing first> — revisit by <YYYY-MM-DD>
   ```

   Offer test-before-commit where a cheap Testing-grade probe could run
   first (leave the plan `Draft`, or design a separate Testing-grade
   experiment) — as an option, not a condition. **Then proceed either way.**
   If the user wants to commit against a `< 0` belief, write the plan and
   the line. That is a supported outcome, not a failure.

5. **Commit.** `Draft` while forming; commit to `Running` once the bars,
   instrument, and (for this Market-grade plan) `Deadline` are fixed —
   commit re-reads the bands (step 4): evidence may have moved since
   drafting, and this is the last honest moment before the bars lock.

6. **Terminology check.** Run `../../_shared/ubiquitous-language.md` over the
   bars and protocol, audience = Internal.

## Found-number mint & the ratchet

When the plan is minted off a **found scoreboard number**
(`../../../docs/goals.md §Found numbers`):

- **A short first cycle is legitimate** — "read on Aug 31" a few weeks out is
  fine; the point is a *real future deadline*, not a long one.
- **Both bars pre-registered at mint, calibrated off the found number** — on
  **absolute anchors, never %-of-target**. "15 customers today → we're right
  if ≥20, wrong if <15" — not "wrong if we miss target by 25%". Sandbagging
  buys nothing: magnitude keys to what materialises, not to how the target
  was set.
- **The ratchet.** Each next cycle re-prices "no progress" **from the current
  level**, so the kill floor rises: "5 new customers; wrong if 0 new". An
  unchanged world then reads at the kill floor — a commitment-grade negative —
  instead of re-banking the same standing number. This is what prevents
  re-counting an unchanged world; dedupe doesn't (each closed cycle is its own
  aggregation unit, `/find-evidence`'s `references/conclude-plan.md`).
- **The discovered truth banks once, at the first close** — an interpolated
  positive at the magnitude of what actually materialised. That's the
  conclude step's job, not design's; design only sets the bars that let it
  happen.

Step 3's belief-mining is the ordinary machinery — a found-number plan births
missing belief rows exactly like any other Market-grade design. No new rule.

## Re-cuts

Re-cutting or dropping a committed plan means designing a **new Experiment
that supersedes the old** — never a silent edit of a bar. A bar that moves
to meet the result measures nothing, and the outcome stops being evidence.

Re-cut freely and often; the discipline is bookkeeping, not permission.

## Gate

Gated write (`../../_shared/gated-writes.md`), one record at a time. If
designing also creates new assumption rows, render **sequential cards** —
the assumptions first, then the Experiment linking them — never one bundled
write.

## Never

- **Never block a commitment.** No band, no missing calibration, no untested
  belief is grounds for refusing to write the plan. Report, ask for the
  line, write it.
- Never edit a bar in place after commit — supersede.
- Never auto-create experiments from mined beliefs — that's a separate,
  gated `/experiment-design` pass.
- Never infer the kill floor from the target. Ask.
