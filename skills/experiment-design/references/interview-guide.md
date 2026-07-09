# Prep playbook — interview guide

Entered from SKILL.md step 7 for interview-tier experiments (`Type` =
`Opinion` / `Anecdotal`; `Survey at scale` uses `survey.md`, which inherits
this file's question discipline). The guide is **always required** for an
interview experiment — with or without a prototype stimulus.

**Home:** the guide is rendered into the **Experiment record body** — that
is where `/meeting-prep` reads existing guides when matching a person to an
experiment. Keep the skeleton's headings verbatim so it stays parseable.

## The skeleton (render into the Experiment body)

```markdown
## Interview guide — <experiment question>

### Who (screener)
- Segment: <from the assumption's Lens + population>
- Must-have characteristics: <screenable FACTS — things a recruiter can
  verify ("manages ≥2 client portfolios", "switched banks in the last
  year"), never attitudes ("cares about money")>
- Disqualifiers: <who contaminates the sample>
- Target N: <from the pass bar's M> · Channel: <how we reach them>

### Stimulus (if any)
- Prototype: <link — or "none">
- What to show, when to show it, and what NOT to say while showing it
  (introduce the stimulus only AFTER the past-behaviour core — never open
  with the demo)

### Question arc
1. Context opener — their world, not our idea
2. Past-behaviour core — "walk me through the last time you…"
3. Probes — why / how, follow the pain, ask for specifics
4. (if stimulus) task + observe — set a task, watch, don't guide or rescue
5. Costly-signal close — ask for something that costs them: time, an intro,
   a follow-up commitment

### How to ask (rules)
- Non-leading; never "would you…"
- Facts & numbers, not adjectives
- Silence after questions; let them fill it
- No pitching, ever — not even at the end

### Signal → bar
- We're right if: <copied from the Experiment field>
- Counts as a hit when: <the observable answer/behaviour pattern that
  qualifies one interview as a "yes">
- We're wrong if: <copied kill bar>
- Scoring: one row per interview, tally toward ≥N of M
```

## Deriving each section

- **Who**: start from the assumption's `Lens` and the population named in
  the assumption's Description / Metric for truth. Every characteristic
  must be **screenable** before the call, not inferred during it.
  Wrong-population interviews are the top anti-pattern (guardrails §1
  *Right population*).
- **Question arc**: every question must earn its place by feeding "counts
  as a hit". Cut questions that are merely interesting.
- **How to ask** (Mom-Test discipline): past tense beats hypothetical;
  specifics beat generalities; their money/time/behaviour beats their
  opinions of our idea. If a draft question contains "would", rewrite it as
  "when did you last…".
- **Signal → bar**: copy `We're right if` / `We're wrong if` — never
  re-derive. "Counts as a hit" is the per-interview translation of the
  aggregate bar (e.g. bar "≥6 of 10 describe the problem unprompted" → hit
  = "described the problem before we named it").

**Anti-patterns** (reject on sight — guardrails §3): leading / "would you"
hypotheticals · pitching mid-interview · attitude-based screeners ·
questions that don't map to the bar · a hit definition vague enough that
every interview passes.

**Terminology check:** `../../_shared/ubiquitous-language.md` — Internal
for the guide, plus the end-user audience for any script wording read aloud
to participants.

**Write gate:** render the full guide, confirm
(`../../_shared/gated-writes.md`), then update the Experiment record body.
