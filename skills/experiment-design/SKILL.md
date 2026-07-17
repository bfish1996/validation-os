---
name: experiment-design
description: >-
  Phased, gated designer for the Experiments register — turns untested beliefs
  into the right, falsifiable test, Testing-grade or committed (Market-grade)
  alike. Starts from the riskiest testable belief (Risk-ranked) or one you
  name, then bundles any beliefs a single honest run can address; picks each
  belief's evidence rung against one run-level Feasibility, pre-registers a
  "We're right if" pass bar + a "We're wrong if" kill bar PER bundled belief,
  drafts the protocol by the run's method into the record body, then creates +
  links the Experiment (Status=Running) — one row, one bar line per bundled
  belief, one question at a time, gated write. A Market-rung design (Signed
  intent / Paying users) fires the commitment discipline in-skill (an optional
  Deadline, SMART-bar challenge, advisory Confidence bands) — the Goal record
  was unified into the Experiment, there is no separate skill to hand off to.
  Then PREPARES the run via a references/ playbook keyed to the run's method:
  interview guide, prototype brief, survey questions, or fake-door spec. Stops
  before RUNNING: executing the test, recruiting, and capturing findings are
  outside this skill. Use for "design an experiment", "how do I test this
  assumption", "what experiment for X", "set up an experiment", "prep the
  experiment", "interview guide for X", "prototype brief for X", "commit to
  this goal", "set a Q3 goal/OKR". Skip for /assumptions (building the belief)
  and /find-evidence (logging existing evidence, concluding a plan, auditing
  the register).
license: MIT
---

# Experiment design

Take the beliefs a single honest run can settle and design the right
experiment to kill or confirm them — as cheaply as it honestly can — then
link it into the Experiments register and stop. This is the follow-up to
`/assumptions`, which builds guardrail-clean beliefs and flips them `Live`,
feeding the derived **test-next** queue; this skill picks them up.

**Scope = design + preparation, stops before *running*.** Select the belief
set, choose each belief's rung against one run Feasibility, pre-register a
pass/kill bar **per bundled belief**, write the protocol, create + link the
record (`Status = Running`) — the linked beliefs show in the derived
**Testing** view automatically — then **prepare the run** (step 7): the
method-matched playbook in `references/` produces the runnable artifacts.
**Then stop.** Running the test, recruiting, sending, building the prototype,
and recording `Result` / findings stay outside this skill. Evidence is **not**
designed here — it arrives later as **readings** against the plan, and each
belief's `Confidence` rolls up automatically.

Read `validation-os.config.yaml` (walk up from the working directory) and
work the register through the active connector (`connectors/SPEC.md`).

> The deep ruleset (data model, design discipline, grouping, evidence ladder
> + feasibility, per-method playbooks, pass/kill bars, lifecycle) lives in
> `../_shared/experiment-guardrails.md` — read it before running any phase.
> Field map: `../_shared/registry-schema.md`. Gate discipline:
> `../_shared/gated-writes.md`.

## The two registers this touches

- **Experiments** — work here. **One experiment plan is the beliefs that
  honestly share one run** (`experiment-guardrails.md §0/§1b`): one instrument,
  one protocol, one Lens-matched population, one `Feasibility`, and a bar line
  per belief under test. Evidence arrives later as **readings** (one per
  artifact × belief), not designed here.
- **Assumptions** — the candidate source and the relation target. Read
  Description, Lens, Risk, Status, Confidence. **Read-only** — creating the
  `Running` experiment is what moves each bundled row into the derived
  Testing view; no assumption field is written here.

> ⚠️ Never work from a filtered view for the queue — query the full register
> so nothing is silently out of scope.

Three axes, kept separate: the Experiment's **`Status`** = the plan's
lifecycle (`Draft → Running → Closed`); the reading's **`Result`** = the
verdict axis (set later, at logging); assumption **`Confidence`** = how
strongly known (derived from readings). This skill sets each Experiment's
`Status` = Running, nothing further — the assumption's `Status` never moves
here. (A record that isn't a testable candidate isn't ready yet — still
`Draft` needs grill close-out from `/assumptions`, an already-running
experiment means it's mid-test, and Confidence ≤ −50 is the kill lane, not
the test lane — send it there first, or note the exception.)

## Seed (pick or detect)

- **Riskiest testable belief (default).** Compute the candidates — `Status
  = Live` (Completeness % = 100 by invariant), no linked `Running`
  experiment, not in the kill lane, Risk ≥ the working threshold — sort by
  Risk descending, recommend the top record. Commitment-agnostic: every
  `Live` row is eligible, linked or not. This is the belief that *prompts*
  the design; step 1 then asks which other beliefs the same run can
  honestly carry. (The standing **test-next surface** ranks designed
  experiments by Feasibility × the bundle's highest-Risk belief —
  `registry-schema.md §Status & derived views`; this seed step is upstream
  of it.)
