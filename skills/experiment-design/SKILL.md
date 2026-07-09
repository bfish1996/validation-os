---
name: experiment-design
description: >-
  Phased, gated designer for the Experiments register — turns an untested
  assumption into the right, falsifiable test. Picks an assumption off the
  test-next queue (Risk-sorted) or one you name, recommends the target
  evidence rung (Type) weighed against Feasibility upfront, pre-registers a
  concrete "We're right if" pass bar + a "We're wrong if" kill bar, drafts
  the rung-specific protocol into the record body, then creates + links the
  Experiment record (Result=Running) — one question at a time, gated write.
  Then PREPARES the run via a references/ playbook: interview guide,
  prototype brief, survey questions, or fake-door spec. Stops before
  RUNNING: executing the test, recruiting, and capturing findings are
  outside this skill. Use for "design an experiment", "how do I test this
  assumption", "what experiment for X", "set up an experiment", "prep the
  experiment", "interview guide for X", "prototype brief for X". Skip for
  /assumptions (building the belief) and /find-evidence (logging existing
  evidence).
license: MIT
---

# Experiment design

Take one untested assumption and design the right experiment to kill or
confirm it — as cheaply as it honestly can — then link it into the
Experiments register and stop. This is the follow-up to `/assumptions`,
which builds guardrail-clean beliefs and drops them onto a **test-next**
queue; this skill picks them up.

**Scope = design + preparation, stops before *running*.** Pick the
assumption, choose the `Type` rung, pre-register the pass/kill bars, write
the protocol, create + link the record (`Result = Running`), (gated) flip
the assumption `Status` → `Testing` — then **prepare the run** (step 7): the
rung-matched playbook in `references/` produces the runnable artifacts.
**Then stop.** Running the test, recruiting, sending, building the
prototype, and recording `Result` / findings stay outside this skill.
Evidence is **not** a separate table — it lives on the Experiment record
(`Type` + `Result`), and the assumption's `Confidence` rolls up
automatically.

Read `validation-os.config.yaml` (walk up from the working directory) and
work the register through the active connector (`connectors/SPEC.md`).

> The deep ruleset (design discipline, evidence ladder + feasibility,
> per-rung playbooks, pass/kill bars, relations) lives in
> `../_shared/experiment-guardrails.md` — read it before running any phase.
> Field map: `../_shared/registry-schema.md`. Gate discipline:
> `../_shared/gated-writes.md`.

Worked example: `../../examples/05-design-the-experiment.md`.

## The two registers this touches

- **Experiments** — work here. One assumption per experiment; evidence is
  captured on this record (`Type` + `Result`).
- **Assumptions** — the test-next queue source and the relation target. Read
  Description, body *Metric for truth*, Lens, Risk, Status, Confidence.
  Write **only** `Status` (`Experiment Needed` → `Testing`), gated.

> ⚠️ Never work from a filtered view for the queue — query the full register
> so nothing is silently out of scope.

Two axes, kept separate: assumption **`Status`** = the verdict axis;
assumption **`Confidence`** = how strongly known (derived from experiments).
This skill moves `Status` Experiment Needed → Testing and sets the
experiment `Result` = Running, nothing further. (A record still
`Not Started` isn't grill-complete — send it through `/assumptions` first,
or note the exception.)

## Seed (pick or detect)

- **Test-next queue (default).** Query Assumptions for
  `Status = Experiment Needed`, sort by Risk descending, recommend the top
  record.
- **Named assumption.** User names one — load that record.
- **Already-chosen approach.** User says "interview to test X" — skip the
  recommendation in step 2, but still validate it maps to the right `Type`
  rung, is the highest *viable* strength, and confirm.
- **Prep an existing experiment.** User names an already-designed record
  ("prep the X experiment", "interview guide for X") — load the
  `Result = Running` experiment, skip steps 1–6, jump straight to step 7
  (Prepare). If the record is missing `We're right if`, stop: finish the
  design first.

## The design + prep gauntlet (one question at a time — every write gated)

Same discipline as the `/assumptions` grill: **never batch**; each question
carries **your recommended answer + a one-line why**; resolve one branch
before opening the next; the write is gated at the end.

1. **Select the assumption.** Load its Description, body *Metric for truth*,
   Lens, Risk, Status, Confidence. Confirm the **one** assumption this
   experiment tests. If a good test would also inform another belief, note
   it and design a second experiment — don't blur two into one record. If
   the assumption has **no Metric for truth**, stop and send it back to
   `/assumptions` — you can't design a falsifiable test against an
   unfalsifiable belief.
