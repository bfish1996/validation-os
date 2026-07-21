---
"@validation-os/core": minor
"@validation-os/dashboard": minor
"@validation-os/adapter-firestore": minor
"@validation-os/api": minor
---

Lens-aware ladder revision (DEV-5879): adds the `Signed up` consumer do-rung, equalizes all do-rung W0s at 327 (was 140/317.3/410.7), and flattens every do-rung's anchors to 30/50/70. Talk stays 3/6/10 (W0 6.5); Desk stays 15 (W0 2). The lens determines which do-rungs apply (consumer: Signed up + Observed usage; commercial: Signed intent + Paying users); Talk + Desk work for any lens. Confidence accumulation is now honest per-rung: 2 desk sources → ~90% of cap; 20 paying users → 75% of cap; 10 talk readings → ~90% of cap.