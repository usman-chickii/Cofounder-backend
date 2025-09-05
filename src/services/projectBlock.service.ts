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
    .upsert(
      { project_id: projectId, ...block },
      { onConflict: "project_id,type" }
    )
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

export async function getBrd(projectId: string) {
  console.log("get brd");
  const { data, error } = await supabase
    .from("project_blocks")
    .select("id, type")
    .eq("project_id", projectId)
    .eq("type", "brd");

  console.log("blocks for project", projectId, data);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
