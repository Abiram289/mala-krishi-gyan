import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/lib/apiClient";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, User, MapPin, Layers, Ruler, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Based on research of Kerala soil types
const keralaSoilTypes = [
  "Laterite",
  "Red Soil",
  "Alluvial Soil",
  "Black Soil",
  "Peat (Kari)",
  "Sandy Soil",
  "Forest Soil",
  "Acid Saline Soil",
  "Coastal Alluvium",
  "Mixed Alluvium",
];

const FarmProfileForm = () => {
  // Get global profile state and functions from the Auth context
  const { profile, profileLoading, refetchProfile, user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Helper function to parse and display location
  const parseLocationDisplay = (location: string | null): string => {
    if (!location) return "Not provided";
    
    // Check if location already has readable format
    if (location.includes('(') && location.includes(')')) {
      return location; // Already formatted with address + coordinates
    }
    
    // Check if it's just coordinates (lat, lon format)
    const coordsMatch = location.match(/^([+-]?\d*\.?\d+),\s*([+-]?\d*\.?\d+)$/);
    if (coordsMatch) {
      const [, lat, lon] = coordsMatch;
      return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
    }
    
    return location; // Return as-is if it's already a readable format
  };

  // Local form state, initialized from the global profile
  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    farm_size: "",
    soil_type: "", // Re-add soil_type
  });

  useEffect(() => {
    // When the global profile data loads, update the local form state
    console.log("🔍 Profile data received:", profile);
    if (profile) {
      console.log("📝 Setting form data from profile:", {
        full_name: profile.full_name,
        location: profile.location,
        farm_size: profile.farm_size,
        soil_type: profile.soil_type
      });
      setFormData({
        full_name: profile.full_name || "",
        location: profile.location || "",
        farm_size: profile.farm_size?.toString() || "",
        soil_type: profile.soil_type || "", // Re-add soil_type
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSoilTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, soil_type: value }));
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        
        // Build a readable address from components
        const parts = [];
        if (address.village) parts.push(address.village);
        else if (address.town) parts.push(address.town);
        else if (address.city) parts.push(address.city);
        
        if (address.state_district && !parts.includes(address.state_district)) {
          parts.push(address.state_district);
        }
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        const readableAddress = parts.join(', ');
        return readableAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  const handleLocationCapture = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Show coordinates immediately
        const coords = `${latitude}, ${longitude}`;
        setFormData((prev) => ({ ...prev, location: coords }));
        
        // Try to get readable address
        try {
          const readableAddress = await reverseGeocode(latitude, longitude);
          setFormData((prev) => ({ 
            ...prev, 
            location: `${readableAddress} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          }));
          toast({ title: "Location Captured!", description: readableAddress });
        } catch (error) {
          toast({ title: "Location Captured!", description: "Address lookup failed, using coordinates" });
        }
        
        setIsSubmitting(false);
      },
      () => {
        toast({ title: "Could not get location", variant: "destructive" });
        setIsSubmitting(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitData = {
      ...formData,
      farm_size: parseFloat(formData.farm_size) || null,
    };
    
    console.log("📤 Submitting profile data:", submitData);
    
    try {
      const response = await fetchWithAuth("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      
      console.log("📨 Profile update response status:", response.status);

      if (!response.ok) throw new Error("Failed to update profile");

      toast({ title: "Success!", description: "Your profile has been updated." });
      // Refetch the global profile data to update the whole app
      refetchProfile();
      // Exit edit mode to show the updated profile
      setIsEditing(false);

    } catch (error) {
      if (error instanceof Error && !error.message.includes("Authentication error")) {
        console.error(error);
        toast({ title: "Error", description: "Could not update your profile.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display a loading skeleton while the global profile is being fetched
  if (profileLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show profile view by default, edit form when editing
  if (!isEditing && profile) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hello, {profile.username || user?.email}!
            </p>
          </div>
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="text-lg font-medium">
                  {profile.full_name || "Not provided"}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <p className="text-lg">
                  {parseLocationDisplay(profile.location)}
                </p>
                {profile.location && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates for weather and regional advice
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Farm Size
                </Label>
                <p className="text-lg font-medium">
                  {profile.farm_size ? `${profile.farm_size} acres` : "Not provided"}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Soil Type
                </Label>
                <div className="mt-2">
                  {profile.soil_type ? (
                    <Badge variant="secondary" className="text-sm">
                      {profile.soil_type}
                    </Badge>
                  ) : (
                    <p className="text-lg">Not provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {(!profile.full_name || !profile.location || !profile.farm_size || !profile.soil_type) && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 Complete your profile to get personalized farming advice and weather alerts!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          {profile ? "Edit Profile" : "Complete Your Profile"}
        </CardTitle>
        {profile && (
          <Button 
            onClick={() => setIsEditing(false)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" placeholder="Enter your full name" value={formData.full_name} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input id="location" placeholder="latitude, longitude" value={formData.location} onChange={handleChange} disabled={isSubmitting} />
              <Button type="button" onClick={handleLocationCapture} disabled={isSubmitting}>
                Get Location
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Get Location" to automatically fill your coordinates.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm_size">Farm Size (in acres)</Label>
            <Input id="farm_size" type="number" placeholder="Enter farm size" value={formData.farm_size} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soil_type">Soil Type</Label>
            <Select value={formData.soil_type} onValueChange={handleSoilTypeChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select your soil type" />
              </SelectTrigger>
              <SelectContent>
                {keralaSoilTypes.map((soil) => (
                  <SelectItem key={soil} value={soil}>
                    {soil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the soil type that best matches your farm.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1 flex items-center gap-2" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
            {profile && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)} 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmProfileForm;