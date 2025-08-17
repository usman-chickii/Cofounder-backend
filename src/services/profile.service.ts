import { supabase } from "../config/supabase";

interface OnboardingData {
  fullName?: string;
  primaryUseCase?: string;
  experienceLevel?: string;
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  async completeOnboarding(userId: string, onboardingData?: OnboardingData) {
    if (!onboardingData) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);
      if (error) throw error;
      return data;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: onboardingData.fullName,
        primary_use_case: onboardingData.primaryUseCase,
        experience_level: onboardingData.experienceLevel,
        onboarding_completed: true,
      })
      .eq("id", userId);

    if (error) throw error;
    return { message: "Onboarding completed successfully" };
  },
};