2. **Choose the `Type` rung + `Feasibility` — upfront**
   (`experiment-guardrails.md §2`). Weigh two axes: (a) **strength** — the
   8-rung ladder, 🔴 Stated (`Opinion` ~5 → `Pitch-deck reaction` ~10 →
   `Anecdotal` ~15) → 🟡 Researched (`Desk research` ~25 → `Survey at scale`
   ~40) → 🟢 Revealed (`Signed intent` ~60 → `Prototype usage` ~80 →
   `Paying users` ~99); and (b) **feasibility** — High/Medium/Low for
   access, cost, time. **Recommend the highest-strength rung that's still
   genuinely runnable**, one-line why ("`Signed intent` ideal but no buyer
   access yet → `Desk research`, `High` feasibility, this week"). `Type` is
   the Confidence the assumption *will* gain if the test clears its bar —
   choosing it is choosing how much the test is worth — so don't settle low
   without a feasibility reason. A high-Risk belief can take several
   records: a feasible weak test now, a stronger one when access opens.
3. **Carry the bar forward** (`§4`). **`We're right if`** is the
   assumption's *Metric for truth*, copied forward and made countable if it
   isn't already (`≥N of M`, `≥X%`) — not re-derived. If your pass bar would
   *disagree* with the metric, stop: the assumption's metric is wrong, send
   it back to `/assumptions`. Then add the one new artifact:
   **`We're wrong if`** (the kill bar) into the body. Both fixed *before*
   running.
4. **Design the protocol → body** using the matching playbook (`§3`):
   - 🔵 *Desk research:* sub-questions, named sources + what counts as
     credible, decision rule.
   - 🟣 *User interview:* screener/recruit (matching the Lens), target N,
     non-leading behaviour-first questions, the signal that clears the bar.
   - 🟠 *Pitch/Prototype:* the stimulus, the **costly** ask, the count that
     clears the bar.
   - **Anti-patterns** (reject): leading/"would you" hypotheticals · vanity
     metrics · wrong-Lens or too-small sample · confirmation bias · a bar
     vague enough to always pass.
   - **Terminology check** — run `../_shared/ubiquitous-language.md` over
     the title + body, audience = Internal. If the protocol contains
     user-facing scripts (interview/pitch wording read aloud to
     participants), check those once more as the end-user audience. Surface
     findings; resolve before the gate. Advisory.
5. **Tag & relate.** Title = the experiment question; set `Type` (target
   rung), `Feasibility`, `Result = Running`, `Date` = start; Owner and
   Interviewee optional at design. Link the **one** `Assumption`.
6. **Gated write** (`../_shared/gated-writes.md`). Render the full record +
   body, confirm, then create it. On confirm, offer to flip the linked
   assumption's `Status` → `Testing` (a **second** gated write). Then
   continue to step 7.
7. **Prepare the run** (router — open the ONE `references/` playbook
   matching the chosen `Type` rung; each playbook's writes are separately
   gated):
   - `Prototype usage` → **`references/prototype-brief.md`** — apply the
     prototype-needed rule table (guardrails §3b), check whether a matching
     prototype already exists in the config's `prototype_home`, and if
     absent produce a prototype brief. Then also build the interview guide
     for the usage sessions.
   - `Opinion` / `Anecdotal` → **`references/interview-guide.md`** — the
     standard guide skeleton into the Experiment body. **Stimulus override**
     (one gated question): "will you show a prototype in the interview?" —
     if yes, run the prototype path above first, then the guide.
   - `Survey at scale` → **`references/survey.md`** — screener-first
     countable questionnaire into the body; the send is a handoff to your
     distribution tool.
   - `Signed intent` → **`references/fake-door.md`** — stimulus brief +
     costly ask + instrumentation + bars into the body.
   - `Desk research` → no prep artifact here; hand off to `/find-evidence`.
   - `Pitch-deck reaction` / `Paying users` → use the guardrails §3
     pitch/prototype checklist inline (no dedicated playbook); flag if a
     fuller one is needed.
   Then **name the next step** ("run the interviews", "build from the
   brief", "send the survey") and **stop** — running the test is not this
   skill.

## Guardrail summary

See `../_shared/experiment-guardrails.md §1`. Reject a design that fails
any: Falsifiable (can return Invalidated) · Pass **and** kill bar
pre-registered · Highest-strength *viable* `Type` rung (strength ×
feasibility) · Right population (matches Lens) · Revealed-preference
favoured over stated · One belief in focus (others get their own
experiment).

## Safety

- Fetch the register schema first so `Type` / `Result` / `Feasibility`
  writes use only live options; adding a new option is itself a gated
  change.
- **Writes are gated** — confirm the exact record + body before creating.
- **Never set `Result` to anything but `Running`.** Verdicts, findings, and
  outcome dates belong to the evidence skills.
- **Never set assumption `Status` past `Testing`.** Confidence rolls up on
  its own — never hand-edit `Strength` / `Confidence`.
