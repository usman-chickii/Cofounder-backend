export interface Project {
  id: string; // Supabase UUID
  user_id: string; // FK to profiles table
  name: string;
  description: string;
  status: "in_progress" | "completed";
  created_at: string; // Supabase timestamp
}

export type ProjectCreateInput = Omit<Project, "id" | "created_at">;
