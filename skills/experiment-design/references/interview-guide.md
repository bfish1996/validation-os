# Prep playbook — interview guide

Entered from SKILL.md step 7 when the run's **method** is an interview
(± stimulus) — whatever mix of rungs the bundle holds (`Observed usage` uses
`survey.md`, which inherits this file's question discipline). The guide is
**always required** for an interview experiment — with or without a prototype
stimulus.

**Home:** the guide is rendered into the **Experiment record body** — that is
where `/meeting-prep` reads existing guides when matching a person to an
experiment. Keep the skeleton's headings verbatim so it stays parseable. One
interview run = one guide, even when the bundle spans several beliefs at
different rungs.

## The skeleton (render into the Experiment body)

```markdown
## Interview guide — <experiment question>

### Who (screener)
- Segment: <from the bundle's shared Lens + population — one population for
  the whole bundle (guardrails §1b)>
- Must-have characteristics: <screenable FACTS — things a recruiter can
  verify ("manages ≥2 client portfolios", "switched banks in the last
  year"), never attitudes ("cares about money")>
- Disqualifiers: <who contaminates the sample — always include serial
  research-panel participants (`threats-to-validity.md` § professional
  participants)>
- Target N: <from the pass bars' M> · Channel: <how we reach them>

### Stimulus (if any)
- Prototype: <canonical link — or "none">
- What to show, when to show it, and what NOT to say while showing it
  (introduce the stimulus only AFTER the past-behaviour core — never open
  with the demo)
- Framing: cast the session as a task, never an evaluation — no "prototype",
  "test", or "feedback"; disown the artefact ("another team built this, I'm
  checking it holds up"); give a goal the software merely serves ("get me
  the answer to X"), so evaluating isn't the job on offer
- License abandonment up front — "if you'd normally give up and do
  something else, say so" — and log that moment as a prime datum, not a
  failed session
- Where possible run in their context: their device, their data, a task
  they actually care about — stakes are the strongest de-tester lever

### Question arc  (each question tagged with the belief(s) it feeds)
1. Context opener — their world, not our idea  [warm-up, feeds none]
2. Past-behaviour core — "walk me through the last time you…"  [→ BELIEF-ID(s)]
3. Probes — why / how, follow the pain, ask for specifics  [→ BELIEF-ID(s)]
4. (if stimulus) task + observe — have them do the task in their current
   tool first (uncontaminated baseline), then set the task in the stimulus;
   watch, don't guide or rescue — every prompt you give is a demand
   characteristic. Prefer silent work + retrospective narration over
   concurrent think-aloud (narrating makes behaviour slower and more
   rational than it is)  [→ BELIEF-ID(s)]
5. Costly-signal close — ask for something that costs them: time, an intro,
   a follow-up commitment  [→ BELIEF-ID(s)]
6. Debrief — "what do you think this session was about?" — logs what the
   setup was signalling (`threats-to-validity.md` § demand characteristics)

### Ordering check (the §1b cross-contamination guard)
- Past-behaviour core comes BEFORE any stimulus, for every belief — no demo,
  pitch, or leading frame ahead of the uncontaminated questions. A stimulus
  shown early poisons the Mom-Test half of the bundle.

### Signal → bar — one block PER bundled belief
<!-- repeat this block for each belief under test; bars only for beliefs
     under test — un-bundled signal is off-plan (see Capture below) -->
- Belief: <assumption title + link> · planned rung: <the rung this belief's
  reading will sit on>
- We're right if: <copied from this belief's bar line>
- We're wrong if: <copied kill bar>
- Counts as a hit when: <the observable answer/behaviour pattern that
  qualifies one interview as a "yes" for THIS belief>
```

## Deriving each section

- **Who**: start from the bundle's shared `Lens` and the population named in
  the assumptions' Descriptions / Metrics for truth. Every characteristic
  must be **screenable** before the call, not inferred during it.
  Wrong-population interviews are the top anti-pattern (guardrails §1
  *Right population*). One Lens, one population, whole bundle.
- **Question arc**: every question must earn its place by feeding some
  belief's "counts as a hit" — **tag it with that belief**. A question that
  feeds no belief's hit definition is cut ("every question earns its place",
  now per belief). Warm-up/context and debrief questions are the only
  untagged exceptions.
- **How to ask** (Mom-Test discipline, below): past tense beats hypothetical;
  specifics beat generalities; their money/time/behaviour beats their
  opinions of our idea.
- **Signal → bar**: copy each belief's `We're right if` / `We're wrong if` —
  never re-derive. "Counts as a hit" is the per-interview translation of that
  belief's aggregate bar (e.g. bar "≥6 of 10 describe the problem unprompted"
  → hit = "described the problem before we named it").

### How to ask (rules)
- Non-leading; never "would you…"
- Facts & numbers, not adjectives
- Silence after questions; let them fill it
- No pitching, ever — not even at the end

## Capture (what happens after the run — not this skill)

One interview artifact yields **one Reading carrying a `beliefs[]` entry per
belief it actually addressed**, each entry judged against that belief's bar
(`experiment-guardrails.md §0`) — never several Readings for the one call.
Signal the interview yielded on a belief that wasn't bundled is **off-plan**:
it becomes an off-plan `beliefs[]` entry on the same Reading, keeping the
experiment origin as provenance, with **no bar** — never retro-fitted into the
plan. There is **no** "one row per interview, tally toward ≥N of M" scoring
line: scoring is per belief entry, and the closure verdict against the
pre-registered N is a separate human act at close (`§6`). Capture itself runs
in `/find-evidence`.

## The conduct sheet (a one-page live aid, rendered with the guide)

The guide is what to ask; the conduct sheet is how to hold the room while
asking it. Render it alongside the guide (same gated write) so the interviewer
has it live during the call.

```markdown
## Conduct sheet — <experiment question>

### Time budget
- <arc section>: <minutes> · … (sums to the session length; the
  past-behaviour core gets the most, the demo the least)

### Per-question purpose
<one line per arc question: what it earns, for WHICH belief — so a question
that has stopped earning is visible and can be dropped live>

### Scripted probes
<the exact follow-ups that dig for specifics: "when was the last time?",
"walk me through what you did next", "how much did that cost you?">

### Recovery moves (the three drift modes)
- Rambling / hypothetical drift → "take me back to the last time you actually
  did that."
- "What are you building?" / "is this your product?" → the deflect script
  (own the task framing, never pitch): "another team built this — I'm just
  checking it holds up." Never pitch.
- "I would probably…" (future/stated) → rewrite to past tense live: "when did
  you last do that, and what happened?"

### Live hit tally (per belief)
<one row per bundled belief, ticked as the session earns a hit — so
mid-interview it's visible which belief is still unearned and needs its
remaining questions>
| Belief | Bar | Hit so far? |
```

**Anti-patterns** (reject on sight — guardrails §3, applied per belief):
leading / "would you" hypotheticals · pitching mid-interview · attitude-based
screeners · questions that don't map to any belief's bar · a hit definition
vague enough that every interview passes · a stimulus shown before the
past-behaviour core (poisons another belief's read).

**Terminology check:** `../../_shared/ubiquitous-language.md` — Internal for
the guide and conduct sheet, plus the end-user audience for any script wording
read aloud to participants.

**Write gate:** render the full guide + conduct sheet, confirm
(`../../_shared/gated-writes.md`), then update the Experiment record body.
