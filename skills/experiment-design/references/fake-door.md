# Prep playbook — fake-door / signed intent

Entered from SKILL.md step 7 when `Type` = `Signed intent` (concept test,
fake-door, waitlist, LOI, deposit). The evidence is the **costly action** —
a signup, signature, or payment-intent — not stated enthusiasm. This
playbook produces the spec; building the page happens in your prototype
home, not in this skill.

## The three parts (all pre-registered)

1. **Stimulus** — the thing shown: a waitlist landing page, one-pager, or
   concept card. Realistic enough that the ask is real: concrete promise,
   price anchor if pricing is part of the belief, your real brand. The
   stimulus gets its own **brief** — same template and gated write
   procedure as `prototype-brief.md §3–4` (a landing page is just the
   thinnest prototype).
2. **The costly ask** — what makes it evidence. Ranked by cost, pick the
   highest honest one: deposit / card details > signed LOI >
   calendar-booked call > email + qualifying form > bare email. A bare
   email signup is the floor, and weak — say so in the design if that's all
   that's feasible.
3. **Instrumentation** — name the exact event that counts as a conversion
   (an analytics event / form submission with qualifying fields complete),
   the denominator (unique qualified visitors — traffic source must match
   the Lens population), and the window. If the counting event isn't
   defined before launch, the bar can't be scored.

## Render into the Experiment body

```markdown
## Fake-door — <experiment question>

### Stimulus
- Page/asset: <link to the brief> · promise shown · price shown (if any)

### The ask
- Costly action: <what they must do> · why this cost level

### Traffic & population
- Source: <channel> · must match Lens: <…> · window: <dates>

### Instrumentation
- Conversion event: <exact event/form> · denominator: <qualified visitors>

### Signal → bar
- We're right if: <copied> · We're wrong if: <copied>
- Ethics note: what we tell signups afterwards (fake-door = the product
  doesn't exist yet; the follow-up message is part of the spec)
```

**Anti-patterns:** counting impressions/clicks as intent (vanity —
guardrails §3) · un-qualified traffic inflating the denominator ·
a soft ask dressed up as `Signed intent` (if the action costs nothing, the
honest rung is `Pitch-deck reaction`) · no post-signup follow-up plan.

**Terminology check:** `../../_shared/ubiquitous-language.md` — end-user
audience for all on-page copy.

**Write gates:** the Experiment-body section and the brief are each gated
(`../../_shared/gated-writes.md`).
