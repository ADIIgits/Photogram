import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import postsRouter from "./posts";
import likesRouter from "./likes";
import commentsRouter from "./comments";
import camerasRouter from "./cameras";
import feedRouter from "./feed";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(likesRouter);
router.use(commentsRouter);
router.use(camerasRouter);
router.use(feedRouter);
router.use(uploadRouter);

export default router;
