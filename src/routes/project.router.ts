import { Router } from "express";
import {
  getProjects,
  createProject,
  deleteProject,
  getProjectById,
} from "../controllers/project.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { createProjectSchema } from "../validation/projectSchema";

const router = Router();

router.get("/", getProjects);
router.get("/:projectId", getProjectById);
router.post("/", validateRequest(createProjectSchema), createProject);
router.delete("/:projectId", deleteProject);

export default router;
