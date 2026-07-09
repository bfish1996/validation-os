# Seed mode — get new beliefs INTO the register

The front door: turn raw material into guardrail-clean records. Seeding is
not a separate choreography — **a create is just a grill of an empty
record.** Seed mode's job is only to figure out *what* records should exist
and stub them; the actual build runs through **single mode**
(`single.md`), whose Phase 0 (Statement) → Phase 8 (5 Whys) → Phase 9
(Language) is the gauntlet.

## Detect the seed

- **Blank topic** — the user names an area with nothing written yet, or asks
  to pressure-test a raw idea. If the `/office-hours` skill
  ([garrytan/gstack](https://github.com/garrytan/gstack), install with
  `npx skills add garrytan/gstack` — [skills.sh](https://skills.sh)) is
  available in this harness, hand off to it in Startup mode first — its six
  forcing questions (demand reality, status quo, desperate specificity,
  narrowest wedge, observation & surprise, future-fit) push the idea to
  named-person, named-wedge specificity before anything is stubbed. Its
  design doc's problem restatement and named person/wedge become the seed
  material. Not installed, or not a fit? Stub straight from the raw idea as
  usual — every phase still opens as a `Gaps`, so nothing here substitutes
  for the Statement/5-Whys/scoring grill in single mode. Either way, stub
  one or more records from what survives; each starts with **all** `Gaps`
  set, so single mode grills every phase from scratch — the interview only
  sharpens Description and Owner, it never pre-fills Confidence or clears a
  guardrail.
- **Call transcript / notes** — extract the candidate assumptions stated or
  implied in the material. Pre-fill what's actually stated (Description,
  Lens if clear), leave the rest as `Gaps`. One record per distinct
  falsifiable belief — split bundled claims rather than writing an "and"
  record.
- **Existing records** — not seeding; that's audit mode (`audit.md`) to find
  what's wrong, then single mode to fix. Route there instead.

## Stub, then grill

1. **Extract candidates.** From the topic or transcript, name each distinct
   belief the business depends on. Dedupe-search the register first
   (`../../_shared/assumption-guardrails.md §4`) — if the belief already
   exists, don't create a twin; grill the existing record.
2. **Create the stub record(s)** (field map:
   `../../_shared/registry-schema.md`): title + whatever Description is
   stated, `Owner` = who voiced/champions the belief, a
   `## Provenance & notes` line in the body for source provenance
   (call/conversation/document), and `Gaps` = every phase not yet satisfied
   **plus `Duplicate`, always** — every new stub runs the boundary check
   against the register through single mode's Phase 5, even when nothing
   about it looks like an overlap. A record never suspected of overlapping
   is exactly the record that silently drifts into one.
3. **Hand each stub to single mode.** It works the `Gaps` as its agenda —
   Statement, atomicity, falsifiability, Lens, dedup/contradiction, scoring,
   metric-for-truth, 5 Whys, language — one question at a time, gated write.
   The stub is guardrail-clean when its `Gaps` empties.

For a whole transcript with many candidates, this is a small loop: stub them
all, then grill top-down by `Risk`. If the user wants that unattended,
that's **loop mode** — seeding included, no gates.

## Lifecycle & timing (applies to every seeded record)

- **`Gaps` drives the work, never an exhaustive march.** A gap-filtered
  queue sorted by Risk descending *is* the grill queue: open one, grill
  top-down, stop when Risk gets low. Empty `Gaps` = guardrail-complete → the
  close-out write flips `Status` `Goal Linked` → `Experiment Needed`,
  dropping the record onto the **test-next** queue — but only once a
  standing Goal commitment has already linked it (`Not Started → Goal
  Linked`, `decision-guardrails.md §9g`). A grilled-clean record with no
  goal link yet still sits in `Not Started`, gapless but ungated.
- **5 Whys timing.** Mandatory **at creation** (do it up front, so no
  backlog forms). For a retrofit backlog, prioritise by `Risk × gap-count`,
  not all at once — the low-Risk tail sits as clean scaffold until it's
  actually due to be tested.
- **No SWOT in assumption bodies.** An assumption is one falsifiable bet;
  if-false / what-would-prove-it / threats are already covered by Impact +
  Metric-for-truth + the Depends-on graph. If strategic SWOT is wanted, do
  it one level up (thesis-wide, or per Lens/Theme), referencing assumptions.

## Scope boundary

Enforce that a falsifiability statement exists, then **stop**.
Creating/running experiments and managing evidence is the Experiments
register's job (`/experiment-design`, `/find-evidence`) — seed mode never
designs a test.
