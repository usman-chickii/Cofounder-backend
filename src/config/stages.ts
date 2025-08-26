import { StageId, ProjectMetadata } from "../types/stage";

type FieldPath =
  | keyof NonNullable<ProjectMetadata["idea_refinement"]>
  | keyof NonNullable<ProjectMetadata["market_analysis"]>
  | keyof NonNullable<ProjectMetadata["competitive_analysis"]>;

export interface StageDefinition {
  id: StageId;
  requiredPaths: string[]; // e.g. ["idea_refinement.idea", "idea_refinement.problem_statement"]
  questionTemplate: (missing: string[], meta: ProjectMetadata) => string;
  next?: StageId;
}

export const STAGES: Record<StageId, StageDefinition> = {
  idea_refinement: {
    id: "idea_refinement",
    requiredPaths: [
      "idea_refinement.idea",
      "idea_refinement.problem_statement",
      "idea_refinement.target_audience",
      "idea_refinement.unique_value_proposition",
      "idea_refinement.success_metrics",
    ],
    questionTemplate: (missing, meta) =>
      `We’re in Idea Refinement. I still need: ${missing.join(", ")}.
Let's focus on the most critical one first. ${
        missing.includes("idea_refinement.problem_statement")
          ? "What specific user or business problem does this idea solve? Please be concrete."
          : "Provide details for one of the missing fields above to proceed."
      }`,
    next: "market_analysis",
  },
  market_analysis: {
    id: "market_analysis",
    requiredPaths: [
      "market_analysis.market_size",
      "market_analysis.trends",
      "market_analysis.customer_segments",
      "market_analysis.pricing_strategy",
    ],
    questionTemplate: (missing) =>
      `Market Analysis: missing ${missing.join(
        ", "
      )}. What's your input for the first one?`,
    next: "competitive_analysis",
  },
  competitive_analysis: {
    id: "competitive_analysis",
    requiredPaths: [
      "competitive_analysis.competitors",
      "competitive_analysis.competitor_matrix",
      "competitive_analysis.differentiation",
      "competitive_analysis.barriers_to_entry",
    ],
    questionTemplate: (missing) =>
      `Competitive Analysis: I still need ${missing.join(
        ", "
      )}. Let's fill them one by one.`,
    next: "brd_ready",
  },
  brd_ready: {
    id: "brd_ready",
    requiredPaths: [],
    questionTemplate: () =>
      "All sections are complete. I can generate your BRD now. Proceed?",
  },
};
