# Shared helper — gated writes

The one confirmation discipline every mutating skill uses. A **gated write**
renders the upcoming mutation to the user — intent, target, payload, side
effects, reversibility — and waits for explicit approval before firing.
Single gate; no implicit consent.

## The card

Before any registry write, render:

```
─────────────────────────────────────────────
ABOUT TO WRITE
─────────────────────────────────────────────
intent:        <one line — "create assumption ASM-014", "flip ASM-003 Status → Testing">
target:        <record + backend — file section, or database page>
payload:       <the fields and body being written; truncate long bodies with an offer to expand>
side effects:  <downstream changes — "recomputes Confidence on ASM-003", "none">
reversible:    <yes | no | partial — and how to undo it>
─────────────────────────────────────────────
Confirm? [y / n / edit <field>]
```

## Consent rules

- Only an explicit yes (`y`, `yes`, `confirm`, `go ahead`) approves. **Never
  interpret silence, vague affirmation ("sure", "ok" mid-sentence), or
  unrelated text as approval** — re-render the card and wait.
- `n` / `no` / `cancel` aborts the write; the skill returns to where it was.
- `edit <field>` reopens that field, then re-renders the card.
- One card per record. A write that cascades (a decision that also flips an
  assumption's Status) renders **sequential cards** — the second conditional
  on the first being confirmed — never one bundled silent write.
- Irreversible mutations carry an extra warning line:
  `⚠ IRREVERSIBLE — once you confirm, this cannot be undone.`

## Autonomous modes

Batch modes that are allowed to write without per-row gates (e.g.
`/decisions` Sweep, `/assumptions` loop) replace the card with a **run-log**:
every mutation recorded as `{record, field, before, after, kind}` and read
back at the end. The writes each mode may make autonomously are listed in
that mode's reference — anything not listed stays gated.

## Batch gate

A third pattern, for modes that sweep a large amount of source material in
one sitting (e.g. `/assumptions` bootstrap) where a per-record card would be
too slow and silent autonomy would be too risky. Unlike the run-log (writes
already happened, logged for rollback), a batch gate writes **nothing**
until the one confirmation lands:

1. **Accumulate, don't write.** As the sweep runs, hold every proposed
   mutation in memory — new records, edits, close-outs — instead of
   rendering a card or writing per item.
2. **Render one consolidated proposal** at the end, grouped by kind (e.g.
   new assumption stubs / new evidence records / `Running` records closed
   out / material considered and dropped), each line as terse as the
   per-record card's `payload` — enough to judge, not the full body. Include
   before → after `Confidence` for every touched assumption.
3. **One confirmation gates the whole batch**: `y` writes everything shown;
   `n` writes nothing; `edit <item>` or `drop <item>` removes or amends one
   line, then the proposal re-renders for another confirm. There is no
   partial-apply without an explicit edit/drop first — silence is not
   approval, same as the per-record card.
4. **Write, then report** exactly like a run-log: every mutation that
   actually landed, so the batch is auditable after the fact too.

Irreversible items inside a batch still carry the per-record
`⚠ IRREVERSIBLE` line so they aren't lost in the aggregate view.
