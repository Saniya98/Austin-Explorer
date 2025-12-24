import { db } from "./db";
import {
  savedPlaces,
  type InsertSavedPlace,
  type SavedPlace,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Saved Places CRUD (user-specific)
  getSavedPlaces(userId: string): Promise<SavedPlace[]>;
  createSavedPlace(place: InsertSavedPlace): Promise<SavedPlace>;
  deleteSavedPlace(id: number, userId: string): Promise<void>;
  toggleVisited(id: number, userId: string): Promise<SavedPlace | null>;
}

export class DatabaseStorage implements IStorage {
  async getSavedPlaces(userId: string): Promise<SavedPlace[]> {
    return await db.select().from(savedPlaces).where(eq(savedPlaces.userId, userId));
  }

  async createSavedPlace(place: InsertSavedPlace): Promise<SavedPlace> {
    const [saved] = await db.insert(savedPlaces).values(place).returning();
    return saved;
  }

  async deleteSavedPlace(id: number, userId: string): Promise<void> {
    await db.delete(savedPlaces).where(
      and(eq(savedPlaces.id, id), eq(savedPlaces.userId, userId))
    );
  }

  async toggleVisited(id: number, userId: string): Promise<SavedPlace | null> {
    const [existing] = await db.select().from(savedPlaces).where(
      and(eq(savedPlaces.id, id), eq(savedPlaces.userId, userId))
    );
    if (!existing) return null;
    
    const [updated] = await db.update(savedPlaces)
      .set({ visited: !existing.visited })
      .where(and(eq(savedPlaces.id, id), eq(savedPlaces.userId, userId)))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
