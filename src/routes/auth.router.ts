// routes/auth.routes.ts
import express from "express";
import {
  signup,
  login,
  logout,
  me,
  oAuthSync,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/oauth-sync", oAuthSync);
router.post("/logout", logout);
router.get("/me", me);

export default router;
