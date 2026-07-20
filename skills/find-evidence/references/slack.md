# Evidence source — Slack (team chat)

Active when `slack` ∈ the config's `evidence_sources`. Requires the Slack
MCP server connected in the harness.

**What it holds:** shared customer reactions, forwarded quotes, screenshots
of feedback, internal debate. Mostly second-hand — treat accordingly.

**How to search:** keyword search across channels (public, and private if
the connection allows) for the assumption's subject terms; open promising
threads in full — the evidential detail is usually in replies, not the
matched message.

**Qualifies as evidence when:** the thread relays something a real
user/customer/prospect said or did (quote, screenshot, forwarded message).
The rung follows what was relayed: a described past behaviour → `Anecdotal`.
A **teammate's own take is not evidence** — internal opinion is hypothesis, not
a reading (`experiment-guardrails.md §0`); it belongs in the assumption's
`Scoring justification`, never logged.

**Caveats:**
- Second-hand relay drifts — prefer linking to the original artifact
  (recording, email) when the thread points at one.
- Date = the thread's date; source link = the message permalink.
