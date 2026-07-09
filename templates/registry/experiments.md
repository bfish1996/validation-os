# Experiments

One `## EXP-###` section per test; evidence rows and experiment rows are the
same thing. Format: `connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Created by `/experiment-design`,
concluded via `/find-evidence` and the humans running the test. The example
below is safe to delete — it's a real, complete row from validation-os's
own register (`../../registry/experiments.md`), including the actual
interview guide used to test it, not an invented one.

## EXP-001: Do README + example readers understand the next step, cold? (example)
- **Assumption**: ASM-001
- **Type**: Anecdotal
- **Source quality**: Medium
- **Feasibility**: High
- **We're right if**: ≥4 of 6 friends, reading only the README + one
  example scene, state unprompted (a) what problem it solves and (b) the
  literal next command they'd run.
- **Result**: Running
- **Strength**: 0           <!-- derived: 0 until a conclusive Result -->
- **Date**: 2026-07-09
- **Owner**: Benji

### Interview guide — Do people understand the product from the README/examples alone?

#### Who (screener)
- Segment: the primary audience whose decision the assumption drives.
- Must-have characteristics: screenable facts only, never attitudes.
- Disqualifiers: anyone already involved in building the product.
- Target N: 6 · Channel: DM to people who fit.

#### Stimulus (if any)
- The actual README + one example — link only, no verbal explanation
  before they've read and reacted.

#### Question arc
1. Context opener — their current setup, not our idea.
2. Past-behaviour core — "walk me through the last time…"
3. Send the link, have them read cold, think aloud.
4. Probes — "in your own words, what does this do?" / "what would you do
   first?"
5. Costly-signal close — ask for something that costs them time or a
   real commitment.

#### How to ask (rules)
- Non-leading; never "would you find this useful."
- Silence after the core question — let them struggle if they struggle.
- No pitching, ever.

#### Signal → bar
- We're right if: copied from the field above.
- We're wrong if: copied from the kill bar below.
- Scoring: one row per interview, tally toward the bar.

### We're wrong if
Fewer than 3 of 6 get it, or several describe it as something it's not.

### Results notes
(empty — logged per call as interviews happen)
