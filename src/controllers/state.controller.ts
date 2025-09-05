import { getProjectState } from "../services/state.service";
import { Request, Response } from "express";

export const getState = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const state = await getProjectState(projectId);
  res.status(200).json(state);
};
