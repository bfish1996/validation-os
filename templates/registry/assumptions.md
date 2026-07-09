# Assumptions

Every belief the business depends on, one `## ASM-###` section per assumption.
Format: `connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Built and maintained by `/assumptions` —
prefer running the skill over hand-editing. The example below is safe to
delete — it's a real, complete row from validation-os's own register
(`../../registry/assumptions.md`), not a fictional company, kept here so a
new registry starts from a genuine example instead of an invented one.

## ASM-001: README readers understand the next step, cold (example)
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
Root: the README is the entire product experience for a first-time reader,
and we have no unbiased read on it — see `../../registry/assumptions.md`
for the full chain.

### Metric for truth
TRUE if ≥4 of 6 friends, given only the GitHub link, can state unprompted
(a) what problem it solves and (b) the literal next command they'd run.

### Scoring justification
Impact 85: comprehension gates everything downstream of distribution.
Not 100 — the doc can still be iterated post-launch.

### Provenance & notes
Seeded as a real example, pulled from validation-os's own self-hosted
register. Walkthrough: `../../examples/`.
