import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import { Icon, DivIcon, LatLngBounds } from "leaflet";
import { useSearchPlaces, useSavePlace, useSavedPlaces, useDeleteSavedPlace, useToggleVisited, useToggleFavorited } from "@/hooks/use-places";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation, Heart, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";

// Custom icons setup with emojis
const createCustomIcon = (type: string, isFavorited: boolean) => {
  const emojiMap: Record<string, string> = {
    playground: "🛝",
    park: "🌳",
    museum: "🏛️",
    gallery: "🖼️",
    science_centre: "🔬",
    planetarium: "🔭",
  };

  const emoji = emojiMap[type] || "📍";

  return new DivIcon({
    className: "bg-transparent",
    html: `
      <div class="relative w-12 h-12 transform transition-transform hover:scale-125">
        <div class="absolute inset-0 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center text-2xl">
          ${emoji}
        </div>
        ${isFavorited ? `
          <div class="absolute -top-1 -right-1 text-base" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
            ❤️
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 16, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

interface MapComponentProps {
  categories: string[];
  flyToCoords: [number, number] | null;
  searchQuery?: string;
}

export default function MapComponent({ categories, flyToCoords, searchQuery = "" }: MapComponentProps) {
  const { data: places, isLoading, isError } = useSearchPlaces(categories);
  const { data: savedPlaces } = useSavedPlaces();
  const saveMutation = useSavePlace();
  const deleteMutation = useDeleteSavedPlace();
  const toggleVisitedMutation = useToggleVisited();
  const toggleFavoritedMutation = useToggleFavorited();
  const { toast } = useToast();
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const austinCoords: [number, number] = [30.2672, -97.7431];

  // Get user's current location on mount, fallback to Austin center
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          // If geolocation is denied or unavailable, use Austin center as fallback
          console.log("Using Austin center as fallback location");
          setUserLocation(austinCoords);
        }
      );
    } else {
      // Fallback if geolocation API not available
      setUserLocation(austinCoords);
    }
  }, [austinCoords]);

  const getSavedPlace = (osmId: number) => {
    return savedPlaces?.find((p) => p.osmId === osmId.toString());
  };

  const handleToggleFavorite = async (place: any) => {
    const saved = getSavedPlace(place.id);
    
    try {
      if (!saved) {
        // Create a new entry with isFavorited = true
        await saveMutation.mutateAsync({
          osmId: place.id.toString(),
          name: place.name || "Unnamed Location",
          lat: place.lat,
          lon: place.lon,
          type: place.type,
          address: place.tags?.['addr:street'] || "",
          notes: "",
          isFavorited: true,
          visited: false,
        });
        toast({
          title: "Added to favorites",
          description: `${place.name || "Location"} has been favorited.`,
          duration: 2000,
        });
      } else {
        // Toggle the isFavorited status
        await toggleFavoritedMutation.mutateAsync(saved.id);
        toast({
          title: saved.isFavorited ? "Removed from favorites" : "Added to favorites",
          description: saved.isFavorited 
            ? `${place.name || "Location"} has been removed from favorites.`
            : `${place.name || "Location"} has been favorited.`,
          duration: 2000,
        });
      }
    } catch (error: any) {
      if (error.message?.includes("401")) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to favorite places.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update this location.",
        });
      }
    }
  };

  const handleToggleVisited = async (place: any) => {
    const saved = getSavedPlace(place.id);
    
    try {
      if (!saved) {
        // Create a new entry with visited = true, isFavorited = false
        const newPlace = await saveMutation.mutateAsync({
          osmId: place.id.toString(),
          name: place.name || "Unnamed Location",
          lat: place.lat,
          lon: place.lon,
          type: place.type,
          address: place.tags?.['addr:street'] || "",
          notes: "",
          isFavorited: false,
          visited: true,
        });
        toast({
          title: "Marked as visited",
          description: `${place.name || "Location"} has been marked as visited.`,
          duration: 2000,
        });
      } else {
        await toggleVisitedMutation.mutateAsync(saved.id);
        toast({
          title: saved.visited ? "Unmarked" : "Marked as visited",
          description: saved.visited 
            ? `${place.name || "Location"} is no longer marked as visited.`
            : `${place.name || "Location"} has been marked as visited.`,
          duration: 2000,
        });
      }
    } catch (error: any) {
      if (error.message?.includes("401")) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to mark places as visited.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update visited status.",
        });
      }
    }
  };

  const handleGetDirections = (place: any) => {
    // Open Google Maps directions in a new tab
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`,
      '_blank'
    );
  };

  // We memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    if (!places) return [];
    
    // Filter by search query if provided
    let filtered = places;
    if (searchQuery.trim()) {
      filtered = places.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Only show up to 100 markers to keep performance high
    // Prioritize named places
    return filtered
      .filter(p => p.name) 
      .slice(0, 100)
      .map((place) => {
        const savedPlace = getSavedPlace(place.id);
        const isFavorited = savedPlace?.isFavorited ?? false;
        const isVisited = savedPlace?.visited ?? false;
        
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lon]}
            icon={createCustomIcon(place.type, isFavorited)}
          >
            <Popup className="bg-transparent border-none shadow-none leaflet-popup-content-wrapper p-0">
              <div className="bg-white rounded-lg p-4 shadow-lg border border-border/20 min-w-[260px]">
                <div className="mb-3">
                  <h3 className="font-semibold text-base leading-tight text-foreground mb-1">
                    {place.name || "Unknown Location"}
                  </h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                      {place.type.replace('_', ' ')}
                    </span>
                  </div>
                  {place.tags?.['addr:street'] && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {place.tags['addr:housenumber'] ? `${place.tags['addr:housenumber']}, ` : ''}
                      {place.tags['addr:street']}
                      {place.tags['addr:city'] ? `, ${place.tags['addr:city']}` : ''}
                      {place.tags['addr:postcode'] ? `, ${place.tags['addr:postcode']}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-3 gap-2">
                  <button
                    onClick={() => handleGetDirections(place)}
                    className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    data-testid={`button-directions-${place.id}`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Directions</span>
                  </button>
                  
                  <button
                    onClick={() => handleToggleFavorite(place)}
                    disabled={saveMutation.isPending || deleteMutation.isPending}
                    className={`flex flex-col items-center gap-0.5 text-xs transition-all cursor-pointer disabled:opacity-50 px-4 py-1.5 rounded-full ${
                      isFavorited 
                        ? "bg-rose-100 text-rose-600" 
                        : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                    }`}
                    data-testid={`button-favorite-${place.id}`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>Favorited</span>
                  </button>
                  
                  <button
                    onClick={() => handleToggleVisited(place)}
                    disabled={toggleVisitedMutation.isPending || saveMutation.isPending}
                    className={`flex flex-col items-center gap-0.5 text-xs transition-all cursor-pointer disabled:opacity-50 px-4 py-1.5 rounded-full ${
                      isVisited 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                    }`}
                    data-testid={`button-visited-${place.id}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isVisited 
                        ? "bg-emerald-500 border-emerald-500" 
                        : "border-gray-400 bg-white"
                    }`}>
                      {isVisited && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span>Mark visited</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      });
  }, [places, savedPlaces, saveMutation.isPending, deleteMutation.isPending, toggleVisitedMutation.isPending, searchQuery]);

  return (
    <div className="w-full h-full relative bg-slate-100">
      <MapContainer
        center={austinCoords}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0 outline-none"
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {markers}
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={new DivIcon({
            className: "bg-transparent",
            html: `
              <div class="relative w-6 h-6">
                <div class="absolute inset-0 rounded-full bg-blue-500 animate-pulse shadow-lg"></div>
                <div class="absolute inset-1 rounded-full bg-blue-600"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })} />
        )}

        <MapController coords={flyToCoords} />
      </MapContainer>

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm shadow-xl rounded-full px-6 py-2 flex items-center gap-3 animate-fade-in-up border border-border/50">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-foreground">Discovering places...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 shadow-xl rounded-full px-6 py-2 flex items-center gap-3 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-700">Unable to load map data</span>
        </div>
      )}

      {/* Hint for empty state */}
      {!isLoading && (!places || places.length === 0) && categories.length > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur shadow-lg rounded-xl px-6 py-4 border border-border/50 max-w-sm text-center">
          <Navigation className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No places found in this view.</p>
          <p className="text-xs text-muted-foreground mt-1">Try zooming out or moving the map to a different area of Austin.</p>
        </div>
      )}
    </div>
  );
}
