# The seams — where the OS hands off

Validation-OS answers one question — **should we build this?** — and it
answers it with market evidence. It does not build, and it does not
sharpen raw ideas into testable shape. Those are its neighbours' jobs.
This doc defines the boundaries: what each neighbour judges, the two
contractual seams that cross them, and the patterns that look like a seam
but rot the register.

## Three judges, one go/no-go

The OS sits between two systems, each with a different judge. The judge —
what falsifies a verdict — is what keeps them separate.

| | Office Hours (gstack) | Validation-OS (this repo) | mattpocock/skills |
|---|---|---|---|
| **Question** | Is this idea specific enough to test? | Should we build it? | How do we build it? |
| **Judge** | The interviewer, in the moment | The market, via evidence | The builder |
| **Input** | A raw idea | A falsifiable belief | A committed destination |
| **Output** | Problem restatement + named person/wedge | Evidence-backed decision | Map → spec → tickets → code |
| **State** | None — one session, done | The register, permanent | A map that lives until the route is built |
| **Kill power** | Can embarrass an idea, can't record a kill | The only place a belief can die | Can prune scope, never veto the journey |

Two validations, and they diverge in both directions. **Market**
validation — "should we build this?" — is falsified by external
behaviour. **Design** validation — "given we're building it, does this
way hold up?" — is falsified by a builder reacting to an artifact. A
perfectly designed state model for a product nobody wants, and a product
people beg for with a broken interaction model, are both real: that's
what proves they are separate validations, not two settings of one dial.

Validation-OS is the only one of the three with a go/no-go. mattpocock's
suite presupposes conviction — wayfinding is about the route, never
whether the journey should happen; grilling hardens an idea, never
auditions it; `/prototype` answers design questions, not demand
questions. So **the go/no-go *is* the decision log** — a build decision
recorded here is the front door to the build pipeline.

## Decisions ≠ assumptions

The build pipeline has **decisions**, not assumptions, and the difference
is who owns the cost of being wrong. A decision is an implementation
choice the builder owns — revising it costs a refactor. An assumption is
a belief the world owns — being wrong costs the company. The pipeline has
no assumption object because it starts after conviction; fed "will SMBs
pay?", its grilling would record *your own answer* as a resolved
decision — a 5% Opinion masquerading as validation, exactly what the
decision log forbids.

The line between the two is **altitude, not category** (`domains.md`): if
invalidating a belief wouldn't change what you build, who you sell to, or
how you reach them, it is below the register's floor and belongs to the
builder. But a design-flavoured belief the thesis rests on — "ops teams
can self-serve onboarding without training" — *is* register material, and
a prototype-reaction test is legitimate low-rung evidence against it. A
prototype can appear in the register as evidence against a business
belief; never as "which implementation is right".

## The four layers below an experiment

An experiment is not a bag of design questions. Four layers, top judged
by the market, bottom by the builder:

```
Assumption   — one falsifiable belief; the market judges it
  └─ Experiment  — the plan: rung + pass/kill bars + protocol
       └─ Instrument — what runs it: interview guide, survey,
          fake-door page, prototype
            └─ Design questions — construction choices raised only
               while BUILDING an instrument
```

Interview/JTBD questions are **measurement items** — instrument content,
answered by participants, feeding the pass bar. They are *not* design
questions. Interview, desk-research, and survey experiments have **zero**
design questions: nothing gets built.

- **Pass-bar litmus.** Does the answer feed the pass bar? **Yes** →
  measurement item, the market's to answer. **No — it just has to be good
  enough for the test to be honest** → design question, the builder's,
  `/prototype` territory. A design question is judged, never measured; its
  verdict never touches Confidence. Its trace to the register runs through
  the brief: design question ← brief ← experiment ← assumption.
- **The A/B trap.** The moment you want to *count* a design question's
  answer — "which variant do users prefer?" — it has become an
  experiment: variant testing in-session at `Observed usage`, or a live
  A/B at `Paying users`. Builder vibes must never answer what the
  experiment was built to measure.

## Two kinds of prototype

The word collides, and the collision is the recurring confusion.

- **Experiment prototype** (ours) — a measurement instrument;
  market-judged; exists *before* the commitment to build. Its
  rung/number and manifest live with the experiment. mattpocock's
  `/prototype` defaults (in-memory, no persistence, developer-judged) are
  overridden by the brief's REAL / FAKED / instrumentation sections.
- **Wayfinder prototype ticket** (theirs) — a discussion-grounding
  artifact, "a cheap, rough thing to react to"; builder-judged; exists
  *after* commitment; never touches the register.
