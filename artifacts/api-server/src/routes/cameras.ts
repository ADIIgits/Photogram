import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, camerasTable, usersTable } from "@workspace/db";
import {
  CreateCameraBody,
  UpdateCameraBody,
  GetCameraParams,
  UpdateCameraParams,
  DeleteCameraParams,
} from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/cameras", async (_req, res): Promise<void> => {
  const cameras = await db.select().from(camerasTable).orderBy(camerasTable.name);
  res.json(cameras);
});

router.post("/cameras", authMiddleware, async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const parsed = CreateCameraBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [camera] = await db.insert(camerasTable).values(parsed.data).returning();
  res.status(201).json(camera);
});

router.get("/cameras/:id", async (req, res): Promise<void> => {
  const params = GetCameraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [camera] = await db.select().from(camerasTable).where(eq(camerasTable.id, params.data.id));
  if (!camera) {
    res.status(404).json({ error: "Camera not found" });
    return;
  }

  res.json(camera);
});

router.patch("/cameras/:id", authMiddleware, async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = UpdateCameraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCameraBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [camera] = await db
    .update(camerasTable)
    .set(parsed.data)
    .where(eq(camerasTable.id, params.data.id))
    .returning();

  if (!camera) {
    res.status(404).json({ error: "Camera not found" });
    return;
  }

  res.json(camera);
});

router.delete("/cameras/:id", authMiddleware, async (req, res): Promise<void> => {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const params = DeleteCameraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [camera] = await db.select().from(camerasTable).where(eq(camerasTable.id, params.data.id));
  if (!camera) {
    res.status(404).json({ error: "Camera not found" });
    return;
  }

  await db.delete(camerasTable).where(eq(camerasTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
