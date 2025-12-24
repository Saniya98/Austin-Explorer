import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPinOff className="h-10 w-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-gray-900">404 Page Not Found</h1>
            <p className="text-gray-500 font-medium">
              We couldn't find the location you're looking for.
            </p>
          </div>

          <div className="pt-4">
            <Link href="/" className="w-full block">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                Return to Map
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
