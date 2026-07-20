# Stage policy: assumption membership + dashboard lens

**Status:** Spec — 2026-07-20. Land in two coordinated PRs (schema + dashboard, backend migration).

## The policy in one sentence

Every assumption is a falsifiable claim about **an external actor's response** to the business — a user, buyer, competitor, regulator, partner, distributor, investor. The sentence's subject must be the external actor or the market, not "we". If the claim doesn't fit one of the four discovery stages, it isn't an assumption; it's a build risk, a fact, a decision, or a value — and it leaves the register.

## The four stages (the membership test AND the stored tag)

Grounded in customer-development literature (Blank, IDEO, lean startup, Andreessen). Tag every assumption with exactly one:

- **Stage 1 — Discovery (problem-solution fit):** "Do people have this problem, will they engage, will they disclose, will they care?" Desirability bets. Subjects: prospective users, prospects encountering the problem.
- **Stage 2 — Validation (product-market fit):** "Will they pay, will they sign, will they stay, is the sale repeatable?" Viability bets. Subjects: buyers, decision-makers in a committing posture.
- **Stage 3 — Scale (growth):** "Can we acquire efficiently, does CAC<LTV hold at volume, can we deliver at scale?" Unit-economics + delivery-at-scale bets. Subjects: channels, cohorts, acquisition mechanics, infra.
- **Stage 4 — Maturity (defense):** "Will incumbents respond, will regulators accept, will the market accept the category, expansion bets." Subjects: regulators, incumbents/competitors, the market-as-a-whole, adjacent segments.

**The membership test is embedded in the taxonomy.** There is no stage for "we can build X" — build risk isn't a stage of discovery, it's a delivery phase. If a claim doesn't fit any stage, it falls out. To place a record in a stage you have to articulate *which external actor and what kind of response* — which forces lazy BUILD framings ("the conduct layer is safe enough") into their real market bet ("regulators will approve the conduct layer"). The stage taxonomy does the gate's work.

## What's NOT stored

- **No `type` field.** Everything in the register is a BET by construction — the stage placement *is* the membership test. BUILD/FACT are what the gate catches, not residents.
- **No business-level stage flag.** Where the business is, per Lens, is *read off the distribution of bets held* — the modal stage per Lens is where that part of the business is. No "update my stage" button.
- **No per-stage confidence model.** The 8-rung ladder is stage-agnostic; stage only affects *which rungs are honest* for a given bet, not how Confidence is computed.
- **No granularity field.** Granularity is enforced at write-time by the existing atomicity (§4) and general-law rejection (§1.2) rules.

## The Lens × Stage relationship

`Lens` (already stored) = the **actor** — who the belief is about (SME owners, banks, regulators, etc.). Vocabulary field, configured.

`Stage` (new) = the **kind of response** being tested — engage, pay, scale, defend. 1-4, derived from the claim's subject matter.

