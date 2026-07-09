# Blank-topic interview — pressure-test before you stub

When the seed material is a bare idea ("we should let SMBs auto-reconcile
their books") rather than a call, transcript, or notes, don't stub straight
from the one sentence — an un-pressure-tested idea produces a record that
*sounds* falsifiable but was never actually forced to name a person, a cost,
or a wedge. Run this interview first, one question at a time, then stub from
what survives. Adapted from the "six forcing questions" in garrytan/gstack's
`/office-hours` skill — retargeted here to produce guardrail-clean stubs in
the register instead of a standalone design doc.

## The six questions

Ask one at a time. Wait for an answer. Push back exactly once if it's vague
("everyone", "enterprises", "people who hate spreadsheets") before accepting
it or moving on.

1. **Demand reality** — What's the evidence someone would genuinely miss
   this, in *behavior*, not sentiment? ("They'd panic" beats "they said it
   sounded useful.")
2. **Status quo** — What do they do today instead, and what does that
   workaround actually cost them (time, money, risk)?
3. **Desperate specificity** — Name the actual human who needs this: title,
   what gets them fired or promoted, what keeps them up at night. "SMB
   owners" is not a name; "the solo bookkeeper at a 12-person agency who
   closes the books alone every month-end" is.
4. **Narrowest wedge** — What's the smallest slice of this someone would pay
   for or adopt *this week* — not the full platform vision?
5. **Observation and surprise** — Have you actually watched them do the
   thing, without helping? What surprised you?
6. **Future-fit** — In three years, as the world around this changes, does
   it become more essential or less?

## From answers to stub

The interview's output is raw material, not evidence — treat every answer as
Opinion-rung (`../../../docs/evidence-ladder.md`, ~5%) unless the founder
points to an actual instrument (a call, a workaround they watched, a
payment). It only earns:

- The **Description** — draft it from Q1–Q4, one falsifiable sentence per
  distinct belief; split a bundled answer into separate stubs rather than an
  "and" record.
- The **Owner** — whoever gave the answers, or whoever champions the belief.
- A `## Provenance & notes` line citing this interview as the source.
- **Every** phase gap still open, `Duplicate` included — the interview
  elicits a candidate, it doesn't clear a single guardrail. Hand the stub to
  single mode exactly as any other seed (`seed.md §Stub, then grill`).

Q3 and Q4 usually sharpen the inputs to scoring (a named person and a wedge
size feed Impact's reach and dependent-count) — they don't set `Confidence`.
That still comes from nothing but a concluded experiment.

## When to skip it

Skip straight to stubbing if the raw material is already a call, transcript,
or notes — those already carry real behavior (Q1/Q2/Q5 are answered by what
actually happened), so re-interviewing would ask the founder to guess at
what a recording already shows. This technique is for the bare-idea case
only.
