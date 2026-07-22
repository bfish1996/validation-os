/**
 * Assumption-type inference — the falsification-test rule (the confidence-scoring simplification).
 *
 * The assumption type is set by what would prove the assumption WRONG, not by
 * what evidence is cheap to gather. "Users will pay $50/mo" is falsified by
 * offering it and watching them not pay → TheyllPay, regardless of how many
 * interview quotes exist. The function is conservative: if the
 * falsification test is ambiguous, it returns `ProblemExists` (the most
 * permissive sub-ladder) and flags for human review. The migration script
 * runs this over all assumptions and produces a review queue for the ones it
 * isn't confident on.
 *
 * The grill enforces the gaming guard: the inferred type (from the
 * falsification bar) must match the stated type, or the assumption is rejected.
 * This is the rule that stops a team reframing "will users pay?" as "do users
 * express willingness to pay?" (existence question, qual ceiling) to avoid
 * running a market test.
 *
 * Rules (matched in order; first match wins) — retargeted from the legacy
 * Question Type inference to the 11 Assumption Types:
 *
 *   - Falsified by "the regulation prohibits / the regulator rules against
 *     / the compliance audit fails" → LegalCompliant
 *   - Falsified by "they don't pay / don't sign up / don't commit / fake-door
 *     rate below X%" → TheyllPay
 *   - Falsified by "they stop using it / drop-off exceeds X / sustained usage
 *     falls below / retention" → TheyKeepUsingIt
 *   - Falsified by "the treatment group doesn't differ from control / no
 *     causal effect / variant doesn't outperform" → ItWorks
 *   - Falsified by "the rate is below X% / fewer than N of N / the proportion
 *     is below / the share is below" → ProblemWidespread
 *   - Falsified by "they can't complete the flow / can't complete the task" →
 *     CanCompleteTask
 *   - Falsified by "the system can't do X / can't be built" → CanBuildIt
 *   - Falsified by "they don't want our solution / they don't react positively
 *     / they don't choose us" → WantOurSolution
 *   - Falsified by "the unit economics don't work / margin is below / cost to
 *     serve exceeds" → EconomicsWork
 *   - Falsified by "we can't reach them profitably / CAC exceeds LTV" →
 *     ReachProfitably
 *   - Falsified by "no one reports this pain / no one describes this
 *     mechanism / no one reports caring" → ProblemExists
 *   - Otherwise (ambiguous) → ProblemExists (flagged for human review)
 */
import { ASSUMPTION_TYPES, type AssumptionType } from "../types.js";

/**
 * The default assumption type for an ambiguous falsification test — the most
 * permissive sub-ladder. This is the single source of truth for the default
 * across the packages; every call site that falls back to a default
 * (recompute, derive-on-write, reading-input, the dashboard's confidence
 * explainers) imports this constant rather than re-typing `"ProblemExists"` so
 * the default can't silently diverge (). Living inference re-runs on
 * every touching write, so an un-grilled belief gets the permissive default
 * and self-corrects once a falsification bar exists.
 */
export const DEFAULT_ASSUMPTION_TYPE: AssumptionType = "ProblemExists";

/** Validate a stored Assumption Type against the enum. */
export function isValidAssumptionType(v: unknown): v is AssumptionType {
  return typeof v === "string" && (ASSUMPTION_TYPES as readonly string[]).includes(v);
}

interface Rule {
  readonly type: AssumptionType;
  readonly patterns: readonly RegExp[];
}

