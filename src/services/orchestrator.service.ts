import { openai } from "../config/openAI";
import { getProjectState, upsertProjectState } from "./state.service";
import { STAGES } from "../config/stages";
import { ProjectMetadata, StageId } from "../types/stage";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { ENV } from "../config/env";
import { getRecentMessagesByProjectDB } from "./message.service";

type ExtractFnArgs = {
  // Only fields for the current stage will be present
  updates: ProjectMetadata;
};

function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let curr = obj;
  while (parts.length > 1) {
    const p = parts.shift()!;
    curr[p] = curr[p] ?? {};
    curr = curr[p];
  }
  curr[parts[0]] = value;
}

function missingPaths(meta: ProjectMetadata, required: string[]) {
  const missing: string[] = [];
  for (const p of required) {
    const parts = p.split(".");
    let curr: any = meta;
    for (const part of parts) {
      curr = curr?.[part];
      if (curr === undefined || curr === null || curr === "") break;
    }
    if (curr === undefined || curr === null || curr === "") missing.push(p);
  }
  return missing;
}

export async function handleTurn(
  projectId: string,
  userText: string,
  model: string
) {
  const state = await getProjectState(projectId);
  const stageDef = STAGES[state.stage as StageId] ?? STAGES.idea_refinement;

  // 1) Try to extract structured updates from user message for current stage
  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "extract_stage_updates",
        description:
          "Extract only fields relevant to the current stage from the user's message.",
        parameters: {
          type: "object",
          properties: {
            updates: {
              type: "object",
              properties: {
                idea_refinement: {
                  type: "object",
                  properties: {
                    idea: { type: "string" },
                    problem_statement: { type: "string" },
                    target_audience: { type: "string" },
                    unique_value_proposition: { type: "string" },
                    success_metrics: { type: "string" },
                  },
                },
                market_analysis: {
                  type: "object",
                  properties: {
                    market_size: { type: "string" },
                    trends: { type: "string" },
                    customer_segments: { type: "string" },
                    pricing_strategy: { type: "string" },
                  },
                },
                competitive_analysis: {
                  type: "object",
                  properties: {
                    competitors: { type: "array", items: { type: "string" } },
                    competitor_matrix: { type: "string" },
                    differentiation: { type: "string" },
                    barriers_to_entry: { type: "string" },
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: ["updates"],
        },
      },
    },
  ];

  const system = `You are a requirements assistant. 
- Keep answers concise.
- Extract facts and update metadata when present.
- If some required fields for the current stage are still missing, ask one targeted follow-up question at a time.`;
  const pastMessages = await getRecentMessagesByProjectDB(projectId, 10);

  const messages = [
    { role: "system", content: system },
    ...pastMessages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user",
      content: `Current stage: ${state.stage}.
Current metadata (JSON): ${JSON.stringify(state.metadata)}
User says: "${userText}"`,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: model,
    messages: messages as ChatCompletionMessageParam[],
    tools,
    tool_choice: "auto",
    temperature: 0.2,
    max_tokens: Number(ENV.LLM_MAX_TOKENS),
  });

  // 2) Apply tool outputs if present
  const choice = completion.choices[0];
  let newMeta = { ...(state.metadata || {}) } as ProjectMetadata;

  const call = choice.message?.tool_calls?.find(
    (t) => t["function"]?.name === "extract_stage_updates"
  );
  if (call?.["function"]?.arguments) {
    const args = JSON.parse(call["function"].arguments) as ExtractFnArgs;
    // Deep merge instead of shallow overwrite
    for (const [stageKey, fields] of Object.entries(args.updates)) {
      if (fields && typeof fields === "object") {
        for (const [fieldKey, val] of Object.entries(fields)) {
          setDeep(newMeta, `${stageKey}.${fieldKey}`, val);
        }
      }
    }
  }

  // 3) Compute missing fields for the current stage
  const missing = missingPaths(newMeta, stageDef.requiredPaths);

  // 4) Advance stage or ask next question
  let assistantText: string;
  let stage: StageId = stageDef.id;

  if (missing.length === 0) {
    if (stageDef.next) {
      stage = stageDef.next;
      assistantText =
        stage === "brd_ready"
          ? "All sections are complete. I can generate your BRD now. Would you like me to proceed?"
          : `Great—${stageDef.id} is complete. Moving to ${stage}.`;
    } else {
      assistantText = "All sections are complete.";
    }
  } else {
    assistantText = stageDef.questionTemplate(missing, newMeta);
  }

  // 5) Persist state
  await upsertProjectState({
    project_id: projectId,
    stage,
    metadata: newMeta,
    completed: stage === "brd_ready",
  });

  return { assistantText, stage, metadata: newMeta };
}
