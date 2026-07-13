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
prevent — a reader can't check a made-up story against anything. `Kind:
Direction`, so citing ASM-003 here does not gate its Status; it stays
`Not Started` until separately grilled and, separately again, goal-linked.

### Alternatives considered
Keep Ledgerly and add a second, real example alongside it — rejected:
doubles the maintenance surface, and the fictional one still ships first,
undermining trust before the real one is even found. Write a different
fictional example instead — rejected: same problem, different name.

### Source
2026-07-09 planning session — this session's task.
