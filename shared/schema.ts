import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll use this table to let users "bookmark" their favorite places
export const savedPlaces = pgTable("saved_places", {
  id: serial("id").primaryKey(),
  osmId: text("osm_id").notNull(), // OpenStreetMap ID
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  type: text("type").notNull(), // e.g., "playground", "museum"
  address: text("address"),
  notes: text("notes"),
});

export const insertSavedPlaceSchema = createInsertSchema(savedPlaces).omit({ id: true });

export type SavedPlace = typeof savedPlaces.$inferSelect;
export type InsertSavedPlace = z.infer<typeof insertSavedPlaceSchema>;

// Types for the Overpass API response (not stored in DB, but used for API contract)
export const osmLocationSchema = z.object({
  id: z.number(),
  lat: z.number(),
  lon: z.number(),
  name: z.string().optional(),
  type: z.string(), // Mapped from tags (e.g. "Leisure: Park" -> "park")
  tags: z.record(z.string()).optional(),
});

export type OsmLocation = z.infer<typeof osmLocationSchema>;
