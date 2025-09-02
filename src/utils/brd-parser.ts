// src/utils/brd-parser.ts
import type { JiraPayload, JiraEpic, JiraStory } from "../types/jira.js";

/**
 * Very basic parser: assumes BRD sections like:
 * # Epic: User Authentication
 * - Story: Frontend Login Form
 * - Story: Backend Auth API
 */
export function parseBrdToJiraJson(
  brdContent: string,
  projectKey: string
): JiraPayload {
  const lines = brdContent.split("\n");
  const epics: JiraEpic[] = [];

  let currentEpic: JiraEpic | null = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("# Epic:")) {
      if (currentEpic) epics.push(currentEpic);
      currentEpic = {
        title: line.replace("# Epic:", "").trim(),
        stories: [],
      };
    } else if (line.startsWith("- Story:") && currentEpic) {
      const storyTitle = line.replace("- Story:", "").trim();
      currentEpic.stories.push({ title: storyTitle });
    }
  }

  if (currentEpic) epics.push(currentEpic);

  return {
    projectKey,
    epics,
  };
}
