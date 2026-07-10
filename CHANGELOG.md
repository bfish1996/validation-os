# Changelog

Release convention: add a `## vX.Y.Z` section here, set the same version in
`.claude-plugin/plugin.json`, commit, then `git tag vX.Y.Z && git push --tags`.
The release workflow refuses tags whose version or changelog section is missing.

## v0.1.0 — 2026-07-10

Initial release.

- Six validation skills plus setup: `/assumptions`, `/experiment-design`,
  `/find-evidence`, `/meeting-prep`, `/decisions`, `/self-review`,
  `/setup-validation-os`.
- Machine-readable ontology (`skills/_shared/ontology.yaml`) with
  vocabularies, derivations, status machines, and integrity rules.
- Four connector backends with schema guides: local files, Notion, SQL, NoSQL.
- Method docs, evidence ladder, weekly ritual, goals, and a worked
  seven-part example.
