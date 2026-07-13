# Decisions

The decision log: what was actually decided, by whom, how unanimously. One
`## DEC-###` section per decision. Format: `connectors/local-files.md` ·
field rules: `skills/_shared/registry-schema.md`. Owned by `/decisions`.

This is validation-os's own register — the tool run on itself, on launch day.

## DEC-001: Validate README comprehension before wider launch
- **Type**: Decision
- **Kind**: Goal commitment
- **Status**: Provisional
- **Area**: Positioning
- **Owner**: Benji
- **Agreed by**: Benji
- **Unanimity score**: 100
- **Source**: 2026-07-09 planning session
- **Decided date**: 2026-07-09
- **Reversibility**: Two-way door
- **Related tension**: (none)
- **Supersedes**: (none)
- **Superseded by**: (none)
- **Based on assumption**: ASM-001
- **Resolves assumption**: (none)

### Decision
Before any broader launch push (posts, forums, wider outreach), get ≥4 of 6
friends who fit the Adopter profile to demonstrate cold comprehension of
validation-os's core loop and first command — reading only the README plus
one example scene. Measured by the interview tally in EXP-001. Target date:
2026-07-23.

### Rationale
Cites ASM-001 (README readers understand the next step, cold) — the whole
distribution plan sits on top of this being true. Better to find out from
six friends than from a public launch. Provisional, not Active: this is a
validation checkpoint, not a binding launch commitment yet — its own
underlying belief (ASM-001) gets to run through the main loop before we
commit further (`decision-guardrails.md §9c`).

### Alternatives considered
Skip validation and launch broadly now — rejected: no way to tell a bad
README from a bad idea if we launch blind. Wait for a fully-designed
onboarding flow before testing anything — rejected: too slow; a friend DM
is cheaper and faster than building more first.

### Source
2026-07-09 planning session.

### Outcome
(empty — target date 2026-07-23; closes out via `/find-evidence` once
EXP-001's interviews conclude, per `decision-guardrails.md §9`.)

## DEC-002: Replace the fictional Ledgerly walkthrough with real examples
- **Type**: Decision
- **Kind**: Direction
- **Status**: Active
- **Area**: Docs & DX
- **Owner**: Benji
- **Agreed by**: Benji
- **Unanimity score**: 100
- **Source**: 2026-07-09 planning session
- **Decided date**: 2026-07-09
- **Reversibility**: Two-way door
- **Related tension**: (none)
- **Supersedes**: (none)
- **Superseded by**: (none)
- **Based on assumption**: ASM-003
- **Resolves assumption**: (none)

### Decision
Replace every fictional "Ledgerly" example — the 7-scene `examples/`
walkthrough and the 4 `templates/registry/` seed rows — with real content
from validation-os's own registry: the tool run on itself.

### Rationale
Cites ASM-003 (real examples build more trust than fictional ones). A
fictional company invites exactly the skepticism the README is trying to
prevent — a reader can't check a made-up story against anything. Rationale
citations never touch the cited row: ASM-003 stays `Draft` until grilled
and, separately, needs a goal link to enter the test-next queue.

### Alternatives considered
Keep Ledgerly and add a second, real example alongside it — rejected:
doubles the maintenance surface, and the fictional one still ships first,
undermining trust before the real one is even found. Write a different
fictional example instead — rejected: same problem, different name.

### Source
2026-07-09 planning session — this session's task.

## DEC-003: An assumption is never validated — no terminal Validated state
- **Type**: Decision
- **Kind**: Direction
- **Status**: Active
- **Area**: Product
- **Owner**: Benji
- **Agreed by**: Benji
- **Unanimity score**: 100
- **Source**: Linear OPS-1110 / OPS-1117 (notes 2026-07-12, session 2026-07-13)
- **Decided date**: 2026-07-13
- **Reversibility**: Two-way door
- **Related tension**: (none)
- **Supersedes**: (none)
- **Superseded by**: (none)
- **Based on assumption**: ASM-011
- **Resolves assumption**: (none)

### Decision
An assumption is never validated. The model stores no terminal `Validated`
state: an assumption's standing is its live Risk score
(Impact × (1 − Confidence/100)), which moves whenever evidence or Impact
moves. Stored lifecycle is `Draft → Live → Invalidated` only; testing,
queue membership, goal linkage, and the proven set are derived views.
"Validated" survives as an experiment's `Result` and as the prose
shorthand "validated at \<rung\>". Full semantics: `docs/validated.md`.

### Rationale
Every "because" is a ✅ ground truth or a register record:
- ✅ Falsification asymmetry: finite evidence can conclusively refute a
  general claim but never conclusively prove one (Popper — settled
  epistemology, not a bet). So `Invalidated` can honestly be a state;
  `Validated` cannot.
- ✅ Evidence describes the population and moment it sampled; markets,
  users, and products keep moving after the sample is taken.
- ✅ By construction the evidence ladder tops out at 99, not 100
  (`docs/evidence-ladder.md`, Gilad lineage): even the strongest evidence
  class leaves residual uncertainty.
- ASM-011 — the operational bet: a live Risk score resurfaces stale or
  newly load-bearing beliefs that a terminal status would freeze. Cited as
  rationale only (`Kind: Direction`), so the citation does not gate
  ASM-011's own lifecycle.

Unanimity 100: sole-founder decision, no dissent to record. Two-way door:
reinstating statuses is a schema migration — a cost we'd pay, not a door
that locks.

### Alternatives considered
Keep `Validated` as a resting-but-reopenable status — rejected: every
consumer must then be taught the status lies ("validated, but check the
date"); a derived proven-set view says the same thing without storing a
claim that decays. A fixed Confidence threshold for "validated" —
rejected: the stopping rule is Risk (Impact-weighted), so no global
Confidence number is honest.

### Source
Linear OPS-1110 (closed 2026-07-13 on this decision) and the OPS-1117
comment thread (2026-07-12 notes); decided in the 2026-07-13 working
session.
