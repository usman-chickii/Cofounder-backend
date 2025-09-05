import { getBrd } from "../services/projectBlock.service";
import { Request, Response } from "express";

export const getBrdController = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const brd = await getBrd(projectId);
    console.log("brd", brd);
    res.status(200).json(brd);
  } catch (error) {
    res.status(500).json({ message: "Failed to get BRD" });
  }
};
