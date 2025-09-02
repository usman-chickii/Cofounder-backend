import { addMessageDB, getRecentMessagesByProjectDB } from "./message.service";
import { Response } from "express";
import { openai } from "../config/openAI";
import { retryWithBackoff } from "../utils/retry";
import { ENV } from "../config/env";
import { handleTurn } from "./orchestrator.service";

export const chatService = async (projectId: string, content: string) => {
  const userMessage = await addMessageDB(projectId, "user", content);

  const aiResponse = "This is a test response by the AI";

  const assistantMessage = await addMessageDB(
    projectId,
    "assistant",
    aiResponse
  );

  return { userMessage, assistantMessage };
};

export const chatStreamService = async (
  projectId: string,
  content: string,
  model: string = "gpt-4o-mini",
  res: Response,
  userId: string
) => {
  const userMessage = await addMessageDB(projectId, "user", content);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Use orchestrator for stateful, stage-aware reply
  // Use orchestrator for stateful, stage-aware reply
  try {
    const { assistantText, stage, metadata } = await handleTurn(
      projectId,
      content,
      model,
      userId
    );

    // stream tokens
    const tokens = assistantText.match(/\S+\s*/g) || [assistantText];
    for (const t of tokens) {
      res.write(`data: ${JSON.stringify({ token: t })}\n\n`);
    }

    const savedAssistantMessage = await addMessageDB(
      projectId,
      "assistant",
      assistantText
    );
    res.write(
      `data: ${JSON.stringify({ event: "done", stage, metadata })}\n\n`
    );
    res.end();
    return { userMessage, assistantMessage: savedAssistantMessage };
  } catch (e) {
    console.error(e);
    res.write(
      `data: ${JSON.stringify({
        event: "error",
        message: "AI failed to respond.",
      })}\n\n`
    );
    res.end();
    return { userMessage, assistantMessage: null as any };
  }
};
