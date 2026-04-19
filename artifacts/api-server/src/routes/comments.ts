import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, commentsTable, usersTable, postsTable } from "@workspace/db";
import {
  CreateCommentBody,
  CreateCommentParams,
  ListCommentsParams,
  DeleteCommentParams,
} from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: IRouter = Router();

router.get("/posts/:id/comments", async (req, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, params.data.id))
    .orderBy(asc(commentsTable.createdAt));

  const enriched = await Promise.all(
    comments.map(async (c) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId));
      const { passwordHash: _, ...safeUser } = user ?? { passwordHash: "" };
      return { ...c, user: safeUser };
    })
  );

  res.json(enriched);
});

router.post("/posts/:id/comments", authMiddleware, async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ content: parsed.data.content, userId: req.userId!, postId: params.data.id })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ ...comment, user: safeUser });
});

router.delete("/comments/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, params.data.id));
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (comment.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
