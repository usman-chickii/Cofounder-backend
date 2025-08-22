import { Router } from "express";
import {
  getProjects,
  createProject,
  deleteProject,
  getProjectById,
  getProjectsWithLimit,
  generateDocument,
} from "../controllers/project.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { createProjectSchema } from "../validation/projectSchema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getProjects);
router.get("/recent", authMiddleware, getProjectsWithLimit);
router.get("/:projectId", authMiddleware, getProjectById);
router.post(
  "/",
  authMiddleware,
  validateRequest(createProjectSchema),
  createProject
);
router.post("/:projectId/generate-document", authMiddleware, generateDocument);
router.delete("/:projectId", deleteProject);

export default router;
