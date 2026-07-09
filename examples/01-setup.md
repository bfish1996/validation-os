# 01 · Set up the workspace — `/setup-validation-os`

Friday 10 July. Alex installs the skills in the repo the founders work
from and runs setup.

**You type:** `/setup-validation-os`

The wizard asks one thing at a time, recommending an answer each:

▎ Where should the registry live? Recommended: local files — markdown in
▎ this workspace, git-tracked, no accounts or keys. Also available:
▎ Notion, SQL, NoSQL — migrating later is a records copy, not a rewrite.

Alex takes local files. No `registry/` exists yet, so validate-first
resolves to create: the skill shows the exact files it will write and
creates them on confirm —

```
validation-os.config.yaml
registry/assumptions.md · experiments.md · decisions.md · terminology.md
```

▎ Which evidence sources can this agent actually reach? I can see a
▎ Fireflies and an Attio connection; web is always available. Declare:
▎ web, fireflies, attio?

Two more questions set the vocabulary, and the config lands:

```yaml
connector: local-files
local_files:
  registry_dir: registry
vocabulary:
  lens: [Consumer, Commercial, Investor]
  area: [Product, Go-to-market, Pricing, Trust & data]
  audiences: [End user, Investor, Internal]
evidence_sources: [web, fireflies, attio]
```

**What this shows:** validate-first setup (nothing existed, so it offered
`create_backend`), every mutation gated, and evidence sources declared only
if the harness can actually reach them.

Next: [02 — seed assumptions from a call](02-seed-from-a-call.md).
