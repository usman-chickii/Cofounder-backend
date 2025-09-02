import { ChatCompletionTool } from "openai/resources/chat/completions/index";

export function mapMcpToolToOpenAITool(mcpTool: any): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: mcpTool.inputSchema, // already matches JSON Schema format
    },
  };
}
