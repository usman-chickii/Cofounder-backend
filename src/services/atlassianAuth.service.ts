// src/services/atlassianAuth.service.ts
import { ENV } from "../config/env";
import { supabase } from "../config/supabase"; // adjust import

interface UserAuth {
  token: string;
  cloudId: string;
  refreshToken?: string;
  expiresAt?: string;
}

/**
 * Fetch the stored Atlassian OAuth token + cloudId for a user.
 */
export async function getUserAuthFromDb(
  userId: string
): Promise<UserAuth | null> {
  const { data, error } = await supabase
    .from("user_integration_connections")
    .select(
      `
        encrypted_access_token,
        encrypted_refresh_token,
        token_expires_at,
        connection_metadata,
        integrations (
        name
      )
      `
    )
    .eq("user_id", userId)
    .eq("integrations.name", "jira") // ✅ filter by service name
    .single();

  if (error) {
    console.error("Error fetching user auth:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  let cloudId: string | null = null;
  try {
    const metadata = JSON.parse(data.connection_metadata || "{}");
    cloudId = metadata.cloud_id || null;
    console.log("cloudId", cloudId);
  } catch (e) {
    console.error("Error parsing connection_metadata:", e);
  }

  return {
    token: data.encrypted_access_token,
    refreshToken: data.encrypted_refresh_token,
    expiresAt: data.token_expires_at,
    cloudId,
  };
}

/**
 * Optional: Update the token if it was refreshed.
 */
export async function updateUserAuthInDb(
  userId: string,
  newToken: string,
  newExpiry: string
) {
  const { error } = await supabase
    .from("user_integration_connections")
    .update({
      access_token: newToken,
      expires_at: newExpiry,
    })
    .eq("user_id", userId)
    .eq("integration_type", "atlassian");

  if (error) {
    console.error("Error updating token:", error);
  }
}

export async function refreshAtlassianToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("client_id", ENV.ATLASSIAN_CLIENT_ID);
  params.append("client_secret", ENV.ATLASSIAN_CLIENT_SECRET);
  params.append("refresh_token", refreshToken);

  const resp = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!resp.ok) {
    throw new Error(`Failed to refresh token: ${resp.statusText}`);
  }

  return resp.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}
