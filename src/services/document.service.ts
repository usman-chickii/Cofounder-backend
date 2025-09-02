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
  // const prompt = `You are a senior technical business analyst creating a Business Requirements Document (BRD) that will be used to generate JIRA development tasks.
  // Input: A metadata JSON containing structured business information about the project.
  // Metadata JSON: ${JSON.stringify(metadata)}

  // **CRITICAL OBJECTIVE**: Generate a BRD detailed enough for developers to immediately start creating user stories and technical tasks in JIRA.

  // **Read from metadata:** Access ALL previous stage data to compile comprehensive documentation

  // **Technical Inference Guidelines:**
  // - From business workflows → infer required system components and data flows
  // - From target audience and scale → determine performance and security requirements
  // - From competitive analysis → identify feature complexity and technical challenges
  // - From pricing strategy → infer payment processing and user management needs
  // - From market size → determine scalability and infrastructure requirements

  // **Output Format:** A comprehensive, development-ready BRD in **Markdown**.

  // ## Document Structure
  // 1. **Executive Summary**
  //    - Project overview, vision, market opportunity
  //    - **Technology approach summary** (inferred from complexity)
  // 2. **Problem Statement & Solution**
  //    - Clear problem definition and proposed solution
  // 3. **Market Analysis**
  //    - Target audience, market size, competitive landscape
  // 4. **Product Specifications**
  //    - **Core Features List** (prioritized table with MoSCoW)
  //    - **User Workflows** (detailed step-by-step processes)
  //    - **Business Logic Rules** (calculations, validations, decision points)
  // 5. **System Architecture**
  //    - **High-level Architecture** (inferred system components)
  //    - **Technology Stack Recommendations** (based on complexity and scale)
  //    - **Third-party Integrations** (inferred from business needs)
  // 6. **Technical Requirements**
  //    - **Functional Requirements**: Detailed user stories with acceptance criteria (MoSCoW table)
  //    - **Non-functional Requirements**: Performance, scalability, security (specific metrics)
  //    - **API Requirements**: Key endpoints needed (inferred from workflows)
  // 7. **Data Architecture**
  //    - **Entities and Relationships** (inferred from business processes)
  //    - **Data Validation Rules**
  //    - **Data Security Requirements**
  // 8. **Security & Compliance**
  //    - Authentication and authorization needs
  //    - Data privacy requirements
  //    - Regulatory compliance (if applicable)
  // 9. **Integration Requirements**
  //    - Payment gateways, external APIs, notification systems
  //    - Data import/export needs
  // 10. **User Experience Requirements**
  //     - Key user journeys and interaction patterns
  //     - Mobile/responsive considerations
  // 11. **Development Phases**
  //     - **MVP Features** (Phase 1)
  //     - **Enhanced Features** (Phase 2+)
  //     - **Dependencies and Prerequisites**
  // 12. **Success Metrics & KPIs**
  //     - Business metrics and technical performance indicators
  // 13. **Risk Assessment**
  //     - Technical risks, business risks, and mitigation strategies

  // ---

  // **Enhanced Instructions for Technical Sections:**
  // **For Functional Requirements:**
  // - Convert each business capability into specific user stories
  // - Include acceptance criteria for each story
  // - Estimate complexity (Simple/Medium/Complex)
  // - Group related stories into epics
  // **For System Architecture:**
  // - Infer system components from user workflows
  // - Suggest appropriate technology stack based on scale and complexity
  // - Identify required integrations from business processes
  // **For Data Model:**
  // - Extract entities from business processes and user workflows
  // - Define relationships between entities
  // - Include data validation and business rules
  // **Constraints:**
  // - Use ONLY the metadata as the source of truth
  // - Make intelligent technical inferences from business context
  // - Every section must be actionable for development planning
  // - Include specific, measurable requirements where possible
  // - The final BRD must be ready for immediate JIRA task creation

  // **Quality Check:**
  // Ask yourself: "Could a development team use this BRD to immediately start sprint planning and task creation?" If not, add more technical detail.`;
  const prompt = `Just give a simple and dummy markdown which looks like a BRD. Must be atleast 2 pages`;
  //   const prompt = `You are a senior technical business analyst creating a machine-parseable Business Requirements Document (BRD) that will be automatically converted into a JIRA project by another AI agent.

  // **CRITICAL OBJECTIVE:** Generate a BRD with explicit, structured technical specifications that can be directly parsed into JIRA epics, user stories, and development tasks.

  // **Input:** A metadata JSON containing structured business information about the project.
  // Metadata JSON: ${JSON.stringify(metadata)}

  // **Technical Inference Guidelines:**
  // - From business workflows → infer specific API endpoints, database entities, and frontend components
  // - From target audience and scale → determine concrete performance requirements and infrastructure needs
  // - From competitive analysis → identify specific feature complexity and integration requirements
  // - From pricing strategy → infer detailed billing system and subscription management needs

  // **OUTPUT FORMAT:** Structured Technical BRD in Markdown with explicit machine-readable sections.

  // ---

  // # Technical Business Requirements Document
  // **Project:** [Inferred from idea]
  // **Generated:** [Current date]
  // **Source:** Business metadata analysis

  // ## 1. Executive Summary
  // ### Project Overview
  // [2-3 sentence technical summary]

  // ### Technology Approach
  // [Specific architecture decisions inferred from business complexity]

  // ### Success Metrics
  // [Business KPIs only - keep brief]

  // ---

  // ## 2. System Architecture
  // ### High-Level Components
  // | Component | Technology | Purpose | Dependencies |
  // |-----------|------------|---------|--------------|
  // | [Component] | [Tech Stack] | [Function] | [Prerequisites] |

  // ### Technology Stack
  // | Layer | Technology | Justification |
  // |-------|------------|---------------|
  // | Frontend | [Specific choice] | [Reason based on complexity] |
  // | Backend | [Specific choice] | [Reason based on requirements] |
  // | Database | [Specific choice] | [Reason based on data needs] |
  // | Infrastructure | [Specific choice] | [Reason based on scale] |

  // ---

  // ## 3. Data Architecture
  // ### Entity Definitions
  // {
  //   "entities": [
  //     {
  //       "name": "User",
  //       "attributes": ["id", "email", "password_hash", "created_at"],
  //       "relationships": ["hasMany: Projects", "belongsTo: Organization"],
  //       "validations": ["email: unique, format", "password: min 8 chars"]
  //     }
  //   ]
  // }

  // ### API Endpoint Specifications
  // | Endpoint | Method | Purpose | Auth Required | Request Schema | Response Schema |
  // |----------|--------|---------|---------------|----------------|-----------------|
  // | /api/users | POST | User registration | No | {email, password} | {id, token} |

  // ---

  // ## 4. Development Specifications

  // ### Epic Breakdown
  // {
  //   "epics": [
  //     {
  //       "id": "EP-001",
  //       "name": "User Authentication System",
  //       "priority": "Must",
  //       "estimated_sprints": 2,
  //       "stories": ["US-001", "US-002", "US-003"]
  //     }
  //   ]
  // }

  // ### User Stories with Technical Tasks

  // #### Epic: User Authentication System (EP-001)

  // **US-001: User Registration**
  // - **Priority:** Must
  // - **Complexity:** Medium (8 story points)
  // - **Sprint:** 1
  // - **Dependencies:** Database setup, email service integration

  // **Acceptance Criteria:**
  // - [ ] User can register with email/password
  // - [ ] Email validation before account activation
  // - [ ] Password meets security requirements (8+ chars, complexity)
  // - [ ] Duplicate email registration prevented

  // **Technical Task Breakdown:**
  // | Task ID | Component | Description | Estimated Hours | Dependencies |
  // |---------|-----------|-------------|-----------------|--------------|
  // | T-001-1 | Backend | Create User model with validations | 4 | Database schema |
  // | T-001-2 | Backend | Implement POST /api/auth/register endpoint | 6 | User model |
  // | T-001-3 | Backend | Add email verification system | 8 | Email service |
  // | T-001-4 | Frontend | Build registration form component | 6 | UI library setup |
  // | T-001-5 | Frontend | Add form validation and error handling | 4 | Registration form |
  // | T-001-6 | Testing | Unit tests for registration logic | 4 | Backend implementation |
  // | T-001-7 | Testing | E2E registration flow test | 4 | Frontend implementation |

  // **Definition of Done:**
  // - [ ] All tests passing
  // - [ ] Code reviewed and approved
  // - [ ] Documentation updated
  // - [ ] Security review completed

  // ---

  // **US-002: User Login**
  // - **Priority:** Must
  // - **Complexity:** Small (5 story points)
  // - **Sprint:** 1
  // - **Dependencies:** US-001 (User Registration)

  // **Acceptance Criteria:**
  // - [ ] User can login with valid credentials
  // - [ ] JWT token generated on successful login
  // - [ ] Invalid credentials show appropriate error
  // - [ ] Session management implemented

  // **Technical Task Breakdown:**
  // | Task ID | Component | Description | Estimated Hours | Dependencies |
  // |---------|-----------|-------------|-----------------|--------------|
  // | T-002-1 | Backend | Implement POST /api/auth/login endpoint | 4 | User model |
  // | T-002-2 | Backend | Add JWT token generation and validation | 6 | Auth system |
  // | T-002-3 | Frontend | Build login form component | 4 | Auth context |
  // | T-002-4 | Frontend | Implement token storage and auth state | 6 | Login form |
  // | T-002-5 | Testing | Login flow unit and integration tests | 4 | Implementation |

  // **Definition of Done:**
  // - [ ] All tests passing
  // - [ ] Security audit completed
  // - [ ] Token expiration handling implemented
  // - [ ] Documentation updated

  // ---

  // ## 5. Non-Functional Requirements
  // | Requirement | Specification | Measurement | Priority |
  // |-------------|---------------|-------------|----------|
  // | Performance | API response < 300ms (p95) | Response time monitoring | Must |
  // | Scalability | Support 100k concurrent users | Load testing | Should |
  // | Security | TLS 1.3, encrypted at rest | Security audit | Must |
  // | Availability | 99.9% uptime | Uptime monitoring | Must |

  // ---

  // ## 6. Integration Requirements
  // | Integration | Purpose | Implementation Approach | Complexity |
  // |-------------|---------|------------------------|------------|
  // | Payment Gateway | Subscription billing | Stripe API integration | Medium |
  // | Email Service | Notifications | SendGrid API | Simple |
  // | AI Models | Core analysis | OpenAI API + caching layer | Complex |

  // ---

  // ## 7. Development Timeline
  // ### Phase 1: MVP (8 weeks)
  // | Sprint | Duration | Focus | Deliverables |
  // |--------|----------|-------|--------------|
  // | Sprint 1 | 2 weeks | User Auth + Project Setup | Authentication system, CI/CD |
  // | Sprint 2 | 2 weeks | Core Data Models + APIs | Database, basic CRUD APIs |
  // | Sprint 3 | 2 weeks | Business Logic + Frontend | Core features, UI components |
  // | Sprint 4 | 2 weeks | Integration + Testing | Payment, email, comprehensive testing |

  // ### Dependencies and Blockers
  // | Item | Type | Impact | Mitigation |
  // |------|------|--------|------------|
  // | AI Model API Access | External | High | Secure API keys, fallback options |
  // | Payment Gateway Approval | Process | Medium | Apply early, prepare alternatives |

  // ---

  // ## 8. JIRA Project Configuration

  // ### Project Settings
  // {
  //   "project_name": "[Inferred from business name]",
  //   "project_key": "[3-letter abbreviation]",
  //   "project_type": "Software Development",
  //   "workflow": "Kanban",
  //   "issue_types": ["Epic", "Story", "Task", "Bug", "Subtask"]
  // }

  // ### Sprint Configuration
  // {
  //   "sprint_length": "2 weeks",
  //   "story_points_scale": "Fibonacci (1,2,3,5,8,13)",
  //   "velocity_target": "40 points per sprint",
  //   "team_capacity": "5 developers × 6 hours/day × 10 days = 300 hours"
  // }

  // ### Custom Fields Required
  // | Field Name | Type | Purpose | Values |
  // |------------|------|---------|--------|
  // | Component Type | Select | Technical categorization | Backend, Frontend, Database, DevOps |
  // | Technical Complexity | Select | Effort estimation | Simple, Medium, Complex |
  // | Business Priority | Select | Feature prioritization | Must, Should, Could, Won't |

  // ---

  // ## 9. Machine-Readable Summary

  // {
  //   "project_metadata": {
  //     "name": "[Project name]",
  //     "total_epics": 6,
  //     "total_stories": 24,
  //     "estimated_duration_weeks": 12,
  //     "team_size_recommended": 5,
  //     "technology_complexity": "Medium",
  //     "external_integrations": 3
  //   },
  //   "epic_summary": [
  //     {
  //       "id": "EP-001",
  //       "name": "User Authentication System",
  //       "story_count": 4,
  //       "story_points": 28,
  //       "sprint_allocation": [1, 2]
  //     }
  //   ],
  //   "development_priorities": {
  //     "mvp_stories": ["US-001", "US-002", "US-005", "US-007"],
  //     "phase_2_stories": ["US-003", "US-004", "US-006", "US-008"],
  //     "technical_debt_allocation": "20% per sprint"
  //   },
  //   "risk_flags": [
  //     {
  //       "area": "AI Integration",
  //       "risk_level": "High",
  //       "mitigation_required": true
  //     }
  //   ]
  // }

  // ---

  // **PARSING INSTRUCTIONS FOR JIRA AGENT:**
  // 1. Extract epics from "Epic Breakdown" JSON
  // 2. Create user stories from each "US-XXX" section with:
  //    - Title from story header
  //    - Description from acceptance criteria
  //    - Story points from complexity rating
  //    - Sprint assignment from sprint field
  // 3. Generate subtasks from "Technical Task Breakdown" tables
  // 4. Apply custom field values from structured data
  // 5. Create dependencies from "Dependencies" fields
  // 6. Set up sprints based on "Development Timeline"

  // **VALIDATION CHECKLIST:**
  // - [ ] Every user story has explicit technical tasks
  // - [ ] All estimates are numeric and consistent
  // - [ ] Dependencies are clearly mapped
  // - [ ] Machine-readable JSON blocks are syntactically correct
  // - [ ] Epic/Story/Task hierarchy is complete`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini", // ✅ use a valid model name
      messages: [{ role: "user", content: prompt }],
    });

    const markdown =
      completion.choices[0].message.content || "# BRD\n\nNo content.";
    console.log(markdown);

    return { markdown };
  } catch (err: any) {
    // Log full details for debugging
    console.error("OpenAI API Error:", err);

    // Optionally surface a safer error up to the API response
    throw new Error(
      `Failed to generate document: ${
        err.response?.data?.error?.message || err.message
      }`
    );
  }
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
