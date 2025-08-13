import { supabase } from "../config/supabase";

export const getMessagesByProjectDB = async (projectId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const addMessageDB = async (
  projectId: string,
  role: string,
  content: string
) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      role,
      content,
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteMessageDB = async (messageId: string) => {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);
  if (error) {
    throw new Error(error.message);
  }
  return true;
};
