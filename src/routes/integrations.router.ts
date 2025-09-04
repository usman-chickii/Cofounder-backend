import { Router } from "express";
import * as integrationController from "../controllers/integration.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Public endpoint (no auth required)
router.get("/available", integrationController.fetchAvailableIntegrations);

// Requires logged in user
router.get(
  "/user",
  authMiddleware,
  integrationController.fetchUserIntegrations
);

export default router;
