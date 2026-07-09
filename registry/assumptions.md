# Assumptions

Every belief the business depends on, one `## ASM-###` section per assumption.
Format: `connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Built and maintained by `/assumptions` —
prefer running the skill over hand-editing.

This is validation-os's own register — the tool run on itself, on launch day.
Not a starter template (that's `templates/registry/`); this is live.

## ASM-001: README readers understand the next step, cold
- **Description**: We assume founders who read the validation-os README and
  one example scene, cold, will understand what to do next because the core
  loop and first command are stated plainly enough to act on without live
  explanation.
- **Lens**: Adopter
- **Themes**: Positioning, Docs & DX
- **Impact**: 85
- **Confidence**: 0         <!-- derived -->
- **Risk**: 85              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Testing
- **Owner**: Benji
- **Gaps**: (none)
- **Depends on**: (none)
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: EXP-001

### 5 Whys
1. Why do we believe this? Because the README and examples are the *entire*
   onboarding surface — no salesperson, demo call, or onboarding flow sits
   behind it. If the doc doesn't land, nothing else compensates.
2. Why does that matter right now? We're about to swap the fictional
   Ledgerly walkthrough for a real one and message friends cold — if
   comprehension is broken, both moves fail before we even learn why.
3. Why might we be wrong? We wrote the README — we already know what it
   means, so we're structurally blind to the confusion a first-time reader
   would hit.
4. Why hasn't this been tested yet? The repo is one day old
   (created 2026-07-09) — this is the first real distribution moment.
5. Why is a handful of friend DMs enough, rather than a bigger launch?
   It's the cheapest test that still uses a real, blind, cold reader — a
   bigger launch multiplies exposure on a doc we haven't validated yet.

Root: the README is the entire product experience for a first-time reader,
and we have no unbiased read on it.

### Metric for truth
TRUE if ≥4 of 6 friends, given only the GitHub link, can state unprompted
(a) what problem validation-os solves and (b) the literal next command
they'd run — without being told.

### Scoring justification
Impact 85: if comprehension fails, install intent (ASM-002), trust in real
examples (ASM-003), and everything downstream of distribution collapses.
Not 100 — the doc can still be iterated post-launch; this isn't a one-way
door.

### Provenance & notes
Seeded from the 2026-07-09 planning session where we decided to replace the
fictional Ledgerly examples with a real, self-hosted register
(see DEC-002).

## ASM-002: Agent-native founders install via `npx skills add`
- **Description**: We assume founders who already use an AI coding agent
  daily will install validation-os via `npx skills add` because it adds
  zero new surface area to their existing workflow.
- **Lens**: Adopter
- **Themes**: Distribution
- **Impact**: 70
- **Confidence**: 0         <!-- derived -->
- **Risk**: 70              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
- **Depends on**: (none)
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-09 planning session. Not yet grilled — next in the
queue behind ASM-001.

## ASM-003: Real examples build more trust than fictional ones
- **Description**: We assume a real, transparent, self-hosted worked
  example builds more trust in the method than a fictional one because
  readers can verify it against the repo's own live registry.
- **Lens**: Adopter
- **Themes**: Positioning, Docs & DX
- **Impact**: 60
- **Confidence**: 0         <!-- derived -->
- **Risk**: 60              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
- **Depends on**: (none)
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-09 planning session. Cited as rationale by DEC-002
(a `Direction` decision, so citing it does not gate its Status — it stays
`Not Started` until grilled and, separately, goal-linked).

## ASM-004: GitHub stars are too early to read as signal
- **Description**: We assume GitHub stars won't be a usable adoption
  signal for at least two weeks post-launch because organic discovery
  takes time to compound and day-zero counts are dominated by noise.
- **Lens**: Distributor
- **Themes**: Distribution
- **Impact**: 40
- **Confidence**: 0         <!-- derived -->
- **Risk**: 40              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Scoring justification
- **Depends on**: (none)
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: EXP-002

### 5 Whys

### Metric for truth
TRUE if star/fork counts stay in low single digits through day 3
(noise-dominated), and only become directionally readable by day 14 with a
repeatable weekly check. Filled ad hoc ahead of the desk-research sweep in
EXP-002 — the rest of the grill (5 Whys, Scoring justification) is still
open.

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-09 planning session.

## ASM-005: Friends are a valid proxy for the Adopter population
- **Description**: We assume friends who are founders or technical
  builders are close enough to the target Adopter population that their
  comprehension reactions to the README generalize to real prospective
  users.
- **Lens**: Adopter
- **Themes**: Community, Positioning
- **Impact**: 55
- **Confidence**: 0         <!-- derived -->
- **Risk**: 55              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
- **Depends on**: (none)
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-09 planning session. This is the honest caveat on
EXP-001: friends are a convenience sample, not a screened one — flagged
explicitly rather than left implicit (see 06-meeting-prep.md).
