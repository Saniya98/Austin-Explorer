import { z } from 'zod';
import { insertSavedPlaceSchema, savedPlaces, osmLocationSchema, SavedPlace } from './schema';

export type { SavedPlace };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  places: {
    // Search for places via Overpass API
    search: {
      method: 'GET' as const,
      path: '/api/places/search',
      input: z.object({
        // Comma separated categories: "playground,museum,park"
        categories: z.string().optional(),
        // Optional bounding box, defaults to Austin
        bbox: z.string().optional(), 
      }).optional(),
      responses: {
        200: z.array(osmLocationSchema),
        500: errorSchemas.internal,
      },
    },
  },
  savedPlaces: {
    list: {
      method: 'GET' as const,
      path: '/api/saved-places',
      responses: {
        200: z.array(z.custom<typeof savedPlaces.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/saved-places',
      input: insertSavedPlaceSchema,
      responses: {
        201: z.custom<typeof savedPlaces.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/saved-places/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    toggleFavorited: {
      method: 'PATCH' as const,
      path: '/api/saved-places/:id/favorite',
      responses: {
        200: z.custom<typeof savedPlaces.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
