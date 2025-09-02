import { Request, Response } from "express";
import { chatService, chatStreamService } from "../services/chat.service";

export const chat = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const { message } = req.body;
  const { userMessage, assistantMessage } = await chatService(
    projectId,
    message
  );
  res.json({ userMessage, assistantMessage });
};

export const chatStream = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const userId = (req as any).user?.id;
  const { message } = req.body;
  try {
    await chatStreamService(projectId, message, "gpt-4o-mini", res, userId);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          event: "error",
          message: "AI failed to respond. Please try again.",
        })}\n\n`
      );
      res.end();
    }
  }
};
