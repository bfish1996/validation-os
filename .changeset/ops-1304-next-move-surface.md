---
"@validation-os/core": minor
"@validation-os/dashboard": minor
---

Front-door "next move" surface across `core` + `dashboard` (OPS-1304).

`@validation-os/core` gains `rankNextMoves` (in `derivation`) — one pure function, beside `risk`/`confidence`/`impact`, that ranks beliefs into their next move. It scores each unresolved belief by Feasibility × Risk (the cheapest honest test of the riskiest belief on top), floats any belief at Confidence ≤ −50 into a kill/re-test lane above that order, and names the act its stage demands (`score-impact` · `design-experiment` · `record-reading` · `decide` · `retest`). Computed fresh on read — it reads the derived numbers, never recomputing them — so it stays out of the on-write recompute. The rule is stated once in `ontology.yaml → derived_views.next_move`. New exports: `rankNextMoves`, `KILL_LANE_THRESHOLD`, and the `NextMove` / `MoveKind` / `NextMove*Input` types.

`@validation-os/dashboard` fills the `#next` pane with `NextMoveSurface`: a centred hero (the belief, a seen-not-read risk chip with no number, and one act button whose label follows the belief's stage), all machinery behind a single "Why this?" reveal (the numeric risk, the Feasibility × Risk breakdown, the ranked list, and the Framed→Planned→Tested→Known stepper), an "On deck" list of runners-up, a manual-override pick-list, and a kill-lane banner. Step-in adapts to the act: human acts open a form, agent-run acts point at the record for review. Adds the two missing step-in forms — `ScoreImpactForm` (a real slider, not a bare cell) and `WriteDecisionForm` (create a decision and wire it to the belief via `based on`/`resolves` in one step). New exports: `NextMoveSurface`, `ScoreImpactForm`, `WriteDecisionForm`, `toNextMoveInput`, `movePresentation`.
