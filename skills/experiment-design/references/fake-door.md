# Prep playbook — fake-door / signed intent

Entered from SKILL.md step 7 when the run's **method** is a fake-door (concept
test, waitlist, LOI, deposit). The evidence is the **costly action** — a
signup, signature, or payment-intent — not stated enthusiasm.

> **The record is a Goal, not an Experiment.** A fake-door sits on the
> `Signed intent` rung, which is 🎯 Goals-side (`experiment-guardrails.md §2`).
> A fake-door is a **short goal**: its two bars, deadline, and instrument
> named in advance are drafted through **`/goals`** (`docs/goals.md`), which
> owns the Goal record. **This playbook specs the instrument** — the stimulus,
> the costly ask, and the instrumentation — that the goal's instrument line
> points at. Never write a `Signed intent` plan as an Experiment row.

## The three parts (all pre-registered, into the Goal record)

1. **Stimulus** — the thing shown: a waitlist landing page, one-pager, or
   concept card. Realistic enough that the ask is real: concrete promise,
   price anchor if pricing is part of the belief, your real brand. The
   stimulus gets its own **brief** — same template and gated write procedure
   as `prototype-brief.md §3–4` (a landing page is just the thinnest
   prototype), referenced by its **canonical link** (`experiment-guardrails.md
   §0`), never copied in.
2. **The costly ask** — what makes it evidence. Ranked by cost, pick the
   highest honest one: deposit / card details > signed LOI > calendar-booked
   call > email + qualifying form > bare email. A bare email signup is the
   floor, and weak — say so if that's all that's feasible (and the honest rung
   may then be a lower one).
3. **Instrumentation** — name the exact event that counts as a conversion (an
   analytics event / form submission with qualifying fields complete), the
   denominator (unique qualified visitors — traffic source must match the
   goal's Lens population), and the window. This is what the Goal's
   **instrument** line names in advance; if the counting event isn't defined
   before launch, the bar can't be scored.

## Render into the Goal record body

The two bars, deadline, owner, and instrument are set by `/goals` draft; this
playbook fills the instrument's detail into the body:

```markdown
## Fake-door instrument — <goal name>

### Stimulus
- Page/asset: <canonical link to the brief> · promise shown · price shown (if any)

### The ask
- Costly action: <what they must do> · why this cost level

### Traffic & population
- Source: <channel> · must match Lens: <…> · window: <dates, fixed>

### Instrumentation (the goal's named instrument)
- Conversion event: <exact event/form> · denominator: <qualified visitors>

### Ethics note
- What we tell signups afterwards (fake-door = the product doesn't exist yet;
  the follow-up message is part of the spec)
```

**Anti-patterns:** counting impressions/clicks as intent (vanity —
guardrails §3) · un-qualified traffic inflating the denominator · a soft ask
dressed up as `Signed intent` (if the action costs nothing, the honest rung is
`Pitch-deck reaction` — a Testing-side Experiment, not a goal) · no
post-signup follow-up plan.

**Terminology check:** `../../_shared/ubiquitous-language.md` — end-user
audience for all on-page copy.

**Write gates:** the stimulus brief and the Goal-record instrument body are
each gated (`../../_shared/gated-writes.md`); the Goal record itself is drafted
and gated in `/goals`.
