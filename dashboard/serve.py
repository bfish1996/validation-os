#!/usr/bin/env python3
"""Local dashboard for a validation-os registry.

Zero-dependency: parses the local-files registers (markdown, the source of
truth) into JSON on every request and serves a single-page UI.

    python3 dashboard/serve.py            # http://localhost:8787
    python3 dashboard/serve.py --port 9000 --dir path/to/registry
"""

import argparse
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent

REGISTERS = {
    "assumptions": "assumptions.md",
    "experiments": "experiments.md",
    "decisions": "decisions.md",
    "terminology": "terminology.md",
}

H2_RE = re.compile(r"^## ((?:ASM|EXP|DEC|TERM)-\d+):\s*(.*)$")
FIELD_RE = re.compile(r"^- \*\*(.+?)\*\*:\s*(.*)$")
H3_RE = re.compile(r"^### (.+)$")
COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def clean(text):
    return COMMENT_RE.sub("", text).strip()


def parse_register(path):
    """One markdown register -> list of records.

    A record is `## ID: Title`, then `- **Field**: value` bullets (wrapped
    lines indented by two spaces), then `### Section` blocks of free text.
    """
    records = []
    record = None
    field = None
    section = None

    for line in path.read_text().splitlines():
        h2 = H2_RE.match(line)
        if h2:
            record = {"id": h2.group(1), "title": h2.group(2).strip(),
                      "fields": {}, "sections": {}}
            records.append(record)
            field = section = None
            continue
        if record is None:
            continue

        h3 = H3_RE.match(line)
        if h3:
            section = h3.group(1).strip()
            record["sections"][section] = ""
            field = None
            continue

        if section is not None:
            record["sections"][section] += line + "\n"
            continue

        f = FIELD_RE.match(line)
        if f:
            field = f.group(1)
            record["fields"][field] = clean(f.group(2))
        elif field and line.startswith("  "):
            record["fields"][field] = clean(
                record["fields"][field] + " " + line.strip())

    for rec in records:
        rec["sections"] = {
            name: clean(body) for name, body in rec["sections"].items()
        }
    return records


def build_registry(registry_dir):
    out = {"registry_dir": str(registry_dir)}
    for key, filename in REGISTERS.items():
        path = registry_dir / filename
        out[key] = parse_register(path) if path.exists() else []
    return out


def registry_dir_from_config(root):
    """Naive read of validation-os.config.yaml — registry_dir only."""
    config = root / "validation-os.config.yaml"
    if config.exists():
        m = re.search(r"^\s*registry_dir:\s*(\S+)", config.read_text(), re.M)
        if m:
            return root / m.group(1)
    return root / "registry"


class Handler(BaseHTTPRequestHandler):
    registry_dir = None

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            body = (HERE / "index.html").read_bytes()
            self._send(200, "text/html; charset=utf-8", body)
        elif self.path == "/registry.json":
            body = json.dumps(build_registry(self.registry_dir),
                              indent=2).encode()
            self._send(200, "application/json; charset=utf-8", body)
        else:
            self._send(404, "text/plain; charset=utf-8", b"not found")

    def _send(self, status, ctype, body):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=8787)
    ap.add_argument("--dir", type=Path, default=None,
                    help="registry directory (default: from config, else ./registry)")
    args = ap.parse_args()

    registry_dir = args.dir or registry_dir_from_config(Path.cwd())
    if not registry_dir.is_dir():
        sys.exit(f"registry directory not found: {registry_dir}")

    Handler.registry_dir = registry_dir
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"validation-os dashboard: http://localhost:{args.port}"
          f"  (registry: {registry_dir})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
