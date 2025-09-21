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
  const { profile, profileLoading, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local form state, initialized from the global profile
  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    farm_size: "",
    soil_type: "", // Re-add soil_type
  });

  useEffect(() => {
    // When the global profile data loads, update the local form state
    if (profile) {
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

  const handleLocationCapture = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({ ...prev, location: `${latitude}, ${longitude}` }));
        toast({ title: "Location Captured!" });
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
    try {
      const response = await fetchWithAuth("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          farm_size: parseFloat(formData.farm_size) || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({ title: "Success!", description: "Your profile has been updated." });
      // Refetch the global profile data to update the whole app
      refetchProfile();

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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmProfileForm;