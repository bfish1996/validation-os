# 04 · Find existing evidence — `/find-evidence` (desk)

**You type:** "what do we already know about ASM-001 — any internal or
desk evidence before we design a test?"

The skill resolves the record, sweeps the configured sources, and reports
back honestly:

▎ Internal sources: none configured beyond web — no Fireflies, Slack, or
▎ Attio connected in this workspace. Desk sweep for "do people understand
▎ agent-skill READMEs cold": nothing I can fetch and quote meets the
▎ desk-research bar (`desk-research-rubric.md` — no source, no claim).
▎ Swept, no qualifying hit — that's a valid, complete outcome; nothing
▎ gets written, and nothing gets manufactured to fill the gap.

Nothing lands against ASM-001. But one desk fact *is* available and worth
logging while we're here: validation-os's own GitHub footprint, bearing on
ASM-004 ("stars won't be a usable signal for ~2 weeks").

▎ Pulled directly from the GitHub API for `bfish1996/validation-os`: 0
▎ stars, 0 forks, 0 open issues; repo created 2026-07-09T13:21:32Z, last
▎ push 2026-07-09T19:28:57Z — a same-day snapshot, not a trend. This is a
▎ base rate, not a validation: one point-in-time count can't settle a
▎ 14-day claim. I'll log it as `Result: Inconclusive` so Strength stays 0
▎ and Confidence doesn't move.

One gated write:

```markdown
## EXP-002: What does validation-os's current GitHub footprint show?
- **Assumption**: ASM-004 · **Type**: Desk research
- **Result**: Inconclusive    (day-0 snapshot ≠ 14-day verdict)
- **Strength**: 0             <!-- derived; conclusive Results only -->
```

The body carries the exact numbers, the source (GitHub API, pulled
2026-07-09), and one more honest finding: there's no npm package for
validation-os itself, so `npx skills add` installs aren't measurable
today — that gap is recorded in the body, not papered over with an
invented number.

**What this shows:** "swept, no hit" is a real and complete outcome — the
skill doesn't manufacture a weak record to fill space — a genuinely
available desk fact gets logged with exact provenance even when it's for
a different assumption than the one you started on, and a day-zero number
is honestly scored `Inconclusive`, not stretched into a verdict it can't
support yet.

Next: [05 — design the test](05-design-the-experiment.md).
