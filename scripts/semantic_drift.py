#!/usr/bin/env python3
"""Advisory semantic-drift review via Ollama Cloud.

Given prose schema docs that changed in a PR, asks a model whether any of
them semantically disagree with skills/_shared/ontology.yaml — the drift the
mechanical term-coverage check in validate.py cannot see. Output is Markdown
for $GITHUB_STEP_SUMMARY. Never authoritative: the CI job is advisory.

Usage: OLLAMA_API_KEY=... python3 scripts/semantic_drift.py <changed-file>...
"""

import json
import os
import sys
import urllib.request

ONTOLOGY = "skills/_shared/ontology.yaml"

files = [f for f in sys.argv[1:] if f != ONTOLOGY]
model = os.environ.get("OLLAMA_MODEL", "gpt-oss:120b")

ontology = open(ONTOLOGY).read()
changed = "\n\n".join(f"===== {f} =====\n{open(f).read()}" for f in files)

prompt = f"""In this repo, `{ONTOLOGY}` is the machine-readable source of
truth for a registry schema; prose docs must never disagree with it.
Mechanical term coverage (every entity/property/relation/enum named) is
already checked elsewhere — do NOT report missing mentions.

Report only SEMANTIC disagreements between the ontology and the changed
prose files below: different behavior, cardinality, required-ness, status
transitions, derivation formulas, side effects, or option meanings.

For each finding: the file, a short quote, and one sentence on what
disagrees with the ontology. If there are none, reply exactly:
"No semantic drift found."

===== {ONTOLOGY} (source of truth) =====
{ontology}

{changed or "(only the ontology itself changed — check it against nothing; reply 'No semantic drift found.')"}
"""

req = urllib.request.Request(
    "https://ollama.com/api/chat",
    data=json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        }
    ).encode(),
    headers={
        "Authorization": f"Bearer {os.environ['OLLAMA_API_KEY']}",
        "Content-Type": "application/json",
    },
)

with urllib.request.urlopen(req, timeout=600) as resp:
    body = json.load(resp)

print(f"## Semantic drift review (advisory, {model})\n")
print(body["message"]["content"])
