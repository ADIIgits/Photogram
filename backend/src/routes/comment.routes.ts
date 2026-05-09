import { Router } from "express";
import * as CommentController from "../controllers/comment.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/posts/:id/comments", CommentController.listComments);
router.post("/posts/:id/comments", authMiddleware, CommentController.createComment);
router.delete("/comments/:id", authMiddleware, CommentController.deleteComment);

export default router;
