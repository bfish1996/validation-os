# Capture mode — one decision, gated

Turn a specific call/thread/note into one guardrail-complete Decision record.
This is the per-record choreography every other Decision mode reuses — Sweep
runs it (minus gates) per candidate; Audit hands its findings back here for
gated fixes.

## Read first

`../../_shared/decision-guardrails.md` (all sections — this mode enforces all
of them) and `../../_shared/registry-schema.md` (field map, Type = Decision).
Terminology check: `../../_shared/ubiquitous-language.md`. Gate:
`../../_shared/gated-writes.md`.

## Entry

The user points Capture at a specific source: a call transcript, a chat
thread, a note, or pasted text. If they instead describe a decision from
memory with no source, ask for one — `Source` is required
(`decision-guardrails.md §1`); pasted notes count, dated.

## Phases

1. **Extract.** Read the source. Pull out the one-line decision statement:
   what was decided, instead of what alternative, and who was in the
   room/thread.
2. **Dedup.** Search existing Decision records (Type = Decision), same `Area`
   first, then whole register, for a record that already covers this. If
   found, **edit that record** (e.g. add corroborating `Agreed by`, or open a
   `Supersedes` link if this is actually a later override) rather than
   creating a duplicate.
3. **Draft the fields:**
   - **Owner** — who's accountable for the decision.
   - **Agreed by** — everyone who explicitly affirmed, best-effort from the
     source even if speaker attribution looks shaky
     (`decision-guardrails.md §3`).
   - **Unanimity score** — band it per `decision-guardrails.md §2`, one band
     down if attribution is uncertain. Write the one-line justification into
     the body's `## Rationale`.
   - **Area** — topic tag from the config's `vocabulary.area`.
   - **Decided date**, **Source** (link or dated reference).
   - **Status** — default `Active` unless the decision is explicitly
     tentative (`Provisional`).
4. **Draft the body** from the 4-heading template (verbatim headings,
   `registry-schema.md`): `## Decision`, `## Rationale` (+ scoring
   justification), `## Alternatives considered`, `## Source` (quote/link).
5. **Assumption links — two separate, never-inferred-from-each-other
   questions** (`decision-guardrails.md §6`):
   - *"Does the rationale cite an existing assumption?"* → if yes, propose
     `Based on assumption`, linking the cited record(s). This never touches
     the assumption's `Status`.
   - *"Does this decision settle that assumption without needing a test?"* →
     only if the user **explicitly** affirms, propose `Resolves assumption`
     linking the record(s), **and** the paired write flipping the
     assumption's `Status` to `Resolved by decision`. If the user is unsure
     or says no, leave this unset — an open assumption stays open.
6. **Terminology check.** Run `../../_shared/ubiquitous-language.md` over the
   final Decision statement + body, audience = Internal. Walk any
   must-fix/should-fix findings with the user; add any missing glossary term
   via Terminology Build mode (`Status: Provisional`).

## Gate

Gated write (`../../_shared/gated-writes.md`), one record at a time. If
`Resolves assumption` was set, render **two sequential confirmation cards** —
the new/updated Decision record first, then the assumption's `Status` flip —
the second conditional on the first being confirmed. Never bundle them into
one silent write.

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
