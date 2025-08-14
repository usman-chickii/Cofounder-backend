import { Request, Response } from "express";
import {
  getAllProjectsDB,
  getProjectByIdDB,
  createProjectDB,
  deleteProjectDB,
} from "../services/project.service";
import { validate as isUuid } from "uuid";
import { ProjectCreateInput } from "../types/project";

export const getProjects = async (req: Request, res: Response) => {
  // TODO: Add auth middleware
  const userId = "78479c75-0f06-45cb-b823-89d60781bef3"; // will have to add auth middleware and add req.user.id
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
  const { name, description, status = "in_progress" } = req.body;
  const userId = "78479c75-0f06-45cb-b823-89d60781bef3"; // will have to add auth middleware and add req.user.id
  const newProject: ProjectCreateInput = {
    name,
    description,
    status,
    user_id: userId,
  };
  try {
    const project = await createProjectDB(newProject);
    res.status(201).json(project);
  } catch (error) {
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
