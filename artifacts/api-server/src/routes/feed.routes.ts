import { Router } from "express";
import * as FeedController from "../controllers/feed.controller";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/feed", authMiddleware, FeedController.getFeed);
router.get("/discover", optionalAuth, FeedController.getDiscover);
router.get("/stats/summary", optionalAuth, FeedController.getStatsSummary);

export default router;
