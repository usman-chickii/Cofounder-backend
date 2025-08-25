import { Request, Response } from "express";
import { downloadDocumentService } from "../services/document.service";
import { createProjectBlock } from "../services/projectBlock.service";

export async function downloadDocument(req: Request, res: Response) {
  try {
    const { projectId, blockId } = req.params;

    const { url } = await downloadDocumentService(projectId, blockId);

    return res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function saveDocumentInProjectBlock(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { markdown, title = "Business Requirement Document" } = req.body;

    const block = await createProjectBlock(projectId, {
      project_id: projectId,
      type: "brd",
      title: title,
      summary: markdown.slice(0, 200),
      status: "draft",
      content: markdown,
    });

    return res.status(201).json({ success: true, block });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
