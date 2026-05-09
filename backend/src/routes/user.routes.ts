import { Router } from "express";
import * as UserController from "../controllers/user.controller";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/users/:id", optionalAuth, UserController.getUser);
router.patch("/users/:id", authMiddleware, UserController.updateUser);
router.post("/users/:id/follow", authMiddleware, UserController.followUser);
router.delete("/users/:id/follow", authMiddleware, UserController.unfollowUser);
router.get("/users/:id/posts", optionalAuth, UserController.getUserPosts);

export default router;
