import { supabase } from "../config/supabase";

export interface ProjectBlock {
  project_id: string;
  type: string;
  title: string;
  summary: string;
  status: string;
  content: string;
}

export async function createProjectBlock(
  projectId: string,
  block: ProjectBlock
) {
  const { data, error } = await supabase
    .from("project_blocks")
    .insert({ project_id: projectId, ...block })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectBlocksDB(projectId: string) {
  const { data, error } = await supabase
    .from("project_blocks")
    .select("*")
    .order("created_at", { ascending: true })
    .eq("project_id", projectId);

  if (error) throw error;
  return data;
}

export async function getProjectBlockByIdDB(blockId: string) {
  const { data, error } = await supabase
    .from("project_blocks")
    .select("*")
    .eq("id", blockId)
    .single();

  if (error) throw error;
  return data;
}
