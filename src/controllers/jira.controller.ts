import { Request, Response } from "express";
import { generateJiraTasks } from "../services/jira.service";

export async function generateJiraTasksController(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const result = await generateJiraTasks(userId, projectId);

    res.status(200).json({
      success: true,
      message: `Created ${result.created} Jira issues`,
      data: result.details,
    });
  } catch (error: any) {
    console.error("Error generating Jira tasks:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate Jira tasks",
    });
  }
}
