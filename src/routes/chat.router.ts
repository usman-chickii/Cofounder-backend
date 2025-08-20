import { Router } from "express";
import { chat, chatStream } from "../controllers/chat.controller";

const router = Router();

router.post("/:projectId", chat);
router.post("/stream/:projectId", chatStream);

export default router;
