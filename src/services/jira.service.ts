// src/services/jira.service.ts
import axios from "axios";
import type { JiraPayload, JiraResponse } from "../types/jira";
import { openai } from "../config/openAI";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000";

/**
 * Use the LLM to convert BRD content into a Jira MCP payload
 */
async function generateJiraPayloadFromLLM(
  brdContent: string,
  projectKey: string
): Promise<JiraPayload> {
  const prompt = `
You are a project management assistant.
Convert the following BRD into JSON suitable for the MCP tool 'create_jira_project'.

The JSON format must be exactly:

{
  "projectKey": "...",
  "name": "...",        // optional project name
  "description": "...", // optional project description
  "epics": [
    {
      "title": "...",
      "description": "...", // optional
      "stories": [
        { "title": "...", "description": "..." }
      ]
    }
  ]
}

BRD:
"""
${brdContent}
"""
Return JSON only.
`;

  // Call the LLM
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  const llmResponse = completion.choices[0].message.content;
  if (!llmResponse) {
    throw new Error("LLM returned no response");
  }

  try {
    const payload: JiraPayload = JSON.parse(llmResponse);
    payload.projectKey = projectKey; // ensure projectKey is correct
    return payload;
  } catch (err) {
    throw new Error(`LLM returned invalid JSON for Jira payload: ${err}`);
  }
}

/**
 * Create Jira project via MCP tool
 */
export async function createJiraProjectTool(
  brdContent: string,
  projectKey: string
): Promise<JiraResponse> {
  // Step 1: Generate MCP payload from LLM
  const payload: JiraPayload = await generateJiraPayloadFromLLM(
    brdContent,
    projectKey
  );

  // Step 2: Send payload to MCP tool
  const response = await axios.post(
    `${MCP_SERVER_URL}/tools/create_jira_project`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  // Step 3: Parse MCP response
  const content = response.data?.content?.[0]?.text;
  if (!content) throw new Error("Empty MCP response");

  return JSON.parse(content) as JiraResponse;
}