**They are orthogonal.** A Lens can appear at multiple stages: Commercial spans all four (will banks engage / sign / integrate / get regulatory sign-off). Consumer spans 1-3 and is zero at Stage 4 (consumers don't drive defense bets). No Lens maps 1:1 to a stage. Both fields earn their keep; collapsing them loses signal.

## The dashboard surface

A **Lens × Stage heatmap** with click-through to Risk-ranked assumptions:

```
              S1 (discover)  S2 (validate)  S3 (scale)  S4 (defend)
Commercial        9             43            17           31
Consumer         60              5             4            0
Investor          0              1             1            3
```

- **Densest cell per row = where that part of the business is.** No flag, no declaration — the density tells you. Commercial-S2 (43) is the active commercial front; Consumer-S1 (60) is the active consumer front.
- **Click a cell → the assumptions in it, ranked by Risk.** Prioritisation still happens by Risk within the cell. The grid is the filter; Risk is the rank.
- **Thin/empty cells = gaps.** Consumer-S4 (0) isn't a problem — consumers don't drive defense bets. Commercial-S3 (17, but only 6 market bets after the build-pollution cleanup) *is* a gap — under-tracking scale.
- **Off-diagonal cells = open earlier-stage questions while you're elsewhere.** Commercial-S1 (9) while you're at Commercial-S2 — those 9 are desirability bets still in flight. They don't suppress; they stay visible as "still open."

No stage-flag selector. No "what stage am I" prompt. No per-stage confidence model. No sequencing-gate UI. Just a grid that reads your business state off where your bets cluster, and lets you drill into any cell ranked by Risk.

## Provenance — what we borrowed and from whom

This policy is a synthesis, not an invention. The lineage, credited honestly:

| Concept | Source | What we took | What we went beyond |
|---|---|---|---|
| **Assumption-based planning** | RAND (Dunham, 1995) | The framing: make hidden beliefs visible, rank by criticality, test them. | CAP's NPV-swing criticality → our `Risk = Impact × (1−Confidence)`; CAP's test-effectiveness ratio → our Feasibility × Risk queue. |
| **Critical Assumption Planning (CAP)** | D. Dunham & Co. (Sykes & Dunham, 1995) | The learning loop: identify → test → reassess → re-test. | CAP treats build risk and market bets as the same kind of "test." We split them — the stage taxonomy has no slot for "we can build X." |
| **Discovery-Driven Planning (DDP)** | McGrath & MacMillan (HBR 1995) | Assumption-to-test mapping; the discipline of pre-registering what would prove you wrong. | DDP is scoped to new ventures only. Our stage taxonomy extends across the full lifecycle (Stages 1-4), with the U-shape: BET-heavy at 1, BUILD-heavy at 3, BET-returns at 4. |
| **Customer development (4 stages)** | Steve Blank (2012) | The four-stage shape: Discovery → Validation → Scale → Maturity. The idea that the *kind* of uncertainty shifts by stage. | Blank's stages are a business-level property. We tag per-assumption, so a business with a mature core + a new segment shows mixed stages honestly. |
| **Desirability → Feasibility → Viability triangle** | IDEO | The framing that different kinds of bet dominate at different times. | IDEO's triangle is a design lens; we made it a stored tag with a dashboard grid. |
| **Build → Measure → Learn** | Eric Ries (Lean Startup) | The loop shape; the bias toward cheapest honest test first. | Our ladder (8 rungs, signed) is finer than Ries's "validated learning" — and our Confidence is signed, not binary. |
| **Pre/post-PMF framing** | Marc Andreessen | The intuition that what matters shifts after product-market fit. | Made operational as the Stage 2 → Stage 3 transition in the tag. |
| **Subject-verb membership test** | Original to this policy | — | The rule that every assumption's subject must be an external actor. CAP/DDP don't draw this line; they include "we can build on time" as an assumption. We reject it. |
| **Stage-as-derived-business-state** | Original to this policy | — | Reading "where the business is" off the distribution of bets held, not off a self-declared flag. |
| **Lens × Stage heatmap dashboard** | Original to this policy | — | The grid that makes the stage tag operational as a filter and a diagnostic. |

**What we explicitly did NOT take from CAP/DDP:**
- Their treatment of build risk as a type of assumption (we reject it).
- Their binary test outcomes (we have a signed, graded Confidence).
- Their evidence-type silence (we have an 8-rung ladder + Testing/Goals split).
- Their new-venture-only scope (we extend across the full lifecycle).

## Execution plan

### Team A — Backend migration (doshi-validation-os worktree)

Repo: `/Users/benjifisher/.superset/worktrees/bca5dfb1-50d2-4d11-94d0-f9d4ccd1d3c7/review-remove-assumptions/` (this worktree).

Write a migration script (`migration/stage-policy.mjs`) that:

1. **Reads** all 174 records from Firestore (use the existing `lib/firestore.ts` adapter pattern from `migrate-raw.mjs` / `remodel.mjs`).
2. **Applies the 27-record cleanup** per the classification at `/var/folders/w4/w0dxhr290nbbvbstvk9cdj180000gn/T/opencode/assumption_categorisation.md`:
   - **Reshape 22** BUILD records into their market-bet form (the `reshape_to` column in that file). Update title + description.
   - **Relocate 4** decision-in-disguise records (ASM-106, ASM-109, ASM-113, ASM-150) to the Decisions collection, rewritten as Decision rows (Statement = the "should" claim, Status = Active, Reversibility = judge per claim).
   - **Delete 5** pure-build records (ASM-032, ASM-037, ASM-038, ASM-088, ASM-144) — no external actor, no market bet.
   - **Delete 1** garbage row (ASM-086 — meta-text, not a claim).
3. **Writes `stage: 1-4`** onto every surviving record per the cross-tab at `/var/folders/w4/w0dxhr290nbbvbstvk9cdj180000gn/T/opencode/assumption_stages.md`.
4. **Safety:**
   - Dry-run mode by default (print the diff, write nothing).
   - `--write` flag to actually mutate.
   - Signature-check each delete target before deleting (match title + description hash) so a stale backup can't cause a wrong delete.
   - Take a Firestore backup before any write (the existing `migration/backups/` pattern).
   - Idempotent — re-running with `--write` converges.
5. **Verification post-run:** count = 168, every record has a `stage` in [1,2,3,4], no record in the BUILD/FACT lists survives.
6. **Test:** add `migration/stage-policy.test.mjs` (or extend the existing verify script) that asserts the post-state.

### Team B — Schema + Dashboard frontend (upstream validation-os worktree)

Repo: `/Users/benjifisher/.superset/worktrees/8cd6d12d-d2db-48b6-8ed4-03e736302e70/evidence-confidence-frame/`.

**Schema changes:**
1. `skills/_shared/ontology.yaml`:
   - Add `stage` to `vocabularies`: `stage: [Discovery, Validation, Scale, Maturity]` (names, not numbers — the 1-4 is the ordinal, the name is the stored value; pick one — I recommend the name for legibility).
   - Add `stage` property to `entities.assumptions.properties`: `{ name: Stage, type: select, options: vocabularies.stage, required: true }`.
   - Add an integrity rule: `stage-actor-consistency` (warn) — "the claim's subject is inconsistent with its stage's expected actor" (e.g. a Stage-4 record whose subject is "we" is suspect). Advisory at first.
2. `skills/_shared/registry-schema.md`: add the `Stage` field to the Assumptions field map, with prose on the membership test (the subject-verb rule) and the Lens × Stage orthogonality.
3. Update `connectors/nosql-schema.md` and `connectors/sql-schema.md` to carry the new field.

**Dashboard frontend:**
4. `packages/dashboard/src/stage-grid.tsx` (new) — the Lens × Stage heatmap surface. Follow the existing patterns in `journey-surface.tsx` / `register-browser.tsx` / `register-table.tsx`. Render the grid with cell counts, heatmap colour by density, click a cell → drill into the assumptions in that cell ranked by Risk.
5. `packages/dashboard/src/stage-grid.test.ts` (new) — test the grid renders, counts are correct, click-through filters work. Follow the existing `*.test.ts` patterns (see `journey.test.ts`, `next-move.test.ts`).
6. Wire the grid into the dashboard app (`dashboard-app.tsx` / `sidebar-nav.tsx`) as a new surface, alongside the existing `journey-surface` and `next-move-surface`. Don't replace anything; add.

**Documentation:**
7. This doc (`docs/stage-policy.md`) — already written, commit as-is.
8. Add a pointer in `README.md` after the "Why this exists" section: a line linking to `docs/stage-policy.md`.
9. Add a pointer in `docs/method.md` if it exists (check; if not, skip).

### Coordination contract

Both teams work off the same `stage` vocabulary. The stored value is the **name** (`Discovery` | `Validation` | `Scale` | `Maturity`), not the number — the number is the ordinal for sorting. Team A writes the name into Firestore; Team B reads the name from the vocabulary. No coupling beyond that.

### Sequence

Parallel. The two worktrees don't overlap (different repos, different files). Team A's migration can run against Firestore while Team B builds the schema + frontend against the upstream repo. Integration happens when both PRs merge.