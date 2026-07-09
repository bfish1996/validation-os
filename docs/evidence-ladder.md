# The evidence ladder

Eight rungs, three tiers. The rung an experiment sits on (`Type`) names
*both* what you do and how strong the resulting evidence is — the
percentages are the indicative Confidence a *concluded, validating*
experiment at that rung earns its assumption. The gaps between rungs
reflect **commitment**: what the signal cost the person to give.

| Tier | Rung | ~Strength | What it is |
|---|---|---|---|
| 🔴 Stated | Opinion | 5% | What someone says about a hypothetical ("I think users would love this"). Includes your own team's and advisors' views. |
| 🔴 Stated | Pitch-deck reaction | 10% | A verbal "yes, I'd…" to a pitch or mock — stated, but to a concrete stimulus. |
| 🔴 Stated | Anecdotal | 15% | A report of something that **actually happened** — a specific past behaviour, an unprompted real complaint. A weak, small-N shadow of revealed preference; that's why it beats Opinion. |
| 🟡 Researched | Desk research | 25% | Regulation, published data, competitor facts. Always ask first: "is this already knowable in hours, with no participants?" |
| 🟡 Researched | Survey at scale | 40% | A structured questionnaire at larger N. **This is where volume lives** — 100 people validating a belief is one Survey row, not 100 anecdotes. |
| 🟢 Revealed | Signed intent | 60% | A **costly** commitment made before the thing is built: fake-door signup, LOI, deposit. |
| 🟢 Revealed | Prototype usage | 80% | Real (unpaid) use of a throwaway / Wizard-of-Oz build — genuine behaviour, minus money. |
| 🟢 Revealed | Paying users | 99% | Real money: payment, A/B on live traffic, signed contract. Strongest, priciest. |

## The rules that keep the ladder honest

- **Revealed > stated.** What people *did* beats what they *say* they'd do,
  always.
- **The rollup is a `max`, not a sum.** An assumption's Confidence is its
  strongest concluded experiment — weak evidence doesn't stack. 100
  anecdotes roll up exactly like one.
- **Volume changes the rung, not the count.** Systematically asking 100
  people is a Survey at scale (40%), not 100 Anecdotal rows (15%).
- **Source quality moves you within a rung, never across.** A CFO at a
  target account beats a junior at an off-ICP company — but a High-quality
  Opinion is still just an opinion.
- **Corroboration is a bounded bump.** ≥K independent proven records
  agreeing at the top rung earn a small uplift, capped below the next
  rung's floor. Replication is worth something; it can't manufacture a
  higher rung.
- **Only concluded experiments count.** A Running or Inconclusive
  experiment contributes zero. Sample too small or wrong audience →
  Inconclusive, not "weakly validated".
- **Base rate ≠ validation.** Desk research can tell you the world's
  conversion rates; it cannot tell you *your* users will convert. For
  your-user behavioural claims, desk evidence caps at Inconclusive.

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.
Credit: the ladder adapts Itamar Gilad's Confidence Meter.
