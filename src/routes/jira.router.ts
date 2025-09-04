// src/routes/jira.routes.ts
import { Router } from "express";
import {
  generateJiraTasksController,
  connectJira,
  jiraCallback,
  getJiraProjectsController,
} from "../controllers/jira.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/connect", authMiddleware, connectJira);
router.get("/callback", jiraCallback);

router.post(
  "/generate-jira-tasks/:projectId",
  authMiddleware,
  generateJiraTasksController
);

router.get("/projects", authMiddleware, getJiraProjectsController);

export default router;
