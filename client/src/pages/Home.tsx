import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import MapComponent from "@/components/Map";

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "playground", "park", "museum"
  ]);
  const [searchPlaces, setSearchPlaces] = useState("");
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectPlace = (lat: number, lon: number) => {
    setFlyToCoords([lat, lon]);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <Sidebar
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onSelectPlace={handleSelectPlace}
        searchPlaces={searchPlaces}
        onSearchPlacesChange={setSearchPlaces}
      />
      
      <main className="flex-1 relative h-full">
        <MapComponent 
          categories={selectedCategories} 
          flyToCoords={flyToCoords}
          searchQuery={searchPlaces}
        />
      </main>
    </div>
  );
}
