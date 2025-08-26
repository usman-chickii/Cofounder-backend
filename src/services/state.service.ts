import { supabase } from "../config/supabase";
import { ProjectMetadata } from "../types/stage";

export interface ProjectState {
  project_id: string;
  stage: string;
  metadata: ProjectMetadata;
  completed: boolean;
  updated_at?: string;
  pending_field?: string | null;
  pending_suggestion?: any | null;
}

export async function getProjectState(
  projectId: string
): Promise<ProjectState> {
  const { data, error } = await supabase
    .from("project_state")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const init: ProjectState = {
      project_id: projectId,
      stage: "idea_refinement",
      metadata: {},
      completed: false,
      pending_field: null,
      pending_suggestion: null,
    };
    await upsertProjectState(init);
    return init;
  }
  return data as ProjectState;
}
export async function upsertProjectState(
  state: ProjectState
): Promise<ProjectState> {
  // fetch existing state
  const { data: existing } = await supabase
    .from("project_state")
    .select("metadata")
    .eq("project_id", state.project_id)
    .single();

  // merge metadata if exists
  const mergedMetadata = existing?.metadata
    ? { ...existing.metadata, ...state.metadata }
    : state.metadata;

  const { data, error } = await supabase
    .from("project_state")
    .upsert(
      { ...state, metadata: mergedMetadata },
      { onConflict: "project_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProjectState;
}
