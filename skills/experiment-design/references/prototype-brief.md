# Prep playbook — prototype path (existence check → prototype brief)

Entered from SKILL.md step 7 when the run's **method** is a prototype session,
or when an interview run answered **yes** to the stimulus override ("will you
show a prototype in the interview?"). Guardrails:
`../../_shared/experiment-guardrails.md` (§1 discipline, §1b grouping, §3
playbooks, §3b prototype rule table).

## 1. Is a prototype actually needed?

Apply the rule table in `experiment-guardrails.md §3b` — keyed to *what the
experiment is discovering*, not to enthusiasm for building:

| Discovering… | Build |
|---|---|
| Problem **existence / severity** (past behaviour) | **Nothing** — interview, no stimulus |
| Solution **comprehension / usability / engagement** | **Prototype** (this playbook) |
| **Willingness to commit** before anything is built | **Fake-door / landing page** (`fake-door.md`) — a short committed plan via `commitment-discipline.md` |
| Facts knowable from published sources | **Nothing** — `/find-evidence` desk research |

If the table says "nothing" or "fake-door", say so, route there, and stop
this path — building a prototype for a test that doesn't need one violates
*cheapest viable* (§1).

## 2. Existence check (the instrument is a reusable asset)

The instrument is identified by its **canonical link** (`§0`); every new round
references the same link rather than rebuilding. Look for an existing match
before writing a brief:

- The prototype home is the config's `source_map` prototype entry (or the
  legacy `prototype_home` — a repo or directory; if unset, ask once and offer
  to record it in the config). List what's already there.
- **An existing prototype plausibly matches the experiment's solution shape**
  → confirm the match with the user (name match is fuzzy — a human decides).
  If confirmed: no brief needed; link the prototype by its **canonical link**
  in the Experiment body's Stimulus section and continue to the interview
  guide (a prototype without a guide is a demo, not an experiment).
- **No match** → a **prototype brief** is needed. Continue below.

## 3. The prototype brief — the experiment's constraints on the instrument

**The brief is not a build spec.** It states the *constraints the experiment
puts on the instrument* — what must be real, what may be faked, what must be
observable — each keyed to the bundled beliefs' bars. It is never a
throwaway-build spec, and never a production PRD. Derive everything from the
Experiment record + linked assumptions — copy, don't re-derive. Template:

```markdown
# Prototype brief — <prototype name>

> The experiment's constraints on the instrument — not a build spec, not a
> PRD. Every HOW/design/build question routes to `/prototype`, outside
> Validation-OS.

## Why this exists  (one row per bundled belief)
<!-- repeat per belief under test -->
- Belief: <assumption title + link>
  - We're right if: <copied from this belief's bar line>
  - We're wrong if: <copied kill bar>

## What must be REAL
<The minimum surface a participant must genuinely experience for the test to
be honest — the thing the beliefs are actually about. Key each real element
to the belief(s) whose bar depends on it.>

## What can be FAKED
<Wizard-of-Oz allowed and encouraged: canned data, hardcoded flows, a human
behind the curtain. List each fake so no one mistakes it for a capability;
key each to the belief it does NOT compromise.>

## Instrumentation
<The events / counts / observations that feed each belief's pass bar — each
observation keyed to the belief and the "We're right if" it clears. If it
can't be observed, it can't clear that bar. At capture (`/find-evidence`) the
session becomes **one Reading with a `beliefs[]` entry per belief it scored**
(never one Reading per belief); each observation set feeds its belief's entry.>

## Out of scope
<Explicit list. Anything not needed to clear or kill a bundled belief's bar
is out — including any surface the instrument spans that isn't under test
(off-plan; no bar).>

## How the session uses it
<Where the prototype sits in the interview arc: shown only after the
past-behaviour core (the §1b ordering guard), what task the participant is
set, what the interviewer does and does not do while it runs.>
```

## 4. Landing it (gated)

1. Render the full brief and gate it (`../../_shared/gated-writes.md`) — the
   user approves the exact text.
2. On confirm, write it into the prototype home (ask the user's preferred
   mechanism on first use — direct commit vs. PR for a repo, plain file for a
   directory).
3. Write the brief's **canonical link** into the Experiment record body's
   Stimulus section — never copy the brief's content into the register
   (single source, no drift; `§0` reference-never-mirror).
4. **Building the prototype from the brief is `/prototype`'s job, outside
   Validation-OS** — every HOW/design decision routes there. The
   brief → `/prototype` handoff mechanics live on the Prototypes epic, not
   here. Name that as the next step and stop.

**Terminology check:** `../../_shared/ubiquitous-language.md` over the brief
(audience = Internal) before the gate.
