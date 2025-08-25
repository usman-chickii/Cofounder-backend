import { Router } from "express";
import {
  getProjects,
  createProject,
  deleteProject,
  getProjectById,
  getProjectsWithLimit,
  generateDocument,
  getProjectBlocks,
} from "../controllers/project.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { createProjectSchema } from "../validation/projectSchema";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  downloadDocument,
  saveDocumentInProjectBlock,
} from "../controllers/document.controller";

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
router.get("/:projectId/documents/:blockId/download", downloadDocument);
router.post(
  "/:projectId/documents/save-block",
  authMiddleware,
  saveDocumentInProjectBlock
);
router.get("/:projectId/blocks", authMiddleware, getProjectBlocks);
router.delete("/:projectId", deleteProject);

export default router;
