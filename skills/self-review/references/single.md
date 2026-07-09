# Single mode — review one transcript, gated

Point the skill at one recorded conversation — a source link/ID or pasted
text — right after it happened. Same detection and rubric as sweep; the
writes are gated instead of autonomous, because single mode is
interactive.

## Read first

`references/rubric.md`, `references/storage.md`.

## Steps

1. **Normalize** the transcript to `{title, date, attendees, link, turns}`
   (pasted text with speaker prefixes qualifies).
2. **Confirm it's internal and you spoke.** An external conversation
   (evidence interview, customer, investor, prospect) is out of scope —
   say so and stop; that material belongs to `/find-evidence`. No alias
   match → say so and stop.
3. **Detect your moments** per `sweep.md §Phase B` — same definition, same
   tie-break.
4. **Evaluate** each moment on the rubric; render the scores, quotes, Read,
   and **Improve next** in full.
5. **Gated write** (`../../_shared/gated-writes.md`): append the section(s)
   to `history.md`, recompute Trends, append a `— single` run-log entry. A
   `— single` entry never advances the sweep window
   (`storage.md §run-log`).

Registers stay read-only; candidate decisions or assumptions surface as
recommendations for `/decisions` Capture or `/assumptions`, exactly as in
sweep.
