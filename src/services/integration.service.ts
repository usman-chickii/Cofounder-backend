import { supabase } from "../config/supabase";

export const getAvailableIntegrations = async () => {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
};

export const getUserIntegrations = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
};
