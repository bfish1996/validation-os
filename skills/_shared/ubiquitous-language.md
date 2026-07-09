# Shared helper — terminology check (ubiquitous language)

The canonical terminology-enforcement procedure. Cited by `/decisions` (its
Terminology Audit mode) **and** by any output-producing skill that wants its
draft checked before it ships. Build and enforcement judge by the same
glossary, so what the glossary says is what every output is held to. When
this changes, all paths change.

The glossary lives in the Decisions & Terminology register (query it via the
active connector, **filtered/confirmed to `Type = Terminology`** — the same
register holds Decision records, whose rules live in
`decision-guardrails.md`). Field map: `registry-schema.md`.

> ⚠️ Always query the full register, never a filtered view or subset —
> checking against a slice silently misses terms.

## Model: one record per word, audience in the body

A word is **one concept = one record.** Audience-specific meaning and bans
are not fields and not separate per-audience records — they live in the
record **body**, per audience. The audience list comes from the config's
`vocabulary.audiences`. The fields carry only the word's audience-agnostic
facts (Title, Type, Status, Area, Related tension).

### Record body — the enforceable source

Every term's body follows three fixed headings (the check keys off these
verbatim):

- **`## Definition`** — one bullet per audience that applies
  (`- **End user:** …`, `- **Internal:** …`); a single bullet if the meaning
  is uniform. Context only, **not enforced**.
- **`## Avoid / don't say`** — the **must-fix source**. Per-audience bullets
  of banned phrasings + the fix, e.g. `- **End user:** 'claim' → say
  'redeem'`. Universal bans use `- **All:** …`. A check applies the **All**
  bullets plus the bullets for the resolved audience.
- **`## How it differs`** — 2–5 `- **vs <neighbour>:**` bullets contrasting
  the term from confusable neighbours (pairs with the `Related tension`
  relation). Context.

A term whose body breaks the template (no `## Avoid` section) silently
escapes the check — when building or editing terms, always write the
template.

## The check contract

**Inputs:** `(draft text, audience)`. Audience is one of the config's
`vocabulary.audiences`. If the calling skill cannot resolve the audience,
**ASK the user** — never guess.

**Steps:**

1. Query the register (Type = Terminology; Title, Status, Area). Determine
   the **hard-enforce set**: `Active` + `Superseded` + `Reversed` records.
   Optionally narrow to the draft's Area when known.
2. Read the **bodies of the hard-enforce set only** and parse each
   `## Avoid / don't say` section into `{audience → [banned phrasing →
   fix]}`. Apply the **All** bullets plus the resolved audience's bullets.
3. Scan the draft for those banned phrasings, and for any use of a
   `Superseded`/`Reversed` term.
4. If the draft uses a domain concept that has **no glossary record at all**,
   emit it as an `unknown term` note — a candidate to add via `/decisions`'
   Terminology Build mode.

**Severity:**

- **must-fix** — a banned phrasing from an `## Avoid` bullet (All or the
  resolved audience), or a `Superseded`/`Reversed` term.
- **should-fix** — an `## Avoid` bullet for the resolved audience that
  suggests a register/wording swap (soft nudge rather than hard ban).
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
