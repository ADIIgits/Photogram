import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, likesTable, postsTable, usersTable } from "@workspace/db";
import {
  LikePostParams,
  UnlikePostParams,
  GetPostLikesParams,
} from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: IRouter = Router();

router.post("/posts/:id/like", authMiddleware, async (req, res): Promise<void> => {
  const params = LikePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  try {
    await db.insert(likesTable).values({ userId: req.userId!, postId: params.data.id });
    res.json({ message: "Post liked" });
  } catch {
    res.status(409).json({ error: "Already liked" });
  }
});

router.delete("/posts/:id/like", authMiddleware, async (req, res): Promise<void> => {
  const params = UnlikePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(likesTable)
    .where(eq(likesTable.postId, params.data.id))
    .where(eq(likesTable.userId, req.userId!));
  res.json({ message: "Post unliked" });
});

router.get("/posts/:id/likes", async (req, res): Promise<void> => {
  const params = GetPostLikesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.postId, params.data.id));

  const likeRows = await db
    .select()
    .from(likesTable)
    .where(eq(likesTable.postId, params.data.id));

  const users = await Promise.all(
    likeRows.map(async (l) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, l.userId));
      if (!user) return null;
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    })
  );

  res.json({ count: countResult?.count ?? 0, users: users.filter(Boolean) });
});

export default router;
