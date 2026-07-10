# Threats to validity

A checklist for pressure-testing a design before it's finalized (guardrails
§3, step 4 of `/experiment-design`). Not every threat applies to every rung —
skim the list, name the ones that do, and either mitigate or explicitly
accept them in the record body. Silence is not the same as "not applicable."

- **Selection bias** — are conditions/groups getting systematically different
  subjects? (e.g. only power users see the new flow)
- **Novelty effects** — will the intervention look good just because it's
  new, not because it's better? Most relevant to `Prototype usage`.
- **Hawthorne effect** — are subjects behaving differently because they know
  they're being observed? Relevant to any moderated interview or usability
  session.
- **Regression to the mean** — if subjects were picked because of an extreme
  value (angriest churned users, most engaged power users), they'll drift
  toward average regardless of the intervention.
- **Spillover / contamination** — can the treatment leak into the control
  group, or can one interviewee's answer bias the next (e.g. shared Slack
  channel)?
- **Sample representativeness** — will results generalize past the tested
  population? A `Signed intent` test with five design-partner customers
  doesn't tell you what the long tail will do.
- **Multiple comparisons** — testing many metrics inflates false positives.
  Commit to one primary metric (the `We're right if` bar); treat everything
  else as directional.
- **Instrumentation drift** — is the measurement stable across the whole
  run? (analytics tracking changed mid-test, interviewer changed the script)
- **Survivorship bias** — are dropouts silently excluded in a way that skews
  the result? (churned users can't answer your retention survey)

## Stopping rules

Decide *before* running when you'll look at results and what counts as
done. Peeking early and stopping the moment a metric looks good inflates
false positives — this is exactly what `We're right if` / `We're wrong if`
are supposed to prevent, but a stopping rule closes the timing loophole
they don't cover.

## Ethics and safety (interviews, prototype usage, fake-door)

When the experiment involves real people, personal data, or an
irreversible action:

- Get informed consent where appropriate — especially for recorded
  interviews or usage tracking outside the normal product.
- Minimize harm; have a clear stopping criterion if the prototype or
  fake-door causes real confusion or cost to a participant (e.g. a fake
  checkout that charges a real card needs a refund plan ready before it
  ships).
- Handle any data collected (recordings, PII, payment intent) per the
  org's normal data-privacy rules — don't create a side channel that
  bypasses them because it's "just a test."
