import { Router } from "express";
import * as UploadController from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/upload/image", authMiddleware, UploadController.uploadImage);

export default router;
