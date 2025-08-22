import { Router } from "express";
import { chat, chatStream } from "../controllers/chat.controller";

const router = Router();

router.post("/:projectId", chat);
router.post("/:projectId/stream", chatStream);

export default router;
