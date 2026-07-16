import { useMemo, useState } from "react";
import type { Collection } from "@validation-os/core";
import { primaryLabel } from "./columns.js";
import { FIELD_CONTROL_CLASS } from "./field-styles.js";
import { linkChoicesFrom } from "./link-choices.js";
import { useList } from "./use-records.js";
import { useLink } from "./use-mutations.js";

export interface RelationEditorProps {
  /** The register of the open record initiating the link. */
  register: Collection;
  /** The open record's id (the `from` end). */
  recordId: string;
  basePath?: string;
  /** Called after a relation is wired, so the drawer can re-fetch. */
  onLinked: () => void;
}

/**
 * Wire a relation from the open record (spec user story 14). Pick an edge, then
 * a target record from the register that edge points at; linking sets both ends
 * server-side and recomputes derived fields. Registers with no outbound edges
 * (glossary, people) render nothing.
 */
export function RelationEditor({
  register,
  recordId,
  basePath,
  onLinked,
}: RelationEditorProps) {
  const choices = useMemo(() => linkChoicesFrom(register), [register]);
  const [relation, setRelation] = useState("");
  const [targetId, setTargetId] = useState("");
  const { link, linking, error } = useLink(basePath);

  const active = choices.find((c) => c.relation === relation) ?? null;
  const { records } = useList(
    (active?.targetRegister ?? register) as Collection,
    basePath,
  );
  // Never offer to link a record to itself (self-referential registers).
  const targets = (records ?? []).filter(
    (r) => !(active?.targetRegister === register && r.id === recordId),
  );

  if (choices.length === 0) return null;

  const onLink = async () => {
    if (!active || !targetId || linking) return;
    try {
      await link({
        relation: active.relation,
        from: { register, id: recordId },
        to: { register: active.targetRegister, id: targetId },
      });
      setTargetId("");
      setRelation("");
      onLinked();
    } catch {
      // `error` carries the message; leave the picks in place to retry.
    }
  };

  return (
    <section className="vos-relation">
      <h3 className="vos-sectitle">Link a record</h3>
      <div className="vos-field-stack">
        <select
          aria-label="Relation"
          value={relation}
          onChange={(e) => {
            setRelation(e.target.value);
            setTargetId("");
          }}
          className={FIELD_CONTROL_CLASS}
        >
          <option value="">Choose a relation…</option>
          {choices.map((c) => (
            <option key={c.relation} value={c.relation}>
              {c.label}
            </option>
          ))}
        </select>

        {active ? (
          <select
            aria-label="Target record"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={FIELD_CONTROL_CLASS}
          >
            <option value="">Choose a record…</option>
            {targets.map((r) => (
              <option key={r.id} value={r.id}>
                {primaryLabel(r)}
              </option>
            ))}
          </select>
        ) : null}

        {error ? <p className="vos-error">{error}</p> : null}

        <button
          type="button"
          onClick={onLink}
          disabled={!active || !targetId || linking}
          className="vos-btn vos-btn-sm"
          style={{ alignSelf: "flex-start" }}
        >
          {linking ? "Linking…" : "Link"}
        </button>
      </div>
    </section>
  );
}
