import type { Request, Response } from "express";
import { UploadImageBody } from "../api-validators";
import { processImageUpload } from "../services/upload.service";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const parsed = UploadImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await processImageUpload(parsed.data.dataUrl);
  res.json(result);
}
