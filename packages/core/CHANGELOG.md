# @validation-os/core

## 0.4.0

### Minor Changes

- 88751a2: Create & link records (OPS-1275): new records and two-way relations, end to end.

  - `@validation-os/core`: each `RelationSpec` now carries a `targetRegister`, so
    the register a relation points at is known even when its inverse is a derived
    view (the 5 null-`to` relations). The `DataProvider` `create`/`link` contract
    and the in-memory fake were already in place; this names the target end for
    the API and dashboard to consume.
  - `@validation-os/api`: new `link` route (`POST /api/link`, body
    `{ relation, from, to }`) — validates the relation and both endpoint
    registers against the config, sets both ends through the adapter, and runs the
    derive-on-write backstop when the edge can move a derived number (a reading
    joins a belief, a standing decision lands, a dependency edge appears).
  - `@validation-os/dashboard`: a "new record" form per register (own scalar
    fields only — derived numbers are computed server-side, relations wired
    separately), a relation editor in the record drawer, and the `useCreate` /
    `useLink` mutation hooks. New pure helpers `formFieldsFor` / `emptyDraft` /
    `missingRequired` / `toCreatePayload` and `linkChoicesFrom` back them and are
    unit-tested.

- ea59431: Understanding layer (OPS-1276): the Confidence "Why?" now tells the story of
  the number — the reason a dashboard beats Notion, not polish.

  - `@validation-os/core` derivation gains three pure functions, all decomposing
    the very Confidence the derived box shows:
    - `confidenceAttribution` — which experiments (and goals / direct readings)
      move Confidence, each as a signed contribution `= weight·strength / den`,
      grouped and ranked by how hard it pushes. The movers sum to the Confidence
      number, so the reveal literally adds up to the hero. Reuses the shared
      `scoreAndDedupe` so attribution always agrees with `confidence()`.
    - `experimentProgress` — progress-to-conclusion from an experiment's
      pre-registered bar lines: `settled / total`, `toGo`, and `concluded` once
      every bar has a verdict. Bar verdict is a report, never a Confidence input.
    - `confidenceTrajectory` — Confidence over time, replaying concluded readings
      by date through `confidence()`; undated readings are folded into every
      point so the last point equals today's number.
    - New: `BarLine` type + `barLines` on `ExperimentRecord` (the embedded array
      the schema already defines); `scoreAndDedupe`/`Scored`, `isConcluded`, and
      the shared record→input mapper `toReadingInput` exposed — the latter is now
      the single mapping site both the server-side recompute pass and the
      dashboard read a reading through.
  - `@validation-os/dashboard`: the Confidence "Why?" reveal is now live. It
    mounts only when opened (lazy-loading readings + experiments), then renders
    every experiment testing the belief — ranked by how hard it pushes, each with
    its progress-to-conclusion (a running experiment with no reading yet still
    shows, so it's clear whether finishing is worth it; concluded ones read as
    done) — the goal/direct evidence that also moves the number, and a Confidence-
    over-time sparkline. Tucked behind the tap so the derived box stays the hero
    (the Reveal pattern). New pure `buildUnderstanding` join + `UnderstandingPanel`
    component, with `Understanding` / `ExperimentView` / `OtherMover` types
    exported.

## 0.3.0

### Minor Changes

- 6f7c193: Schema ripple (OPS-1273): promote the presence-gap sections to first-class
  fields; retire Derived Impact's "stale by design" note.

  - `AssumptionRecord` gains three first-class fields — `5 Whys`,
    `Metric for truth`, `Scoring justification` — promoted from body prose. Their
    presence is now a structural (blocking) check, not a semantic gap.
  - New `@validation-os/core` exports: `ASSUMPTION_PRESENCE_FIELDS`,
    `missingPresenceFields`, and `assumptionPresenceComplete` — the pure
    presence primitive the CRUD write model is to block a Draft→Live write on
    (the presence half of the Draft→Live gaps invariant, OPS-1251;
    write-time enforcement lands with the write slice, OPS-1256).
  - Schema docs realigned: `ontology.yaml` / `registry-schema.md` move the three
    from `body_headings` / the `gaps` vocabulary to first-class fields with a
    `presence_gate: Live` marker and a new error-level `presence-field-missing`
    integrity rule; the connector schema guides (nosql/sql/local-files) map the
    new fields.
  - Derived Impact is no longer documented as "stale between runs by design" —
    it is recomputed on every touching write like Confidence/Risk (OPS-1251).

## 0.2.0

## 0.1.1

### Patch Changes

- a8e7bb7: Validate npm Trusted Publishing (OPS-1277): first release through the OIDC
  publish path, confirming a token-free publish with provenance. No functional
  change.
