# 02 · Seed assumptions from a call — `/assumptions` (seed)

Monday 13 July. The founders just finished a pricing call with their first
pilot customer, recorded in Fireflies.

**You type:** "pull assumptions from this morning's pricing call"

The skill states its mode (seed) in one line, fetches the transcript, and
proposes candidates — each already checked against the guardrails:

▎ Three candidates. 1) "Owners of sub-20-employee businesses will pay
▎ £40/month for automated reconciliation because month-end currently costs
▎ them a full working day" — atomic, falsifiable, Lens Consumer.
▎ 2) "Owners will connect a read-only bank feed because their accountant
▎ already has bank access" — Lens Consumer, Theme Trust & data.
▎ 3) "Everyone hates spreadsheets" — rejected: hyperbole, no falsifiable
▎ metric; the sentiment behind it already lives inside candidate 1.

Each accepted candidate is its own gated write — nothing lands in bulk.
ASM-004 as created:

```markdown
## ASM-004: Owners pay £40/mo for reconciliation
- **Description**: We assume owners of sub-20-employee businesses will pay
  £40/month for automated reconciliation because month-end currently costs
  them a full working day.
- **Lens**: Consumer · **Themes**: Business model
- **Status**: Not Started · **Owner**: Alex
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
```

New records are stubs, not finished work — seed leaves the `Gaps` that the
single-mode grill will clear.

**What this shows:** seed rejects what fails the guardrails instead of
laundering it into the register, one gated write per record, and
`Status` + `Gaps` mark exactly how unfinished a new belief is.

Next: [03 — grill it](03-grill-an-assumption.md).
