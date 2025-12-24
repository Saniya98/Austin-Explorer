import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from "react-leaflet";
import { Icon, DivIcon, LatLngBounds } from "leaflet";
import { useSearchPlaces, useSavePlace, useSavedPlaces } from "@/hooks/use-places";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark, MapPin, Navigation, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";

// Custom icons setup with emojis
const createCustomIcon = (type: string, isSaved: boolean) => {
  const emojiMap: Record<string, string> = {
    playground: "🛝",
    park: "🌳",
    museum: "🏛️",
    gallery: "🖼️",
    science_centre: "🔬",
    planetarium: "🔭",
  };

  const emoji = emojiMap[type] || "📍";
  const savedClass = isSaved ? "ring-4 ring-yellow-400 ring-offset-2" : "";

  return new DivIcon({
    className: "bg-transparent",
    html: `
      <div class="relative w-12 h-12 transform transition-transform hover:scale-125">
        <div class="absolute inset-0 rounded-full bg-white shadow-lg border-3 border-blue-500 ${savedClass} flex items-center justify-center text-2xl">
          ${emoji}
        </div>
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
}

export default function MapComponent({ categories, flyToCoords }: MapComponentProps) {
  const { data: places, isLoading, isError } = useSearchPlaces(categories);
  const { data: savedPlaces } = useSavedPlaces();
  const saveMutation = useSavePlace();
  const { toast } = useToast();
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [isGettingRoute, setIsGettingRoute] = useState(false);
  const routeToPlace = useRef<[number, number] | null>(null);

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

  const handleSave = async (place: any) => {
    try {
      await saveMutation.mutateAsync({
        osmId: place.id.toString(),
        name: place.name || "Unnamed Location",
        lat: place.lat,
        lon: place.lon,
        type: place.type,
        address: place.tags?.['addr:street'] || "",
        notes: "",
      });
      toast({
        title: "Saved!",
        description: `${place.name || "Location"} has been added to your saved places.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save this location. It might already be saved.",
      });
    }
  };

  const isPlaceSaved = (osmId: number) => {
    return savedPlaces?.some((p) => p.osmId === osmId.toString());
  };

  const handleGetDirections = async (place: any) => {
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Unable to Get Directions",
        description: "Could not determine location. Please try again.",
      });
      return;
    }

    setIsGettingRoute(true);
    routeToPlace.current = [place.lat, place.lon];

    try {
      // Use OSRM (Open Source Routing Machine) for free routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${place.lon},${place.lat}?geometries=geojson&steps=true&overview=full`
      );

      if (!response.ok) {
        throw new Error(`Route API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]) as [number, number][];

        setRouteCoords(coords);
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.round(route.duration / 60);
        toast({
          title: "Directions Ready",
          description: `${distanceKm}km away • ${durationMins} min drive`,
          duration: 4000,
        });
      } else {
        throw new Error("No route available");
      }
    } catch (error: any) {
      console.error("Route error:", error);
      toast({
        variant: "destructive",
        title: "Could Not Calculate Route",
        description: "Please try a different location or check your internet connection.",
      });
    } finally {
      setIsGettingRoute(false);
    }
  };

  // We memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    if (!places) return [];
    
    // Only show up to 100 markers to keep performance high
    // Prioritize named places
    return places
      .filter(p => p.name) 
      .slice(0, 100)
      .map((place) => {
        const isSaved = isPlaceSaved(place.id);
        
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lon]}
            icon={createCustomIcon(place.type, !!isSaved)}
          >
            <Popup className="bg-transparent border-none shadow-none">
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight text-foreground">
                    {place.name || "Unknown Location"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {place.type.replace('_', ' ')}
                    </span>
                    {place.tags?.wheelchair === 'yes' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        Accessible
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                   {place.tags?.website && (
                     <a href={place.tags.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block truncate">
                       Visit Website
                     </a>
                   )}
                   {place.tags?.['addr:street'] && (
                     <p className="text-xs text-muted-foreground">{place.tags['addr:street']}</p>
                   )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 font-semibold shadow-md"
                    onClick={() => handleGetDirections(place)}
                    disabled={isGettingRoute || !userLocation}
                  >
                    {isGettingRoute ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Directions
                  </Button>
                  <Button 
                    size="sm" 
                    className={cn(
                      "flex-1 font-semibold shadow-md",
                      isSaved ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-primary hover:bg-primary/90"
                    )}
                    onClick={() => !isSaved && handleSave(place)}
                    disabled={isSaved || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : isSaved ? (
                      <>
                        <Bookmark className="w-4 h-4 mr-2 fill-current" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      });
  }, [places, savedPlaces, saveMutation.isPending, isGettingRoute, userLocation]);

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

        {/* Route polyline */}
        {routeCoords && (
          <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.7} />
        )}
        
        <MapController coords={flyToCoords || routeToPlace.current} />
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