- **Guard rule.** If a wayfinder prototype ticket's question is about
  *user behaviour*, the destination was not actually validated — route it
  back to the register as an experiment. Don't let a discussion artifact
  answer a demand question.

## Seam 1 — subcontract (bidirectional, mid-experiment)

An experiment needs an instrument built: a landing page, a concierge
mock, an interactive prototype. The register subcontracts the build.

```
brief → /prototype or /implement (builds the instrument)
     → run → /find-evidence renders the verdict here
```

This is a **function call, not a flow transfer**: brief in, artifact out,
control never leaves the register. The builder builds; the market still
judges. The design questions in the brief are the builder's to answer;
the pass bar stays ours.

## Seam 2 — graduation (one-way, out)

- **Trigger = a build decision, alone.** The decision-log entry is the
  sole gate. There is no assumption-status precondition — DEC-003
  abolished `Validated`, and DEC-004 makes the decision itself the gate.
  Rejected: Risk-below-threshold as a hard precondition — it
  re-introduces the validated-like gate DEC-003 removed. (A one-way-door
  build decision still owes the evidence bar `decision-guardrails.md`
  sets; that is the decision's own discipline, not a seam precondition.)
- **What crosses = the delivery packet**, a *dated snapshot*: the build
  decision, the **beliefs it rests on with their evidence and Risk at
  decision time**, and the prototype + brief + pass/kill results. The
  decision moots those beliefs via Impact 0 as it lands — the packet
  preserves what they were.
- **The packet is not a PRD.** It arrives loose about the route, hard
  about the *why*. `/to-spec` starts fresh with the prototype as
  reference; the brief never becomes the PRD.

### Where the packet lands

The wayfinder map template has two receptors built for it:

- **`## Notes`** — link the packet here. Notes are consulted by every
  session working the map, which mechanically enforces **no double
  jeopardy**: charting cites register facts, never re-asks them. Register
  facts are facts, not decisions.
- **`## Out of scope`** — seed with the invalidated/killed beliefs, so
  the frontier never charts toward something the market already killed.

Destination grilling phrases the destination as the **validated
promise**, not a founder hunch.

### Routing

- Path already clear (fits one session) → packet **→ `/to-spec`
  directly**. `/to-spec` is the designed receiver; it has a rule for
  inlining prototype-derived, decision-rich snippets.
- Route unclear / too big for one session → **`/wayfinder`** charts a map
  first, then merges onto `/to-spec`. The routing test is session size,
  not document quality.
- A PRD already exists → enter at `/to-tickets`; don't re-grill or
  re-wayfind.
- **Sequencing authority stays register-side.** What to test next is the
  Risk-sorted queue × Feasibility (`experiment-guardrails.md`); the
  build tools order work only *after* the packet crosses. Wayfinder takes
  **decisions**, never assumptions.

## Inbound is open by design

There is **no inbound seam**. Anything that produces a candidate belief
enters through `/assumptions`. gstack's `/office-hours` is one *optional*
sharpener — wired into `/assumptions` seed mode for the blank-topic case
— not a contractual boundary: it can embarrass an idea but cannot record
a kill. The only two contractual seams are the two above, both with
mattpocock/skills.

## Backflow — the only thing that crosses back

Shipping is the **highest-rung experiment**. Production usage and payments
return to the register through `/find-evidence` as `Paying users` (99%)
readings — the single backflow. The build phase feeds the register rather
than pausing it: it generates evidence and new thesis beliefs, so
graduation never idles the OS. The register runs on the business's
rhythm, not the product lifecycle, and has no end state.

## Rejected: market validation as a wayfinder map

Structurally tempting — research / grilling / prototype / task tickets
map neatly onto validation work — and wrong. It rebuilds the register
with the machinery stripped out: no evidence ladder, no pre-registered
bars, no Risk queue, no Confidence rollup. "Decisions so far" becomes a
decision log without falsifiability — the market's questions answered by
opinion-based tools, exactly what the judge rule forbids. The only
salvageable piece is already Seam 1: experiment instruments are
subcontracted to `/prototype` / `/implement`, and the verdict is rendered
here via `/find-evidence`.

---

*Origin: the seam decisions on the seam-decisions review (DEC-004 in the register),
building on the seam-decisions groundwork and the Prototypes epic (the prototypes epic). Judge-rule and
altitude framing: `domains.md`. Evidence rungs: `evidence-ladder.md`.*
