import { Request, Response } from "express";
import {
  getAllProjectsDB,
  getProjectByIdDB,
  createProjectDB,
  deleteProjectDB,
  getAllProjectsDBWithLimit,
  generateDocumentService,
} from "../services/project.service";
import { validate as isUuid } from "uuid";
import { ProjectCreateInput } from "../types/project";

export const getProjects = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const projects = await getAllProjectsDB(userId);
    if (!projects) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to get projects" });
  }
};

export const getProjectsWithLimit = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  console.log("userId from getProjectsWithLimit is:", userId);
  console.log("req.query from getProjectsWithLimit is:", req.query);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  console.log("limit from getProjectsWithLimit is:", limit);
  try {
    const projects = await getAllProjectsDBWithLimit(userId, limit);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to get projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!isUuid(projectId)) {
    return res.status(400).json({ message: "Project not found" });
  }
  try {
    const project = await getProjectByIdDB(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to get project" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { name, description, status = "In Progress" } = req.body;
  const userId = (req as any).user.id;
  console.log("userId from createProject is:", userId);
  const newProject: ProjectCreateInput = {
    name,
    description,
    status,
    user_id: userId,
  };
  console.log("newProject from createProject is:", newProject);
  try {
    const project = await createProjectDB(newProject);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const project = await deleteProjectDB(projectId);
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
};

export const generateDocument = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const document = await generateDocumentService(projectId);
    console.log("document from generateDocument is:", document);

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate document" });
  }
};
