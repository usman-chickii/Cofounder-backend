import { supabase } from "../config/supabase";
import { Project, ProjectCreateInput } from "../types/project";

// Get all projects for a user
export async function getAllProjectsDB(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function getAllProjectsDBWithLimit(
  userId: string,
  limit: number
): Promise<Project[]> {
  console.log("userId from getAllProjectsDBWithLimit is:", userId);
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get project by ID
export async function getProjectByIdDB(
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.log(error);
    // PGRST116 = No rows found
    throw error;
  }
  return data ?? null;
}

// Create a new project
export async function createProjectDB(
  project: ProjectCreateInput
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a project
export async function deleteProjectDB(projectId: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
}
