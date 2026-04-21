import type { Request, Response } from "express";
import {
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  FollowUserParams,
  UnfollowUserParams,
  GetUserPostsParams,
  GetUserPostsQueryParams,
} from "@workspace/api-zod";
import * as UserService from "../services/user.service";
import { getUserPosts as getUserPostsService } from "../services/post.service";

export async function getUser(req: Request, res: Response): Promise<void> {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const user = await UserService.getUser(params.data.id, req.userId);
  res.json(user);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = await UserService.editUser(params.data.id, req.userId!, parsed.data);
  res.json(user);
}

export async function followUser(req: Request, res: Response): Promise<void> {
  const params = FollowUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const result = await UserService.followUser(req.userId!, params.data.id);
  res.json(result);
}

export async function unfollowUser(req: Request, res: Response): Promise<void> {
  const params = UnfollowUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const result = await UserService.unfollowUser(req.userId!, params.data.id);
  res.json(result);
}

export async function getUserPosts(req: Request, res: Response): Promise<void> {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const params = GetUserPostsParams.safeParse({ id });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const query = GetUserPostsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;

  const result = await getUserPostsService(params.data.id, page, limit, req.userId);
  res.json(result);
}
