# 02 · Seed assumptions from the planning session — `/assumptions` (seed)

Same day. No pilot call to mine — the source is the planning conversation
where Benji decided to stop shipping a fictional walkthrough and run
validation-os on itself instead.

**You type:** "pull assumptions from this conversation — we're replacing
the fictional examples and dogfooding the repo"

The skill states its mode (seed) in one line, then proposes candidates —
each already checked against the guardrails:

▎ Five candidates, all atomic and falsifiable. 1) "Founders reading the
▎ README and one example scene, cold, will understand what to do next" —
▎ Lens Adopter. 2) "Agent-native founders install via `npx skills add`
▎ because it adds no new surface area" — Lens Adopter. 3) "A real,
▎ self-hosted example builds more trust than a fictional one" — Lens
▎ Adopter. 4) "GitHub stars won't be a usable signal for ~2 weeks" — Lens
▎ Distributor. 5) "Friends are a valid proxy for the Adopter population" —
▎ Lens Adopter. Nothing rejected this round — no hyperbole, no
▎ non-atomic claims.

Each accepted candidate is its own gated write — nothing lands in bulk.
ASM-001 as created:

```markdown
## ASM-001: README readers understand the next step, cold
- **Description**: We assume founders who read the validation-os README
  and one example scene, cold, will understand what to do next because
  the core loop and first command are stated plainly enough to act on
  without live explanation.
- **Lens**: Adopter · **Themes**: Positioning, Docs & DX
- **Status**: Draft · **Owner**: Benji
- **Gaps**: 5 Whys, Metric for truth, Scoring justification
```

ASM-002 through ASM-005 land the same way, each a stub with the same three
open Gaps. New records are stubs, not finished work — seed leaves the
`Gaps` that the single-mode grill will clear.

**What this shows:** seed works from a real conversation, not just a call
transcript — the source can be any record of how a belief surfaced — one
gated write per record, and `Status` + `Gaps` mark exactly how unfinished
each belief still is.

Next: [03 — grill it](03-grill-an-assumption.md).
