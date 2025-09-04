import { Request, Response } from "express";
import * as integrationService from "../services/integration.service";

export const fetchAvailableIntegrations = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await integrationService.getAvailableIntegrations();
    return res.json(data);
  } catch (err: any) {
    console.error("Error fetching available integrations:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to fetch available integrations" });
  }
};

export const fetchUserIntegrations = async (req: any, res: Response) => {
  try {
    const userId = req.user.id; // comes from your auth middleware
    const data = await integrationService.getUserIntegrations(userId);
    return res.json(data);
  } catch (err: any) {
    console.error("Error fetching user integrations:", err.message);
    return res.status(500).json({ error: "Failed to fetch user integrations" });
  }
};
