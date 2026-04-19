import {
  listCameras,
  findCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
  type CreateCameraData,
} from "../models/camera.model";
import { findUserById } from "../models/user.model";

async function assertAdmin(userId: number): Promise<void> {
  const user = await findUserById(userId);
  if (!user?.isAdmin) throw Object.assign(new Error("Admin access required"), { status: 403 });
}

export async function getCameras() {
  return listCameras();
}

export async function getCamera(id: number) {
  const camera = await findCameraById(id);
  if (!camera) throw Object.assign(new Error("Camera not found"), { status: 404 });
  return camera;
}

export async function addCamera(userId: number, data: CreateCameraData) {
  await assertAdmin(userId);
  return createCamera(data);
}

export async function editCamera(userId: number, id: number, data: Partial<CreateCameraData>) {
  await assertAdmin(userId);
  const camera = await updateCamera(id, data);
  if (!camera) throw Object.assign(new Error("Camera not found"), { status: 404 });
  return camera;
}

export async function removeCamera(userId: number, id: number) {
  await assertAdmin(userId);
  const camera = await findCameraById(id);
  if (!camera) throw Object.assign(new Error("Camera not found"), { status: 404 });
  await deleteCamera(id);
}
