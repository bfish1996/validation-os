/**
 * A tiny, dependency-free Markdown renderer (OPS-1305) — enough to render a
 * reading's quote (`body`) and an experiment's narrative (`body`) as formatted
 * prose without pulling a runtime dependency into a package that ships with
 * near-zero deps (only `@validation-os/core`). react-markdown + remark would add
 * a sizeable tree for a feature this small, so we hand-roll the common subset:
 * headings, bold / italic / inline code, links, ordered & unordered lists,
 * blockquotes, fenced code blocks and paragraphs.
 *
 * It is safe by construction: the output is React elements, never
 * `dangerouslySetInnerHTML`, and link hrefs are restricted to http(s)/mailto and
 * in-app (#, /) targets — a `javascript:` or other scheme renders as plain text.
 * Anything it doesn't recognise falls through as text, so no input is ever lost.
 */
import type { ReactNode } from "react";

/** Render Markdown `text` into the package's prose styling. Empty → nothing. */
export function Markdown({ text }: { text: string }) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  return <div className="vos-md">{renderBlocks(trimmed)}</div>;
}

// ── Blocks ────────────────────────────────────────────────────────────────────

function renderBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Blank line — skip.
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Fenced code block: ``` … ```
    const fence = line.match(/^```/);
    if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i]!)) {
        body.push(lines[i]!);
        i += 1;
      }
      i += 1; // consume the closing fence (if present)
      out.push(
        <pre key={key++} className="vos-md-pre">
          <code>{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Heading: #… up to ######
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1]!.length;
      const Tag = `h${Math.min(level + 2, 6)}` as "h3" | "h4" | "h5" | "h6";
      out.push(<Tag key={key++}>{renderInline(heading[2]!)}</Tag>);
      i += 1;
      continue;
    }

    // Blockquote: consecutive `>` lines.
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!)) {
        quote.push(lines[i]!.replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(
        <blockquote key={key++} className="vos-md-quote">
          {renderBlocks(quote.join("\n"))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list: consecutive `- ` / `* ` / `+ ` lines.
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^[-*+]\s+/, ""));
        i += 1;
      }
      out.push(
        <ul key={key++} className="vos-md-ul">
          {items.map((it, n) => (
            <li key={n}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list: consecutive `1. ` lines.
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      out.push(
        <ol key={key++} className="vos-md-ol">
          {items.map((it, n) => (
            <li key={n}>{renderInline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-structural lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== "" &&
      !/^```|^#{1,6}\s|^>\s?|^[-*+]\s+|^\d+\.\s+/.test(lines[i]!)
    ) {
      para.push(lines[i]!);
      i += 1;
    }
    out.push(<p key={key++}>{renderInline(para.join(" "))}</p>);
  }

  return out;
}

// ── Inline ──────────────────────────────────────────────────────────────────

/** Only these href shapes are allowed to become links; everything else stays
 * plain text so a `javascript:`/`data:` scheme can never be clicked. */
function safeHref(href: string): string | null {
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  if (/^[#/]/.test(href)) return href; // in-app / anchor targets
  return null;
}

interface InlineRule {
  re: RegExp;
  render: (m: RegExpExecArray, key: number) => ReactNode;
  /** Whether the captured inner text is itself parsed for inline markup. */
  recurse: boolean;
  inner?: (m: RegExpExecArray) => string;
}

const INLINE_RULES: InlineRule[] = [
  // Inline code first — its contents are literal.
  {
    re: /`([^`]+)`/,
    render: (m, key) => (
      <code key={key} className="vos-md-code">
        {m[1]}
      </code>
    ),
    recurse: false,
  },
  // Links: [text](href)
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    render: (m, key) => {
      const href = safeHref(m[2]!);
      if (!href) return <span key={key}>{m[1]}</span>;
      return (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      );
    },
    recurse: false,
  },
  // Bold: **text** or __text__
  {
    re: /\*\*([^*]+)\*\*|__([^_]+)__/,
    render: (m, key) => <strong key={key}>{renderInline(m[1] ?? m[2] ?? "")}</strong>,
    recurse: true,
    inner: (m) => m[1] ?? m[2] ?? "",
  },
  // Italic: *text* or _text_
  {
    re: /\*([^*]+)\*|_([^_]+)_/,
    render: (m, key) => <em key={key}>{renderInline(m[1] ?? m[2] ?? "")}</em>,
    recurse: true,
    inner: (m) => m[1] ?? m[2] ?? "",
  },
];

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;

  while (rest.length > 0) {
    // Find the earliest-starting match across every rule.
    let best: { rule: InlineRule; m: RegExpExecArray } | null = null;
    for (const rule of INLINE_RULES) {
      const m = new RegExp(rule.re).exec(rest);
      if (m && (best === null || m.index < best.m.index)) {
        best = { rule, m };
      }
    }

    if (!best) {
      nodes.push(rest);
      break;
    }

    const { rule, m } = best;
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    nodes.push(rule.render(m, key++));
    rest = rest.slice(m.index + m[0].length);
  }

  return nodes;
}