- **Named assumption.** User names one — load that record; it seeds the bundle.
- **Already-chosen approach.** User says "interview to test X" — skip the
  rung recommendation in step 2, but still validate each belief maps to the
  right rung, is the highest *viable* strength, and confirm.
- **Prep an existing experiment.** User names an already-designed record
  ("prep the X experiment", "interview guide for X") — load the
  `Status = Running` experiment, skip steps 1–6, jump straight to step 7
  (Prepare) and route by its **method**. If any bundled belief is missing
  `We're right if`, stop: finish the design first.

## The design + prep gauntlet (one question at a time — every write gated)

Same discipline as the `/assumptions` grill: **never batch**; each question
carries **your recommended answer + a one-line why**; resolve one branch
before opening the next; the write is gated at the end.

1. **Select the belief set** (`experiment-guardrails.md §1b`). Start from the
   top-Risk candidate (the seed), load its Description, Lens, Risk,
   Confidence. Then propose the beliefs a **single run of one instrument, on
   one Lens-matched population** can honestly address alongside it — bundle
   candidates, each with a one-line why. The membership rules are hard gates:
   - **same Lens** across the whole bundle (a belief needing a different
     population, instrument, or method gets its own experiment);
   - the run must be able to come back **Invalidated on each belief
     independently**;
   - **no belief's measurement may poison another's** (pitching mid-interview
     to test desirability poisons the Mom-Test half — the §3 anti-patterns
     apply per belief; the ordering check is explicit: past-behaviour core
     before any stimulus).

   The **bundle is symmetric** — no lead belief. Which belief prompted the
   design is origination provenance only. If a belief's falsifiability check
   was never cleared in its grill (`assumption-guardrails.md §1`), it can't
   be in the bundle — send it back to `/assumptions`. If the *same*
   pre-registered bar would resolve two candidate beliefs, they're one
   belief — merge (`assumption-guardrails.md §4`), don't bundle.

