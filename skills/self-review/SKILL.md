---
name: self-review
description: >-
  PRIVATE self-review of how you communicate in recorded conversations —
  your pitches, arguments, load-bearing claims — scored 0–4 against the
  registers: do you re-litigate settled decisions, name your assumptions,
  propose the cheapest test first, speak concretely? Blunt report, trend
  tracking, and concrete improve-next actions; everything lands in a local
  gitignored directory, never through the registry connector. Use for
  "review my calls", "how did I pitch", "score me against the method",
  "what should I improve", "am I still reopening settled decisions",
  "evaluate this transcript of me". Skip for logging the decision itself
  (/decisions), logging evidence (/find-evidence), or grilling an
  assumption (/assumptions).
license: MIT
---

# Self-review

A private coach for practicing the method: the registers supply the
standard (settled decisions, named assumptions, the evidence ladder, the
glossary), your transcripts supply the behaviour, and every run tells you
— bluntly — where the two diverge and what to do differently in the next
conversation. Anyone on a team runs it on **themselves**, in their own
workspace; it evaluates only you.

Read `validation-os.config.yaml` (walk up from the working directory).
Registers are read through the active connector (`connectors/SPEC.md`) —
**read-only, every mode**.

> The four-dimension rubric, tone, and improve-next rules live in
> `references/rubric.md`; its machine-readable shadow (anchors, rules,
> report shape) is `references/evals.json` — the pair changes together.
> The review directory, profile, run-log, and history formats live in
> `references/storage.md`. Attribution confidence reuses
> `../_shared/decision-guardrails.md §3`. Read what your mode needs before
> writing anything.

## Pick the mode

| Mode | Scope | Writes | Reference |
|---|---|---|---|
| Sweep | your transcripts since the last run | review dir only, autonomous + run-log | `references/sweep.md` |
| Single | one transcript (link, ID, or pasted) | review dir only, gated | `references/single.md` |
| Trends | accumulated history | none | inline, below |

**State the mode in one line before acting.** Sweep is on-demand only,
never scheduled.

The unit of evaluation is the **moment** — a stretch where you pitch
(advocate a course of action with an ask) or assert load-bearing claims.
Detection rules: `references/sweep.md §Phase B`; both modes share them.

### Trends (read-only)

"Am I improving?" / "Am I still reopening settled decisions?" — read
`history.md`, render dimension trajectories, the re-litigation ledger,
standing patterns, and which improve-next actions are still open. No
fetching, no writes.

## Transcript sources

Sources come from the config's `evidence_sources` — whatever is listed
that carries transcripts (mechanics per source:
`../find-evidence/references/<source>.md`). Every transcript is normalized
to `{title, date, attendees, link, turns}` before anything else happens,
so the evaluation logic is source-independent; with nothing configured,
pasted text with speaker prefixes works the same.

Only **internal team conversations where you spoke** are reviewed.
External conversations — evidence interviews, customer, investor, or
prospect calls — are skipped and logged: interviewing well is
`/find-evidence` and `/experiment-design` territory, and a pitch *to a
prospect* is `Pitch-deck reaction` evidence, not review material.

## Never — the privacy rails

- Never write through the registry connector, into any register, or
  anywhere outside the review directory (sole exception: the gated
  `.gitignore` append at first-run scaffold, `references/storage.md`).
- Never surface review content in another skill's output, a register
  record, or anything team-facing.
- Never score anyone but the profile's subject — teammates' words are
  context, not material.
- Never score an external conversation under this rubric.
- Never schedule a sweep.

## How this relates to other skills

Your moments often contain the raw material of register records — a
decision being made, an assumption worth logging. The report
**recommends** routing those to `/decisions` Capture or `/assumptions`; it
never writes them. Pairs naturally with the Friday `/decisions` sweep —
run it back-to-back, privately.
