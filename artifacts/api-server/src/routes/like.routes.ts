import { Router } from "express";
import * as LikeController from "../controllers/like.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/posts/:id/like", authMiddleware, LikeController.likePost);
router.delete("/posts/:id/like", authMiddleware, LikeController.unlikePost);
router.get("/posts/:id/likes", LikeController.getPostLikes);

export default router;
