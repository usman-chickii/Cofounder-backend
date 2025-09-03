// src/routes/jira.routes.ts
import { Router } from "express";
import { generateJiraTasksController } from "../controllers/jira.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/generate-jira-tasks/:projectId",
  authMiddleware,
  generateJiraTasksController
);

export default router;
