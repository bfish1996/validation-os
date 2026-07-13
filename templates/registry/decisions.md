# Decisions

The decision log: what was actually decided, by whom, how unanimously. One
`## DEC-###` section per decision. Format: `connectors/local-files.md` ·
field rules: `skills/_shared/registry-schema.md`. Owned by `/decisions`.
The example below is safe to delete — it's a real, complete row from
validation-os's own register (`../../registry/decisions.md`), not a
fictional company.

## DEC-001: Replace the fictional Ledgerly walkthrough with real examples (example)
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
- **Based on assumption**: ASM-001
- **Resolves assumption**: (none)

### Decision
Replace every fictional example in this repo's docs with real content from
its own registry — the tool run on itself.

### Rationale
Cites ASM-001 (README readers understand the next step, cold) — a
fictional example is one more thing standing between the reader and
understanding what to do next, and it can't be checked against anything
real. A `Based on assumption` link is rationale only — it never touches
ASM-001's row, on any `Kind`.

### Alternatives considered
Keep the fictional example and add a real one alongside it — rejected:
doubles the maintenance surface and the fictional one still ships first.

### Source
2026-07-09 planning session.

<!-- Kind: Goal commitment rows additionally carry an `### Outcome` section
     (empty until close-out) and dated risk-acceptance lines in Rationale —
     skills/_shared/decision-guardrails.md §9. -->
