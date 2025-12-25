import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map as MapIcon, 
  Palette, 
  Landmark, 
  Trees, 
  Baby, 
  Rocket, 
  Telescope,
  ChevronRight,
  ChevronLeft,
  Trash2,
  ExternalLink,
  LogIn,
  LogOut,
  User,
  CheckCircle2,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSavedPlaces, useDeleteSavedPlace, useToggleVisited, useToggleFavorited } from "@/hooks/use-places";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onSelectPlace: (lat: number, lon: number) => void;
  searchPlaces: string;
  onSearchPlacesChange: (query: string) => void;
}

const CATEGORIES = [
  { id: "playground", label: "Playgrounds", icon: Baby, color: "text-rose-500" },
  { id: "park", label: "Parks", icon: Trees, color: "text-green-600" },
  { id: "museum", label: "Museums", icon: Landmark, color: "text-amber-600" },
  { id: "gallery", label: "Galleries", icon: Palette, color: "text-purple-600" },
  { id: "science_centre", label: "Science Centers", icon: Rocket, color: "text-blue-600" },
  { id: "planetarium", label: "Planetariums", icon: Telescope, color: "text-indigo-600" },
];

export function Sidebar({ selectedCategories, onToggleCategory, onSelectPlace, searchPlaces, onSearchPlacesChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: savedPlaces, isLoading } = useSavedPlaces();
  const deleteMutation = useDeleteSavedPlace();
  const toggleVisitedMutation = useToggleVisited();
  const toggleFavoritedMutation = useToggleFavorited();

  const allPlaces = savedPlaces || [];
  
  const favoritedPlaces = allPlaces.filter((place) =>
    place.isFavorited && (
      place.name.toLowerCase().includes(searchPlaces.toLowerCase()) ||
      (place.address && place.address.toLowerCase().includes(searchPlaces.toLowerCase()))
    )
  );
  
  const visitedPlaces = allPlaces.filter((place) =>
    place.visited && (
      place.name.toLowerCase().includes(searchPlaces.toLowerCase()) ||
      (place.address && place.address.toLowerCase().includes(searchPlaces.toLowerCase()))
    )
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-80 bg-background/95 backdrop-blur-md border-r border-border shadow-2xl z-[1000] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                    <MapIcon className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-xl leading-none tracking-tight">AustinKids</h1>
                    <p className="text-xs text-muted-foreground mt-1">Family Friendly Map</p>
                  </div>
                </div>
              </div>
              
              {/* Login/User Section */}
              <div className="mt-4">
                {authLoading ? (
                  <div className="h-9 bg-muted/30 rounded-lg animate-pulse" />
                ) : isAuthenticated && user ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {user.firstName || user.email || "User"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in to save places
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-2 bg-border/50" />

            {/* Content */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-6">
                {/* Activities Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Activities</h3>
                  <div className="space-y-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => onToggleCategory(cat.id)}>
                            <cat.icon className={cn("w-4 h-4", isSelected ? cat.color : "text-muted-foreground")} />
                            <span className="text-sm font-medium">{cat.label}</span>
                          </label>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => onToggleCategory(cat.id)}
                            data-testid={`toggle-${cat.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Search Places */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search places..."
                    value={searchPlaces}
                    onChange={(e) => onSearchPlacesChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-search-places"
                  />
                </div>

                {/* About This Map */}
                <div className="px-1 pt-2">
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-xs mb-1">About this Map</h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-200/70 leading-relaxed">
                      Discover the best family-friendly places in Austin. Data is sourced live from OpenStreetMap to ensure accuracy.
                    </p>
                  </div>
                </div>

                {/* Data Attribution */}
                <div className="px-1 pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    Data from <span className="font-medium">OpenStreetMap</span> powered by <span className="font-medium">Leaflet</span> & <span className="font-medium">Overpass API</span>
                  </p>
                </div>

                {/* Favorited Section - Only show if authenticated */}
                {isAuthenticated && (
                  <div className="space-y-3 pt-4 border-t border-border/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Favorited {favoritedPlaces.length > 0 && `(${favoritedPlaces.length})`}
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">
                        <div className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                      </div>
                    ) : favoritedPlaces.length === 0 ? (
                      <div className="text-center py-3 text-muted-foreground">
                        <p className="text-xs">No favorited places yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {favoritedPlaces.map((place) => {
                          const cat = CATEGORIES.find(c => c.id === place.type) || CATEGORIES[1];
                          const Icon = cat.icon;
                          
                          return (
                            <motion.div
                              key={place.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group bg-card/50 rounded-lg border border-border/30 p-2.5 hover:shadow-sm hover:border-primary/20 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => onSelectPlace(place.lat, place.lon)}
                                >
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Icon className={cn("w-3 h-3", cat.color)} />
                                    <p className="font-semibold text-xs text-foreground">
                                      {place.name}
                                    </p>
                                  </div>
                                  {place.address && (
                                    <p className="text-xs text-muted-foreground/70 line-clamp-1 ml-5">{place.address}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => toggleFavoritedMutation.mutate(place.id)}
                                    className="p-1 rounded text-red-500 hover:text-red-600 transition-colors"
                                    title="Remove from favorites"
                                    data-testid={`unfavorite-${place.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Visited Section - Only show if authenticated */}
                {isAuthenticated && (
                  <div className="space-y-3 pt-4 border-t border-border/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Visited {visitedPlaces.length > 0 && `(${visitedPlaces.length})`}
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">
                        <div className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                      </div>
                    ) : visitedPlaces.length === 0 ? (
                      <div className="text-center py-3 text-muted-foreground">
                        <p className="text-xs">No visited places yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visitedPlaces.map((place) => {
                          const cat = CATEGORIES.find(c => c.id === place.type) || CATEGORIES[1];
                          const Icon = cat.icon;
                          
                          return (
                            <motion.div
                              key={place.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-900/30 p-2.5 hover:shadow-sm transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => onSelectPlace(place.lat, place.lon)}
                                >
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Icon className={cn("w-3 h-3", cat.color)} />
                                    <p className="font-semibold text-xs text-foreground">
                                      {place.name}
                                    </p>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                      Visited
                                    </Badge>
                                  </div>
                                  {place.address && (
                                    <p className="text-xs text-muted-foreground/70 line-clamp-1 ml-5">{place.address}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => toggleVisitedMutation.mutate(place.id)}
                                    className="p-1 rounded text-green-600 hover:text-green-700 transition-colors"
                                    title="Mark as not visited"
                                    data-testid={`toggle-visited-${place.id}`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteMutation.mutate(place.id)}
                                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                                    data-testid={`delete-place-${place.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        size="icon"
        className={cn(
          "fixed top-6 z-[1000] shadow-lg transition-all duration-300 rounded-xl",
          isOpen ? "left-[336px]" : "left-6"
        )}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </Button>
    </>
  );
}
