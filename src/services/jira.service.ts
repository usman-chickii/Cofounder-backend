// src/services/jira.service.ts
import axios from "axios";
import { openai } from "../config/openAI";
import { supabase } from "../config/supabase";
import { callMcpTool } from "./mcp.service";

interface JiraIssuePayload {
  summary: string;
  description: string;
  issue_type: string; // Epic | Story | Task | Sub-task
}

export async function getJiraProjects(userId: string) {
  try {
    const projects = await callMcpTool(userId, "jira_get_all_projects", {});
    console.log("projects", projects.result.content);
    const projectText = projects.result.content[0].text;
    let projectList = [];

    if (projectText) {
      try {
        projectList = JSON.parse(projectText); // <-- now this is a proper array
      } catch (err) {
        console.error("Failed to parse projects JSON:", err);
      }
    }

    // Now you can map/filter
    const formatted = projectList.map((p: any) => ({
      key: p.key,
      name: p.name,
    }));
    // Transform to key + name for frontend

    return formatted;
  } catch (err: any) {
    console.error("Error fetching Jira projects:", err);
    throw new Error(err.message);
  }
}

export async function generateJiraTasks(
  userId: string,
  projectId: string,
  projectKey: string
) {
  // 1. Fetch the latest BRD from project_blocks
  console.log("Fetching BRD for project", projectId);
  const { data: blocks, error } = await supabase
    .from("project_blocks")
    .select("*")
    .eq("project_id", projectId)
    .eq("type", "brd")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !blocks?.length) {
    throw new Error("No BRD found for project.");
  }

  const brdMarkdown = blocks[0].content;
  // console.log("BRD Markdown", brdMarkdown);

  // 2. Ask LLM to convert BRD → Jira payload
  const llmResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or groq model
    messages: [
      {
        role: "system",
        content:
          "You are a Jira Agent. Parse the BRD and output valid Jira issues JSON.",
      },
      { role: "user", content: brdMarkdown },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "generate_jira_payload",
          description: "Generate a Jira issue hierarchy from BRD",
          parameters: {
            type: "object",
            properties: {
              projectKey: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    description: { type: "string" },
                    issue_type: { type: "string" },
                    parent: { type: "string" },
                    custom_fields: { type: "object" },
                  },
                  required: ["summary", "description", "issue_type"],
                },
              },
            },
            required: ["issues"],
          },
        },
      },
    ],
  });

  // 3. Extract the JSON payload
  console.log("llmResponse", llmResponse.choices[0].message);
  const toolCall = llmResponse.choices[0].message.tool_calls?.[0];
  console.log("toolCall", toolCall);
  if (!toolCall) {
    throw new Error("LLM did not return a Jira payload.");
  }

  const jiraPayload = JSON.parse(toolCall["function"].arguments);
  console.log("jiraPayload", jiraPayload);

  //   projectKey: "BTP",
  //   issues: [
  //     {
  //       summary: "User Authentication & Profiles",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "User Registration",
  //       description:
  //         "Acceptance Criteria:\n" +
  //         "- [ ] User can register with email/password\n" +
  //         "- [ ] Email verification link sent and required to activate account\n" +
  //         "- [ ] Password meets security requirements (8+ chars, complexity)\n" +
  //         "- [ ] Duplicate email registration prevented",
  //       issue_type: "Story",
  //       parent: "EP-001",
  //     },
  //     {
  //       summary: "Create User table and migrations",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-001",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement POST /api/auth/register",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-001",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Integrate SendGrid for email verification",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-001",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Registration form with client-side validation",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-001",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Unit + integration tests for registration flow",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-001",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "User Login",
  //       description:
  //         "Acceptance Criteria:\n" +
  //         "- [ ] Login with credentials returns JWT + refresh token\n" +
  //         "- [ ] Token expiration and refresh flow implemented\n" +
  //         "- [ ] Invalid credentials produce correct error codes",
  //       issue_type: "Story",
  //       parent: "EP-001",
  //     },
  //     {
  //       summary: "Implement POST /api/auth/login & refresh",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-002",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "JWT issuance and validation middleware",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-002",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Login UX and token handling in local storage/secure cookie",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-002",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Integration tests (auth flow)",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-002",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Social Login (Google)",
  //       description:
  //         "Acceptance Criteria:\n" +
  //         "- [ ] User can sign in with Google OAuth\n" +
  //         "- [ ] Accounts link to existing email if present\n" +
  //         "- [ ] Proper scopes and consent are requested",
  //       issue_type: "Story",
  //       parent: "EP-001",
  //     },
  //     {
  //       summary: "Implement OAuth endpoints & token exchange",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-003",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: 'Add "Sign in with Google" button and flow',
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-003",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Core Data Models & CRUD APIs",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "Trip creation API (POST /api/trips)",
  //       description:
  //         "Acceptance Criteria:\n" +
  //         "- [ ] Validations for origin, destination, dates, and budget\n" +
  //         "- [ ] Database migration complete\n" +
  //         "- [ ] Unit tests implemented\n",
  //       issue_type: "Story",
  //       parent: "EP-002",
  //     },
  //     {
  //       summary: "Implement Trip creation API and validations",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-005",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Prepare DB migration for Trip table",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-005",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Develop unit tests for Trip API",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-005",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Destination catalog CRUD + search index",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-002",
  //     },
  //     {
  //       summary: "Design and implement Destination model",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-006",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Develop CRUD APIs for Destination management",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-006",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Create search index for Destination",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-006",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Reviews CRUD + moderation pipeline",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-002",
  //     },
  //     {
  //       summary: "Implement Review model and CRUD APIs",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-007",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Design moderation features for reviews",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-007",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Itinerary Generator (AI) & Budget Calculator",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "Design LLM prompt templates and caching",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-003",
  //     },
  //     {
  //       summary: "Create prompt templates for common trip queries",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-008",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement caching mechanism for prompt results",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-008",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement /api/itineraries/generate with request queuing",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-003",
  //     },
  //     {
  //       summary: "Create itinerary generation API",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-009",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement request queuing logic for itineraries",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-009",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Budget calculator endpoint and UI component",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-003",
  //     },
  //     {
  //       summary: "Develop budget calculator API",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-010",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Create UI for Budget calculator",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-010",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Store generated itineraries, versioning and edit tracking",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-003",
  //     },
  //     {
  //       summary: "Implement storage for generated itineraries",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-011",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Design versioning and edit tracking system",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-011",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Search & Pricing Integrations",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "Integrate flight search (Amadeus/Skyscanner) with caching",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-004",
  //     },
  //     {
  //       summary: "Create flight API integration",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-012",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement caching for flight search results",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-012",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Integrate hotel inventory (Booking API)",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-004",
  //     },
  //     {
  //       summary: "Create hotel API integration",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-013",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement hotel search caching",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-013",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement unified search aggregator with price normalization",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-004",
  //     },
  //     {
  //       summary: "Design aggregator API for unified search",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-014",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement price normalization logic",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-014",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Booking & Payment Flows",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "Stripe customer creation, subscription and billing plans",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-005",
  //     },
  //     {
  //       summary: "Implement Stripe customer creation API",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-015",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Design subscription models for users",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-015",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Booking submission to provider, reconciliation",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-005",
  //     },
  //     {
  //       summary: "Create booking submission API",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-016",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement reconciliation process with providers",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-016",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Booking confirmation emails and receipts",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-005",
  //     },
  //     {
  //       summary: "Integrate email notifications for booking confirmations",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-017",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Develop receipt templates for users",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-017",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Frontend UX / Itinerary Editor",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "Itinerary editor with drag/drop stops",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-006",
  //     },
  //     {
  //       summary: "Design itinerary editor UI with drag/drop functionality",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-018",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement backend for itinerary editing operations",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-018",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Itinerary share/export (PDF + shareable link)",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-006",
  //     },
  //     {
  //       summary: "Implement export functionality for itineraries",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-019",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Create PDF templates for itinerary export",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-019",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Responsive UI and accessibility compliance",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-006",
  //     },
  //     {
  //       summary: "Audit and redesign UI for responsiveness and accessibility",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-020",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Implement accessibility features",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-020",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "In-app tips and onboarding for new travelers",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-006",
  //     },
  //     {
  //       summary: "Design onboarding flow for new users",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-021",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Develop in-app tips for itinerary management",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-021",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Ops, Monitoring & Security",
  //       description: "",
  //       issue_type: "Epic",
  //     },
  //     {
  //       summary: "CI/CD pipelines, infra IaC (Terraform)",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-007",
  //     },
  //     {
  //       summary: "Implement CI/CD pipelines for deployment",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-022",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Design infrastructure as code with Terraform",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-022",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Observability (traces, metrics, alerts)",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-007",
  //     },
  //     {
  //       summary: "Integrate observability tools for metrics tracking",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-023",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Develop alerting mechanisms for system monitoring",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-023",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Security: TLS, secret management, automated scans",
  //       description: "",
  //       issue_type: "Story",
  //       parent: "EP-007",
  //     },
  //     {
  //       summary: "Implement TLS for secure communication",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-024",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Manage secrets using a vault solution",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-024",
  //       customFieldValues: [Object],
  //     },
  //     {
  //       summary: "Perform automated security scans on codebase",
  //       description: "",
  //       issue_type: "Subtask",
  //       parent: "US-024",
  //       customFieldValues: [Object],
  //     },
  //   ],
  // };

  // const jiraPayloadTest = {
  //   projectKey: "MCPTEST",
  //   issues: [
  //     {
  //       summary: "EP-001: User Authentication & Organization Management",
  //       description:
  //         "As a user, I want to register and manage organizations so that I can control access.",
  //       issue_type: "Epic",
  //       custom_fields: {
  //         priority: "Must",
  //         story_points: 21,
  //       },
  //     },
  //   ],
  // };

  // 4. Create Jira issues via MCP
  const results = [];
  for (const issue of jiraPayload.issues as JiraIssuePayload[]) {
    const res = await callMcpTool(userId, "jira_create_issue", {
      project_key: projectKey,
      summary: issue.summary,
      description: issue.description,
      issue_type: issue.issue_type,
    });
    results.push(res);
  }
  // const res = await callMcpTool(userId, "search", {
  //   project_key: "MCPTEST2",
  // });
  return {
    created: results.length,
    details: results,
  };
}

export async function exchangeCodeForTokens(code: string) {
  // 1. Exchange code for tokens
  const tokenRes = await axios.post("https://auth.atlassian.com/oauth/token", {
    grant_type: "authorization_code",
    client_id: process.env.ATLASSIAN_CLIENT_ID,
    client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
    code,
    redirect_uri: process.env.ATLASSIAN_REDIRECT_URI,
  });

  const tokens = tokenRes.data;

  // 2. Fetch cloud ID
  const cloudRes = await axios.get(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  const cloudId = cloudRes.data?.[0]?.id;

  return { tokens, cloudId };
}
