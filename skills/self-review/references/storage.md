# Storage — the private self-review directory

Every file this skill writes lives here, and nothing here ever travels
through the registry connector. Both modes read this file before writing.

## Resolving the directory

Config key `self_review.review_dir`, resolved relative to
`validation-os.config.yaml` (same rule as `local_files.registry_dir`).
Unset → `self-review/` next to the config file.

## First run — gated scaffold

When the directory doesn't exist yet, scaffold it behind one gated card
(`../../_shared/gated-writes.md`):

1. Create the directory and `README.md` containing the privacy banner:
   *"Private self-review for <name>. Never share, never commit, never
   sync."*
2. Offer to append the directory to the **workspace** `.gitignore` (create
   the file if missing). If the user declines or the workspace isn't a git
   repo, say so and record the choice in `README.md`.
3. Build `profile.md` interactively: the user's name and the speaker labels
   they appear under in transcripts.

## Layout

```
self-review/
  README.md     privacy banner + gitignore choice
  profile.md    your name + speaker aliases
  run-log.md    one section per run — the sweep window chain lives here
  history.md    your accumulated evaluations + trends
```

## profile.md

```markdown
# Profile
- **Name**: Alex
- **Aliases**: Alex, Alex F., A. Fisher
```

Transcript speaker labels are matched against the aliases; a transcript
where none match is skipped and logged (someone else's meeting, or broken
diarization).

## run-log.md

One `##` per run, newest first:

```markdown
## Run 2026-07-09T14:02 — sweep
- **Window**: 2026-07-01 → 2026-07-09
- **Sources**: fireflies
- **Transcripts scanned**: 6 (title — date — link, one per line)
- **Skipped**: "Acme discovery call" (external) · "Standup 07-07" (no moments) · "Design review" (you didn't speak)
- **Moments**: 2 (transcript — type)
- **History updated**: +2 sections
- **Register recommendations**: candidate decision in Q3 sync (→ /decisions Capture) — not written
```

Timestamps: local time, minute precision. `Sources:` names the configured
transcript sources, or `pasted/local files` when the material was pointed
at directly. **Window chaining:** a sweep's
default start = the window end of the latest `— sweep` entry; no sweep
entry yet → ask for a start date. Single-mode runs append a `— single`
entry but never advance the chain.

## history.md

Header + `## Trends` + per-run sections, newest section directly under
Trends:

```markdown
# Self-review — Alex (PRIVATE)
- **Runs**: 4   **Last evaluated**: 2026-07-09

## Trends
| Dimension | ← older … newer → | Direction |
|---|---|---|
| Decision fidelity | 1 · 2 · 1 · 1 | flat-low |
| Assumption transparency | 2 · 2 · 3 · 3 | improving |
| Experiment-first | 3 · n/a · 4 · 3 | solid |
| Concreteness | 2 · 3 · 3 · 4 | improving |

Re-litigation ledger:
- DEC-012 (one-way, in Agreed by): 2026-06-02, 2026-06-20, 2026-07-09 — 3rd time
Standing patterns (≥2 runs): pipeline projections asserted as fact, no ASM mapping — 3 of 4 runs.
Open actions: name the DEC-### before proposing near it (since 2026-06-20).

## 2026-07-09 — "Q3 roadmap sync" (fireflies: <link>) — sweep 2026-07-09T14:02
**Moment** (pitch): move to usage-based pricing this quarter.
**Attribution**: Confident (5 labels / 5 attendees).

| Dimension | Score | Basis |
|---|---|---|
| Decision fidelity | 1 | reopens DEC-012 (Active, one-way, you in Agreed by), no new evidence |
| Assumption transparency | 3 | named ASM-021; churn claim asserted as fact |
| Experiment-first | 3 | pricing-page fake door proposed before migration |
| Concreteness | 4 | numbers + named accounts throughout |

**Quotes**
- [00:14:22] "I still think per-seat was the wrong call, we should just switch" → DEC-012 re-litigation, no evidence (D1)
- [00:16:05] "I'm assuming — and it is an assumption — that ASM-021 holds for mid-market" (D2)
- [00:19:40] "before we migrate anyone, put the usage tiers on the pricing page and see who clicks" (D3)

**Read**: <2–4 blunt sentences, tone rules in rubric.md>
**Improve next**: cite new evidence or leave DEC-012 alone — 3rd reopening without it.
**Register recommendations (not written)**: churn claim → candidate ASM via /assumptions.
```

**Recompute `## Trends` on every run**: dimension sequences from the
per-run sections (oldest → newest, `n/a` kept in place), the re-litigation
ledger from repeated DEC-### citations across sections, standing patterns
once seen in ≥2 runs, and `Open actions` — Improve-next items that haven't
moved their dimension yet.

## Idempotency

Before appending a section, check `history.md` for the same transcript
link (or file path, for pasted/local material) + moment. Present → skip. Re-running an overlapping window converges
instead of duplicating (same rule as `/decisions` sweep).
