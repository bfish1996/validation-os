# 01 · Set up the workspace — `/setup-validation-os`

Thursday 9 July 2026 — launch day. Benji installs the skills in this repo
and runs setup, on validation-os itself.

**You type:** `/setup-validation-os`

The wizard asks one thing at a time, recommending an answer each:

▎ Where should the registry live? Recommended: local files — markdown in
▎ this workspace, git-tracked, no accounts or keys. Also available:
▎ Notion, SQL, NoSQL — migrating later is a records copy, not a rewrite.

Benji takes local files. No `registry/` exists yet, so validate-first
resolves to create: the skill shows the exact files it will write and
creates them on confirm —

```
validation-os.config.yaml
registry/assumptions.md · experiments.md · decisions.md · terminology.md
```

▎ Which evidence sources can this agent actually reach? Web is always
▎ available; no Fireflies, Slack, or Attio are connected in this
▎ workspace. Declare: web only?

Two more questions set the vocabulary — this time the audience isn't
"Consumer/Commercial/Investor" (that's the README's generic placeholder),
it's specific to what validation-os actually is: an OSS dev tool with no
sales team, so the people whose decisions matter are *Adopters* (install
and use it), *Contributors* (send a PR), and *Distributors* (feature or
recommend it). The config lands:

```yaml
connector: local-files
local_files:
  registry_dir: registry
vocabulary:
  lens: [Adopter, Contributor, Distributor]
  area: [Positioning, Distribution, Docs & DX, Product, Community]
  audiences: [End user, Contributor, Internal]
evidence_sources:
  - web
```

**What this shows:** validate-first setup (nothing existed, so it offered
`create_backend`), every mutation gated, evidence sources declared only if
the harness can actually reach them, and vocabulary chosen for what the
project actually is rather than copied from the README's example set.

Next: [02 — seed assumptions from the planning session](02-seed-from-a-call.md).
