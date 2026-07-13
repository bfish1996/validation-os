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
intent:        <one line — "create assumption ASM-014", "flip ASM-003 Status → Live">
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
- One card per record. A write that cascades (a decision whose `Resolves
  assumption` action also drops an assumption's Impact to 0) renders
  **sequential cards** — the second conditional on the first being
  confirmed — never one bundled silent write.
- Irreversible mutations carry an extra warning line:
  `⚠ IRREVERSIBLE — once you confirm, this cannot be undone.`

## Autonomous modes

Batch modes that are allowed to write without per-row gates (e.g.
`/decisions` Sweep, `/assumptions` loop) replace the card with a **run-log**:
every mutation recorded as `{record, field, before, after, kind}` and read
back at the end. The writes each mode may make autonomously are listed in
that mode's reference — anything not listed stays gated.
