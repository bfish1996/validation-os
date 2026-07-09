# Prep playbook — prototype path (existence check → prototype brief)

Entered from SKILL.md step 7 when the experiment's `Type` =
`Prototype usage`, or when an interview-tier experiment answered **yes** to
the stimulus override ("will you show a prototype in the interview?").
Guardrails: `../../_shared/experiment-guardrails.md` (§1 discipline, §3
playbooks, §3b prototype rule table).

## 1. Is a prototype actually needed?

Apply the rule table in `experiment-guardrails.md §3b` — keyed to *what the
experiment is discovering*, not to enthusiasm for building:

| Discovering… | Build |
|---|---|
| Problem **existence / severity** (past behaviour) | **Nothing** — interview, no stimulus |
| Solution **comprehension / usability / engagement** | **Prototype** (this playbook) |
| **Willingness to commit** before anything is built | **Fake-door / landing page** (`fake-door.md`) — not a full prototype |
| Facts knowable from published sources | **Nothing** — `/find-evidence` desk research |

If the table says "nothing" or "fake-door", say so, route there, and stop
this path — building a prototype for a test that doesn't need one violates
*cheapest viable* (§1).

## 2. Existence check

The prototype home is the config's `prototype_home` (a repo or directory —
if unset, ask once and offer to record it in the config). List what's
already there:

- **An existing prototype plausibly matches the experiment's solution
  shape** → confirm the match with the user (name match is fuzzy — a human
  decides). If confirmed: no brief needed; link the prototype in the
  Experiment body's Stimulus section and continue to the interview guide (a
  prototype without a guide is a demo, not an experiment).
- **No match** → a **prototype brief** is needed. Continue below.

## 3. The prototype brief

**Naming:** this artifact is a *prototype brief*, never a "PRD" — a brief
is a throwaway-build spec; a PRD is a production spec. Derive everything
from the Experiment record + linked assumption — copy, don't re-derive.
Template:

```markdown
# Prototype brief — <prototype name>

> Throwaway build. This exists to make ONE assumption testable — not a
> production spec. Delete-friendly by design.

## Why this exists
- Assumption: <record title + link>
- Experiment: <record title + link>
- We're right if: <copied from the Experiment field>
- We're wrong if: <copied from the Experiment body>

## What must be REAL
<The minimum surface a participant must genuinely experience for the test
to be honest — the thing the assumption is actually about.>

## What can be FAKED
<Wizard-of-Oz allowed and encouraged: canned data, hardcoded flows, a human
behind the curtain. List each fake so no one mistakes it for a capability.>

## Instrumentation
<The events / counts / observations that feed the pass bar — each maps to
"We're right if". If it can't be observed, it can't clear the bar.>

## Out of scope
<Explicit list. Anything not needed to clear or kill the bar is out.>

## Build notes
<Directory/stack conventions for your prototype home; brand/design-system
pointers if you have them.>
```

## 4. Landing it (gated)

1. Render the full brief and gate it (`../../_shared/gated-writes.md`) —
   the user approves the exact text.
2. On confirm, write it into `prototype_home` (ask the user's preferred
   mechanism on first use — direct commit vs. PR for a repo, plain file for
   a directory).
3. Write a **link** to the brief into the Experiment record body — never
   copy the brief's content into the register (single source, no drift).
4. Building the prototype itself happens from the brief — not in this
   skill. Name that as the next step and stop.

**Terminology check:** `../../_shared/ubiquitous-language.md` over the
brief (audience = Internal) before the gate.
