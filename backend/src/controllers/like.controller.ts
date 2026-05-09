import type { Request, Response } from "express";
import { LikePostParams, UnlikePostParams, GetPostLikesParams } from "@workspace/api-zod";
import * as LikeService from "../services/like.service";

export async function likePost(req: Request, res: Response): Promise<void> {
  const params = LikePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const result = await LikeService.likePost(params.data.id, req.userId!);
  res.json(result);
}

export async function unlikePost(req: Request, res: Response): Promise<void> {
  const params = UnlikePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const result = await LikeService.unlikePost(params.data.id, req.userId!);
  res.json(result);
}

export async function getPostLikes(req: Request, res: Response): Promise<void> {
  const params = GetPostLikesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const result = await LikeService.getPostLikes(params.data.id);
  res.json(result);
}
