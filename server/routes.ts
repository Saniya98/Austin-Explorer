import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Saved Places Routes (Protected) ---

  app.get(api.savedPlaces.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const places = await storage.getSavedPlaces(userId);
    res.json(places);
  });

  app.post(api.savedPlaces.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.savedPlaces.create.input.parse(req.body);
      const place = await storage.createSavedPlace({ 
        osmId: input.osmId,
        name: input.name,
        lat: input.lat,
        lon: input.lon,
        type: input.type,
        address: input.address,
        notes: input.notes,
        visited: false,
        userId 
      });
      res.status(201).json(place);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.savedPlaces.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    await storage.deleteSavedPlace(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.patch("/api/saved-places/:id/visited", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const updated = await storage.toggleVisited(Number(req.params.id), userId);
    if (!updated) {
      return res.status(404).json({ message: "Place not found" });
    }
    res.json(updated);
  });

  // --- OSM Proxy Route ---

  app.get(api.places.search.path, async (req, res) => {
    try {
      // Default to Central Austin area to avoid timeouts on initial load
      // 30.25,-97.80 (SW) to 30.35,-97.70 (NE)
      const defaultBbox = "30.25,-97.80,30.35,-97.70";
      
      const { categories } = req.query;
      
      // Construct Overpass QL query
      // Categories mapping
      const categoryMap: Record<string, string[]> = {
        playground: ['node["leisure"="playground"]', 'way["leisure"="playground"]'],
        park: ['node["leisure"="park"]', 'way["leisure"="park"]'],
        museum: ['node["tourism"="museum"]', 'way["tourism"="museum"]'],
        gallery: ['node["tourism"="gallery"]', 'way["tourism"="gallery"]'],
        science_centre: ['node["amenity"="science_centre"]', 'way["amenity"="science_centre"]'],
        planetarium: ['node["amenity"="planetarium"]', 'way["amenity"="planetarium"]'],
      };

      const selectedCategories = (categories as string)?.split(',') || Object.keys(categoryMap);
      
      let queryParts: string[] = [];
      selectedCategories.forEach(cat => {
        const key = cat.toLowerCase().trim();
        if (categoryMap[key]) {
          queryParts.push(...categoryMap[key]);
        }
      });

      // If no valid categories, use all
      if (queryParts.length === 0) {
        Object.values(categoryMap).forEach(parts => queryParts.push(...parts));
      }

      // Construct the full query
      // [bbox:...] is set globally for the query
      // Increased timeout to 90s
      const bbox = (req.query.bbox as string) || defaultBbox;
      
      const query = `
        [out:json][timeout:90][bbox:${bbox}];
        (
          ${queryParts.map(part => `${part};`).join('\n')}
        );
        out center;
      `;

      console.log("Fetching from Overpass:", query);

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform OSM data to our simple schema
      const results = data.elements.map((el: any) => {
        const tags = el.tags || {};
        let type = "unknown";
        
        if (tags.leisure === 'playground') type = 'playground';
        else if (tags.leisure === 'park') type = 'park';
        else if (tags.tourism === 'museum') type = 'museum';
        else if (tags.tourism === 'gallery') type = 'gallery';
        else if (tags.amenity === 'science_centre') type = 'science_centre';
        else if (tags.amenity === 'planetarium') type = 'planetarium';

        // Use center for ways, or lat/lon for nodes
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;

        return {
          id: el.id,
          lat,
          lon,
          name: tags.name || `${type} (Unnamed)`,
          type,
          tags
        };
      }).filter((el: any) => el.lat && el.lon); // Filter out any entries without coordinates

      res.json(results);

    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to fetch map data" });
    }
  });

  return httpServer;
}
