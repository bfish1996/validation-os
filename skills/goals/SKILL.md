---
name: goals
description: >-
  The one skill for Goal records — a goal is a time-boxed, owned commitment
  to a measurable state change, held as its own record with two bars fixed at
  commit time (We're right if / We're wrong if), a deadline, an owner, and
  the measuring instrument named in advance. Goals are instruments, not
  gates: this skill NEVER blocks a commitment. Three modes — draft (gated;
  write a SMART bar, challenge the target against calibration evidence, mine
  the beliefs underneath, read their Confidence back as advisory bands and
  ask for a dated risk-acceptance when you're gambling); close (gated; human
  verdict Achieved/Missed/Dropped against the pre-registered bars, hard-gated
  on decomposing the outcome into per-belief evidence readings); audit
  (read-only goal health — overdue risk-acceptances, fired tripwires,
  unclosed goals, undecomposed outcomes, anchor dilution). Use for "log this
  goal", "set a Q3 goal/OKR", "commit to this goal", "close out the goal",
  "did we hit the goal", "audit our goals". Skip for /decisions (a goal is
  NOT a decision row) and for KR progress tracking (your CRM keeps score).
license: MIT
---

# Goals

A goal is the strongest instrument the method has. Its outcome is evidence —
bought with real commitment, read back onto the beliefs underneath. That only
works if the bars are fixed *before* you know the answer.

**The team makes the goals. This skill never gates goal-making.** It helps
write a good one, says out loud what the goal bets on, and reads the result
back. It does not hold a veto — every band below is advice, and a user who
wants to commit against their own evidence may, on the record, with a date.

Read `validation-os.config.yaml` (walk up from the working directory) and
work the register through the active connector (`connectors/SPEC.md`).

> The goal model — what a goal is, the three joints, and why the gate is gone
> — lives in `../../docs/goals.md`; read it first, every mode. The register's
> field map lives in `../_shared/registry-schema.md`. The risk-acceptance
> line format is `../_shared/decision-guardrails.md §8`. Why a goal never
> anchors Impact: `../_shared/assumption-guardrails.md §3`. Gate discipline:
> `../_shared/gated-writes.md`.

> ⚠️ **Goal records are not Decision rows.** Never write a goal as `Type:
> Decision` with `Kind: Goal commitment` — that value is retired
> (`../_shared/decision-guardrails.md §9`). A legacy row still carrying it is
> a migration, not a goal to edit in place.

## Pick the mode

| Mode | Scope | Gate | Reference |
|---|---|---|---|
| Draft | one goal | gated | `references/draft.md` |
| Close | one goal | gated | `references/close.md` |
| Audit | all standing goals | read-only report | `references/audit.md` |

**State which mode you're in and why, in one line before acting.** Draft and
Close work one record at a time. Audit never writes; its fixes route back
through Draft or Close.

## The shape of a Goal record

| Part | Rule |
|---|---|
| `We're right if` | The target bar. Concrete, countable, decidable by reading one number. **Fixed at commit time.** |
| `We're wrong if` | The kill floor. Also fixed at commit time — the bar that says this didn't work. |
| Deadline | A date. Hit/miss is decidable on it. |
| Owner | Exactly one. |
| Instrument | Which number, read from where ("Attio, stage 'Pilot signed'"). Named **in advance**, so nobody argues the measurement afterwards. |
| `Based on assumption` | The beliefs the goal rests on — mined at draft, cited in the rationale. |
| Lifecycle | `Draft` → `Active` → `Closed` (`Achieved` / `Missed` / `Dropped`). |

**Re-cutting a goal supersedes it — never a silent edit of a bar.** A bar
that moves to meet the result measures nothing. This is the one hard rule in
the skill, and it is a rule about *bookkeeping*, not about permission: re-cut
as freely as you like, as long as the old record stays readable.

> **Schema note.** The field map and body template for Goal records are not
> yet written into `../_shared/registry-schema.md` — the model is settled,
> the physical schema is pending. Until it lands, carry the parts above,
> match whatever the active connector's records already do, and confirm the
> shape in the gated write card rather than inventing fields silently.

## The advisory bands

At draft and again at activation, read each linked belief's Confidence back
to the user:

| Band | Reading | Ask |
|---|---|---|
| **≥ +30** | Plateaued in Testing — as good as cheap tests get. | Nothing. The goal *is* the next instrument. |
| **0 … +30** | A gamble. | A dated risk-acceptance line. |
| **< 0** | Betting against your own evidence. | The strongest flag — the line must say why the evidence is wrong, or that it's knowingly accepted. |
| **≤ −50** | The belief is in the kill lane. | Surface its kill review before the goal proceeds. |

Say the band, say what it means, ask for the line. Then proceed either way —
**the answer is never "no"**. A goal committed on a `< 0` belief with an
honest dated line is a legitimate output of this skill; a goal committed on
one silently is the failure it exists to prevent.

## How other skills reach goals

- `/assumptions` reads goal linkage as a **per-goal view** and nothing more —
  never an Impact anchor, never a Confidence input
  (`../_shared/assumption-guardrails.md §3`). Linkage never gates the
  test-next queue — every `Live` row is eligible on its own merits
  (`../_shared/registry-schema.md §Status & derived views`).
- `/find-evidence` no longer decomposes goal outcomes — Close does that
  in-skill now (`references/close.md`). What `/find-evidence` still does is
  fire the **tripwire** (a conclusive verdict on a linked belief surfaces
  every `Draft`/`Active` goal resting on it) and route **found scoreboard
  numbers** here — a measured metric is a forward-goal prompt, never logged as
  Testing evidence (`../../docs/goals.md §Found numbers`).
- `/decisions` does not touch goals. A goal is not a decision.
