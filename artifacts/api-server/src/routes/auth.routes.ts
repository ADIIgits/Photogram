import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/auth/signup", AuthController.signup);
router.post("/auth/send-otp", AuthController.sendOtp);
router.post("/auth/verify-otp", AuthController.verifyOtp);
router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.get("/auth/me", authMiddleware, AuthController.getMe);
router.post("/auth/refresh", AuthController.refreshToken);

export default router;
