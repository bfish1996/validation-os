---
"@validation-os/dashboard": minor
---

Add the "Connect Claude Code" page (OPS-1349): `composeConnectCommand` — a pure
composer that bakes a minted token + the API URL into one ready-to-paste command
wiring the `remote-api` connector — and `<ConnectClaudeCode>`, the page shell
around it. Token minting is injected (`mintToken`), so the package takes no
auth-vendor dependency; the deployment supplies the Clerk key-mint.
