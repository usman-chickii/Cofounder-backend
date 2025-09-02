// src/routes/jira.routes.ts
import { Router } from "express";
import { createJiraBoard } from "../controllers/jira.controller";

const router = Router();

router.post("/create-board", createJiraBoard);

export default router;
