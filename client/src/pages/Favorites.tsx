import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, ExternalLink, CheckSquare, Square, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSavedPlaces, useDeleteSavedPlace, useToggleVisited, useToggleFavorited } from "@/hooks/use-places";
import { useAuth } from "@/hooks/use-auth";

const CATEGORIES: Record<string, string> = {
  playground: "Playground",
  park: "Park", 
  museum: "Museum",
  gallery: "Gallery",
  science_centre: "Science Center",
  planetarium: "Planetarium",
};

export default function Favorites() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: savedPlaces, isLoading } = useSavedPlaces();
  const deleteMutation = useDeleteSavedPlace();
  const toggleVisitedMutation = useToggleVisited();
  const toggleFavoritedMutation = useToggleFavorited();

  const allPlaces = savedPlaces || [];
  const favoritedPlaces = allPlaces.filter(p => p.isFavorited);
  const visitedPlaces = allPlaces.filter(p => p.visited);

  const openDirections = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your favorite places.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Map
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-favorites-title">My Favorites</h1>
            <p className="text-muted-foreground text-sm">Places you've saved for future visits</p>
          </div>
          <Link href="/">
            <Button variant="ghost" data-testid="link-back-to-map">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Map
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : allPlaces.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No saved places yet</p>
            <p className="text-sm mt-2">Go back to the map and click on markers to favorite or mark places as visited.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {favoritedPlaces.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Favorited ({favoritedPlaces.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoritedPlaces.map((place) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-place-name-${place.id}`}>
                              {place.name}
                            </h3>
                            {place.address && (
                              <p className="text-xs text-muted-foreground">{place.address}</p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleFavoritedMutation.mutate(place.id)}
                            className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                            title="Remove from favorites"
                            data-testid={`button-unfavorite-${place.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={place.visited ?? false}
                              onCheckedChange={() => toggleVisitedMutation.mutate(place.id)}
                              data-testid={`checkbox-visited-${place.id}`}
                            />
                            <span className="text-sm">Visited</span>
                          </label>
                          <button
                            onClick={() => openDirections(place.lat, place.lon)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-directions-${place.id}`}
                          >
                            Directions
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-xs font-medium text-muted-foreground">Notes</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {place.notes || "No notes added yet."}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {visitedPlaces.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Visited ({visitedPlaces.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visitedPlaces.map((place) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4 bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/30">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-place-name-${place.id}`}>
                              {place.name}
                            </h3>
                            {place.address && (
                              <p className="text-xs text-muted-foreground">{place.address}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteMutation.mutate(place.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete place"
                            data-testid={`button-delete-${place.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={place.visited ?? false}
                              onCheckedChange={() => toggleVisitedMutation.mutate(place.id)}
                              data-testid={`checkbox-visited-${place.id}`}
                            />
                            <span className="text-sm text-green-700 dark:text-green-300">Visited</span>
                          </label>
                          <button
                            onClick={() => openDirections(place.lat, place.lon)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-directions-${place.id}`}
                          >
                            Directions
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-xs font-medium text-muted-foreground">Notes</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {place.notes || "No notes added yet."}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {favoritedPlaces.length === 0 && visitedPlaces.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No saved places yet</p>
                <p className="text-sm mt-2">Go back to the map and click on markers to favorite or mark places as visited.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
