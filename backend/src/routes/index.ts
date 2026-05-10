/* routes/index.ts — root API router.
 * Mounts all feature routers under /api (the prefix is set in app.ts).
 * Adding a new feature: create a new routes file and use() it here. */

import { Router } from "express";
import healthRouter from "./health";
import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";
import commentRoutes from "./comment.routes";
import likeRoutes from "./like.routes";
import userRoutes from "./user.routes";
import cameraRoutes from "./camera.routes";
import feedRoutes from "./feed.routes";
import uploadRoutes from "./upload.routes";
import searchRoutes from "./search.routes";

const router = Router();

router.use(healthRouter);     /* GET /health — liveness probe */
router.use(authRoutes);       /* /auth/signup, /auth/login, /auth/me, etc. */
router.use(postRoutes);       /* /posts CRUD */
router.use(commentRoutes);    /* /posts/:id/comments */
router.use(likeRoutes);       /* /posts/:id/like, /posts/:id/unlike */
router.use(userRoutes);       /* /users/:id, follow/unfollow */
router.use(cameraRoutes);     /* /cameras — read-only camera list */
router.use(feedRoutes);       /* /feed — personalized timeline */
router.use(uploadRoutes);     /* /upload — Cloudinary image upload */
router.use(searchRoutes);     /* /search/suggestions, /search/save, etc. */

export default router;
