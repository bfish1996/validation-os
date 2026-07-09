# Evidence source — Attio (CRM)

Active when `attio` ∈ the config's `evidence_sources`. Requires the Attio
MCP server connected in the harness. Any CRM with notes/records works the
same way — this file's patterns transfer.

**What it holds:** relationship state (who the person is, seniority,
company, ICP-fit — exactly what `Source quality` needs), notes from past
meetings, and deal/stage history (a signed deal or paid invoice recorded
here is 🟢 `Paying users` / `Signed intent` evidence).

**How to search:** search records by the people/companies the assumption's
Lens points at; read their notes and interaction history; use record
attributes (title, company size) to set `Source quality` honestly.

**Qualifies as evidence when:** a note records what a prospect/customer
said or did, or the record's own state is the evidence (deal closed, order
placed). Pipeline stage alone ("in negotiation") is a *planned* signal —
an experiment to design, not evidence to log.

**Caveats:**
- CRM notes are summaries — chase the underlying artifact (call recording,
  email) for load-bearing quotes.
- Use the CRM to *qualify the source*, not just find the quote: the same
  sentence from a decision-maker at a target account and from an off-ICP
  junior are different `Source quality`.

**Mining lost and churned records.** A CRM's Lost/Churned-stage records are
as much evidence as its won ones — often more, since they're the
disconfirming case teams read least. Pull them deliberately, not only the
won pipeline:

- **Read the lost-reason field/notes** and map the stated reason to
  whichever assumption it actually bears on ("too expensive" → a
  willingness-to-pay assumption; "missing feature X" → the assumption that
  feature X isn't needed; "went with a competitor" → a differentiation
  claim). A lost-reason is disconfirming evidence for that assumption —
  log it as such rather than leaving it unread.
- **Distinguish never-converted from churned-after-paying.** A prospect
  lost before signing is a weaker signal (🔴 `Anecdotal`/`Opinion`-tier,
  someone who never became a customer); an account that churned *after*
  paying or using the product is stronger — the same 🟢 rungs a signed deal
  gets, read in reverse (an `Invalidated` result at the `Paying users`
  rung, not a downgrade to a weaker `Type`).
- **The same "chase the underlying artifact" caveat applies harder here** —
  a lost-reason field is frequently a sales rep's one-line paraphrase of a
  longer conversation; check the closing call transcript or email thread
  when available before treating the CRM field alone as the full evidence.
