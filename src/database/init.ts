import { supabase } from "../config/supabase";

export const checkDatabaseConnection = async () => {
  const { data, error } = await supabase.from("projects").select("id").limit(1);
  if (error) {
    throw new Error("Database connection failed");
  }
  console.log("Database connection successful");
};
