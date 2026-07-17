# Shared helper — terminology check (ubiquitous language)

The canonical terminology-enforcement procedure. Cited by `/decisions` (its
Terminology Build/Audit modes) **and** by any output-producing skill that
wants its draft checked before it ships. Build and enforcement judge by the
same glossary, so what the glossary says is what every output is held to.
When this changes, all paths change.

The glossary lives in its own **Glossary register** (`OPS-1305`) — query it
via the active connector. Field map: `registry-schema.md §Field map —
Glossary`.

> ⚠️ Always query the full register, never a filtered view or subset —
> checking against a slice silently misses terms.

## Model: one record per word, all properties, no body

A word is **one concept = one record.** Audience-specific meaning and bans
are **structured properties**, not body prose (`OPS-1305` — the glossary
carries no body at all, so the check parses fields directly):

- **`Definition`** (text) — the definition, one sentence per applicable
  audience if it diverges. Context only, **not enforced**.
- **`Avoid`** (structured `[{audience, phrase, fix}]`) — the **must-fix
  source**. One entry per banned phrasing + its fix, e.g.
  `{audience: "End user", phrase: "claim", fix: "redeem"}`. An audience
  value of `All` applies universally. A check applies the `All` entries
  plus the entries for the resolved audience.
- **`How it differs`** (text) — contrasts the term from confusable
  neighbours (pairs with the `Related tension` relation). Context.

There is no template to break — `Avoid` is a real structured field, so a
term missing must-fix entries is simply an empty `Avoid`, not a silently
escaped check.

## The check contract

**Inputs:** `(draft text, audience)`. Audience is one of the config's
`vocabulary.audiences`. If the calling skill cannot resolve the audience,
**ASK the user** — never guess.

**Steps:**

1. Query the Glossary register (Title, Status, Area, Avoid). Determine the
   **hard-enforce set**: `Active` + `Superseded` records (there is no
   `Reversed` status on a glossary term — a term is superseded by a better
   one, never reversed). Optionally narrow to the draft's Area when known.
2. Read the `Avoid` field of the hard-enforce set only and parse it into
   `{audience → [banned phrasing → fix]}`. Apply the **All** entries plus
   the resolved audience's entries.
3. Scan the draft for those banned phrasings, and for any use of a
   `Superseded` term.
4. If the draft uses a domain concept that has **no glossary record at all**,
   emit it as an `unknown term` note — a candidate to add via `/decisions`'
   Terminology Build mode.

**Severity:**

- **must-fix** — a banned phrasing from an `Avoid` entry (All or the
  resolved audience), or a `Superseded` term.
- **should-fix** — an `Avoid` entry for the resolved audience that suggests
  a register/wording swap (soft nudge rather than hard ban).
- **note** — unknown term (not yet in the glossary).

**Output shape** (the calling skill renders this at its existing gate):

```
🗣️ Terminology check — audience: <audience>
  ✗ must-fix    "claim your reward"      → "redeem your reward"   (Avoid: reward verb is "redeem")
  ⚠ should-fix  "returns on your money"  → "growth"               (Avoid[end user]: register)
  • note        "wellbeing uplift"        → no glossary record — add term?
  ✓ 0 other issues
```

## Rules

- **Advisory, never silent.** Surface findings at the calling skill's gate.
  Never auto-rewrite the draft — the user decides each one. (A skill may
  offer to apply the accepted suggestions after the user confirms.)
- **Don't block the pipeline.** Findings inform the existing gate; they don't
  add a new hard stop. `must-fix` is a strong recommendation, not a lock.
- **One audience per check.** A draft aimed at two audiences is checked once
  per audience.
- **Provisional ≠ Active.** Only enforce `Active` records hard; treat
  `Provisional` phrasings as suggestions so a still-forming glossary doesn't
  nag.
