import type { Request, Response } from "express";
import {
  CreatePostBody,
  UpdatePostBody,
  GetPostParams,
  UpdatePostParams,
  DeletePostParams,
  ListPostsQueryParams,
} from "@workspace/api-zod";
import * as PostService from "../services/post.service";

export async function listPosts(req: Request, res: Response): Promise<void> {
  const query = ListPostsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const result = await PostService.getPosts(page, limit, req.userId);
  res.json(result);
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const post = await PostService.getPost(params.data.id, req.userId);
  res.json(post);
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const post = await PostService.addPost(req.userId!, parsed.data, req.userId);
  res.status(201).json(post);
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const post = await PostService.editPost(params.data.id, req.userId!, parsed.data);
  res.json(post);
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await PostService.removePost(params.data.id, req.userId!);
  res.sendStatus(204);
}
