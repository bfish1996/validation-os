# Prep playbook — fake-door / commitment

Entered from SKILL.md step 7 when the run's **method** is a fake-door (concept
test, waitlist, LOI, deposit). The evidence is the **costly action** — a
signup, signature, or payment-intent — not stated enthusiasm.

> **The record's rung depends on how costly the ask is.** A bare signup or
> qualifying form sits on the `Fake-door` rung — 🧪 Testing-side, costly
> enough to be evidence but not yet a payment/LOI-level commitment
> (`experiment-guardrails.md §2`). A deposit, signed LOI, or pre-order climbs
> to the `Commitment` rung — 🎯 Market-side — and is designed as a
> **committed Experiment**: its two bars, `Deadline`, and instrument named in
> advance are set through `references/commitment-discipline.md`
> (`../../../docs/goals.md`), the same skill's own commitment discipline —
> there is no separate Goal record to hand off to (`the evidence-remodel slice`). **This
> playbook specs the instrument** — the stimulus, the costly ask, and the
> instrumentation — whichever rung the ask lands on.

## The three parts (all pre-registered, into the Experiment record)

1. **Stimulus** — the thing shown: a waitlist landing page, one-pager, or
   concept card. Realistic enough that the ask is real: concrete promise,
   price anchor if pricing is part of the belief, your real brand. The
   stimulus gets its own **brief** — same template and gated write procedure
   as `prototype-brief.md §3–4` (a landing page is just the thinnest
   prototype), referenced by its **canonical link** (`experiment-guardrails.md
   §0`), never copied in.
2. **The costly ask** — what makes it evidence. Ranked by cost, pick the
   highest honest one: deposit / card details (`Commitment`) > signed LOI
   (`Commitment`) > calendar-booked call (`Fake-door`) > email + qualifying
   form (`Fake-door`) > bare email (below `Fake-door` — too cheap to be
   costly, honest rung is `Talk`). A bare email signup is the floor, and
   weak — say so if that's all that's feasible.
3. **Instrumentation** — name the exact event that counts as a conversion (an
   analytics event / form submission with qualifying fields complete), the
   denominator (unique qualified visitors — traffic source must match the
   plan's Lens population), and the window. This is what the plan's
   **instrument** line names in advance; if the counting event isn't defined
   before launch, the bar can't be scored.

## Render into the Experiment's `## Method protocol` body

The two bars, `Deadline`, owner, and instrument are set by
`references/commitment-discipline.md`; this playbook fills the instrument's
detail into the body:

```markdown
## Method protocol

### Stimulus
- Page/asset: <canonical link to the brief> · promise shown · price shown (if any)

### The ask
- Costly action: <what they must do> · why this cost level

### Traffic & population
- Source: <channel> · must match Lens: <…> · window: <dates, fixed>

### Instrumentation (the plan's named instrument)
- Conversion event: <exact event/form> · denominator: <qualified visitors>

### Ethics note
- What we tell signups afterwards (fake-door = the product doesn't exist yet;
  the follow-up message is part of the spec)
```

**Anti-patterns:** counting impressions/clicks as intent (vanity —
guardrails §3) · un-qualified traffic inflating the denominator · a soft ask
dressed up as `Fake-door` (if the action costs nothing, the honest rung is
`Talk`) · no post-signup follow-up plan.

**Terminology check:** `../../_shared/ubiquitous-language.md` — end-user
audience for all on-page copy.

**Write gates:** the stimulus brief and the Experiment's protocol body are
each gated (`../../_shared/gated-writes.md`); the Experiment record itself is
committed and gated in `references/commitment-discipline.md`.
