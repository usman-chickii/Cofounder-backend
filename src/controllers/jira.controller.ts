import { Request, Response } from "express";
import { generateJiraTasks, getJiraProjects } from "../services/jira.service";
import * as jiraService from "../services/jira.service";
import { supabase } from "../config/supabase";
import { UserIntegration } from "src/types/integration";

export async function getJiraProjectsController(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    console.log("in getJiraProjectsController");
    console.log("userId", userId);
    const result = await getJiraProjects(userId);
    res.status(200).json({
      success: true,
      message: "Jira projects fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching Jira projects:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch Jira projects",
    });
  }
}

export async function generateJiraTasksController(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const projectKey = req.body.jiraProjectKey;
    console.log("projectKey", projectKey);
    const result = await generateJiraTasks(userId, projectId, projectKey);

    res.status(200).json({
      success: true,
      message: `Created ${result.created} Jira issues`,
      data: result.details,
    });
  } catch (error: any) {
    console.error("Error generating Jira tasks:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate Jira tasks",
    });
  }
}

export const connectJira = (req: Request, res: Response) => {
  const authUrl = new URL("https://auth.atlassian.com/authorize");
  authUrl.searchParams.set("audience", "api.atlassian.com");
  authUrl.searchParams.set("client_id", process.env.ATLASSIAN_CLIENT_ID!);
  authUrl.searchParams.set("scope", process.env.ATLASSIAN_SCOPE!);
  authUrl.searchParams.set("redirect_uri", process.env.ATLASSIAN_REDIRECT_URI!);
  authUrl.searchParams.set("state", (req as any).user.id);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("prompt", "consent");
  console.log("scope", process.env.ATLASSIAN_SCOPE);
  console.log("authUrl", authUrl.toString());

  return res.redirect(authUrl.toString());
};

export const jiraCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  // const userId = req.query.state as string;
  const userId = "1511391f-458f-4414-838f-97ac46888f18";
  console.log("code", code);
  console.log("userId", userId);
  console.log("in jira callback function");

  try {
    // 1️⃣ Exchange code for tokens + get cloudId
    const { tokens, cloudId } = await jiraService.exchangeCodeForTokens(code);
    console.log(tokens.scope);

    // 2️⃣ Get current user ID from auth middleware
    if (!userId) throw new Error("User not authenticated");

    const { data: integrationDef, error: integrationDefError } = await supabase
      .from("integrations")
      .select("id")
      .eq("service_name", "jira")
      .single();

    if (integrationDefError) throw integrationDefError;

    const integrationId = integrationDef.id;

    // 3️⃣ Upsert user_integrations row
    const { error: integrationError } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: userId,
          service_name: "jira",
          status: "connected",
          auth_token: null, // optional placeholder
        },
        { onConflict: "user_id,service_name" }
      )
      .select()
      .single();

    if (integrationError) throw integrationError;

    // 4️⃣ Upsert user_integration_connections row
    const { error: connectionError } = await supabase
      .from("user_integration_connections")
      .upsert(
        {
          user_id: userId,
          integration_id: integrationId,
          encrypted_access_token: tokens.access_token,
          encrypted_refresh_token: tokens.refresh_token,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          connection_metadata: JSON.stringify({
            cloud_id: cloudId,
            scope: tokens.scope,
          }),
          status: "active",
        },
        { onConflict: "user_id,integration_id" }
      );

    if (connectionError) throw connectionError;

    // 5️⃣ Respond
    return res.send(
      "✅ Jira connected successfully. You can close this window."
    );
  } catch (error: any) {
    console.error("Jira OAuth error:", error.response?.data || error.message);
    return res.status(500).send("❌ Jira integration failed");
  }
};
