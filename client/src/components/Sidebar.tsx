import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map as MapIcon, 
  Bookmark, 
  Search, 
  Palette, 
  Landmark, 
  Trees, 
  Baby, 
  Rocket, 
  Telescope,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSavedPlaces, useDeleteSavedPlace } from "@/hooks/use-places";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onSelectPlace: (lat: number, lon: number) => void;
}

const CATEGORIES = [
  { id: "playground", label: "Playgrounds", icon: Baby, color: "text-rose-500" },
  { id: "park", label: "Parks", icon: Trees, color: "text-green-600" },
  { id: "museum", label: "Museums", icon: Landmark, color: "text-amber-600" },
  { id: "gallery", label: "Galleries", icon: Palette, color: "text-purple-600" },
  { id: "science_centre", label: "Science Centers", icon: Rocket, color: "text-blue-600" },
  { id: "planetarium", label: "Planetariums", icon: Telescope, color: "text-indigo-600" },
];

export function Sidebar({ selectedCategories, onToggleCategory, onSelectPlace }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"explore" | "saved">("explore");
  const { data: savedPlaces, isLoading } = useSavedPlaces();
  const deleteMutation = useDeleteSavedPlace();

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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <MapIcon className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl leading-none tracking-tight">AustinKids</h1>
                  <p className="text-xs text-muted-foreground mt-1">Family Friendly Map</p>
                </div>
              </div>

              <div className="flex p-1 bg-muted/50 rounded-lg">
                <button
                  onClick={() => setActiveTab("explore")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    activeTab === "explore" 
                      ? "bg-white text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Search className="w-4 h-4" />
                  Explore
                </button>
                <button
                  onClick={() => setActiveTab("saved")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    activeTab === "saved" 
                      ? "bg-white text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                  {savedPlaces && savedPlaces.length > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {savedPlaces.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <Separator className="my-2 bg-border/50" />

            {/* Content */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-6">
                {activeTab === "explore" ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Filters</h3>
                      <div className="space-y-1 mt-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => onToggleCategory(cat.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 border cursor-pointer",
                              selectedCategories.includes(cat.id)
                                ? "bg-card border-primary/20 shadow-sm"
                                : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg bg-background", selectedCategories.includes(cat.id) ? "shadow-sm" : "")}>
                                <cat.icon className={cn("w-4 h-4", selectedCategories.includes(cat.id) ? cat.color : "text-muted-foreground")} />
                              </div>
                              <span className="font-medium text-sm">{cat.label}</span>
                            </div>
                            {selectedCategories.includes(cat.id) && (
                              <motion.div
                                layoutId="check"
                                className="w-2 h-2 rounded-full bg-primary"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-2 pt-4">
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">About this Map</h4>
                        <p className="text-xs text-blue-800/80 leading-relaxed">
                          Discover the best family-friendly spots in Austin. Data is sourced live from OpenStreetMap to ensure accuracy.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Saved Places</h3>
                    
                    {isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading...</p>
                      </div>
                    ) : savedPlaces?.length === 0 ? (
                      <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border mx-2">
                        <Bookmark className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">No saved places yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Click on map markers to save them here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedPlaces?.map((place) => {
                          const cat = CATEGORIES.find(c => c.id === place.type) || CATEGORIES[1];
                          const Icon = cat.icon;
                          
                          return (
                            <motion.div
                              key={place.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group bg-card rounded-xl border border-border/50 p-3 hover:shadow-md hover:border-primary/20 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => onSelectPlace(place.lat, place.lon)}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon className={cn("w-3 h-3", cat.color)} />
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/50">
                                      {cat.label}
                                    </Badge>
                                  </div>
                                  <h4 className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {place.name}
                                  </h4>
                                  {place.address && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{place.address}</p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => onSelectPlace(place.lat, place.lon)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteMutation.mutate(place.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
