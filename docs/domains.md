# Where the method applies — by function

Nothing in the loop is product-specific. An **Assumption** is *any belief
the business depends on* — who to sell to, what to charge, which channel
works, what a partner will sign — and the same machinery (falsifiable
sentence, Impact, evidence ladder, Risk-ranked queue) prices every one of
them. One register, sliced by `Theme`/`Area`, never forked per function:
the whole point of the dependency graph is that a go-to-market belief and
a product belief often rest on the *same* root.

## The altitude rule

The assumption is the **belief**, not the artifact. "We assume ops leads
respond to cost-saving framing over compliance framing" is register
material; "subject line A vs B" is not — it's an experiment variant
against that belief. The test: **if invalidating it wouldn't change what
you build, who you sell to, or how you reach them, it's an experiment
detail, not an assumption.** Register the belief once; run the variants
as experiments linked to it. This is what keeps a high-volume function
like outreach from drowning the register.

The same altitude rule draws the register's *lower* boundary: a belief
below it — one whose falsity wouldn't change what you build, who you sell
to, or how you reach them — belongs to the build pipeline, not here. Where
the OS hands off to its neighbours, and what crosses each seam, is
`seams.md`.

## Sales & outreach

The function that tempts people to think the OS is product-only — and the
one it fits best, because outreach experiments are cheap, fast, and
naturally pre-registerable.

Two distinct belief families, tested differently:

- **Who** (ICP beliefs): *"We assume ops leads at 20–50-person logistics
  firms feel [pain] weekly because [reason]."* Classic why-cascade material —
  your product assumptions almost certainly already depend on unstated
  ICP beliefs. Outreach is the cheap test.
- **How** (message/channel beliefs): *"We assume leading with cost-saving
  outperforms leading with compliance risk for this segment."* Registered
  once; each campaign or copy variant is an experiment against it.

The outreach funnel maps onto the existing ladder without modification —
the rung reflects what the signal **cost the prospect**:

| Funnel event | Rung | Why |
|---|---|---|
| A reply, a "sounds interesting" | Talk (10–15%) | Words to a concrete stimulus — stated, not revealed. |
| Campaign at N with a pre-registered rate bar | Observed usage (40%) | Volume changes the rung: 200 systematic sends judged against a reply/meeting-rate bar is one Observed-usage row, not 200 Talk records. |
| LOI, deposit, fake-door signup from outreach | Signed intent (60%) | A costly commitment before the thing exists. |
| Paid pilot, signed contract | Paying users (99%) | Real money. |

Rules that bite hardest here:

- **One bar per belief, honestly failable** (the grouping rule,
  `skills/_shared/experiment-guardrails.md §1b`). A campaign tempts you to
  test ICP *and* message at once — bundle both only if each keeps its own
  pre-registered bar and one measurement can't poison the other; otherwise
  pick the primary belief and hold the other constant, or the result moves
  neither.
- **Pre-register the bar** like anything else: *"We're right if ≥5% of
  100 cold emails to segment X book a meeting."* Open rates are noise;
  replies are stated; meetings and money are where rungs climb.
- **Small N is Inconclusive, not weakly validated.** Eight emails with
  one reply proves nothing; `Source quality` marks down off-ICP replies,
  and an underpowered campaign concludes Inconclusive.

`/meeting-prep` is already an outreach tool: it works backward from a
person to the high-Risk assumptions they're uniquely qualified to test —
use it before any call a campaign books.

## The whole workflow, not just assumptions

Committed plans, decisions, the glossary, and the weekly ritual run
identically on a non-product function — nothing is re-plumbed. The outreach
case, end to end (mechanics: `goals.md`):

**Commit.** *"Q3: 15 qualified meetings with logistics ops leads by
Sep 30"* is a committed Experiment, like any other commitment — bars fixed
per belief at commit time, instrument named (the CRM's qualified-meeting
stage). The SMART check forces a glossary row first — **"qualified meeting"
gets a Glossary entry** (booked ≠ attended ≠ ICP-matched), or the bar is
ambiguous at the deadline. Drafting mines the rationale: ASM-31 *"ops leads
at 20–50-person logistics firms feel the pain weekly"* and ASM-32 *"cold
email reaches them"* — both untested. `/experiment-design` reads both back
in the gamble band and asks for a dated risk-acceptance; the team writes one
and commits anyway, which is a supported answer. Both are high-Impact on
their own and climb the queue on their own Risk — the plan doesn't lift
them; they were always eligible, committed or not.

**Test.** `/experiment-design` turns ASM-32 into a pre-registered
campaign — *"we're right if ≥5% of 100 sends book a meeting"*, one Survey
at scale row. `/meeting-prep` preps each call the campaign books against
ASM-31, Mom-Test style: past behaviour, never the pitch.

**Verdict → tripwire.** The campaign concludes 1/100 — **Invalidated**
against its own bar, by a human. That verdict lands on a belief an active
committed plan rests on, so the tripwire surfaces the plan in week 3, not at
the deadline. The team re-cuts it: warm-intro channel, 10 meetings — a new
committed Experiment with its own bars, not a silent edit of the old one.

**Close out.** Sep 30, the CRM shows 12 qualified meetings: `Closed:
Achieved` via `/find-evidence` close-out, decomposed per belief — the
successor channel belief gets a strong positive reading from revealed
behaviour, and the interview notes from those meetings become the evidence
that moves ASM-31. The Q4 outreach commitment is drafted against what is now
the register's riskiest surviving belief.

Same loop, same gates, same weekly ritual slot — the only thing that
changed is the `Theme` on the rows.

## Pricing & business model

*"We assume teams of this size will pay ≥ €50/month because the manual
version of this job costs them 4+ hours."* Willingness-to-pay beliefs are the
canonical case for **revealed > stated**: everyone says yes to a
hypothetical price. Stated rungs (pricing question in an interview) cap
low; the honest tests are Signed intent (deposit, pre-order, priced
fake-door) and Paying users (a real price on real traffic). Van
Westendorp-style surveys land at Observed usage — useful for *shape*,
never for "they will pay".

## Fundraising

*"We assume seed funds writing €500k–1M cheques will treat [metric] as
the traction bar because [reason]."* Investor beliefs are assumptions
like any other: partner opinions are Opinion (5%) however warm the
meeting felt; a pass/term-sheet pattern across 20 pitches is revealed
behaviour. Logging fundraise beliefs keeps warm-meeting glow from
masquerading as validation — the same trap as the enthusiastic sales
call.

## Partnerships, regulatory, supply

*"We assume the bank's API team will grant production access within a
quarter"*, *"we assume PSD2 permits this flow without a licence."*
Regulatory beliefs are the home turf of Desk research (25%) — often
knowable in hours, no participants. Partner-dependence beliefs climb the
ladder through Signed intent (LOI, signed pilot agreement) and are
frequent **one-way-door** material: a decision resting on an untested
partner belief is exactly what `one-way-door-untested-basis` exists to
catch.

## Hiring & internal ops

The method works — *"we assume a fractional compliance hire covers
audit-readiness until Series A"* — but keep the register about beliefs
the **business thesis** depends on. Operational preferences ("we assume
standups keep us aligned") don't gate the thesis; putting them in the
register dilutes the queue. When in doubt, apply the altitude rule
upward: what breaks if this is false?

## Configuration

No schema change for any of this. `Theme` already ships `Go-to-market`,
`Business model`, `Regulatory` among its examples (extensible per
workspace), and `Lens`, `Area`, and `Audiences` are workspace-defined
lists in `validation-os.config.yaml` — add an outreach or fundraise slice
there if you want it as a first-class filter.
