// src/controllers/jira.controller.ts
import { Request, Response } from "express";
import { createJiraProjectTool } from "../services/jira.service";

export async function createJiraBoard(req: Request, res: Response) {
  try {
    const { brdContent, projectKey } = req.body;

    if (!brdContent || !projectKey)
      return res
        .status(400)
        .json({ error: "BRD content and projectKey required" });

    const result = await createJiraProjectTool(brdContent, projectKey);

    res.json({
      success: true,
      message: "Jira board created successfully",
      data: result,
    });
  } catch (err: any) {
    console.error("Error creating Jira board:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