2. **Per-belief rung, one run Feasibility** (`§2`). Choose the **rung per
   bundled belief** — one run can honestly yield different-strength signal per
   belief (past-behaviour questions vs prototype-in-hand). Weigh two axes per
   belief: (a) **strength** — the 8-rung ladder, 🧪 Testing (`Opinion` ±3 →
   `Pitch-deck reaction` ±6 → `Anecdotal` ±10 → `Desk research` ±15 →
   `Survey at scale` ±25 → `Prototype usage` ±30) → 🎯 Market (`Signed intent`
   ±55/68/80 → `Paying users` ±75/88/99); and (b) **feasibility**. Set
   **`Feasibility` once for the whole run** — `High`/`Medium`/`Low` over
   access, cost, time — because the instrument runs once against one
   population; bundling never splits it. Drivers worth remembering land as a
   line in the protocol body ("Low: no buyer access until Q3"). Recommend the
   highest-strength rung each belief can still honestly reach, one-line why
   ("`Signed intent` ideal but no buyer access yet → `Desk research`, `High`
   feasibility, this week").

   **Market-rung designs fire the commitment discipline.** If a belief's
   honest rung is `Signed intent` or `Paying users`, run
   `references/commitment-discipline.md` alongside this same gauntlet — it
   is still the **same Experiment record** (the Goal record was unified into
   it, `OPS-1305`), now carrying an optional `Deadline` and, at closure, an
   `Outcome`. There is no separate skill to hand off to; a fake-door is a
   *short* committed plan and `references/fake-door.md` stays the
   instrument-prep playbook for the stimulus itself.

3. **One bar pair per bundled belief** (`§4`). For **each** belief under test,
   pre-register a pair, both fixed *before* running:
   - **`We're right if`** — the belief's falsifiability answer from its last
     grill (`assumption-guardrails.md §1` — a check, not a stored field),
     made countable if it isn't already (`≥N of M`, `≥X%`) — re-authored
     here, since nothing was stored to copy forward. If you can't state a
     concrete number, stop: the assumption's falsifiability wasn't actually
     cleared, send it back to `/assumptions`.
   - **`We're wrong if`** — the kill bar for that belief.

   Bars exist **only for beliefs under test**. Signal the run happens to
   reveal on un-bundled surface is expected — **note it**, but don't bar it;
   it enters later as off-plan readings (`§0`).

4. **Design the protocol → body by the run's method** (`§3`). Pick the
   playbook by the **method** the run uses (interview ± stimulus, prototype
   session, survey, fake-door, desk, pitch), never by a rung — a bundle can
   hold mixed rungs; the run is still one method. Write **per-belief signal
   blocks**: one block per bundled belief saying what answer/behaviour pattern
   clears *that belief's* `We're right if`, with each protocol question tagged
   to the belief(s) it feeds.
   - **Anti-patterns** (reject, applied per belief): leading/"would you"
     hypotheticals · vanity metrics · wrong-Lens or too-small sample ·
     confirmation bias · a bar vague enough to always pass · a desirability
     bar on a watched session · one belief's measurement poisoning another's.
   - **Threats to validity, stopping rules, ethics** —
     `references/threats-to-validity.md`. Pressure-test the protocol against
     it and name anything that applies before the gated write.
   - **Terminology check** — run `../_shared/ubiquitous-language.md` over the
     title + body, audience = Internal. If the protocol contains user-facing
     scripts (interview/pitch wording read aloud to participants), check those
     once more as the end-user audience. Surface findings; resolve before the
     gate. Advisory.

5. **Tag & relate.** Title = the experiment question. Set `Feasibility`,
   `Status = Running`, `Date` = start; for a committed (Market-grade) plan,
   also set `Deadline`. Owner optional at design. The **instrument**
   (prototype / fake-door page / survey form) is referenced by its
   **canonical link**, never copied in (`§0`); a pure interview has no
   instrument. Each bundled belief carries its own composed **bar line**
   (`We're right if` / `We're wrong if` / `Planned rung`).

6. **Gated write** (`../_shared/gated-writes.md`). Live encoding: **one
   Experiment row**, carrying the shared instrument's canonical link,
   protocol, and `Feasibility`, with **one composed bar line per bundled
   belief** (`registry-schema.md §Field map — Experiments`). Render
   **sequential gated cards** — one per bundled belief's bar line — never
   one bundled write. Each bundled assumption now shows in the derived
   **Testing** view automatically — no assumption status write. Then
   continue to step 7.

7. **Prepare the run** (router — key on the **run's method**, never a rung;
   open the ONE `references/` playbook that matches; each playbook's writes
   are separately gated):
   - **interview (± stimulus)** → **`references/interview-guide.md`**. If the
     bundle needs a stimulus (one gated question — "will you show a prototype
     in the interview?") and no matching instrument exists, run the prototype
     path first, then the guide.
   - **prototype session** → **existing-instrument check first**: does a
     matching instrument already exist at its canonical link (config
     `source_map` / `prototype_home`)? If yes, link it; if no,
     **`references/prototype-brief.md`**. Then also build the usage guide (a
     prototype without a guide is a demo, not an experiment).
   - **survey** → **`references/survey.md`** — screener-first countable
     questionnaire into the body; the send is a handoff to your distribution
     tool.
   - **fake-door** → **`references/fake-door.md`** — stimulus spec + costly
     ask + instrumentation. Remember the *record* is a **short committed
     plan** (`references/commitment-discipline.md`); this playbook specs the
     stimulus.
   - **desk** → no prep artifact here; hand off to `/find-evidence`.
   - **pitch** → use the `experiment-guardrails.md §3` pitch checklist inline
     (no dedicated playbook); flag if a fuller one is needed.

   **One experiment → one playbook → one protocol artifact, even for
   mixed-rung bundles.** Then **name the next step** ("run the interviews",
   "build from the brief", "send the survey") and **stop** — running the test
   is not this skill.

## Guardrail summary

See `../_shared/experiment-guardrails.md §1`. Reject a design that fails any:
Falsifiable **per belief** (each can return Invalidated independently) · pass
**and** kill bar pre-registered **per bundled belief** · highest-strength
*viable* rung per belief (strength × feasibility) · right population (one Lens
across the bundle) · revealed-preference favoured over stated · beliefs share
a run only when one run honestly addresses each (shared execution, never
theme).

## Safety

- Fetch the register schema first so `Feasibility` / `Planned rung` / bar
  writes use only live options; adding a new option is itself a gated change.
- **Writes are gated** — confirm the exact record(s) + body before creating;
  bundles write as sequential per-belief cards, never one bundled write.
- **Never set `Status` to anything but `Running`.** Verdicts, findings,
  `Closure reason`, and `Outcome` belong to `/find-evidence`.
- **A Market-rung plan (`Signed intent` / `Paying users`) is still an
  Experiment row** — run the commitment discipline in-skill
  (`references/commitment-discipline.md`); there is no separate record type
  to hand off to (`OPS-1305`).
- **Never grow a bundle after design** — adding a belief mid-run is
  retro-registration (`§6`); design a new experiment referencing the same
  instrument.
- **Never write the assumption's `Status`.** The `Running` record alone puts
  the row in the derived Testing view; Confidence rolls up on its own — never
  hand-edit `Strength` / `Confidence`.
