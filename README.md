# Validation-OS

**An operating system for de-risking your startup — one falsifiable
assumption at a time.** Five agent skills that turn the beliefs your
business depends on into a scored, evidence-ranked register, and every
meeting, transcript, and research hour into Confidence against it.

Built and battle-tested daily running a real startup's assumption
register; extracted here so any team can run it, in any agent harness,
against any backend.

## Why this exists

Most startups don't die from building badly — they die from building the
wrong thing *confidently*. The beliefs the plan rests on ("SMBs will pay
for this", "the bank will integrate", "regulation permits it") stay in
founders' heads, untested, while the roadmap compounds on top of them.

Validation-OS makes those beliefs impossible to ignore:

- Every belief becomes an **Assumption** — one falsifiable sentence, scored
  for Impact, traced to its roots with a disciplined 5 Whys.
- Every assumption gets **Risk = Impact × (1 − Confidence/100)** — and
  Confidence is *never typed by hand*: it's the strength of the strongest
  concluded **Experiment**, on an 8-rung evidence ladder from Opinion (5%)
  to Paying users (99%).
- The register **reorders itself**: evidence lands → Confidence rises →
  Risk falls → the next-riskiest belief surfaces. You always know what to
  test next.
- A shared **glossary** keeps the team speaking one language, and a
  **decision log** records what was decided and how unanimously — without
  letting a business call masquerade as validation.

The loop:

```
Assumption → grill & score → Experiment (pre-registered pass/kill bars)
     → Evidence → Confidence ↑ → Risk ↓ → next-riskiest assumption
```

Theory, ladder, and cadence: [docs/method.md](docs/method.md) ·
[docs/evidence-ladder.md](docs/evidence-ladder.md) ·
[docs/weekly-ritual.md](docs/weekly-ritual.md).

## Quickstart

```bash
npx skills add bfish1996/validation-os
```

Pick the skills and the agents you use (Claude Code, Codex, Cursor,
opencode — [70+ harnesses](https://skills.sh)). Then, in your workspace:

```
/setup-validation-os
```

Setup asks where your registry should live and writes a
`validation-os.config.yaml`. **Zero-dependency default:** plain markdown
files in a `registry/` directory — git-tracked, no API keys, working in
under a minute. Already run your product work in Notion? Choose the Notion
connector and point the config at your own databases
([connectors/notion.md](connectors/notion.md)).

Update later with `npx skills update`.

## The skills

| Skill | What it does | Invoke it when |
|---|---|---|
| `/assumptions` | Build, grill, audit the Assumption Registry. Five modes: single (default, gated), seed, audit, loop (autonomous, explicit opt-in), triage. | "grill this assumption", "map assumptions from this call", "audit the register" |
| `/experiment-design` | Turn the riskiest assumption into a falsifiable, pre-registered test; prep the instrument (interview guide, survey, prototype brief, fake-door spec). | "how do I test this", "design an experiment", "interview guide for X" |
| `/find-evidence` | Sweep what you *already* know — internal record (calls, chat, email, CRM) and rigorous desk research — and log it as conclusive evidence. | "what do we already know about X", "desk research this" |
| `/meeting-prep` | Person-first: research whoever you're meeting, then work backward to the high-Risk assumptions they're uniquely qualified to test. | "I'm speaking to X tomorrow", "what should I ask X" |
| `/decisions` | The shared glossary + the decision log — capture, sweep, audit; retire assumptions by explicit decision, never by accident. | "log this decision", "what's the canonical term for X" |

All five read the same config, write through the same connector, and
enforce the same shared rulesets (`skills/_shared/`). Writes are **gated**
by default — every mutation is shown and confirmed before it lands; the
autonomous bulk modes are opt-in by explicit phrasing and leave an
auditable run-log plus a `Human review` gap a human must clear.

### How skills are invoked

Type the slash command (`/assumptions`) in any harness that supports
skills, or just describe the task — each skill's description carries its
trigger phrases, so "I'm meeting the CFO of X tomorrow" reaches
`/meeting-prep` on its own. Skills hand off to each other at their scope
boundaries: `/assumptions` stops where `/experiment-design` starts, and
both stop before *running* anything — verdicts stay human.

## Configuration

One file, `validation-os.config.yaml`, at your workspace root (template:
[templates/validation-os.config.yaml](templates/validation-os.config.yaml)):

```yaml
connector: local-files        # or: notion | sql | nosql
local_files:
  registry_dir: registry
vocabulary:
  lens: [Commercial, Consumer, Investor]   # your audiences
  area: [Product, Go-to-market, ...]       # your domains
  audiences: [End user, Investor, Partner, Internal]
evidence_sources: [web]       # + fireflies, slack, gmail, attio — whatever
                              #   your harness actually has connected
```

No config at all still works: local files, web-only evidence. Skills
degrade gracefully — with no call-transcript or CRM sources connected,
`/find-evidence` and `/meeting-prep` fall back to desk research and
paste-your-notes.

**Storage backends** are pluggable connectors:
[local-files](connectors/local-files.md) (default) ·
[notion](connectors/notion.md) · [sql](connectors/sql.md) ·
[nosql](connectors/nosql.md) · [write your own](docs/writing-connectors.md)
against [the spec](connectors/SPEC.md). Each ships with a schema guide
(`connectors/<name>-schema.md`) that `/setup-validation-os` uses to validate
or build the backend for you — validate-first, every change gated.

## Repo map

```
skills/               the five skills + setup, one dir per skill
  _shared/            the rulesets every skill cites (guardrails, schema +
                      machine-readable ontology, evidence procedures, gate
                      discipline)
connectors/           storage contract + reference implementations
templates/            config + starter registry files
docs/                 the method, the evidence ladder, the weekly ritual
```

## Credits & lineage

The method stands on public shoulders: Itamar Gilad's **Confidence Meter**,
Strategyzer's ***Testing Business Ideas***, Rob Fitzpatrick's ***The Mom
Test***, and Eric Evans' **ubiquitous language** (DDD). Repo conventions
follow the [Agent Skills](https://skills.sh) ecosystem; structural
inspiration from [mattpocock/skills](https://github.com/mattpocock/skills)
and [garrytan/gstack](https://github.com/garrytan/gstack).

MIT — see [LICENSE](LICENSE).
