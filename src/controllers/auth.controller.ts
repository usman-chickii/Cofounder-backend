import { CookieOptions, Request, Response } from "express";
import { authService } from "../services/auth.service";

const setAuthCookie = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  res.cookie("sb-access-token", accessToken, cookieOptions);
  res.cookie("sb-refresh-token", refreshToken, cookieOptions);
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  try {
    const loginData = await authService.signup(email, password, fullName);
    setAuthCookie(
      res,
      loginData.session!.access_token,
      loginData.session!.refresh_token
    );
    res.status(201).json({
      message: "User created successfully",
      user: loginData.user,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      res.status(401).json({ message: error.message, error: error });
    } else {
      res.status(500).json({ message: "Internal server error", error: error });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const loginData = await authService.login(email, password);
    setAuthCookie(
      res,
      loginData.session!.access_token,
      loginData.session!.refresh_token
    );
    res
      .status(200)
      .json({ message: "User logged in successfully", user: loginData.user });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      res.status(401).json({ message: error.message, error: error });
    } else {
      res.status(500).json({ message: "Internal server error", error: error });
    }
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("sb-access-token");
    res.clearCookie("sb-refresh-token");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies["sb-access-token"];
  if (!token) return res.json({ user: null });
  try {
    const user = await authService.getUserFromToken(token as string);
    res.json(user);
  } catch (error) {
    res.status(401).json({ user: null });
  }
};

export const oAuthSync = async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body;
  console.log("access_token from sync function is:", accessToken);
  console.log("refresh_token from sync function is:", refreshToken);
  console.log(req.body);
  if (!accessToken || !refreshToken) {
    return res.status(400).json({ message: "Missing access or refresh token" });
  }
  const user = await authService.getUserFromToken(accessToken);
  console.log("user from sync function is:", user);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  res.cookie("sb-access-token", accessToken, cookieOptions);
  res.cookie("sb-refresh-token", refreshToken, cookieOptions);
  res.status(200).json({ message: "User logged in successfully", user: user });
};
