import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["sb-access-token"];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  (req as any).user = data.user;
  console.log(data.user);
  next();
};
