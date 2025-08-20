import { addMessageDB } from "./message.service";
import { Response } from "express";
import { openai } from "../config/openAI";

export const chatService = async (projectId: string, content: string) => {
  const userMessage = await addMessageDB(projectId, "user", content);

  const aiResponse = "This is a test response by the AI";

  const assistantMessage = await addMessageDB(
    projectId,
    "assistant",
    aiResponse
  );

  return { userMessage, assistantMessage };
  // const response = await generateResponse(userMessage);
  // const assistantMessage = await addMessageDB(response);
  // res.json({
  //     userMessage,
  //     assistantMessage
  // });
};

export const chatStreamService = async (
  projectId: string,
  content: string,
  model: string = "gpt-3.5-turbo",
  res: Response
) => {
  const userMessage = await addMessageDB(projectId, "user", content);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `You are a helpful assistant that helps users define their software project requirements.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    stream: true,
  });

  let assistantMessage = "";

  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      assistantMessage += delta;
      res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
    }
  }

  const savedAssistantMessage = await addMessageDB(
    projectId,
    "assistant",
    assistantMessage
  );

  res.write(`data: ${JSON.stringify({ event: "done" })}\n\n`);
  res.end();

  return { userMessage, assistantMessage: savedAssistantMessage };
};
