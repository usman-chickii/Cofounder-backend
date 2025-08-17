import express from "express";
import {
  completeOnboarding,
  getProfile,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.post("/onboarding", authMiddleware, completeOnboarding);

export default router;
