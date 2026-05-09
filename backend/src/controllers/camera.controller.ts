import type { Request, Response } from "express";
import {
  CreateCameraBody,
  UpdateCameraBody,
  GetCameraParams,
  UpdateCameraParams,
  DeleteCameraParams,
} from "@workspace/api-zod";
import * as CameraService from "../services/camera.service";

export async function listCameras(_req: Request, res: Response): Promise<void> {
  const cameras = await CameraService.getCameras();
  res.json(cameras);
}

export async function getCamera(req: Request, res: Response): Promise<void> {
  const params = GetCameraParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const camera = await CameraService.getCamera(params.data.id);
  res.json(camera);
}

export async function createCamera(req: Request, res: Response): Promise<void> {
  const parsed = CreateCameraBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const camera = await CameraService.addCamera(req.userId!, parsed.data);
  res.status(201).json(camera);
}

export async function updateCamera(req: Request, res: Response): Promise<void> {
  const params = UpdateCameraParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCameraBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const camera = await CameraService.editCamera(req.userId!, params.data.id, parsed.data);
  res.json(camera);
}

export async function deleteCamera(req: Request, res: Response): Promise<void> {
  const params = DeleteCameraParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await CameraService.removeCamera(req.userId!, params.data.id);
  res.sendStatus(204);
}
