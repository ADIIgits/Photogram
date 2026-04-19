import { Router, type IRouter } from "express";
import { UploadImageBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: IRouter = Router();

router.post("/upload/image", authMiddleware, async (req, res): Promise<void> => {
  const parsed = UploadImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dataUrl } = parsed.data;

  // Check if it's a valid data URL or a regular URL
  if (dataUrl.startsWith("data:")) {
    // Mock: return the data URL as-is (in production would upload to Cloudinary)
    // For now we just pass through the dataURL
    res.json({ url: dataUrl });
    return;
  }

  // If it's already a URL, just return it
  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    res.json({ url: dataUrl });
    return;
  }

  res.status(400).json({ error: "Invalid image data" });
});

export default router;
