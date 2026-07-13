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
   - **Kind** — `Goal commitment` (adopting a goal/OKR — extra rules in
     step 5a) / `Direction` (strategy, scope, path calls) / `Operating`
     (process, tooling, how-we-work). `decision-guardrails.md §9a`.
   - **Decided date**, **Source** (link or dated reference).
   - **Reversibility** — ask: *"if this turns out wrong, can we get back to
     today's position at a cost we'd happily pay?"* Yes → `Two-way door`;
     no or unclear → `One-way door` (`decision-guardrails.md §8`).
   - **Status** — default `Active` unless the decision is explicitly
     tentative (`Provisional`).
4. **Draft the body** from the 4-heading template (verbatim headings,
   `registry-schema.md`): `## Decision`, `## Rationale` (+ scoring
   justification), `## Alternatives considered`, `## Source` (quote/link).
5. **Assumption links — two separate, never-inferred-from-each-other
   questions** (`decision-guardrails.md §6`):
   - *"Does the rationale cite an existing assumption?"* → if yes, propose
     `Based on assumption`, linking the cited record(s). This never touches
     the assumption, on any `Kind`. On a `Provisional`/`Active` `Kind: Goal
     commitment` row, this same link (read backwards) is the derived goal
     linkage (§9g) — make sure the cited assumption is actually named
     in `## Rationale`, not just linked, or the write is a reject.
   - *"Does this decision settle that assumption without needing a test?"* →
     only if the user **explicitly** affirms, propose `Resolves assumption`
     linking the record(s), **and** the paired write dropping the
     assumption's Impact to 0 — a dated line in its `## Scoring
     justification` records the prior score and cites this decision;
     `Status` untouched. If the user is unsure or says no, leave this
     unset — an open assumption stays open.
   - **One-way door check** (`decision-guardrails.md §8`): if Reversibility
     is `One-way door` and any `Based on` link points at an assumption
     whose Risk sits above the working threshold, require either an
     explicit risk-acceptance line in
     `## Rationale` (naming the assumption and why deciding now beats
     testing first; dated format for goal commitments —
     `decision-guardrails.md §9d`), or propose `/experiment-design` and keep
     the record `Provisional` until the evidence lands.

5a. **Goal commitments only** (`Kind: Goal commitment` —
   `decision-guardrails.md §9`; the decision row IS the goal record):
   - **Check the bar against §9b (SMART)**: outcome not activity ·
     measurable with the instrument named ("Attio, stage 'Pilot signed'") ·
     unambiguous hit/miss at the deadline · one Owner · target date in the
     `## Decision` line. **Challenge the target number** — it must cite
     calibration evidence (register Confidence, current metrics); an
     unjustifiable target is hyperbole, propose a re-cut (stretch targets
     fine when labelled).
   - **Mine the rationale for beliefs not yet in the register.** Every
     "because" is either a ground truth or an assumption; a load-bearing
     belief with no record gets proposed as a new row (hand off to
     `/assumptions` single mode), then linked via `Based on assumption`,
     cited by name in `## Rationale`. This is how drafting a goal seeds the
     loop: each linked assumption is goal-linked right away — even while
     the decision is still `Provisional` — one of the derived test-next
     queue's membership conditions. Grill it clean (Gaps empty, `Draft →
     Live`) and it enters the queue; `/experiment-design` picks it up from
     there.
   - **Reversibility is `One-way door`** for the cycle by default. For
     untested links prefer test-before-commit (record stays `Provisional`,
     route to `/experiment-design`) when a cheap probe can run first;
     otherwise every risk-acceptance line uses the dated format (§9d) so
     Audit can chase the `revisit by` date.
   - Body gets an empty `## Outcome` section, filled only at close-out.
   - Re-cutting or dropping a committed goal is a **new** decision that
     `Supersedes` (or a `Reversed` flip) — never a silent edit of the bar.

6. **Terminology check.** Run `../../_shared/ubiquitous-language.md` over the
   final Decision statement + body, audience = Internal. Walk any
   must-fix/should-fix findings with the user; add any missing glossary term
   via Terminology Build mode (`Status: Provisional`).

## Goal close-out ("close out the goal", "did we hit it")

Closing an `Active` `Kind: Goal commitment` decision — the deadline passed
or the user asks. Rules: `decision-guardrails.md §9f`.

1. **Read the bar** from `## Decision` and ask the human for the measured
   result from the named instrument (or read it if the source is
   connected). The verdict — `Achieved` / `Missed` / `Dropped` — is theirs,
   never inferred from a threshold.
2. **Decompose the outcome into evidence** (Achieved/Missed): identify what
   the result proved or disproved among the `Based on` assumptions, and run
   `/find-evidence` per belief — a hit is revealed-tier evidence (paying
   users, signed intent); a miss usually invalidates one belief
   specifically. **Hard gate: `## Outcome` cannot be written with zero
   linked Experiment/Evidence records.** If the user wants to skip, that's
   a refusal to close — leave the goal open and say why.
3. **`Dropped` instead**: exempt from the evidence link, but requires the
   superseding/reversing decision to exist and be linked — a goal is
   dropped *by a decision*, not by an edit.
4. **Fill `## Outcome`**: verdict, date, one-line cause, links to the
   evidence rows (or the superseding decision). Gated write.
5. Nothing else changes mechanically — no assumption Status flips, no
   Impact edits; stale goal-anchored scores are Audit's job.

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
