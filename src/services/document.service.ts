import { getProjectByIdDB } from "./project.service";
import {
  createProjectBlock,
  getProjectBlockByIdDB,
} from "./projectBlock.service";
import { supabase } from "../config/supabase";
import { generatePdf } from "../utils/generatePdf";
import { getProjectState } from "./state.service";
import { openai } from "../config/openAI";

// export async function generateDocumentService( //old working dummy markdown function
//   projectId: string
// ): Promise<{ markdown: string }> {
//   const project = await getProjectByIdDB(projectId);
//   if (!project) {
//     throw new Error("Project not found");
//   }
//   console.log(`Generating BRD for project ${projectId}...`);
//   const dummyMarkdown: string = `
// # Business Requirement Document (BRD)

// ## 1. Executive Summary
// This document outlines the business requirements for the development of the new web-based project management platform, **ProjectX**. The platform aims to streamline collaboration, task tracking, and reporting across multiple teams.

// ## 2. Project Overview
// **Project Name:** ProjectX
// **Project Manager:** Jane Doe
// **Sponsor:** John Smith

// ### 2.1 Background
// Current project management tools lack integration with internal reporting systems and have limited automation features. This leads to inefficiencies and increased manual effort.

// ### 2.2 Objectives
// - Improve task tracking and reporting efficiency.
// - Enable real-time collaboration among team members.
// - Provide analytics dashboards for management.
// - Integrate with existing internal tools.

// ## 3. Stakeholders
// | Role | Name | Responsibility |
// |------|------|----------------|
// | Project Sponsor | John Smith | Approves budgets and timelines |
// | Product Owner | Jane Doe | Defines requirements and priorities |
// | Development Team | Team A | Develops platform features |
// | QA Team | Team B | Ensures quality and compliance |

// ## 4. Functional Requirements
// ### 4.1 User Management
// - Ability to create, update, and delete user accounts.
// - Role-based access control:
//   - Admin
//   - Manager
//   - Team Member
// - User authentication via OAuth2 and SSO.

// ### 4.2 Task Management
// - Create, assign, update, and delete tasks.
// - Task prioritization (High, Medium, Low).
// - Task dependencies and notifications.
// - Task search and filter functionality.

// ### 4.3 Reporting & Analytics
// - Dashboard with project KPIs.
// - Export reports in PDF and Excel formats.
// - Customizable charts and graphs.
// - Automated weekly summary emails.

// ### 4.4 Integration
// - Integration with internal CRM system.
// - Integration with messaging apps (Slack, Teams).
// - API access for third-party tools.

// ## 5. Non-Functional Requirements
// - **Performance:** Page load time < 2 seconds.
// - **Scalability:** Support up to 10,000 concurrent users.
// - **Security:** Data encryption at rest and in transit, audit logs.
// - **Availability:** 99.9% uptime SLA.
// - **Maintainability:** Modular architecture, well-documented code.

// ## 6. Assumptions & Constraints
// - Users will have modern browsers (Chrome, Edge, Safari, Firefox).
// - Platform will support English language only initially.
// - Budget and timeline constraints may limit feature scope.

// ## 7. Glossary
// - **BRD:** Business Requirement Document
// - **KPI:** Key Performance Indicator
// - **SLA:** Service Level Agreement

// ## 8. Approval
// | Name | Role | Signature | Date |
// |------|------|-----------|------|
// | John Smith | Project Sponsor | __________ | ____/____/____ |
// | Jane Doe | Product Owner | __________ | ____/____/____ |
//   `.trim();

//   return { markdown: dummyMarkdown };
// }

export async function generateDocumentService(projectId: string) {
  const { metadata } = await getProjectState(projectId);
  const prompt = `
You are a technical business analyst creating development-ready documentation. Transform all previous insights into actionable specifications.

Metadata JSON: ${JSON.stringify(metadata)}

**Read from metadata:** Access ALL previous stage data to compile comprehensive documentation

Generate:
- Business Requirements Document (BRD) with:
  - Executive summary (from all stages)
  - Functional requirements (user stories format)
  - Non-functional requirements (performance, security, compliance)
  - Success metrics and KPIs
  - Risk assessment
- User journey maps for primary personas
- Data model requirements
- Integration requirements (third-party services, APIs)

Output: Well-structured BRD in Markdown using only the provided metadata. ready for technical review, with requirements prioritized using MoSCoW method.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const markdown =
    completion.choices[0].message.content || "# BRD\n\nNo content.";
  console.log(markdown);
  return { markdown };
}

export async function downloadDocumentService(
  projectId: string,
  blockId: string
): Promise<{ url: string }> {
  const block = await getProjectBlockByIdDB(blockId);
  if (!block || block.project_id !== projectId) {
    throw new Error("Document not found for this project");
  }

  const filePath = `projects/${projectId}/documents/${blockId}.pdf`;

  // 1. Try to fetch existing file
  const { error: downloadErr } = await supabase.storage
    .from("documents")
    .download(filePath);

  if (!downloadErr) {
    // File exists → return signed URL
    const { data: urlData, error: urlErr } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60 * 60);

    if (urlErr) {
      throw new Error("Error generating signed URL: " + urlErr.message);
    }

    return { url: urlData?.signedUrl || "" };
  }

  // 2. File missing → generate fresh PDF
  const pdfBuffer = await generatePdf(block.content);

  // 3. Upload to Supabase
  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr) {
    throw new Error("Error uploading file: " + uploadErr.message);
  }

  // 4. Return signed URL
  const { data: urlData, error: urlErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 60);

  if (urlErr) throw new Error("Error generating signed URL: " + urlErr.message);

  return { url: urlData?.signedUrl || "" };
}
