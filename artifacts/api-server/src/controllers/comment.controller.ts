import type { Request, Response } from "express";
import {
  CreateCommentBody,
  ListCommentsParams,
  CreateCommentParams,
  DeleteCommentParams,
} from "@workspace/api-zod";
import * as CommentService from "../services/comment.service";

export async function listComments(req: Request, res: Response): Promise<void> {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const comments = await CommentService.listComments(params.data.id);
  res.json(comments);
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const comment = await CommentService.addComment(params.data.id, req.userId!, parsed.data.content);
  res.status(201).json(comment);
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await CommentService.removeComment(params.data.id, req.userId!);
  res.sendStatus(204);
}
