import { prisma, type Camera } from "../db";

export type CameraRow = Camera;
export type CreateCameraData = { name: string; iconUrl?: string | null };

export async function listCameras(): Promise<Camera[]> {
  return prisma.camera.findMany({ orderBy: { name: "asc" } });
}

export async function findCameraById(id: number): Promise<Camera | null> {
  return prisma.camera.findUnique({ where: { id } });
}

export async function createCamera(data: CreateCameraData): Promise<Camera> {
  return prisma.camera.create({ data });
}

export async function updateCamera(
  id: number,
  data: Partial<CreateCameraData>,
): Promise<Camera | null> {
  try {
    return await prisma.camera.update({ where: { id }, data });
  } catch {
    return null;
  }
}

export async function deleteCamera(id: number): Promise<void> {
  await prisma.camera.delete({ where: { id } }).catch(() => undefined);
}
