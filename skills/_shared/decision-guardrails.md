# Shared helper — decision guardrails

The canonical rules every Decision record must satisfy. Cited by `/decisions`'
Capture, Sweep, and Audit modes, so all three judge by the same standard. When
this changes, all three paths change.

The schema (field map) lives in `registry-schema.md`; this file is the
operational ruleset — how to score, tag, and gate a Decision record.

---

## 1. Decision definition discipline

A Decision record states **what was decided, by whom, and why** — not a vague
direction, not a discussion summary. Write the `## Decision` body heading as
one line: *"We decided [X] instead of [alternative], on [date], because
[reason]."* Plain language, no hyperbole — same discipline as an assumption's
Description.

Every Decision record must carry: a `Decided date`, a `Source` (link back to
the transcript/thread/note it came from), and at least one `Owner`. A record
missing any of these is incomplete — Audit mode flags it, Capture mode must
not close out without them.

---

## 2. Unanimity score — anchored bands (0–100)

- **90–100** — every attendee who spoke on the topic explicitly affirmed; no
  hedging language; attribution is reliable.
- **60–89** — majority explicit affirm, no explicit objection, but at least
  one relevant voice stayed silent, or hedging language ("I think",
  "probably", "I guess") was used by someone who affirmed.
- **30–59** — mixed signal: an objection was voiced and then overridden, or
  affirmation is mostly implicit (silence read as agreement) rather than
  explicit.
- **0–29** — contested: an unresolved explicit objection, a single person's
  call presented as a team decision, or unreliable attribution with no
  corroborating source.

**Adjust one band down whenever attribution is `Uncertain`** (§3) — an
unreliable transcript can't earn top-band confidence in the *content* of what
was agreed, even if the words on the page look unanimous.

**Unanimity score is the only hand-scored number on a Decision record.**
Always record the chosen band + a one-line reason in the body (a "Scoring
justification" line under `## Rationale`) — so the number is auditable, same
convention as an assumption's Impact score (`assumption-guardrails.md §3`).

---

## 3. Attribution confidence rubric

Transcript speaker diarization can collapse or misattribute speakers.
Concretely: compare the transcript's distinct-speaker-label count against the
meeting's known attendee count.

- **Match (or explainable gap, e.g. a silent observer)** → attribution
  `Confident`.
- **Mismatch** (fewer distinct speakers than attendees, or labels that
  clearly blend two people) → attribution `Uncertain`.

**Best-effort attribution is still attempted either way** — `Owner` and
`Agreed by` get populated from the transcript as read. `Uncertain` only
lowers the Unanimity band (§2); it never blocks writing the record, and it
never means falling back to "list all attendees, no one named" — that loses
the signal entirely. Flag it, don't discard it.

Record the outcome in the body's Rationale ("attribution uncertain —
transcript showed 3 speakers, 5 attendees").

---

## 4. Related tension — tagging-only discipline

`Related tension` (self-relation, two-way) is shared by both record Types:

- **Terminology ↔ Terminology**: informational confusable-neighbour pairing.
  Never treated as "unresolved."
- **Decision ↔ Decision**: a contradiction the Sweep mode found. No separate
  severity/action field is stored — actionability is *inferred* from each
  record's own `Status`:
  - Both sides still `Active` → **unresolved conflict**. Audit mode surfaces
    this; a human must resolve it (mark one `Superseded`/`Reversed`, or
    confirm both genuinely coexist and the tension is informational only).
  - One side `Superseded`/`Reversed` (and linked via `Supersedes`, §5) → the
    pair is **resolved**; Audit mode does not re-flag it.

Two-way relations are set on **both** records where the backend doesn't sync
them automatically (see the active connector's Link operation).

---

## 5. Supersedes discipline

`Supersedes` / `Superseded by` (self-relation, two-way, Decision-only) is
distinct from `Related tension`:

- **`Related tension`** = unresolved, sweep-raised contradiction. Nobody has
  yet said which decision wins.
- **`Supersedes`** = resolved, intentional override. A later decision
  knowingly replaces an earlier one on the same topic; the earlier record's
  `Status` flips to `Superseded`.

A record should never sit in both relations for the same counterpart at once —
once `Supersedes` is wired, the corresponding `Related tension` edge (if one
existed) is resolved, not a fresh flag. Sweep mode may set both in the same
pass: tag `Related tension` when it finds a contradiction, then immediately
resolve it into `Supersedes` if the evidence clearly shows one decision
overriding the other (chronological order + same `Area` + same topic).

---

## 6. Based-on vs Resolves-assumption — the "unhelpful loop" guardrail

**This is the rule that keeps decisions from quietly validating untested
assumptions.**

- **`Based on assumption`** — rationale only. It answers *"why did we decide
  this?"* A decision can cite an untested, low-confidence, or even
  since-invalidated assumption as its reason **without that citation implying
  anything about the assumption's truth.** Setting this relation never
  touches the linked assumption's `Status`.
- **`Resolves assumption`** — a separate, deliberate human judgment that this
  decision **settles** the open question the assumption was testing, without
  needing an experiment (e.g. the business chose to proceed regardless of
  what turns out to be true, or the decision makes the question moot).
  Setting this relation is the **only** thing that flips the linked
  assumption's `Status` to `Resolved by decision`
  (`registry-schema.md §Status flow`).

**A decision must never be treated as resolving an assumption just because it
cites it via `Based on assumption`.** Capture and Sweep ask these as two
distinct, separately-gated questions — never infer one from the other:

1. *"Does the rationale cite an existing assumption?"* → propose `Based on
   assumption` only.
2. *"Does this decision settle that assumption without needing a test?"* →
   only if explicitly affirmed, propose `Resolves assumption` **and** the
   paired gated write to flip the assumption's `Status`.

If a decision is Based-on an assumption and the user hasn't explicitly
answered question 2, leave `Resolves assumption` unset — an open assumption
stays open.

---

## 7. Conflict-sweep scope discipline

Sweep mode's semantic-contradiction search is scoped to **the same `Area`
only** — never a whole-register compare. This keeps the sweep cheap and
precise (a go-to-market decision and an engineering decision are never in
tension with each other by construction). If a decision genuinely spans two
Areas, pick the primary one; don't widen the sweep to compensate.

---

## 8. Guardrail summary (reject a Capture/Sweep write that fails any)

Decided-date + Source + at least one Owner present · Unanimity score banded
with a one-line justification · Attribution confidence noted
(Confident/Uncertain) · `Related tension` used tagging-only, no invented
severity field · `Supersedes` wired only for a genuine intentional override,
never in place of an unresolved `Related tension` · `Based on` and `Resolves`
assumption relations set independently, never one inferred from the other ·
Sweep's conflict search never crosses `Area`.
