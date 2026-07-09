# Experiments

One `## EXP-###` section per test; evidence rows and experiment rows are the
same thing. Format: `connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Created by `/experiment-design`,
concluded via `/find-evidence` and the humans running the test.

This is validation-os's own register — the tool run on itself, on launch day.

## EXP-001: Do README + example readers understand the next step, cold?
- **Assumption**: ASM-001
- **Type**: Anecdotal
- **Source quality**: Medium
- **Feasibility**: High
- **We're right if**: ≥4 of 6 friends, reading only the README + one
  example scene, state unprompted (a) what problem validation-os solves
  and (b) the literal next command they'd run.
- **Result**: Running
- **Strength**: 0           <!-- derived: 0 until a conclusive Result -->
- **Date**: 2026-07-09
- **Owner**: Benji
- **Interviewee**: (none yet — set per call as it happens)

### Interview guide — Do people understand validation-os from the README/examples alone?

#### Who (screener)
- Segment: Adopter — builds real projects with an AI coding agent
  (Claude Code, Cursor, Codex, etc.) day to day.
- Must-have characteristics: uses an AI agent for real work weekly; has
  never seen validation-os before this conversation.
- Disqualifiers: already involved in building validation-os.
- Target N: 6 · Channel: DM to friends who fit.

#### Stimulus (if any)
- Prototype: the actual GitHub README + one `examples/` scene — link only.
- Show the link, unprompted; don't explain anything verbally until they've
  read it and answered the core questions.

#### Question arc
1. Context opener — "what's your current setup for tracking assumptions on
   something you're building — spreadsheet, Notion, nothing?"
2. Past-behaviour core — "walk me through the last time a decision got
   made on a hunch that turned out wrong — what happened after?"
3. Send the repo link, have them read cold, think aloud while reading.
4. Probes — "in your own words, what does this do?" / "what would you type
   first?" / "would you install it — why or why not?"
5. Costly-signal close — "want to actually run `/setup-validation-os` on
   one of your own projects and tell me what breaks?"

#### How to ask (rules)
- Non-leading; never "would you find this useful."
- Facts & numbers, not adjectives.
- Silence after "what does this do" — let them struggle if they struggle,
  that's signal.
- No pitching, ever — not even at the end.

#### Signal → bar
- We're right if: ≥4 of 6 correctly describe the core loop and name the
  first command unprompted.
- Counts as a hit when: they say something equivalent to "track
  assumptions, test them, evidence updates confidence" **and** correctly
  name `/setup-validation-os` or `npx skills add` as step one.
- We're wrong if: fewer than 3 of 6 get it, or several describe it as
  something it's not ("a project tracker", "a notes app").
- Scoring: one row per interview, tally toward ≥4 of 6.

### Results notes
(empty — logged per call as interviews happen)

## EXP-002: What does validation-os's current GitHub footprint show?
- **Assumption**: ASM-004
- **Type**: Desk research
- **Source quality**: High
- **Feasibility**: High
- **We're right if**: star/fork counts stay in low single digits through
  day 3 (noise-dominated), consistent with needing ~14 days before the
  count is directionally readable.
- **Result**: Inconclusive    <!-- day-0 snapshot, base rate ≠ verdict -->
- **Strength**: 0             <!-- derived; conclusive Results only -->
- **Date**: 2026-07-09
- **Owner**: Benji
- **Interviewee**: n/a

### Source
GitHub API, `bfish1996/validation-os` — `stargazers_count`, `forks_count`,
`open_issues_count`, `created_at`, `pushed_at`. Pulled 2026-07-09.

### Findings
- Stars: 0 · Forks: 0 · Open issues: 0
- Repo created: 2026-07-09T13:21:32Z · Last push: 2026-07-09T19:28:57Z —
  i.e. this is a same-day snapshot, not a trend.
- No published npm package exists for validation-os itself —
  `npx skills add` clones/copies straight from GitHub, so npm download
  telemetry does not exist for this project. "Installs via npx" is not a
  measurable number today, only an intent claim. Recorded here as a gap,
  not invented as a number.

### We're wrong if
Star/fork counts already move meaningfully (double digits) within the
first 24–48 hours purely from friend-sharing — that would mean day-zero
counts already carry signal, and this assumption is wrong sooner than
expected.

### Results notes
Logged as a baseline, not a verdict — a real read on ASM-004 needs a
second desk-research pass around 2026-07-23 comparing against this
snapshot. Confidence on ASM-004 stays 0; `Result: Inconclusive` is the
honest call here per `skills/_shared/historic-evidence.md §4` — prefer
Inconclusive when the material (one point-in-time count) wasn't built to
test a 14-day trend claim.
