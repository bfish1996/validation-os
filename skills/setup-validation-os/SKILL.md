---
name: setup-validation-os
description: >-
  First-run configuration for Validation-OS. Use when the user has just
  installed the validation-os skills, asks to set up or configure
  Validation-OS, or when any validation-os skill finds no
  validation-os.config.yaml and no registry to work against.
license: MIT
---

# Setup Validation-OS

Configure a workspace to run the validation skills: choose where the registry
lives, declare available evidence sources, and scaffold the starting files.
Everything lands in one config file — `validation-os.config.yaml` at the
workspace root — which every other skill reads (`connectors/SPEC.md` defines
the resolution rules).

Run inside the directory the user will work from. If a config file already
exists, this is a reconfigure: show the current values and change only what
the user asks.

## Steps

1. **Choose the connector.** Ask where the registry should live:
   - **Local files** (default, recommended to start) — markdown files in this
     workspace, git-trackable, no accounts or keys.
   - **Notion** — three databases in the user's workspace, worked through the
     Notion MCP server. Requires that server connected.
   Someone unsure gets local files; migrating later is a records copy, not a
   rewrite.

2. **Wire the connector.**
   - *Local files:* agree the registry directory (default `registry/`), then
     copy the four starter files from this repo's `templates/registry/` into
     it. Each contains one worked example record marked safe to delete.
   - *Notion:* walk through `connectors/notion.md` §Setup — create the three
     databases (or point at existing ones), then collect the three data-source
     IDs. Verify each ID with a live fetch before writing it to config; a 404
     here is cheap, a 404 mid-skill is not. Confirm the Experiments→Assumption
     relation targets the configured assumptions database.

3. **Declare evidence sources.** Ask which of these the user's agent can
   actually reach, and list only those under `evidence_sources:`:
   `web` (default — desk research), `fireflies` (call transcripts), `slack`,
   `gmail`, `attio` (CRM). An empty list is fine — `/find-evidence` and
   `/meeting-prep` fall back to web research and pasted notes.

4. **Set the vocabulary.** The schema leaves two lists to the user
   (`skills/_shared/registry-schema.md`):
   - **Lens** — the audiences whose decisions assumptions drive (example:
     Commercial / Consumer / Investor). 2–4 values.
   - **Area** — the product/domain areas that tag decisions and terminology.
   - **Audiences** — who outputs get written for (example: End user / Investor
     / Partner / Internal); the terminology check enforces per-audience
     phrasing.
   Record all three in the config under `vocabulary:` so every skill offers
   the same options.

5. **Write the config.** Compose `validation-os.config.yaml` from
   `templates/validation-os.config.yaml` with the answers above, show it in
   full, and write it only on the user's confirmation.

6. **Prove the loop.** Offer to run `/assumptions` now to capture the user's
   first real assumption — setup is complete when one genuine record exists,
   not when the config file does.

## Scope boundary

This skill configures; it never grills, scores, designs experiments, or edits
registry records beyond copying the starter templates — those belong to
`/assumptions`, `/experiment-design`, `/find-evidence`, and `/decisions`.

## Never

- Never write config or registry files without showing them first.
- Never store secrets (API keys, tokens) in the config — connections belong to
  the harness (MCP servers), not this file.
- Never invent Notion IDs or accept unverified ones.
