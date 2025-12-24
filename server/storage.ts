import { db } from "./db";
import {
  savedPlaces,
  type InsertSavedPlace,
  type SavedPlace,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Saved Places CRUD
  getSavedPlaces(): Promise<SavedPlace[]>;
  createSavedPlace(place: InsertSavedPlace): Promise<SavedPlace>;
  deleteSavedPlace(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSavedPlaces(): Promise<SavedPlace[]> {
    return await db.select().from(savedPlaces);
  }

  async createSavedPlace(place: InsertSavedPlace): Promise<SavedPlace> {
    const [saved] = await db.insert(savedPlaces).values(place).returning();
    return saved;
  }

  async deleteSavedPlace(id: number): Promise<void> {
    await db.delete(savedPlaces).where(eq(savedPlaces.id, id));
  }
}

export const storage = new DatabaseStorage();
