import { Request, Response } from "express";
import {
  addMessageDB,
  deleteMessageDB,
  getMessagesByProjectDB,
} from "../services/message.service";

export const getMessages = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const messages = await getMessagesByProjectDB(projectId);
  res.status(200).json(messages);
};

export const addMessage = async (req: Request, res: Response) => {
  const { projectId, role, content } = req.body;
  const message = await addMessageDB(projectId, role, content);
  res.status(201).json(message);
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const message = await deleteMessageDB(messageId);
  res.status(200).json(message);
};
