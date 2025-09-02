import { Router } from "express";
import { mcpListTools, mcpCall, mcpReset } from "../controllers/mcp.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/tools", authMiddleware, mcpListTools);
router.post("/call", authMiddleware, mcpCall);
router.post("/reset", authMiddleware, mcpReset);

export default router;
