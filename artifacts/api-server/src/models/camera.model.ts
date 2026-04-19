import { eq } from "drizzle-orm";
import { db, camerasTable } from "@workspace/db";

export type CameraRow = typeof camerasTable.$inferSelect;
export type CreateCameraData = Pick<CameraRow, "name"> & Partial<Pick<CameraRow, "brand" | "type" | "description">>;

export async function listCameras(): Promise<CameraRow[]> {
  return db.select().from(camerasTable).orderBy(camerasTable.name);
}

export async function findCameraById(id: number): Promise<CameraRow | null> {
  const [camera] = await db.select().from(camerasTable).where(eq(camerasTable.id, id));
  return camera ?? null;
}

export async function createCamera(data: CreateCameraData): Promise<CameraRow> {
  const [camera] = await db.insert(camerasTable).values(data).returning();
  return camera;
}

export async function updateCamera(
  id: number,
  data: Partial<CreateCameraData>,
): Promise<CameraRow | null> {
  const [camera] = await db.update(camerasTable).set(data).where(eq(camerasTable.id, id)).returning();
  return camera ?? null;
}

export async function deleteCamera(id: number): Promise<void> {
  await db.delete(camerasTable).where(eq(camerasTable.id, id));
}
