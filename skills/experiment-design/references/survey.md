# Prep playbook — survey

Entered from SKILL.md step 7 when `Type` = `Survey at scale`. Inherits the
question discipline of `interview-guide.md` (behaviour-first, non-leading,
everything maps to the bar) adapted to a no-interviewer, larger-N
instrument. **Distribution is not this skill's job** — the send is a handoff
to whatever survey/email tool the team uses, and stays reviewed there.

## Survey-specific rules

- **Screeners first.** The opening questions qualify or disqualify the
  respondent against the same screenable characteristics an interview would
  use (Lens + population). Disqualified respondents' answers are excluded
  from the bar count — say so in the decision rule.
- **Closed and countable.** Every scoring question has fixed options that
  tally directly against `We're right if` (`≥X%` of qualified respondents
  choose …). Free-text is allowed only as a non-scoring "anything else?"
  tail.
- **Past behaviour over intent.** "In the last 3 months, how many times did
  you…" beats "how likely would you be to…". If a Likert intent scale is
  unavoidable, it cannot be the primary pass-bar question.
- **No leading scales or loaded framings.** Balanced option sets, neutral
  wording, no brand pitch inside the questionnaire.
- **N target from the bar.** State the minimum qualified-respondent N below
  which the result is Inconclusive regardless of percentages — small-N
  percentages are noise.

## Render into the Experiment body

```markdown
## Survey — <experiment question>

### Who (screener questions)
<Q1..Qk with the disqualifying answers marked>

### Scoring questions
<Each question + fixed options; mark which option(s) count toward the bar>

### Distribution
- Audience/segment: <…> · Channel: <email tool / panel / community>
- Minimum qualified N: <…>

### Signal → bar
- We're right if: <copied> · We're wrong if: <copied>
- Decision rule: computed over QUALIFIED respondents only; below min-N →
  Inconclusive
```

**Handoff:** after the gated body write, name the next step — "draft the
send in <tool>" — and stop. Building the email/broadcast belongs there.

**Terminology check:** `../../_shared/ubiquitous-language.md` — end-user
audience for the questionnaire text itself (participants read it verbatim).
