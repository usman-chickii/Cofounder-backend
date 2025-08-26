export type StageId =
  | "idea_refinement"
  | "market_analysis"
  | "competitive_analysis"
  | "brd_ready";

export interface IdeaRefinement {
  idea?: string;
  problem_statement?: string;
  target_audience?: string;
  unique_value_proposition?: string;
  success_metrics?: string;
}

export interface MarketAnalysis {
  market_size?: string;
  trends?: string;
  customer_segments?: string;
  pricing_strategy?: string;
}

export interface CompetitiveAnalysis {
  competitors?: string[]; // names
  competitor_matrix?: string; // short comparison summary or table text
  differentiation?: string;
  barriers_to_entry?: string;
}

export interface ProjectMetadata {
  idea_refinement?: IdeaRefinement;
  market_analysis?: MarketAnalysis;
  competitive_analysis?: CompetitiveAnalysis;
}
