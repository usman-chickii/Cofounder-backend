import { Router } from "express";
import {
  getMessages,
  addMessage,
  deleteMessage,
} from "../controllers/message.controller";

const router = Router();

router.get("/:projectId", getMessages);
router.post("/", addMessage);
router.delete("/:messageId", deleteMessage);

export default router;
