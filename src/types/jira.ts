// src/types/jira.ts

// Structure of one story/issue
export interface JiraStory {
  title: string;
  description?: string;
}

// Structure of one epic with stories
export interface JiraEpic {
  title: string;
  description?: string;
  stories: JiraStory[];
}

// Payload sent to MCP tool
export interface JiraPayload {
  projectKey: string;
  name?: string; // optional project name
  description?: string;
  epics: JiraEpic[];
}

// Response returned from MCP server after tool execution
export interface JiraResponse {
  success: boolean;
  boardUrl?: string;
  epicsCreated?: string[]; // Jira IDs
  storiesCreated?: string[]; // Jira IDs
  error?: string;
}
