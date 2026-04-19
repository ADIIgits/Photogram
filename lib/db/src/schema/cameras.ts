import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const camerasTable = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
});

export const insertCameraSchema = createInsertSchema(camerasTable).omit({ id: true });
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof camerasTable.$inferSelect;
