import { Router } from "express";
import {
  getMessages,
  addMessage,
  deleteMessage,
} from "../controllers/message.controller";
import { createMessageSchema } from "../validation/messageSchema";
import { validateRequest } from "../middleware/validateRequest.middleware";

const router = Router();

router.get("/:projectId", getMessages);
router.post("/", validateRequest(createMessageSchema), addMessage);
router.delete("/:messageId", deleteMessage);

export default router;
