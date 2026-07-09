# Shared helper — desk-research trust rubric

Read by `historic-evidence.md` (when `web` ∈ sources) and `/find-evidence`.

The reason the desk (web) flavour needs this and generic web research
doesn't: a fact logged against an assumption becomes `Confidence` the whole
team reads off. If the research is sloppy, you don't just get a wrong answer
— you get a *confident* wrong answer that stops you testing the thing for
real. This rubric is what makes a desk finding **trustworthy enough to write
into the register**. Every load-bearing claim in a `Desk research`
Experiment record must clear it.

---

## 1. Decompose before you search

Take the assumption's **Metric for truth** and break it into the specific,
answerable **sub-questions** a source could settle — each mapping to part of
`We're right if`. You are not "researching the topic"; you are trying to
move *one belief* past a *pre-set bar*.

- A sub-question is answerable by a document ("What does the regulation
  permit for account-information access?"), not a vibe ("Is this market
  big?").
- If a sub-question can only be answered by observing your own users, it is
  **not desk-researchable** — route to `/experiment-design`. Desk research
  can set a *base rate* for it, never *validate* it.

## 2. Source tiers — every claim rests on a tier

Rate each source before you lean on it. A claim's strength is capped by its
best independent source's tier.

| Tier | What qualifies | Use |
|---|---|---|
| **A — Authoritative / primary** | Legislation & regulator text, official statistics (national statistics offices, central banks), audited filings / annual reports, peer-reviewed research, standards bodies, primary company docs (pricing pages, T&Cs, API docs) | Load-bearing. A single A source can carry a fact if it *is* the primary record (e.g. the regulation itself). |
| **B — Reputable secondary** | Established analysts with a stated methodology, quality press (FT, Reuters, Bloomberg), trade bodies, well-run industry surveys with N + method disclosed | Load-bearing **when triangulated** (§3). |
| **C — Weak secondary** | Vendor marketing / blogs, content-marketing "reports" with no method, aggregators, undated pages, SEO listicles, competitor self-description | Corroboration only. Never the sole basis for a verdict. Flag as self-interested. |
| **D — Anecdotal / unverified** | Reddit, forums, social posts, single unattributed blog posts, AI-generated summaries | Lead generation only — chase them to an A/B source. Never cited as evidence. |

**No source, no claim.** Every figure or fact in the record must trace to a
fetched URL — not to model priors. "According to general knowledge…" is
banned: it is exactly the failure this rubric replaces. If you can't fetch a
source that says it, you don't know it.

## 3. Triangulation & independence

- Any **load-bearing** fact needs **≥2 independent** sources, or one Tier-A
  primary record. A single Tier-B/C source → flag the claim as
  *single-sourced* and cap the verdict at **Inconclusive** on that
  sub-question.
- **Independence is the trap.** Five outlets repeating one press release, or
  ten blogs citing the same chart, are **one** source, not ten. Trace each
  back to its origin; count origins, not restatements.
- Divergent numbers are the norm for market sizing. Report the **range and
  the most-authoritative point estimate**, not a false-precision single
  figure.

## 4. Recency

- **Date every source** (publication date, and the date the *data* covers —
  they differ). Put both in the citation.
- Judge staleness by domain velocity: regulation, pricing, competitor
  features, and market size move fast — a two-year-old figure may already be
  wrong; a definition or a law may be stable for years. When a fast-moving
  fact is only available stale, say so and cap confidence.

## 5. Adversarial verification (the step that earns trust)

For every load-bearing claim, run a **skeptic pass** whose job is to
*refute*, not confirm:

1. **Does the source actually say it?** Fetch the page and quote the exact
   sentence/figure. Reject paraphrases that drift from the source (the most
   common error — a real URL attached to a claim it doesn't support).
2. **Is the source what it claims?** A "study" that's a vendor landing page
   is Tier C, not B. Downgrade on inspection.
3. **What's the disconfirming source?** Actively search for the counter-case
   ("<claim> criticism", "<claim> overstated", "<market> decline"). A
   finding that only ever searched for supporting evidence is confirmation
   bias, not research.
4. **Independence & recency** per §3–4.

Default the skeptic to **refuted / downgrade when uncertain.** A claim
survives only if the skeptic can't knock it down. In an autonomous harness
this is ≥2 independent skeptic agents; majority-refute kills the claim.

## 6. Conflicting evidence — capture, don't cherry-pick

When sources disagree, the record must **show the conflict** and how you
weighed it (tier, recency, independence, self-interest) — never silently
keep the half that fits the bet. A logged contradiction is a strong, honest
outcome; a cherry-picked "Validated" is the failure mode this whole rubric
exists to prevent.

## 7. Base rate ≠ validation (the honesty rule that protects the register)

Desk research can tell you the *world's* base rate ("industry free→paid
conversion runs 2–5%"). It **cannot** tell you your users will do it. If the
Metric for truth is about your own users/customers doing something, desk
evidence is **Inconclusive** for that record — log the base rate as useful
context, set `Result: Inconclusive`, and note in the body that a
revealed-preference test (`/experiment-design`) is what actually settles it.
Marking such a record Validated off desk research is the cardinal sin: it
retires a live risk on evidence that never touched it.

## 8. The verdict

Map the triangulated, verified findings back onto `We're right if` /
`We're wrong if`:

- **Validated** — the world facts clear `We're right if` on A/B,
  triangulated sources, and the claim is genuinely world-knowable (not a
  your-user behaviour).
- **Invalidated** — sources clear `We're wrong if` (e.g. regulation forbids
  it, the market is an order of magnitude too small, the competitor already
  owns it). **Log this loudly** — a killed assumption is the cheapest win
  desk research buys.
- **Inconclusive** — sources conflict irreducibly, are too weak/stale, only
  set a base rate for a behavioural claim, or the sub-questions couldn't be
  answered from public material. Honest and common; better than a
  manufactured verdict.

---

## Desk-research body template (write into the Experiment record)

```markdown
## Desk research — <assumption short title>
**Metric for truth:** <verbatim from the assumption>
**We're right if:** <pre-registered pass bar>   **We're wrong if:** <kill bar>
**Researched:** <YYYY-MM-DD>   **Verdict:** <Validated | Invalidated | Inconclusive>

### Sub-questions → findings
1. **<sub-question>** — <one-line finding>
   - <exact quote / figure> — [<source>](<url>) · Tier <A/B/C> · pub <date>, data <period>
   - <corroborating or conflicting source> — [<source>](<url>) · Tier <…> · <date>
2. …

### Conflicts & how weighed
<what disagreed, and why you leaned the way you did — or "none material">

### Confidence & caveats
<single-sourced claims, stale figures, base-rate-only limits, independence notes>

### Sources considered & dropped
<Tier C/D leads chased but not cited, and why — shows the search was honest>
```

Keep it auditable: a teammate should be able to click every URL, find the
quoted line, and agree with the verdict — or see exactly where they'd
disagree.
