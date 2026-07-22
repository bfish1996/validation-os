import { describe, expect, it } from "vitest";
import { inferQuestionType } from "./question-type.js";

/**
 * Seam 2 — Question-type inference (the question-type-aware evidence ladder).
 *
 * `inferQuestionType(description, wrongIfBar) → QuestionType` is the pure
 * function the migration and the grill both call. The question type is set by
 * the falsification-test rule: what would prove the assumption WRONG, not what
 * evidence is cheap. Each fixture below is a realistic (description,
 * wrong-if-bar, expected) triple drawn from assumption-grill language. The
 * ambiguous case defaults to `Existence` (the most permissive) and is flagged
 * for human review.
 */
describe("inferQuestionType — falsification-test rule", () => {
  describe("Existence — falsified by reports of the pain/mechanism", () => {
    it("classifies a pain-existence claim from a 'no one reports this pain' bar", () => {
      expect(
        inferQuestionType(
          "Adopters have the pain of hand-rolling validation dashboards",
          "We're wrong if no one we interview describes this pain unprompted",
        ),
      ).toBe("Existence");
    });

    it("classifies a mechanism claim from a 'no mechanism' bar", () => {
      expect(
        inferQuestionType(
          "Users follow the weekly ritual because it surfaces blockers early",
          "We're wrong if interviewees can't describe the mechanism by which it surfaces blockers",
        ),
      ).toBe("Existence");
    });

    it("classifies a 'do people report this' claim", () => {
      expect(
        inferQuestionType(
          "Users care about the distinction between validated and unvalidated beliefs",
          "We're wrong if no interviewee reports caring about the distinction",
        ),
      ).toBe("Existence");
    });
  });

  describe("Prevalence — falsified by a rate below a threshold", () => {
    it("classifies a 'rate is below X%' bar", () => {
      expect(
        inferQuestionType(
          "Most adopters hit the validation dashboard within their first week",
          "We're wrong if fewer than 40% of adopters hit it in week 1",
        ),
      ).toBe("Prevalence");
    });

    it("classifies a 'fewer than N of N' bar", () => {
      expect(
        inferQuestionType(
          "A majority of users run the audit monthly",
          "We're wrong if fewer than 5 of 12 interviewed users run it monthly",
        ),
      ).toBe("Prevalence");
    });

    it("classifies a 'the proportion is below' bar", () => {
      expect(
        inferQuestionType(
          "The share of teams adopting the evidence ladder is growing",
          "We're wrong if the share is below 20% in surveyed teams",
        ),
      ).toBe("Prevalence");
    });
  });

  describe("CausalEffect — falsified by no treatment/control difference", () => {
    it("classifies a 'treatment group doesn't differ from control' bar", () => {
      expect(
        inferQuestionType(
          "Showing the Confidence donut increases the rate of closing weak beliefs",
          "We're wrong if the treatment group's close-rate doesn't differ from control",
        ),
      ).toBe("CausalEffect");
    });

    it("classifies an A/B-test framing", () => {
      expect(
        inferQuestionType(
          "The redesigned dashboard increases time-on-page",
          "We're wrong if the variant doesn't outperform control on time-on-page",
        ),
      ).toBe("CausalEffect");
    });

    it("classifies a 'no causal effect' bar", () => {
      expect(
        inferQuestionType(
          "Sending weekly digests causes higher retention",
          "We're wrong if there's no causal effect of digests on 30-day retention",
        ),
      ).toBe("CausalEffect");
    });
  });

  describe("WillingnessToPay — falsified by not paying/committing", () => {
    it("classifies a 'they don't pay' bar", () => {
      expect(
        inferQuestionType(
          "Adopters will pay $50/month for the dashboard",
          "We're wrong if fewer than 10 of 200 offered users pay",
        ),
      ).toBe("WillingnessToPay");
    });

    it("classifies a 'they don't sign up' bar (fake-door)", () => {
      expect(
        inferQuestionType(
          "Prospects will sign up for a paid plan when offered",
          "We're wrong if the fake-door signup rate is below 5%",
        ),
      ).toBe("WillingnessToPay");
    });

    it("classifies a 'they don't commit' bar (LOI/deposit)", () => {
      expect(
        inferQuestionType(
          "Commercial buyers will commit to a pilot",
          "We're wrong if no buyer signs an LOI or puts down a deposit",
        ),
      ).toBe("WillingnessToPay");
    });
  });

  describe("ValueUtility — falsified by drop-off / disuse", () => {
    it("classifies a 'they stop using it' bar", () => {
      expect(
        inferQuestionType(
          "Users derive value from the evidence composition view",
          "We're wrong if week-4 retention drops below 30%",
        ),
      ).toBe("ValueUtility");
    });

    it("classifies a 'drop-off exceeds X' bar", () => {
      expect(
        inferQuestionType(
          "The weekly ritual is useful to teams that adopt it",
          "We're wrong if drop-off exceeds 50% by month 2",
        ),
      ).toBe("ValueUtility");
    });

    it("classifies a 'sustained usage' bar", () => {
      expect(
        inferQuestionType(
          "Teams that adopt the ritual keep using it",
          "We're wrong if sustained usage falls below the retention threshold",
        ),
      ).toBe("ValueUtility");
    });
  });

  describe("Regulatory — falsified by a regulator ruling against", () => {
    it("classifies a 'regulation prohibits' bar", () => {
      expect(
        inferQuestionType(
          "The conduct layer complies with EU AI Act requirements",
          "We're wrong if the regulation prohibits this kind of automated scoring",
        ),
      ).toBe("Regulatory");
    });

    it("classifies a 'regulator rules against' bar", () => {
      expect(
        inferQuestionType(
          "Our data-handling passes GDPR scrutiny",
          "We're wrong if the regulator rules against this data flow",
        ),
      ).toBe("Regulatory");
    });

    it("classifies a 'compliance check fails' bar", () => {
      expect(
        inferQuestionType(
          "Our SOC 2 posture is sufficient for enterprise buyers",
          "We're wrong if the compliance audit fails on this control",
        ),
      ).toBe("Regulatory");
    });
  });

  describe("Feasibility — falsified by can't complete / can't do", () => {
    it("classifies a 'they can't complete the flow' bar", () => {
      expect(
        inferQuestionType(
          "First-time users can complete the setup wizard without help",
          "We're wrong if users can't complete the flow unaided",
        ),
      ).toBe("Feasibility");
    });

    it("classifies a 'the system can't do X' bar", () => {
      expect(
        inferQuestionType(
          "Our connector framework can ingest 10k readings in under a minute",
          "We're wrong if the system can't ingest 10k rows in under 60s",
        ),
      ).toBe("Feasibility");
    });

    it("classifies a 'can't build' bar — the build-claim guard", () => {
      expect(
        inferQuestionType(
          "We can ship the redesign without breaking existing dashboards",
          "We're wrong if the prototype can't be built without regressions",
        ),
      ).toBe("Feasibility");
    });
  });

  describe("ambiguous — defaults to Existence and flags for review", () => {
    it("returns Existence for a vague bar", () => {
      expect(
        inferQuestionType("Something about the market", "We're wrong if it doesn't work"),
      ).toBe("Existence");
    });

    it("returns Existence for an empty bar", () => {
      expect(inferQuestionType("A claim", "")).toBe("Existence");
    });

    it("returns Existence when the bar doesn't match any rule", () => {
      expect(
        inferQuestionType(
          "A novel claim",
          "We're wrong if the weather is bad on launch day",
        ),
      ).toBe("Existence");
    });
  });
});