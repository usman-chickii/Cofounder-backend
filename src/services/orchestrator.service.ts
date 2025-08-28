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
  updates: ProjectMetadata;
  userMessage: string;
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
  const pastMessages = await getRecentMessagesByProjectDB(projectId, 5);

  // Compute missing fields
  const missing = missingPaths(state.metadata, stageDef.requiredPaths);
  const system = `
  You are a helpful requirements assistant helping collect structured metadata for startup projects.
  
  🔑 General Rules:
  - Always keep answers conversational and natural.
  - Every time the user provides metadata, you must produce BOTH:
      (a) a natural language acknowledgement, AND
      (b) a tool call in the same turn.
  - Do not wait for additional confirmation before calling the tool, unless the user explicitly says ‘suggest’ or ‘I’m not sure.’
  - Never output raw metadata keys; describe them in user-friendly terms.
  - When summarizing user input, rephrase or improve wording so it’s clear and polished.
  - Ask about only one missing field at a time, in plain English.
  - If the user says they don't know a field, optionally provide helpful insights or suggestions.
  
  📥 If the user provides clear metadata (e.g., “the target audience is …”), you must BOTH:
    (a) Acknowledge it conversationally in natural language, and
    (b) Immediately call the tool with the structured data update —
      always saving it into the correct stage (even if the user is currently in another stage).
  - Never skip step (b). Narration or summarization is not a substitute for the tool call.
  
  💡 When the user asks you to suggest (e.g., "I don’t know, can you suggest?"):
  - Only propose ideas in natural language and wait for confirmation.
  - Do NOT call tools until the user confirms.
  - After confirmation (e.g., "yes, that works"), then call the tool with structured data.
  - If the user edits your suggestion, update it and then call the tool.
  
  📊 Stage & Metadata Rules:
  - Each project has multiple stages (idea_refinement, problem_statement, market_analysis, competitor_analysis, branding_foundation, ui_preferences, tech_stack, etc.).
  - Always capture and save user input into the correct stage field.
  - If the user provides information belonging to a different stage than the current one, update that stage instead of the current one.
  - When suggesting values, only propose options relevant to the requested stage.
  - Never overwrite unrelated stages.
  - If unsure which stage a detail belongs to, politely ask the user for clarification.
  
  📋 Missing Data Handling:
  - When some fields are missing, respond with a summary of what’s already saved and a clear list of what’s missing.
  `;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...pastMessages
      .reverse()
      .map((msg) => ({ role: msg.role, content: msg.content })),
    {
      role: "user",
      content: `Current stage: ${state.stage}
Missing fields: ${missing.join(", ")}
Current metadata: ${JSON.stringify(state.metadata)}
User says: "${userText}"`,
    },
  ];

  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "extract_stage_updates",
        description:
          "Extract user-provided details and map them to the correct stage and field. Always ensure values are stored in their correct stage, even if the conversation is currently in another stage. Also give a natural language explanation of the update for the user. It should be stored in the userMessage field.",
        parameters: {
          type: "object",
          properties: {
            stage: {
              type: "string",
              description: "The stage these updates belong to",
            },
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
                product_definition: {
                  type: "object",
                  properties: {
                    core_features: { type: "string" },
                    user_workflows: { type: "string" },
                    data_types: { type: "string" },
                    integration_requirements: { type: "string" },
                  },
                },
                project_constraints: {
                  type: "object",
                  properties: {
                    timeline: { type: "string" },
                    budget_tier: { type: "string" },
                    team_size: { type: "string" },
                    technical_complexity_preference: { type: "string" },
                  },
                },
              },
            },
            userMessage: {
              type: "string",
              description:
                "A natural-language explanation of the update for the user. Should reference the updated fields directly, e.g. 'Got it — I’ve noted your {field} is {value}' or 'Understood, I’ve updated {field} to {value}'.",
            },
          },
          required: ["stage", "updates", "userMessage"],
        },
      },
    },
  ];

  const completion = await openai.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.2,
    // max_tokens: Number(ENV.LLM_MAX_TOKENS),
  });

  // Apply tool outputs if present (deep merge)
  const choice = completion.choices[0];
  console.log("choice", choice);
  console.log(choice.message?.content);
  let newMeta = { ...(state.metadata || {}) } as ProjectMetadata;

  const call = choice.message?.tool_calls?.find(
    (t) => t["function"]?.name === "extract_stage_updates"
  );
  if (call?.["function"]?.arguments) {
    const args = JSON.parse(call["function"].arguments) as ExtractFnArgs;
    for (const [stageKey, fields] of Object.entries(args.updates)) {
      if (fields && typeof fields === "object") {
        for (const [fieldKey, val] of Object.entries(fields)) {
          setDeep(newMeta, `${stageKey}.${fieldKey}`, val);
        }
      }
    }
  }
  let assistantTextFromTool: string | undefined;

  if (call?.["function"]?.arguments) {
    const args = JSON.parse(call["function"].arguments) as ExtractFnArgs;

    // Deep merge
    for (const [stageKey, fields] of Object.entries(args.updates)) {
      if (fields && typeof fields === "object") {
        for (const [fieldKey, val] of Object.entries(fields)) {
          setDeep(newMeta, `${stageKey}.${fieldKey}`, val);
        }
      }
    }

    // Build a friendly confirmation message from the tool-call payload
    const pretty = Object.entries(args.updates)
      .flatMap(([stageKey, fields]) =>
        Object.entries(fields as Record<string, any>).map(
          ([k, v]) => `• ${k.replace(/_/g, " ")}: ${String(v)}`
        )
      )
      .join("\n");

    console.log("tool call", choice.message?.tool_calls);

    assistantTextFromTool =
      args.userMessage ??
      (pretty ? `Got it — I’ve saved the following:\n${pretty}` : undefined);
  }
  // Recompute missing fields
  const remainingMissing = missingPaths(newMeta, stageDef.requiredPaths);

  // Advance stage or ask next question
  let assistantText: string;
  let stage: StageId = stageDef.id;

  if (remainingMissing.length === 0) {
    if (stageDef.next) {
      stage = stageDef.next;
      assistantText =
        stage === "brd_ready"
          ? "All sections are complete. I can generate your BRD now. Would you like me to proceed?"
          : `Great—${stageDef.id} is complete. Moving to ${stage}.`;
    } else {
      assistantText = choice.message?.content || "All sections are complete.";
    }
  } else {
    const friendlyName = (p: string) => p.split(".")[1].replace(/_/g, " "); // crude -> “competitor matrix”, etc.
    const nextField = friendlyName(remainingMissing[0]);

    assistantText =
      choice.message?.content ||
      assistantTextFromTool ||
      `Thanks! Next, could you share ${nextField}?`;
  }

  await upsertProjectState({
    project_id: projectId,
    stage,
    metadata: newMeta,
    completed: stage === "brd_ready",
  });

  return { assistantText, stage, metadata: newMeta };
}
