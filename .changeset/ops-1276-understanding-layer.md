---
"@validation-os/core": minor
"@validation-os/dashboard": minor
---

Understanding layer (OPS-1276): the Confidence "Why?" now tells the story of
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
