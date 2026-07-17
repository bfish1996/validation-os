#!/usr/bin/env python3
"""Repo consistency checks for validation-os.

Enforces the contracts the docs declare:
- ontology.yaml is the machine source; registry-schema.md and every
  connectors/*-schema.md guide must cover everything it lists
  (ontology.yaml header, connectors/SPEC.md).
- Every skills/*/SKILL.md must carry valid frontmatter.

Run: python3 scripts/validate.py   (needs PyYAML)
Exit code 0 = clean, 1 = violations (each printed as `path: message`).
"""

import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY = ROOT / "skills/_shared/ontology.yaml"
REGISTRY_SCHEMA = ROOT / "skills/_shared/registry-schema.md"

errors = []


def fail(path, msg):
    errors.append(f"{path.relative_to(ROOT)}: {msg}")


def load_yaml(path):
    try:
        return yaml.safe_load(path.read_text())
    except yaml.YAMLError as e:
        fail(path, f"invalid YAML: {e}")
        return None


def load_json(path):
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as e:
        fail(path, f"invalid JSON: {e}")
        return None


def frontmatter(path):
    """Parse the YAML frontmatter block of a Markdown file."""
    text = path.read_text()
    if not text.startswith("---\n"):
        fail(path, "missing YAML frontmatter")
        return None
    try:
        block = text[4:].split("\n---", 1)[0]
    except IndexError:
        fail(path, "unterminated frontmatter block")
        return None
    try:
        data = yaml.safe_load(block)
    except yaml.YAMLError as e:
        fail(path, f"invalid frontmatter YAML: {e}")
        return None
    if not isinstance(data, dict):
        fail(path, "frontmatter is not a mapping")
        return None
    return data


# ── 1. Parse the standalone config files ────────────────────────────────────
ontology = load_yaml(ONTOLOGY)
load_json(ROOT / "skills/self-review/references/evals.json")
load_yaml(ROOT / "validation-os.config.yaml")


# ── 2. Skill frontmatter ↔ skill dirs ───────────────────────────────────────
# The skills/ directory is the source of truth for which skills exist; each is
# published as an agent skill via skills.sh (`npx skills`).
skill_dirs = sorted(
    d.name for d in (ROOT / "skills").iterdir() if d.is_dir() and d.name != "_shared"
)

for name in skill_dirs:
    skill_md = ROOT / "skills" / name / "SKILL.md"
    if not skill_md.is_file():
        fail(skill_md, "missing SKILL.md")
        continue
    fm = frontmatter(skill_md)
    if fm is None:
        continue
    for key in ("name", "description", "license"):
        if not fm.get(key):
            fail(skill_md, f"frontmatter missing `{key}`")
    if fm.get("name") and fm["name"] != name:
        fail(skill_md, f"frontmatter name `{fm['name']}` != directory `{name}`")


# ── Ontology-derived expectations ────────────────────────────────────────────
def fixed_vocab_values(vocabularies):
    """Fixed enum values only — skip config-sourced and example-only lists."""
    values = {}
    for vocab, spec in vocabularies.items():
        if isinstance(spec, dict):
            continue  # source: config, or fixed: false example sets
        if isinstance(spec, list):
            vals = [v["value"] if isinstance(v, dict) else v for v in spec]
            values[vocab] = vals
    return values


if ontology is not None:
    entities = ontology.get("entities", {})
    relations = ontology.get("relations", [])
    vocab_values = fixed_vocab_values(ontology.get("vocabularies", {}))

    # ── 4a. Connector schema guides: structural coverage via frontmatter ────
    for guide in sorted((ROOT / "connectors").glob("*-schema.md")):
        fm = frontmatter(guide)
        if fm is None:
            continue
        registers = fm.get("registers")
        if not isinstance(registers, dict):
            fail(guide, "frontmatter missing `registers` mapping")
            continue
        for entity, spec in entities.items():
            if spec.get("composed_into"):
                continue  # composed sub-structure (e.g. bar_line), not a register
            reg = registers.get(entity)
            if reg is None:
                fail(guide, f"register `{entity}` not mapped")
                continue
            mapped = {p.get("canonical") for p in reg.get("properties", [])}
            for prop in spec.get("properties", []):
                if prop["name"] not in mapped:
                    fail(guide, f"`{entity}` property `{prop['name']}` not mapped")
        for rel in relations:
            reg = registers.get(rel["source"])
            if reg is None:
                continue  # already reported above
            mapped = {r.get("canonical") for r in reg.get("relations", [])}
            if rel["name"] not in mapped and rel.get("forward") not in mapped:
                fail(guide, f"relation `{rel['name']}` not mapped on `{rel['source']}`")

    # ── 4b/5. registry-schema.md prose: term + enum coverage ────────────────
    prose = REGISTRY_SCHEMA.read_text()
    for entity, spec in entities.items():
        for prop in spec.get("properties", []):
            if prop["name"] not in prose:
                fail(REGISTRY_SCHEMA, f"`{entity}` property `{prop['name']}` not mentioned")
    for rel in relations:
        if rel["name"] not in prose and rel.get("forward", "") not in prose:
            fail(REGISTRY_SCHEMA, f"relation `{rel['name']}` not mentioned")
    for vocab, vals in vocab_values.items():
        for val in vals:
            if val not in prose:
                fail(REGISTRY_SCHEMA, f"`{vocab}` value `{val}` not mentioned")


if errors:
    print(f"{len(errors)} violation(s):\n")
    print("\n".join(errors))
    sys.exit(1)
print("validate.py: all checks passed")
