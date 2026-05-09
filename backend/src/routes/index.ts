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

router.use(healthRouter);
router.use(authRoutes);
router.use(postRoutes);
router.use(commentRoutes);
router.use(likeRoutes);
router.use(userRoutes);
router.use(cameraRoutes);
router.use(feedRoutes);
router.use(uploadRoutes);
router.use(searchRoutes);

export default router;
