import { openai } from "../config/openAI";
import { getProjectState, upsertProjectState } from "./state.service";
import { STAGES } from "../config/stages";
import { ProjectMetadata, StageId } from "../types/stage";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { getRecentMessagesByProjectDB } from "./message.service";

type ExtractFnArgs = {
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
  const pastMessages = await getRecentMessagesByProjectDB(projectId, 5);

  // Compute missing fields
  const missing = missingPaths(state.metadata, stageDef.requiredPaths);

  const system = `
  You are a helpful requirements assistant helping collect structured metadata. 
  You have three tools available: extract_stage_updates, suggest_field_values, and save_metadata.
  Follow these exact rules when deciding to call them:

  If the user gives explicit new information → call extract_stage_updates.
  If user is missing info and needs help → call suggest_field_values.
  If user accepts or confirms something → call save_metadata.

  If the user gives explicit new information → call extract_stage_updates.
  
  1. **If the user provides explicit new information** (e.g., “the target audience is students” or “problems are formatting and tailoring”):
     - Acknowledge conversationally in natural language (summarize/rephrase).
     - Immediately call **save_metadata** with the confirmed fields.
  
  2. **If the user agrees, confirms, or refers to earlier content** (e.g., “yes, that’s fine”, “the problems you mentioned”, “same as above”):
     - Resolve the reference into explicit text from conversation history.
     - Then immediately call **save_metadata** with the resolved fields.
  
  3. **If the user asks for ideas, inspiration, or says they don’t know** (e.g., “you decide”, “can you suggest?”, “I’m not sure”):
     - Call **suggest_field_values** with thoughtful possible values for the missing fields.
     - DO NOT save yet. Wait for explicit user confirmation before calling save_metadata.
  
  4. **If there is information to extract but the stage is unclear or ambiguous**:
     - Call **extract_stage_updates** to map the information into structured fields.
  
  5. Always respond in natural, conversational English even when calling a tool.
     - Example: “Got it — your target audience is recent graduates. I’ll save that.” (then call save_metadata).
  
  6. Only ever call ONE tool per turn.
     - save_metadata → when user provides or confirms values.
     - suggest_field_values → when user asks for ideas/help deciding.
     - extract_stage_updates → only if stage is ambiguous or data is partial.
  
  7. When some fields are missing:
     - Briefly summarize what is saved so far.
     - Ask about only one missing field at a time in plain English (never show raw field names).
     - If the user says they don’t know, propose suggestions (via suggest_field_values).
  
  8. Never output raw metadata keys to the user. Use plain human-friendly terms (e.g., “unique value proposition” instead of \`unique_value_proposition\`).
  
  The goal: Collect complete metadata smoothly by mixing natural conversation with structured tool calls.
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
          "Extract fields relevant to the current stage from the user’s message. If the user refers to, agrees with, or summarizes information already discussed in the conversation (e.g., “the problems you mentioned” or “yes, that’s fine”), resolve those references into explicit text and extract accordingly. Always prefer structured extraction over skipping. Only skip if there is truly no relevant information at all.",
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
    {
      type: "function",
      function: {
        name: "suggest_field_values",
        description:
          "Suggest possible values for missing fields in the current stage. Used when the user asks for ideas, inspiration, or says things like 'you decide' or 'suggest something'. Do NOT save automatically.",
        parameters: {
          type: "object",
          properties: {
            stage: {
              type: "string",
              description:
                "The current stage of the project (e.g., idea_refinement, market_analysis, competitive_analysis, etc.)",
            },
            suggestions: {
              type: "object",
              description: "Suggestions for relevant fields in this stage",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          required: ["stage", "suggestions"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "save_metadata",
        description:
          "Save confirmed metadata fields for the current stage. Used when the user explicitly provides values, or confirms a suggested value. Always save exactly what the user confirms.",
        parameters: {
          type: "object",
          properties: {
            stage: {
              type: "string",
              description:
                "The current stage of the project (e.g., idea_refinement, market_analysis, competitive_analysis, etc.)",
            },
            fields: {
              type: "object",
              description: "Confirmed metadata fields to save",
              additionalProperties: { type: "string" },
            },
          },
          required: ["stage", "fields"],
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
  if (choice.message?.tool_calls?.length) {
    console.log("tool_calls", choice.message?.tool_calls);
  }
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

    assistantTextFromTool = pretty
      ? `Got it — I’ve saved the following:\n${pretty}`
      : undefined;
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
