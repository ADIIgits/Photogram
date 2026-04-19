import { Router } from "express";
import * as CameraController from "../controllers/camera.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/cameras", CameraController.listCameras);
router.post("/cameras", authMiddleware, CameraController.createCamera);
router.get("/cameras/:id", CameraController.getCamera);
router.patch("/cameras/:id", authMiddleware, CameraController.updateCamera);
router.delete("/cameras/:id", authMiddleware, CameraController.deleteCamera);

export default router;
