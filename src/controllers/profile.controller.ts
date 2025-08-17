import { Request, Response } from "express";
import { profileService } from "../services/profile.service";

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const profile = await profileService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { fullName, primaryUseCase, experienceLevel } = req.body;
  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const onboardingData = { fullName, primaryUseCase, experienceLevel };
    const result = await profileService.completeOnboarding(
      userId,
      onboardingData
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
};
