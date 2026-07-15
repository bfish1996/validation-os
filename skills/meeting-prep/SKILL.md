---
name: meeting-prep
description: >-
  Person-first prep for any upcoming conversation — user interview, sales
  call, investor chat. Give it a NAME (the person you're speaking to) and it
  researches them across your configured internal sources (CRM record/notes,
  call transcripts, chat, email) and the public web, places them on a Lens,
  then works BACKWARD into the Assumption Registry: which high-Risk
  assumptions is this specific person uniquely qualified to test, and does
  an existing Experiment (interview guide) fit, need person-specific
  additions, or must a new one be created. Ends with a prep brief AND a
  Running interview-guide Experiment record — linked to the target
  assumption(s) with the interviewee set (gated write). Use whenever the
  user names a person they're about to speak to: "I'm speaking to X
  tomorrow", "prep me for my call with X", "what should I ask X", "who is
  X / research X before our meeting", "which assumptions should we test
  with X", "is there an interview guide for X" — even if they don't say
  "prep". This is the person→assumption direction; for assumption→test use
  /experiment-design, for assumption→existing-evidence use /find-evidence,
  for grilling the claim itself use /assumptions.
license: MIT
---

# Meeting prep

An hour with a real person is one of the scarcest research resources a team
has. This skill makes sure it isn't spent on small talk or on a question
anyone could answer: given the **person**, find the highest-Risk assumptions
**this specific person is uniquely positioned to give evidence on**, and
arrive with the right instrument (interview guide) in hand.

It is the **inverse** of the rest of the family. `/assumptions`,
`/experiment-design` and `/find-evidence` all start from an assumption and
work outward; this skill starts from a person and works backward into the
register. It **recommends, preps, and registers the instrument** — it
creates (or reuses) the Running interview-guide Experiment record, linked to
the assumption(s) with the interviewee set, so the prep lands as a testable
record, not a loose document. It does **not** run the conversation, capture
findings, or record verdicts.

Read `validation-os.config.yaml` (walk up from the working directory): the
connector for register access, `evidence_sources` for the internal research
sweep. With few or no internal sources configured, the skill still works —
external research + assumption matching; the brief just flags "first
contact" / thinner internal history.

> Schema: `../_shared/registry-schema.md`. Gate discipline:
> `../_shared/gated-writes.md`. Per-source search guidance:
> `../find-evidence/references/`.

## The two registers this touches

- **Assumptions** — read-only here: Description, Lens, Risk, Status,
  Confidence, body *Metric for truth*. Query the full register, never a
  filtered view.
- **Experiments** — interview guides ARE Experiment records: the
  protocol/questions live in the body, the pass bar in `We're right if`,
  with `Result = Running` and `Type` = the rung the interview can honestly
  reach. **The interview guide is this skill's REQUIRED deliverable — it
  must end as a record here, never only a document.** Writable (gated):
  create the interview-guide record, link its `Assumption` relation, set
  the interviewee, and append additions to an existing guide's body.

## Procedure

### 1. Resolve the person → identity + email

Search the configured CRM source for the name; fall back to transcript
participants / email contacts if the CRM has nothing. If several plausible
matches, show them (name · company · last touch) and confirm — prepping the
wrong person poisons every later step. Lock in: full name, **email
address(es)**, company, role. Email is the join key that makes the rest of
the sweep precise: transcript participant search, email threads, and CRM
interactions all pivot on it.

If the person is genuinely nowhere internally, say so — the skill still
works (external research + assumption matching), the brief just flags
"first contact".

### 2. Research sweep (read-only, run angles in parallel)

**Internal — what have we already heard from or about them** (sweep only the
configured `evidence_sources`; per-source guidance in
`../find-evidence/references/`):

- **CRM**: the person + company record, notes, logged interactions, list
  memberships. Search notes for the company name too.
- **Call transcripts**: transcripts where they (by email) or their company
  appear. Read what *they* said, not just summaries. ⚠️ Diarization can
  collapse speakers — sanity-check speaker labels against the attendee list
  before attributing quotes.
- **Email**: threads with their address / company domain.
- **Team chat**: mentions of the person or company.
- **The register itself**: prior Experiment records where they're already
  the interviewee (repeat conversation = don't re-ask what they already
  answered).

**External — who they are to the world:** role and seniority (decision-maker
or influencer?), company segment/size/strategy/regulatory posture, recent
news (funding, launches, hires), anything they've published. Professional,
public sources only. Don't skip this even when internal signal is rich —
it's what catches a mis-stored role or seniority in the CRM.

**Goals & motivations — the layer that picks the right assumption.** Go one
level past "who they are" to "what they're *trying to achieve*": the KPIs
or outcomes they personally own, how they're measured inside their company,
what their company is under pressure to do this year, and where you
plausibly fit into that. A person engages honestly and concretely on
questions that intersect their own aims — and speculates politely on
everything else. This is the primary input to step 4, not colour.

Synthesise into a short profile: who they are, what they control or know
first-hand, **what they want**, every prior touchpoint, and anything
they've *already* said that bears on the register.

### 3. Place them — relationship, Lens, evidence ceiling

**Confirm the relationship framing with the user before matching.** Infer
from the records what this person is *to you* — prospect, customer, channel
partner, design partner, investor — then state it and ask, with your read
as the recommended answer. Do this even when the CRM looks unambiguous:
deal labels and old framings mislead, and the user carries live context no
system holds. Getting this wrong poisons the assumption match — a "channel
partner" reading and a "customer" reading select entirely different
records.

Then map the person to the **one** primary `Lens` their perspective serves
(from the config's `vocabulary.lens`) and note any secondary. Be honest
about the **evidence ceiling**: a person can only give evidence their
position allows. An exec speaks first-hand on commercial claims (and can
even sign — 🎯 `Signed intent`) but only `Opinion` on what end consumers
will do; a consumer gives `Anecdotal` on their own behaviour but nothing on
procurement. A single conversation is mostly low-rung 🧪 Testing evidence —
don't plan for Confidence a chat can't deliver.

### 4. Match assumptions

Query the register: candidates are records whose `Lens` matches the person
and whose `Status` is `Draft` or `Live` — never `Invalidated` — sorted by
Risk descending (`Risk = Derived Impact × (1 − max(0, Confidence)/100)`; a
row already in the derived Testing view still counts; another interviewee is
more evidence). A belief whose signed `Confidence` has gone **negative**
(evidence stacked against it) is a live re-test priority, not a settled one —
a conversation that could confirm or overturn that doubt is high-value. Then
apply two filters, in order:

- **Goal intersection** — start from what the person is trying to achieve
  (step 2's motivations layer) and find the register records that live
  inside it. A question aligned with their own aims gets real, considered
  answers; a high-Risk record outside their aims gets polite speculation,
  whatever their role. A candidate linked from a standing (`Draft`/`Active`)
  Goal record via `Based on assumption` (`../../docs/goals.md`) that *this
  person owns or influences* is a strong match. Absence of a goal link is not
  disqualifying at all — an unlinked row's experiments sit on the test-next
  surface like any other's; the link is a signal about *this person's* stake,
  nothing more.
- **Unique qualification** — what can *this* person answer that a generic
  participant couldn't (their role, access, lived experience, their
  company's situation)? Drop high-Risk records they'd only speculate on.

Check `Depends on` — if a candidate rests on an untested upstream belief
this person could also speak to, prefer the upstream one. And if a
candidate's claim is itself **ambiguous** (you can't say in one sentence
what would make it true), don't build a conversation on it: flag it to
`/assumptions` as a grill problem, and either pick the next candidate or
proceed only with the reading the user confirms.

Recommend the top 1–3, each with: title · Risk · one line on why *this
person* · the honest rung the conversation could reach. Confirm which to
target (one question, recommended answer first).

### 5. Match experiments — fit / additions / new

For each chosen assumption, query Experiments for linked records (any
`Result` — a `Running` interview guide is the ideal hit; a concluded one
shows what's already been asked). Read the body protocol and give one
verdict:

- **Fits** — a Running guide whose recruit criteria and questions already
  cover this person. Reuse as-is; the brief carries its questions + pass
  bar.
- **Needs additions** — the guide fits but this person warrants extra
  person-specific probes (their company's situation, something they said in
  a past call, their unique access). Draft the additions.
- **New needed** — no guide exists, or the person's evidence ceiling
  implies a different rung (e.g. they could *sign*, and the only guide is
  opinion-level). **Create the interview-guide Experiment record here**
  (gated, step 6). (Only when the right instrument is *not* an interview a
  single conversation can carry — e.g. a prototype or survey — hand off to
  `/experiment-design` instead, carrying the drafted context.)
- **Already evidence** — the person's *lived history* itself bears on the
  assumption (a closed-lost deal, a build-vs-buy decision they made, a
  pilot they ran). That's retrospective evidence, not a future test: point
  at `/find-evidence` to log it, and shape the call's questions to fill in
  what the records don't capture (the why). This verdict can coexist with
  any of the three above.

### 6. Gated writes, then the brief

Up to three writes, each gated (`../_shared/gated-writes.md`). Write 1 (or
a *Fits* reuse / *Needs additions* edit of an existing record) is REQUIRED —
the skill must leave a Running interview-guide record behind; writes 2–3
support it:

1. **Create the interview-guide Experiment record** (verdict *New needed*):
   title, `Result = Running`, `Type` = the honest rung, `Feasibility`,
   `Assumption` relation → the target assumption(s), and body = recruit
   criteria + questions + pre-registered `We're right if` (and kill bar),
   per `../experiment-design/references/interview-guide.md`'s skeleton.
2. **Interviewee** on the chosen/created record → the person (on Notion,
   take the interviewee field's name and relation target from the live
   schema — don't hardcode either; create a minimal person record if none
   exists).
3. **Body additions** to an *existing* guide — appended as a clearly-marked
   section (`### Person-specific — <name>, <date>`), never interleaved. Run
   the terminology check (`../_shared/ubiquitous-language.md`) over any
   wording that will be read aloud to the participant (end-user audience;
   advisory). **Never touch the pre-registered `We're right if` / kill bar
   or the original questions** — an experiment edited after registration
   stops being pre-registered.

Then deliver the prep brief and **stop** — running the conversation and
capturing findings are execution's job.

## The prep brief

The **required durable artifact is the interview-guide Experiment record**
(created/reused in step 6) — that record, `Result = Running`, linked to the
target assumption(s) with the interviewee set, IS the deliverable. Deliver
the brief in chat and link the record. Do **not** substitute a document for
the record. Optionally (gated), also save a human-readable copy wherever
your team keeps meeting docs (a CRM note, a doc next to the calendar
invite) — a convenience, not the source of truth.

ALWAYS use this structure:

```
# Prep — <Name>, <Company> (<date of meeting if known>)
## Who they are        — role, company, relationship (as confirmed), Lens,
                          evidence ceiling, decision power
## What they want       — their goals/KPIs, how they're measured, their
                          company's pressures, where you fit for THEM
## What we already know — prior touchpoints + what they've said (quoted, sourced)
## Test with them       — the chosen assumption(s): claim, Risk, why them
## The instrument       — Experiment-record link (the Running interview
                          guide), pass bar, questions incl. any additions
## Don't                — what not to ask: already answered, leading/"would
                          you" phrasings to avoid, wrong-Lens topics
## Open intel gaps      — what research couldn't establish; ask early in the call
```

## Never

- Creating the `Running` interview-guide record (linked, interviewee set)
  IS in scope. But never flip its `Result` to a verdict and never change an
  assumption `Status` — the record you leave stays `Running`; verdicts are
  execution. Deep non-interview instrument design (prototype, survey,
  fake-door) stays with `/experiment-design`.
- Never edit a guide's pre-registered bars or existing questions —
  additions only.
- Never log anything the person *might* say as evidence, and never log the
  research sweep itself as evidence records — historic evidence is
  `/find-evidence`.
- Never present speculation as fact in the brief — every "what we know"
  line carries its source; distinguish "they said" from "we infer".
- Never contact the person or act on their systems — research and prep
  only, from professional/public sources.
- Never recommend an assumption above the person's evidence ceiling without
  saying what rung the conversation can honestly reach.
