import { Request, Response } from "express";
import {
  addMessageDB,
  deleteMessageDB,
  getMessagesByProjectDB,
} from "../services/message.service";

export const getMessages = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const messages = await getMessagesByProjectDB(projectId);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to get messages" });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  const { projectId, role, content } = req.body;
  try {
    const message = await addMessageDB(projectId, role, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Failed to add message" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  try {
    const message = await deleteMessageDB(messageId);
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete message" });
  }
};
