/**
 * The single record-body view-model — one pure function behind the one
 * `RecordView`. Given a record id and the loaded registers, it RESOLVES which
 * register owns the id and returns the matching body as a discriminated union.
 *
 * This resolution is the structural fix for the old link bug: a link carries
 * only an id, never a register, so nothing can route it to the wrong detail
 * type — the body is chosen by where the id actually lives. Beliefs reuse
 * `buildBeliefBody`, experiments reuse `buildExperimentBody` (the same
 * view-models the workspace renders), so a record reads identically wherever
 * it's opened. Readings and decisions/glossary get their own small builders
 * here. Pure and unit-tested; the component is a dumb renderer.
 */
import type { AnyRecord, BarLine, Collection } from "@validation-os/core";
import { readingBeliefs, str } from "./derived-views.js";
import {
  buildBeliefBody,
  buildExperimentBody,
  type BeliefBody,
  type ExperimentBody,
  type WorkspaceRecords,
} from "./assumptions-workspace.js";

/** The registers the record body can resolve against — the workspace set plus
 * glossary (decisions and glossary share the generic body). */
export interface RecordSet extends WorkspaceRecords {
  glossary: AnyRecord[];
}

/** One belief's verdict on a reading — the per-belief card in the reading body. */
export interface ReadingBeliefVerdict {
  assumptionId: string;
  assumptionTitle: string;
  result: string;
  rung: string;
  /** The per-belief quote (its own `excerpt`, else a snippet of the context). */
  excerpt: string | null;
  justification: string;
  /** The pre-registered bar line, when the reading came from an experiment. */
  bar: { rightIf: string; wrongIf: string | null; barVerdict: string | null } | null;
}

/** The reading body — shared Context plus one verdict card per belief. */
export interface ReadingBody {
  id: string;
  title: string;
  source: string;
  context: string;
  rung: string;
  /** The experiment this reading came from, or null for found evidence. */
  fromExperiment: { id: string; title: string; confidence: number } | null;
  beliefs: ReadingBeliefVerdict[];
}

/** The lean generic body for decisions and glossary — title, status, markdown
 * body, and a few human-authored fields. */
export interface GenericBody {
  id: string;
  register: Collection;
  title: string;
  status: string | null;
  body: string | null;
  fields: { label: string; value: string }[];
}

/** The resolved body for a record id — tagged by which register owns it. */
export type ResolvedBody =
  | { kind: "belief"; register: "assumptions"; body: BeliefBody }
  | { kind: "experiment"; register: "experiments"; body: ExperimentBody }
  | { kind: "reading"; register: "readings"; body: ReadingBody }
  | { kind: "generic"; register: Collection; body: GenericBody }
  | { kind: "not-found"; id: string };

/** Which register owns this id, scanning in display order. First match wins. */
function registerOf(id: string, records: RecordSet): Collection | null {
  if (records.assumptions.some((r) => String(r.id) === id)) return "assumptions";
  if (records.experiments.some((r) => String(r.id) === id)) return "experiments";
  if (records.readings.some((r) => String(r.id) === id)) return "readings";
  if (records.decisions.some((r) => String(r.id) === id)) return "decisions";
  if (records.glossary.some((r) => String(r.id) === id)) return "glossary";
  return null;
}

/**
 * Build the body for a record id. Resolves the owning register from the id,
 * then delegates to the register's body builder. Returns `not-found` when no
 * register holds the id (a stale link).
 */
export function buildRecordBody(id: string, records: RecordSet): ResolvedBody {
  const register = registerOf(id, records);
  if (register === "assumptions") {
    const body = buildBeliefBody(id, records);
    return body
      ? { kind: "belief", register, body }
      : { kind: "not-found", id };
  }
  if (register === "experiments") {
    const body = buildExperimentBody(id, records);
    return body
      ? { kind: "experiment", register, body }
      : { kind: "not-found", id };
  }
  if (register === "readings") {
    return { kind: "reading", register, body: buildReadingBody(id, records) };
  }
  if (register === "decisions" || register === "glossary") {
    return { kind: "generic", register, body: buildGenericBody(id, register, records) };
  }
  return { kind: "not-found", id };
}

