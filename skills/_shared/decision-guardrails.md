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

## 8. Reversibility — one-way vs two-way doors

Every Decision record is classified `Two-way door` or `One-way door`
(`Reversibility` field, `registry-schema.md`). The test: *"if this turns out
wrong, can we return to today's position at a cost we'd happily pay?"* Yes →
two-way. No, or unclear → one-way (default conservative; unclear is a flag,
not a guess).

The guardrail is **not** "only make two-way decisions" — some one-way doors
are unavoidable. It's a bar-setter:

- **Two-way door** — decide fast. It may freely be `Based on` untested,
  low-confidence assumptions: reversing is cheap, so the decision itself
  functions like an experiment. No extra gate.
- **One-way door** — the strict gate. Every `Based on assumption` link should
  point at a `Validated` or `Resolved by decision` record. If any linked
  assumption is untested, Capture must either (a) record an explicit
  **risk-acceptance line** in `## Rationale` naming the untested
  assumption(s) and why deciding now beats testing first (dated format:
  §9d), or (b) propose routing to `/experiment-design` and leaving the
  decision `Provisional` until the evidence lands. A one-way door silently
  resting on a high-Risk untested assumption is a reject.

**Mootness dies with the decision.** When a Decision carrying `Resolves
assumption` links flips to `Reversed` or `Superseded` (and the superseding
decision doesn't re-resolve the same records), each linked assumption's
`Resolved by decision` status is stale — the question it retired is open
again. Audit flags these; a human reopens each in a gated session
(`registry-schema.md §Status flow`).

---

## 9. Goal commitments (`Kind: Goal commitment`)

A goal is **a time-boxed, owned commitment to a measurable state change in
the world** — and adopting one is a decision, so **the decision row IS the
goal record**. There is no separate goals register, no KR rows, no progress
mirroring: external tools (CRM, analytics, docs) stay the scoreboard;
Validation-OS owns three joints only — the evidence-gated commitment (in),
the Impact anchor + queue lens (through), and results decomposed into
evidence (out). Rationale and a worked example: `docs/goals.md`.

### 9a. Kind

`Kind` (select, Decision rows only): `Goal commitment` / `Direction`
(strategy, scope, path calls) / `Operating` (process, tooling,
how-we-work). Optional — legacy rows without it are untyped; Audit nudges,
never blocks. Only `Goal commitment` carries the extra rules below;
Direction and Operating follow the ordinary sections unchanged.

### 9b. The goal bar — SMART, checkable

The `## Decision` heading of a Goal commitment must state a bar that is:

- **Specific** — an outcome (a state change), never an activity. "Run 10
  interviews" is an experiment plan, not a goal.
- **Measurable, instrument named in advance** — which number, read from
  where ("Attio, stage 'Pilot signed'", "PostHog w4 cohort"). Unambiguous
  hit/miss at the deadline, decidable by reading the number.
- **Assignable** — exactly one `Owner`.
- **Realistic — the target number cites calibration evidence.** A target
  nobody can justify from the register or current data is hyperbole — the
  same rule as an assumption's Description. Challenge it; propose a re-cut
  the evidence can carry (stretch targets are fine when labelled as such).
- **Time-bound** — a target date in the `## Decision` line.

A Goal commitment missing any of these is incomplete — same treatment as §1.

### 9c. Commitment gate — the evidence bar, plus belief-mining

A goal commitment is one-way for its cycle: classify `One-way door` and run
§8's strict gate. Additionally, mine the rationale for beliefs (the goal's
"because"s) **including ones not yet in the register** — a load-bearing
belief with no assumption record gets proposed as a new row (hand off to
`/assumptions` single mode), then linked via `Based on assumption`. For
untested links, prefer **test-before-commit** when a cheap experiment can
run first (leave the decision `Provisional`, route to `/experiment-design`);
otherwise record dated risk-acceptance (§9d).

Timing is event-driven — commit whenever the team is ready; a team may
self-impose a cadence, the system never does. A draft goal = `Status:
Provisional`. Re-cutting or dropping a goal mid-cycle = `Supersedes` /
`Reversed`, per §5 — never a silent edit of the bar.

### 9d. Risk-acceptance lines — dated, parseable

Every risk-acceptance in a Goal commitment's `## Rationale` follows this
format, one line per assumption, so Audit can parse the revisit date:

```
Risk-acceptance: <assumption ref> — <why deciding now beats testing first> — revisit by <YYYY-MM-DD>
```

Audit and the weekly ritual flag Active Goal commitments whose risk-accepted
assumptions are past `revisit by` and still untested — this is the tripwire
that catches a broken goal mid-cycle instead of at the deadline.

### 9e. The mid-cycle tripwire

When a conclusive verdict lands on an assumption that an `Active`
`Kind: Goal commitment` decision links via `Based on assumption` (or names
in a risk-acceptance line), the evidence flow **surfaces that decision for
review** — the goal may need re-cutting (supersede) or the bet re-accepted
knowingly. Surfacing only: no status auto-flips, no auto-supersede; whether
the goal stands is a human decision.

### 9f. Close-out gate

Closing a goal fills `## Outcome` with a human verdict — never auto-flipped
by a threshold. The gate, by verdict:

- **`Achieved` / `Missed`** — hard-gated on **at least one linked
  Experiment/Evidence record**: the outcome must be decomposed into what it
  proved or disproved (via `/find-evidence` — a hit is top-rung evidence for
  the beliefs underneath; a miss usually invalidates one specifically).
  There is always something learned; an outcome with no evidence link is a
  reject.
- **`Dropped`** — exempt from the evidence link (a goal abandoned because
  the world changed may have nothing to decompose; don't force a fake row)
  but requires a link to the superseding/reversing decision instead.

### 9g. Focus effects — anchor and lens, never the formula

An assumption gates a committed goal when an `Active` Goal commitment links
it via `Based on assumption`. That linkage: (a) anchors the human's Impact
score (`assumption-guardrails.md §3` — justify anything below top-band, and
Audit flags mismatches in both directions); (b) gives the test-next queue a
"gates a committed goal" lens. It **never** enters the Risk formula and
never touches Confidence. There is **no cap** on concurrently Active goal
commitments, but Audit reports the count and flags **anchor dilution** —
when most open assumptions gate some goal, the anchor has stopped
discriminating. Informational only.

When a goal dies (Dropped/Missed/Superseded) nothing changes mechanically on
the assumptions that gated it — no status flips, no Impact edits. Stale
goal-anchored Impact justifications surface through the ordinary audit
consistency check, and reopening/re-scoring stays a gated human pass.

---

## 10. Guardrail summary (reject a Capture/Sweep write that fails any)

Decided-date + Source + at least one Owner present · Unanimity score banded
with a one-line justification · Attribution confidence noted
(Confident/Uncertain) · `Related tension` used tagging-only, no invented
severity field · `Supersedes` wired only for a genuine intentional override,
never in place of an unresolved `Related tension` · `Based on` and `Resolves`
assumption relations set independently, never one inferred from the other ·
Sweep's conflict search never crosses `Area` · Reversibility classified
(unclear = one-way) · One-way door with untested `Based on` links carries a
risk-acceptance line or stays `Provisional` pending a test · Goal
commitments (§9): bar passes the SMART checks incl. calibration evidence ·
risk-acceptance lines dated in the parseable format · `## Outcome` verdict
gated (Achieved/Missed need ≥1 evidence link; Dropped needs the
superseding/reversing decision link) · goal linkage never touches
Confidence or the Risk formula.
