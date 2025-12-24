import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SavedPlace } from "@shared/routes";
import { insertSavedPlaceSchema } from "@shared/schema";
import { z } from "zod";

// ============================================
// SEARCH HOOKS (Overpass API proxy)
// ============================================

export function useSearchPlaces(categories: string[]) {
  const categoryString = categories.join(",");
  
  return useQuery({
    queryKey: [api.places.search.path, categoryString],
    queryFn: async () => {
      if (categories.length === 0) return [];
      
      const url = `${api.places.search.path}?categories=${encodeURIComponent(categoryString)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch places");
      return api.places.search.responses[200].parse(await res.json());
    },
    enabled: categories.length > 0,
    staleTime: 0, // Always fetch fresh when categories change
  });
}

// ============================================
// SAVED PLACES HOOKS
// ============================================

export function useSavedPlaces() {
  return useQuery({
    queryKey: [api.savedPlaces.list.path],
    queryFn: async () => {
      const res = await fetch(api.savedPlaces.list.path, { credentials: "include" });
      if (res.status === 401) return []; // Not logged in - return empty
      if (!res.ok) throw new Error("Failed to fetch saved places");
      return api.savedPlaces.list.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useSavePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertSavedPlaceSchema>) => {
      const validated = api.savedPlaces.create.input.parse(data);
      const res = await fetch(api.savedPlaces.create.path, {
        method: api.savedPlaces.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (res.status === 401) {
        throw new Error("401: Unauthorized - Please log in to save places");
      }
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.savedPlaces.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to save place");
      }
      return api.savedPlaces.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savedPlaces.list.path] });
    },
  });
}

export function useDeleteSavedPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.savedPlaces.delete.path, { id });
      const res = await fetch(url, {
        method: api.savedPlaces.delete.method,
        credentials: "include",
      });

      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 404) throw new Error("Place not found");
      if (!res.ok) throw new Error("Failed to delete place");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savedPlaces.list.path] });
    },
  });
}

export function useToggleVisited() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/saved-places/${id}/visited`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 404) throw new Error("Place not found");
      if (!res.ok) throw new Error("Failed to toggle visited status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savedPlaces.list.path] });
    },
  });
}
