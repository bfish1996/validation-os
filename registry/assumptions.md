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
- **Depends on**: ASM-006
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
- **Depends on**: ASM-006
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-09 planning session. Not yet grilled — next in the
queue behind ASM-001. 2026-07-10: linked upstream to ASM-006 — this belief
silently assumes the reader already knows what a skill is.

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

## ASM-006: Target adopters already know what agent skills are
- **Description**: We assume enough of the target Adopter population
  already knows what an agent skill is — and has installed at least one —
  that a skills-first repo (quickstart = `npx skills add`) is legible to
  them without explanation.
- **Lens**: Adopter
- **Themes**: Distribution, Docs & DX
- **Impact**: 75
- **Confidence**: 0         <!-- derived -->
- **Risk**: 75              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: (none)
- **Depends on**: (none)
- **Enables**: ASM-001, ASM-002
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys
1. Why do we believe this? Because we defined the target as agent-native
   founders — people already living in Claude Code / Cursor / Codex, where
   skills are the native packaging format.
2. Why does it matter right now? The entire quickstart is `npx skills add`
   with no explanation of what a skill is. If the reader lacks the concept,
   the README's first actionable line is noise — and EXP-001 would score
   that as a comprehension failure without telling us the real cause.
3. Why might we be wrong? Skills are a young convention. Daily agent use
   does not imply skill literacy — someone can run Cursor for a year and
   never install a skill. We're conflating "uses an agent" with "knows the
   skills ecosystem".
4. Why hasn't it been tested? EXP-001's screener ("uses an AI agent for
   real work weekly") was written assuming agent use implies skill
   literacy — the guide never asks about skills directly, so the current
   test is structurally blind to this failure mode.
5. Why not just fix the README (add a "what's a skill?" explainer) instead
   of testing? Because the right fix depends on who fails. If agent-native
   readers are confused, it's a docs gap — cheap, add the explainer. If
   the target market is mostly non-agent founders, it's a positioning
   problem — the repo should lead with the method (docs/ works with no
   agent at all) and treat the skills as the automation layer. Test first,
   then design.

Root: the delivery mechanism (agent skills) was chosen because the builder
lives in that ecosystem, and its legibility to the buyer was assumed, never
checked.

### Metric for truth
TRUE if ≥4 of 6 EXP-001 interviewees, asked *before* they read the repo,
can (a) say roughly what an agent skill is and (b) report having installed
or used at least one. Piggybacks on the same calls as EXP-001 with its own
pre-registered bar — one added screener-stage question, near-zero cost.

### Scoring justification
Impact 75: if false, ASM-001 and ASM-002 both degrade — comprehension and
install intent fail at the vocabulary layer before the method is ever
judged. Not higher because the failure is recoverable by design (in-line
explainer, method-first framing, agentless path through docs/), not a
one-way door.

### Provenance & notes
Seeded from the 2026-07-10 working session on this PR — raised directly by
the owner ("maybe not many people yet know what skills are"). Grilled in
the same session; hand-written into the register as part of adjusting the
PR rather than via a gated `/assumptions` run, so treat the grill as
draft-quality until the owner re-reads it.

## ASM-007: Installers sustain the ritual long enough to compound
- **Description**: We assume founders who install validation-os will keep
  running the loop — grilling, logging evidence, closing experiments —
  past the first fortnight, because the skills cut the process cost enough
  that the register compounds instead of going stale.
- **Lens**: Adopter
- **Themes**: Product, Community
- **Impact**: 80
- **Confidence**: 0         <!-- derived -->
- **Risk**: 80              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
- **Depends on**: ASM-002
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-10 working session. The install (ASM-002) is not
the product — the sustained weekly ritual is. Every process tool's
graveyard is full of enthusiastic day-one installs; nothing in the current
register or EXP plan measures week-two behaviour.

## ASM-008: The method generalizes beyond its home startup
- **Description**: We assume the method — the evidence ladder, derived
  Confidence, Risk = Impact × (1 − Confidence/100), the gates — produces
  better test-next prioritization than founder intuition for teams other
  than the one it was extracted from.
- **Lens**: Adopter
- **Themes**: Product, Positioning
- **Impact**: 90
- **Confidence**: 0         <!-- derived -->
- **Risk**: 90              <!-- derived -->
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
Seeded from the 2026-07-10 working session. The README's core evidence is
"battle-tested daily running a real startup" — n=1, and the n is us. The
ladder's rung percentages and the Risk formula are asserted, not derived;
what's actually load-bearing is whether teams using them make better
kill/commit calls than they would by feel.

## ASM-009: Six skills is a learnable surface, not a maze
- **Description**: We assume users faced with six slash commands find the
  right one for their situation via trigger phrases and natural language,
  rather than bouncing off the choice or only ever using `/assumptions`.
- **Lens**: Adopter
- **Themes**: Docs & DX, Product
- **Impact**: 45
- **Confidence**: 0         <!-- derived -->
- **Risk**: 45              <!-- derived -->
- **Corroboration count**: 0
- **Status**: Not Started
- **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
- **Depends on**: ASM-006
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: (none)

### 5 Whys

### Metric for truth

### Scoring justification

### Provenance & notes
Seeded from the 2026-07-10 working session. The costly-signal close in
EXP-001 ("run `/setup-validation-os` on one of your own projects and tell
me what breaks") is the cheapest early read on this.

## ASM-010: Validation is a gap adjacent skill packs leave open
- **Description**: We assume validation-os occupies a niche that adjacent
  skill ecosystems (mattpocock/skills foremost) do not cover — they own
  the build workflow (prototype, TDD, code review, PRD-to-prod), so the
  winning shape is a narrow validation layer that composes with them
  rather than reinventing their ground.
- **Lens**: Adopter
- **Themes**: Positioning, Product
- **Impact**: 65
- **Confidence**: 0         <!-- derived -->
- **Risk**: 65              <!-- derived -->
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
Seeded from the 2026-07-10 working session. Two falsifiable halves: (a) no
popular pack already ships assumption-testing/validation skills — a desk
sweep of skills.sh and the major packs settles it; (b) composition is real
work we don't have to redo — Doshi's own OPS-1014 (prototype → production
pipeline) and OPS-1144 (PRD handoff) are the live case: mattpocock-style
/prototype, /tdd, /code-review cover the build side, and validation-os's
exit stage (Validated assumption + prototype) is the input they need.
Repo credits already name mattpocock/skills as structural inspiration.
