---
"@validation-os/core": minor
"@validation-os/dashboard": minor
"@validation-os/api": minor
"@validation-os/adapter-firestore": minor
---

Experiments now surface the assumptions they test and carry a validation Cycle.

- **Tested assumptions, made explicit.** The experiment detail leads with a
  **Testing** panel naming the beliefs the plan set out to test (its
  pre-registered bar lines) with each one's live status — visible from the
  moment the plan is drafted. Readings that grade a belief the plan never
  bar-lined are surfaced as **coincidental** evidence (a distinct "also found"
  panel + a per-card tag), so a stray validation is never read as a
  pre-registered result. New pure `buildExperimentAssumptions` view-model.
- **Cycles.** A scalar `Cycle` field on the experiment (Cycle 1, 2, 3…) batches
  runs into validation rounds. Experiments filter/group by their own `Cycle`;
  assumptions filter/group by a derived `cycle_membership` (the cycles of the
  experiments testing them). Added across the ontology, registry schema, all
  three connector guides, the create form, the experiments table column, and
  the group-by axis. Cycle badges show on the experiment and assumption detail.