// ── Reading body ─────────────────────────────────────────────────────────────

/** Build the reading body — Context plus one verdict card per belief scored. */
export function buildReadingBody(readingId: string, records: RecordSet): ReadingBody {
  const reading =
    records.readings.find((r) => String(r.id) === readingId) ?? ({ id: readingId } as AnyRecord);
  const context = str(reading.body) ?? "";
  const rung = str(reading.Rung) ?? "";
  const expId = str(reading.experimentId);
  const experiment = expId
    ? records.experiments.find((e) => String(e.id) === expId) ?? null
    : null;

  const beliefs: ReadingBeliefVerdict[] = readingBeliefs(reading).map((b) => {
    const assumption = records.assumptions.find((a) => String(a.id) === b.assumptionId);
    const bar =
      experiment && Array.isArray(experiment.barLines)
        ? ((experiment.barLines as BarLine[]).find((x) => x.assumptionId === b.assumptionId) ?? null)
        : null;
    const excerptField = typeof b.excerpt === "string" && b.excerpt !== "" ? b.excerpt : null;
    return {
      assumptionId: b.assumptionId,
      assumptionTitle: str(assumption?.Title) ?? b.assumptionId,
      result: str(b.Result) ?? "Inconclusive",
      rung,
      excerpt: excerptField ?? (context ? snippetFor(context, b.assumptionId) : null),
      justification: str(b["Grading justification"]) ?? "",
      bar: bar
        ? {
            rightIf: str(bar.rightIf) ?? "",
            wrongIf: str(bar.wrongIf) ?? null,
            barVerdict: bar.barVerdict ?? null,
          }
        : null,
    };
  });

  return {
    id: readingId,
    title: str(reading.Title) ?? readingId,
    source: str(reading.Source) ?? "",
    context,
    rung,
    fromExperiment: experiment
      ? {
          id: String(experiment.id),
          title: str(experiment.Title) ?? String(experiment.id),
          confidence: Math.round(
            ((experiment.derived as { experimentConfidence?: number } | undefined)
              ?.experimentConfidence ?? 50),
          ),
        }
      : null,
    beliefs,
  };
}

/** Pull a representative quote from a reading's body — the `## Quote` section
 * if present, else the first sentence mentioning the belief, else the opener. */
function snippetFor(body: string, cue: string): string {
  const quote = body.match(/## Quote\n+([\s\S]*?)(?=\n## |\n##$|$)/i);
  if (quote) return clamp(quote[1]!.trim());
  const sentences = body.split(/(?<=[.!?])\s+/);
  const hit = sentences.find((s) => s.toLowerCase().includes(cue.toLowerCase()));
  return clamp((hit ?? sentences[0] ?? "").trim());
}

function clamp(s: string): string {
  return s.length > 220 ? s.slice(0, 217).trim() + "…" : s;
}

// ── Generic body (decisions + glossary) ──────────────────────────────────────

/** The human-authored fields surfaced on the generic body, per register. */
const GENERIC_FIELDS: Partial<Record<Collection, string[]>> = {
  decisions: ["Statement", "Unanimity justification"],
  glossary: ["Definition", "Aliases"],
};

/** Build the lean generic body for a decision or glossary record. */
export function buildGenericBody(
  id: string,
  register: Collection,
  records: RecordSet,
): GenericBody {
  const source = register === "decisions" ? records.decisions : records.glossary;
  const rec = source.find((r) => String(r.id) === id) ?? ({ id } as AnyRecord);
  const fields = (GENERIC_FIELDS[register] ?? [])
    .map((label) => ({ label, value: str(rec[label]) ?? "" }))
    .filter((f) => f.value !== "");
  return {
    id,
    register,
    title: str(rec.Title) ?? id,
    status: str(rec.Status),
    body: str(rec.body) ?? null,
    fields,
  };
}
