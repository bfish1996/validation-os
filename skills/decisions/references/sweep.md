# Sweep mode — retrospective decision sweep, on demand

Scan a user-given date range across the configured evidence sources for
candidate decisions, log the new ones, and run a conflict + supersession pass
across existing Decision records. Autonomous write for what it finds, with a
run-log — but **never** autonomous for `Resolves assumption`, which always
stays a human's call.

Always invoked on demand. If the user wants a recurring sweep, that's a
separate, explicit ask — not covered here.

## Read first

`../../_shared/decision-guardrails.md` (all sections),
`../../_shared/registry-schema.md`, and `references/capture.md` (Sweep reuses
Capture's extraction/scoring logic per candidate, minus the gate).

## Inputs

A date range (ask if not given) and the sources: whatever the config's
`evidence_sources` lists that can carry decisions — call transcripts, team
chat, notes. With none configured, ask the user to paste or point at the
material to sweep.

## Phases

**A — Extract candidates.** Fan out across the sources for the date range.
For each hit that looks like a decision moment, run Capture's Phase 1–4
choreography (extract, dedup same-Area-first, draft fields + body, band
Unanimity and attribution).

**B — Conflict sweep.** For each new or existing Decision record,
semantic-compare only against other records in the **same `Area`**
(`decision-guardrails.md §7` — never a whole-register compare) for
contradictory decisions. Wire `Related tension` (two-way — it's a tag, not a
mutation with side effects beyond the relation itself).

**C — Supersedes detection.** Within a same-Area, same-topic pair where one
decision is chronologically later and evidently overrides the earlier one,
autonomously wire `Supersedes`/`Superseded by` and flip the earlier record's
`Status` to `Superseded` (`decision-guardrails.md §5`).

**D — Assumption-link recommendations.** If a candidate's rationale plausibly
cites an existing assumption, wire `Based on assumption` autonomously — but
only when the candidate's `Kind` is **not** `Goal commitment`. The link is
rationale-only and never touches the assumption, on any `Kind` — but on a
`Kind: Goal commitment` candidate it is the derived goal linkage
(`decision-guardrails.md §9g`): it anchors the target's Impact and admits
it to the derived test-next queue, so it gets the same treatment as
`Resolves assumption`: **never** autonomous — add it to the run-log as a
**recommendation** for a human to action via Capture mode, which also
confirms the citation lands in `## Rationale`. Likewise **never**
autonomously set `Resolves assumption`, even when the sweep is confident
the decision settles the question. This is the deliberate asymmetry in
Sweep's autonomy: everything else here is reversible via the run-log;
changing what the register prioritizes — admitting a row to the test-next
queue, or mooting it at Impact 0 — is a judgment call that stays gated.

## Autonomy rails

- **New Decision records, `Related tension`, `Supersedes`/`Status` flips,
  `Based on assumption` (non-`Goal commitment` `Kind` only)** — autonomous,
  logged.
- **`Based on assumption` on a `Kind: Goal commitment` decision, `Resolves
  assumption`** — never autonomous. Surfaced only as a run-log
  recommendation.
- **Terminology check** — run `../../_shared/ubiquitous-language.md` over
  each new Decision statement (audience: Internal) same as Capture; add
  unknown terms as `Provisional` glossary records autonomously.
- **Idempotent.** Dedupe-search before creating — re-running Sweep over an
  overlapping date range converges rather than duplicating.
- **Ground, don't invent.** If a source doesn't clearly show who agreed,
  leave `Agreed by` partial and let the attribution note carry the signal —
  never guess names to fill the field.

## Run-log

A list of `{record, field, before, after, kind}` mutations
(`../../_shared/gated-writes.md §Autonomous modes`), read back at the end.
Must separately call out: new records created, tensions tagged,
supersessions applied, and — distinctly — any recommended-but-not-applied
`Resolves assumption` or goal-commitment `Based on assumption` candidates
for human follow-up via Capture.

## Never

- Never schedule — Sweep is on-demand only in this skill.
- Never autonomously set `Resolves assumption`, or `Based on assumption` on
  a `Kind: Goal commitment` decision — always a run-log recommendation,
  never a write.
- Never compare for conflicts across different `Area`s.
- Never leave a clear intentional override as an unresolved tension — if the
  evidence clearly shows one decision overriding another, resolve straight
  to `Supersedes` rather than leaving a `Related tension` flag for Audit to
  re-find.