// Lowercase match; word-boundary-tolerant. Patterns are intentionally specific
// so a TheyllPay bar ("they don't pay") isn't misread as ProblemExists ("no one
// reports they pay"). Order matters — see the module doc.
const RULES: readonly Rule[] = [
  {
    type: "LegalCompliant",
    patterns: [
      /\bregulat(?:or|ion)\s+(?:prohibits|rul(?:es|ed)\s+against)\b/,
      /\bregulator\b.*\bagainst\b/,
      /\bcompliance\s+audit\s+fails?\b/,
      /\bprohibits?\b.*\bscoring\b/,
      // Positive bar patterns (the register's rightIf text):
      /\bregulat(?:or|ion)s?\s+(?:approve|accept|confirm|permit)\b/,
      /\bfca\b.*\bconfirm\b/,
      /\blegal\s+opinion\b.*\bstate/i,
      /\bnon[-\s]?compliant\b.*\boutputs?\b/,
      /\bconduct\s+layer\b.*\b(?:safe|within|comply)\b/,
      /\bconsumer\s+duty\b/,
      /\bguardrails?\b.*\b(?:regulat|comply|within)\b/,
      /\beducation\b.*\bguidance\b.*\bwithin\b/,
    ],
  },
  {
    type: "TheyllPay",
    patterns: [
      /\b(?:don't|do not|won't|will not)\s+pay\b/,
      /\bfake[-\s]?door\s+(?:signup\s+)?rate\s+below\b/,
      /\bfake[-\s]?door\b.*\brate\b/,
      /\bdon't\s+sign\s+up\b/,
      /\bno\s+(?:buyer|user)s?\s+(?:sign|pay|commit)\b/,
      /\bsigns?\s+(?:an\s+)?loi\b/,
      /\bput(?:s|ting)?\s+down\s+(?:a\s+)?deposit\b/,
      /\bdon't\s+commit\b/,
      /\boffered\s+users?\s+pay\b/,
      /\bpay(?:ing)?\s+(?:rate|share)?\s*(?:is\s+)?below\b/,
      /\bfewer\s+than\s+\d+\s+of\s+\d+\s+offered\s+users?\s+pay\b/,
      // Positive bar patterns:
      /\bsign\s+(?:a\s+)?(?:design[-\s]?partner|pilot)\s+agreement\b/,
      /\bsigned\s+intent\b/i,
      /\bcommit(?:s|ting)?\s+(?:before|to\s+pay|to\s+a)\b/,
      /\badopt\s*(?:and\s*)?pay\b/,
      /\bpay\s+for\b.*\b(?:layer|harness|governed)\b/,
      /\bagree\s+(?:in\s+writing|to\s+ingest|to\s+sign)\b/,
      /\b(?:design|pilot)\s+partner\b.*\bagreement\b/,
    ],
  },
  {
    type: "TheyKeepUsingIt",
    patterns: [
      /\bstop\s+using\s+(?:it|the)\b/,
      /\bdrop[-\s]?off\s+exceeds\b/,
      /\bsustained\s+usage\s+falls?\s+below\b/,
      /\bretention\s+(?:drops?|falls?)\s+below\b/,
      /\bweek-\d+\s+retention\s+drops?\s+below\b/,
      /\bdisuse\b/,
      // Positive bar patterns:
      /\bengage\s+(?:turn[-\s]by[-\s]turn|with|positively)\b/i,
      /\bengage(?:s|ment)?\s+with\b/i,
      /\breact\s+positively\b/i,
      /\bcomfortable\s+with\b.*\b(?:bank|storing|context)\b/i,
      /\bchoose\s+(?:voice|as\s+their\s+primary)\b/i,
      /\bsustained\s+(?:retention|usage|engagement)\b/i,
      /\bcome\s+back\b.*\bsession/i,
      /\bprefer\b.*\b(?:modality|interface|experience)\b/i,
    ],
  },
  {
    type: "ItWorks",
    patterns: [
      /\btreatment\s+group(?:'s)?\s+doesn'?t\s+differ\s+from\s+control\b/,
      /\bno\s+causal\s+effect\s+of\b/,
      /\bvariant\s+doesn'?t\s+outperform\s+control\b/,
      /\bdiffer\s+from\s+control\b/,
      /\boutperform\s+control\b/,
      /\btreatment\s+vs\.?\s+control\b/,
      // Positive bar patterns:
      /\bbeats?\s+(?:a\s+)?\w+[-\s]only\s+(?:model|baseline|control)\b/i,
      /\brelative\s+lift\b/i,
      /\breplicated\s+in\b.*\bcohort/i,
      /\bwins?\s+≥?\s*\d+\s*[×x]\b/i,
      /\bframing\s+wins\b/i,
      // Efficacy-specific: "it works" / "produces the outcome"
      /\bdoesn'?t\s+(?:work|produce\s+the\s+(?:promised\s+)?outcome)\b/i,
      /\bno\s+efficacy\b/i,
    ],
  },
  {
    type: "ProblemWidespread",
    patterns: [
      /\brate\s+is\s+below\b/,
      /\bfewer\s+than\s+\d+\s+of\s+\d+\s+(?:interviewed|surveyed|of)\b/,
      /\bfewer\s+than\s+\d+%\s+of\s+\w+\s+hit\b/,
      /\bthe\s+(?:rate|share|proportion)\s+is\s+below\b/,
      /\b(?:in\s+)?surveyed\s+teams\b/,
      /\bshare\s+(?:of\s+\w+\s+)?(?:is\s+)?below\b/,
      /\bproportion\s+is\s+below\b/,
      // Positive bar patterns:
      /\b[≥>]\s*\d+%\s+of\b/i,
      /\b[≥>]\s*\d+\s+of\b/i,
      /\bnamed\b.*\b(?:as|in)\s+a\s+top[-\s]\d\b/i,
      /\b[≥>]\s*\d+\s+(?:of\s+\d+\s+)?(?:institutions?|consumers?|users?|buyers?|banks?|teams?)\b/i,
    ],
  },
  {
    type: "CanCompleteTask",
    patterns: [
      /\bcan'?t\s+complete\s+the\s+(?:flow|task|setup|wizard)\b/,
      /\bcan'?t\s+\w+\s+(?:unaided|without\s+(?:help|regressions))\b/,
      // Positive bar patterns:
      /\bcomplete\s+the\s+(?:flow|setup|wizard)\b.*\b(?:unaided|without\s+help)\b/i,
    ],
  },
  {
    type: "CanBuildIt",
    patterns: [
      /\bsystem\s+can'?t\s+(?:do|ingest|handle|build)\b/,
      /\bcan'?t\s+be\s+built\b/,
      /\bcan'?t\s+ingest\b/,
      /\bprototype\s+can'?t\s+be\s+built\b/,
      // Positive bar patterns:
      /\bingest\b.*\b(?:rows?|records?)\b.*\b(?:under|in)\s+\d+/i,
      /\b(?:can|able\s+to)\s+(?:build|ship|deliver)\b.*\b(?:without|no)\s+(?:regress|break)/i,
    ],
  },
  {
    type: "WantOurSolution",
    patterns: [
      /\bdon'?t\s+want\s+(?:our\s+)?(?:solution|product|this)\b/i,
      /\bdoesn'?t\s+solve\b/i,
      /\b(?:don'?t|won'?t)\s+(?:choose|adopt)\s+us\b/i,
      // Positive bar patterns:
      /\bwant\s+(?:our\s+)?(?:solution|product|this)\b/i,
      /\bsolve(?:s)?\s+(?:our\s+)?(?:problem|pain|need)\b/i,
    ],
  },
  {
    type: "EconomicsWork",
    patterns: [
      /\bunit\s+economics\s+don'?t\s+work\b/i,
      /\bmargin\s+(?:is\s+)?below\b/i,
      /\bcost\s+to\s+serve\s+exceeds\b/i,
      /\b(?:no|negative)\s+margin\b/i,
      // Positive bar patterns:
      /\bmargin\s+(?:is\s+)?(?:above|≥|at\s+least)\b/i,
      /\bunit\s+economics\s+work\b/i,
    ],
  },
  {
    type: "ReachProfitably",
    patterns: [
      /\bcac\s+exceeds\s+ltv\b/i,
      /\bcan'?t\s+reach\s+(?:them\s+)?profitably\b/i,
      /\bacquisition\s+cost\s+exceeds\b/i,
      // Positive bar patterns:
      /\bcac\s*<\s*ltv\b/i,
      /\breach(?:ing)?\s+profitably\b/i,
    ],
  },
  {
    type: "ProblemExists",
    patterns: [
      /\bno\s+one\s+(?:we\s+interview\s+)?(?:describes|reports|mentions)\b/,
      /\bno\s+interviewee(?:s)?\s+(?:describe|report|mention)s?\b/,
      /\bcan'?t\s+describe\s+the\s+mechanism\b/,
      /\bno\s+one\s+reports\s+caring\b/,
      /\bno\s+one\s+describes\b/,
      // Positive bar patterns:
      /\bindependently\s+states?\b.*\b(?:needs?|wants?|values?|sees)\b/i,
      /\bindependently\s+(?:report|state|confirm)s?\b/i,
      /\bsay\s+they'?d\s+(?:be\s+)?(?:comfortable|prefer)\b/i,
      /\b(?:credible|independent)\b.*\b(?:states?|reports?|confirms?)\b/i,
    ],
  },
];

/** Normalize a string for matching: lowercase, collapse whitespace. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Infer the Assumption Type from an assumption's description and falsification
 * bar. The falsification bar (`wrongIfBar`) carries the signal — the
 * description is only consulted as a fallback context. Returns the most
 * permissive type (`ProblemExists`) for an ambiguous bar; the migration's
 * review queue is the backstop.
 */
export function inferAssumptionType(
  description: string,
  wrongIfBar: string,
): AssumptionType {
  const bar = normalize(wrongIfBar ?? "");
  const desc = normalize(description ?? "");
  const hay = bar.length > 0 ? `${bar} ${desc}` : desc;

  for (const rule of RULES) {
    for (const re of rule.patterns) {
      if (re.test(hay)) return rule.type;
    }
  }
  return DEFAULT_ASSUMPTION_TYPE;
}

/** The set of assumption types the inference rule can return. Exported for
 * the migration's "covered types" assertion. */
export const INFERABLE_ASSUMPTION_TYPES: readonly AssumptionType[] = [
  "ProblemExists",
  "ProblemWidespread",
  "WantOurSolution",
  "ItWorks",
  "CanCompleteTask",
  "CanBuildIt",
  "LegalCompliant",
  "TheyllPay",
  "TheyKeepUsingIt",
  "ReachProfitably",
  "EconomicsWork",
] as const;

/** Whether an inferred assumption type should be flagged for human review.
 * Conservative: only the confident matches are clean; the default
 * (ProblemExists-from-ambiguous) is always flagged. A match is "confident" if
 * the bar matched a rule other than the ProblemExists fallback. */
export function needsReview(
  description: string,
  wrongIfBar: string,
  inferred: AssumptionType,
): boolean {
  if (wrongIfBar == null || wrongIfBar.trim() === "") return true;
  // Re-run the inference; if the bar was empty/ambiguous (no rule matched the
  // bar text), the inferred type is the fallback and should be reviewed.
  const bar = normalize(wrongIfBar);
  for (const rule of RULES) {
    if (rule.type === inferred) {
      for (const re of rule.patterns) {
        if (re.test(bar)) return false;
      }
    }
  }
  return true;
}