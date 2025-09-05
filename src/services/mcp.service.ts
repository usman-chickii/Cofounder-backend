// src/services/mcp.service.ts
import fetch from "node-fetch";
import { ENV } from "../config/env";
import {
  getUserAuthFromDb,
  refreshAtlassianToken,
  updateUserAuthInDb,
} from "./atlassianAuth.service";

const MCP_SERVER_URL = ENV.MCP_SERVER_URL || "http://localhost:9000/mcp";

// Keep track of active MCP sessions
const mcpSessions: Record<string, { sessionId: string }> = {};

// --- Helpers ---

async function parseSSEOrJSON(response: any): Promise<any> {
  const contentType = response.headers?.get?.("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} ${response.statusText}: ${text}`
      );
    }
    return response.json();
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
  }

  let buffer = "";
  let lastJSON: any = undefined;

  const stream: AsyncIterable<Buffer | string> = response.body as any;
  for await (const chunk of stream) {
    buffer += chunk.toString();
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const dataLines = rawEvent
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim());

      if (dataLines.length > 0) {
        const dataPayload = dataLines.join("\n");
        try {
          const parsed = JSON.parse(dataPayload);
          lastJSON = parsed;
        } catch {
          // ignore non-JSON frames
        }
      }
    }
  }

  if (lastJSON === undefined) {
    const maybeData = buffer
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("\n");
    if (maybeData) {
      try {
        lastJSON = JSON.parse(maybeData);
      } catch {
        // ignore
      }
    }
  }

  if (lastJSON === undefined) {
    throw new Error("No JSON payload found in SSE stream");
  }
  return lastJSON;
}

async function mcpPost(
  payload: Record<string, any>,
  userId?: string,
  sessionId?: string
): Promise<any> {
  const auth = userId ? await getUserAuthFromDb(userId) : undefined;

  if (userId && !auth) {
    throw new Error(`No Atlassian OAuth credentials found for user ${userId}`);
  }
  const now = new Date();
  if (auth.expiresAt && new Date(auth.expiresAt) <= now) {
    const refreshedToken = await refreshAtlassianToken(auth.refreshToken);
    auth.token = refreshedToken.access_token;
    auth.expiresAt = new Date(
      new Date().getTime() + refreshedToken.expires_in * 1000
    ).toISOString();
    await updateUserAuthInDb(userId, auth.token, auth.expiresAt);
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    ...(sessionId ? { "MCP-Session-Id": sessionId } : {}),
    ...(auth
      ? {
          Authorization: `Bearer ${auth.token}`,
          "X-Atlassian-Cloud-Id": auth.cloudId ?? "",
        }
      : {}),
  };

  console.log("mcpPost payload", payload);

  const response = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const sessionIdResponse = response.headers.get("MCP-Session-Id");
  console.log(sessionId);
  console.log("sessionIdResponse", sessionIdResponse);

  const result = await parseSSEOrJSON(response);
  if (!sessionIdResponse) {
    throw new Error("MCP Session ID not found");
  }
  return { result, sessionId: sessionIdResponse };
}

// Fire-and-forget notification (no JSON-RPC id)
async function mcpNotify(
  method: string,
  params: Record<string, any> = {},
  userId?: string,
  sessionId?: string
): Promise<void> {
  const auth = userId ? await getUserAuthFromDb(userId) : undefined;
  if (userId && !auth) {
    throw new Error(`No Atlassian OAuth credentials found for user ${userId}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    ...(sessionId ? { "MCP-Session-Id": sessionId } : {}),
    ...(auth
      ? {
          Authorization: `Bearer ${auth.token}`,
          "X-Atlassian-Cloud-Id": auth.cloudId ?? "",
        }
      : {}),
  };

  const resp = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    }),
  });

  // Consume body to completion but ignore content/parsing
  try {
    await resp.text();
  } catch {
    // ignore
  }
}

// --- Public API ---

/**
 * Ensure a session exists for a user/chatbot session.
 * Initializes a session with the MCP server if none exists.
 */
export async function ensureMcpSession(userId: string): Promise<string> {
  if (mcpSessions[userId]) {
    return mcpSessions[userId].sessionId;
  }

  const result = await mcpPost(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    },
    userId
  );

  const sessionId = result?.result?.sessionId || result?.sessionId || undefined;

  if (!sessionId) {
    console.log("Failed to initialize MCP session (no sessionId)");
    throw new Error("Failed to initialize MCP session (no sessionId)");
  }

  mcpSessions[userId] = { sessionId };
  console.log("logging the error", result.result.error);

  if (result?.result?.error?.code === -32602) {
    console.log("MCP tools listed in listMcpTools failed, retrying");
    await mcpNotify("notifications/initialized", {}, userId, sessionId);
    return sessionId;
  }

  return sessionId;
}

/**
 * Call a tool on the MCP server.
 */
export async function callMcpTool(
  userId: string,
  tool: string,
  args: Record<string, any>
): Promise<any> {
  const sessionId = await ensureMcpSession(userId);
  console.log("args in mcp function", args);

  const result = await mcpPost(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: tool,
        arguments: args,
      },
    },
    userId,
    sessionId
  );
  // const result = await mcpPost(
  //   {
  //     jsonrpc: "2.0",
  //     id: 1,
  //     method: "tools/list",
  //   },
  //   userId,
  //   sessionId
  // );

  // console.log(result.result.result);

  console.log("result in call", result.result.result.content);

  return result?.result?.content ?? result?.result ?? result;
}

/**
 * List available tools on the MCP server for this session.
 */
export async function listMcpTools(userId: string): Promise<any> {
  const sessionId = await ensureMcpSession(userId);

  try {
    const result = await mcpPost(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      },
      userId,
      sessionId
    );
    // console.log("MCP tools listed in listMcpTools", result.result.result.tools);
    return result.result.result.tools;
  } catch (e: any) {
    console.log("MCP tools listed in listMcpTools failed", e);
    // If initialization notification wasn’t seen yet, send it and retry once

    throw e;
  }
}

/**
 * Optional: Reset session if needed (e.g., user logs out)
 */
export function resetMcpSession(userId: string) {
  delete mcpSessions[userId];
}

/**
 * Get the current MCP session id for a user (for debugging).
 */
export function getMcpSessionId(userId: string): string | undefined {
  console.log("Getting MCP session id for user", userId, mcpSessions[userId]);
  return mcpSessions[userId]?.sessionId;
}
