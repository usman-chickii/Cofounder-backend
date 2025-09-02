import { Request, Response } from "express";
import {
  ensureMcpSession,
  listMcpTools,
  callMcpTool,
  resetMcpSession,
  getMcpSessionId,
} from "../services/mcp.service";

export async function mcpListTools(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    console.log("Ensuring MCP session and listing tools");
    await ensureMcpSession(userId);
    const tools = await listMcpTools(userId);
    const sessionId = getMcpSessionId(userId);
    console.log("MCP tools listed", tools);
    res.json({ userId, sessionId, tools });
  } catch (e: any) {
    res.status(500).json({
      message: "Failed to list tools",
      error: e?.message || String(e),
    });
  }
}

export async function mcpCall(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { tool, args } = req.body || {};
  if (!tool) return res.status(400).json({ message: "Missing 'tool' in body" });

  try {
    const result = await callMcpTool(userId, tool, args || {});
    res.json({ userId, sessionId: getMcpSessionId(userId), tool, result });
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "MCP call failed", error: e?.message || String(e) });
  }
}

export async function mcpReset(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  resetMcpSession(userId);
  res.json({ userId, reset: true });
}
