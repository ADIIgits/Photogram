import { Router } from "express";
import * as PostController from "../controllers/post.controller";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/posts", optionalAuth, PostController.listPosts);
router.post("/posts", authMiddleware, PostController.createPost);
router.get("/posts/:id", optionalAuth, PostController.getPost);
router.patch("/posts/:id", authMiddleware, PostController.updatePost);
router.delete("/posts/:id", authMiddleware, PostController.deletePost);

export default router;
