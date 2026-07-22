# Capture mode — one decision, gated

Turn a specific call/thread/note into one guardrail-complete Decision record.
This is the per-record choreography every other Decision mode reuses — Sweep
runs it (minus gates) per candidate; Audit hands its findings back here for
gated fixes.

## Read first

`../../_shared/decision-guardrails.md` (all sections — this mode enforces all
of them) and `../../_shared/registry-schema.md` (Decisions register field
map). Terminology check: `../../_shared/ubiquitous-language.md`. Gate:
`../../_shared/gated-writes.md`.

## Entry

The user points Capture at a specific source: a call transcript, a chat
thread, a note, or pasted text. If they instead describe a decision from
memory with no source, ask for one — `Source` is required
(`decision-guardrails.md §1`); pasted notes count, dated.

## Phases

0. **Not a commitment.** If the source turns out to describe a **committed
   evidence plan** — a time-boxed commitment to a measurable outcome — stop:
   it is not a Decision row (`decision-guardrails.md §9`). Hand off to
   `/experiment-design`.
1. **Extract.** Read the source. Pull out the one-line decision statement:
   what was decided, instead of what alternative, and who was in the
   room/thread.
2. **Dedup.** Search existing Decision records, same `Area` first, then
   whole register, for a record that already covers this. If found, **edit
   that record** (e.g. add corroborating `Agreed by`, or open a `Supersedes`
   link if this is actually a later override) rather than creating a
   duplicate.
3. **Draft the fields:**
   - **Owner** — who's accountable for the decision.
   - **Agreed by** — everyone who explicitly affirmed, best-effort from the
     source even if speaker attribution looks shaky
     (`decision-guardrails.md §3`).
   - **Unanimity score** — band it per `decision-guardrails.md §2`, one band
     down if attribution is uncertain. Write the one-line justification into
     `Unanimity justification` (promoted from the old `## Rationale` body
     prose, `the evidence-remodel slice`).
   - **Area** — topic tag from the config's `vocabulary.area`. There is no
     `Kind` field (`the evidence-remodel slice`) — `Area` + `Reversibility` carry the
     classification that used to also live on `Kind`.
   - **Decided date**, **Source** (link or dated reference).
   - **Reversibility** — ask: *"if this turns out wrong, can we get back to
     today's position at a cost we'd happily pay?"* Yes → `Two-way door`;
     no or unclear → `One-way door` (`decision-guardrails.md §8`).
   - **Status** — default `Active` unless the decision is explicitly
     tentative (`Provisional`).
4. **Draft the record.** `Statement` field — the one-line what-was-decided
   (promoted from the old `## Decision` body heading, `the evidence-remodel slice`). Body:
   `## Rationale` (why; cites `Based on assumption` rows; carries any
   risk-acceptance lines) and `## Alternatives considered` — the two
   headings that survive; `## Source` is cut, it only mirrored the `Source`
   field.
5. **Assumption links — two separate, never-inferred-from-each-other
   questions** (`decision-guardrails.md §6`):
   - *"Does the rationale cite an existing assumption?"* → if yes, propose
     `Based on assumption`, linking the cited record(s). This never touches
     the assumption.
   - *"Does this decision settle that assumption without needing a test?"* →
     only if the user **explicitly** affirms, propose `Resolves assumption`
     linking the record(s), **and** the paired write dropping the
     assumption's Impact to 0 — a dated line in its `Scoring justification`
     field records the prior score and cites this decision; `Status`
     untouched. If the user is unsure or says no, leave this unset — an
     open assumption stays open.
   - **One-way door check** (`decision-guardrails.md §8`): if Reversibility
     is `One-way door` and any `Based on` link points at an assumption
     whose Risk sits above the working threshold, require either an
     explicit risk-acceptance line in `## Rationale` (naming the assumption
     and why deciding now beats testing first; dated format —
     `decision-guardrails.md §8`), or propose `/experiment-design` and keep
     the record `Provisional` until the evidence lands.

6. **Terminology check.** Run `../../_shared/ubiquitous-language.md` over the
   final `Statement` + body, audience = Internal. Walk any
   must-fix/should-fix findings with the user; add any missing glossary term
   via Terminology Build mode (`Status: Provisional`).

## Gate

Gated write (`../../_shared/gated-writes.md`), one record at a time. If
`Resolves assumption` was set, render **two sequential confirmation cards** —
the new/updated Decision record first, then the assumption's Impact drop to
0 with its dated mootness line — the second conditional on the first being
confirmed. Never bundle them into one silent write.

## Never

- Never infer `Resolves assumption` from `Based on assumption` — always asked
  and gated separately.
- Never fall back to "list all attendees, no one named" when attribution is
  uncertain — attempt best-effort attribution regardless; only the Unanimity
  band changes.
- Never invent an Owner, Agreed-by, or Decided date — leave the gap and flag
  it if the source doesn't clearly state it (Audit mode will surface it).
- Never write `Related tension` or `Supersedes` without reading whether the
  earlier record is truly the same topic — a false positive creates noise
  Audit can't distinguish from a real conflict.
