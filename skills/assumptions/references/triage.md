# Triage mode — comment + gap follow-up

People leave **comments** on records and tag `Gaps` values directly in the
registry — during a meeting, off the back of a chat thread, or just jotting
a thought while reading — with no agent involved at the time of writing.
Triage mode is the pass that runs afterward: find the records that got
touched, read what was left, and work through it the same way a live grill
would have. **The trigger is not "a meeting happened"** — it's
"comments/gaps have accumulated".

Resolving a comment is **two genuinely separate outcomes**, not one:

1. **The comment is about the record it's on** — it closes a gap, flags an
   overlap, or asks a question. Resolving it means **editing that existing
   assumption** (Route A below).
2. **The comment describes a belief with no record yet** — resolving it
   means **creating a brand-new assumption** (Route B below), via the same
   stub-then-grill mechanics seed mode uses.

Don't conflate these: a comment thread is only handled once you've
determined *which* of the two it is (or that it's genuinely both).

This is a **front door into single mode's choreography** (like seed mode),
not an audit variant — audit is read-only; triage is gated and mutates.

## Discovery

A record is in scope for triage if **either**:

1. **It has an open comment thread.** What "comment" means is
   backend-specific: on the Notion connector, open (unresolved) page
   comments — fetch them per record, including block-anchored comments, not
   just page-level ones. On the local-files connector, review notes left in
   the record's `### Comments` subsection or `<!-- comment: … -->` markers.
2. **It has a non-empty `Gaps`** — however it got tagged: by a human, by
   seed, by loop. This reuses the Gaps-driven queue single mode already
   works from.

Load records via the connector, never a filtered view. Default the sweep to
non-terminal `Status` (`Not Started` / `Experiment Needed` / `Testing`) to
cut scan size; offer a wider "full sweep including concluded records" as an
explicit option when asked.

## Per-record triage

1. Fetch the record (same "Before you start" step as `single.md`) plus its
   open comment threads.
2. **Classify each open comment into one of the two outcomes**, then route:

   **Route A — edits the existing record.** The comment bears on the record
   it's attached to:
   - **Closes an existing/implied structural gap** — feed the comment text
     as *context* into the matching `single.md` phase instead of asking
     cold: "Comment on this record raised: '<quote>'. Recommended
     resolution: <answer>. Confirm?" Same one-question-at-a-time discipline.
   - **Flags a possible duplicate/overlap** — set (or confirm) `Duplicate`/
     `Contradiction` and route into `single.md` Phase 5, including the
     mandatory boundary-statement requirement.
   - **A genuine open question with no obvious gap** — still a normal grill
     turn: recommend + confirm, gated.

   **Route B — spawns a new record.** The comment describes a distinct
   belief with no record yet — hand off to `seed.md`'s stub-creation step
   (`Owner` = comment author if resolvable, provenance = "source: comment on
   <record title>, <date>"), then grill it through single mode as usual —
   including the always-set `Duplicate` gap. A single comment can trigger
   *both* routes (it corrects the existing record **and** implies a sibling
   belief) — treat them as two independent triage actions on the same
   thread.
3. **Reply is a gated write**, same convention as any other mutation: render
   intent/payload, then post the reply **in the same thread** once resolved
   — confirming the resolution, and linking the new record if Route B
   created one. (On local files: append the resolution under the comment.)
4. **A record is "done"** once every open thread has a reply and every
   `Gaps` tag present has been worked through the usual close-out
   (`single.md §Close out`) — `Gaps` emptying is still the signal.

## Never

- Never treat an unreplied comment as resolved just because its record's
  `Gaps` emptied through an unrelated route — every open thread needs its
  own reply.
- Never assume Route A and Route B are mutually exclusive on a single
  comment — check for both before marking a thread handled.
- Never skip the mandatory boundary-statement requirement just because the
  comment, not a live suspicion, is what raised the overlap.
- Never run the full-register comment sweep on every turn — it's a
  deliberate, periodic pass, not a background poll.
