import { supabase } from "../config/supabase";

export const authService = {
  async signup(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
      },
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (loginError) {
      throw new Error(loginError.message);
    }

    return loginData;
  },
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("loginData", data);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  async getUserFromToken(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    console.log("getUserFromToken", data);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
