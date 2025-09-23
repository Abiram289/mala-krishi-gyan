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
import { useLanguage } from "./LanguageToggle";

// Based on research of Kerala soil types with Malayalam translations
const keralaSoilTypes = {
  en: [
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
  ],
  ml: [
    "ലാറ്ററൈറ്റ്",
    "ചുവന്ന മണ്ണ്",
    "അലൂവിയൽ മണ്ണ്",
    "കറുത്ത മണ്ണ്",
    "പീറ്റ് (കാരി)",
    "മണൽ മണ്ണ്",
    "വന മണ്ണ്",
    "ആസിഡ് സലൈൻ മണ്ണ്",
    "തീരദേശ അലൂവിയം",
    "മിശ്ര അലൂവിയം",
  ]
};

// Mapping for soil type values (always store English values in backend)
const soilTypeMapping: Record<string, string> = {
  "ലാറ്ററൈറ്റ്": "Laterite",
  "ചുവന്ന മണ്ണ്": "Red Soil",
  "അലൂവിയൽ മണ്ണ്": "Alluvial Soil",
  "കറുത്ത മണ്ണ്": "Black Soil",
  "പീറ്റ് (കാരി)": "Peat (Kari)",
  "മണൽ മണ്ണ്": "Sandy Soil",
  "വന മണ്ണ്": "Forest Soil",
  "ആസിഡ് സലൈൻ മണ്ണ്": "Acid Saline Soil",
  "തീരദേശ അലൂവിയം": "Coastal Alluvium",
  "മിശ്ര അലൂവിയം": "Mixed Alluvium",
};

// Reverse mapping for display (English to Malayalam)
const soilTypeDisplayMapping: Record<string, string> = {
  "Laterite": "ലാറ്ററൈറ്റ്",
  "Red Soil": "ചുവന്ന മണ്ണ്",
  "Alluvial Soil": "അലൂവിയൽ മണ്ണ്",
  "Black Soil": "കറുത്ത മണ്ണ്",
  "Peat (Kari)": "പീറ്റ് (കാരി)",
  "Sandy Soil": "മണൽ മണ്ണ്",
  "Forest Soil": "വന മണ്ണ്",
  "Acid Saline Soil": "ആസിഡ് സലൈൻ മണ്ണ്",
  "Coastal Alluvium": "തീരദേശ അലൂവിയം",
  "Mixed Alluvium": "മിശ്ര അലൂവിയം",
};

// Kerala districts with Malayalam translations
const keralaDistricts = {
  en: [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta", 
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
  ],
  ml: [
    "തിരുവനന്തപുരം",
    "കൊല്ലം",
    "പത്തനംതിട്ട",
    "ആലപ്പുഴ",
    "കോട്ടയം",
    "ഇടുക്കി",
    "എറണാകുളം",
    "തൃശ്ശൂർ",
    "പാലക്കാട്",
    "മലപ്പുറം",
    "കോഴിക്കോട്",
    "വയനാട്",
    "കണ്ണൂർ",
    "കാസർകോട്",
  ]
};

// District mapping (always store English values in backend)
const districtMapping: Record<string, string> = {
  "തിരുവനന്തപുരം": "Thiruvananthapuram",
  "കൊല്ലം": "Kollam",
  "പത്തനംതിട്ട": "Pathanamthitta",
  "ആലപ്പുഴ": "Alappuzha",
  "കോട്ടയം": "Kottayam",
  "ഇടുക്കി": "Idukki",
  "എറണാകുളം": "Ernakulam",
  "തൃശ്ശൂർ": "Thrissur",
  "പാലക്കാട്": "Palakkad",
  "മലപ്പുറം": "Malappuram",
  "കോഴിക്കോട്": "Kozhikode",
  "വയനാട്": "Wayanad",
  "കണ്ണൂർ": "Kannur",
  "കാസർകോട്": "Kasaragod",
};

// Reverse mapping for display (English to Malayalam)
const districtDisplayMapping: Record<string, string> = {
  "Thiruvananthapuram": "തിരുവനന്തപുരം",
  "Kollam": "കൊല്ലം",
  "Pathanamthitta": "പത്തനംതിട്ട",
  "Alappuzha": "ആലപ്പുഴ",
  "Kottayam": "കോട്ടയം",
  "Idukki": "ഇടുക്കി",
  "Ernakulam": "എറണാകുളം",
  "Thrissur": "തൃശ്ശൂർ",
  "Palakkad": "പാലക്കാട്",
  "Malappuram": "മലപ്പുറം",
  "Kozhikode": "കോഴിക്കോട്",
  "Wayanad": "വയനാട്",
  "Kannur": "കണ്ണൂർ",
  "Kasaragod": "കാസർകോട്",
};

const FarmProfileForm = () => {
  // Get global profile state and functions from the Auth context
  const { profile, profileLoading, refetchProfile, user } = useAuth();
  const { toast } = useToast();
  const { language, t } = useLanguage();
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
    district: "",
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
        district: profile.district || "",
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

  const handleDistrictChange = (value: string) => {
    setFormData((prev) => ({ ...prev, district: value }));
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
      // Always store English values in backend
      soil_type: soilTypeMapping[formData.soil_type] || formData.soil_type,
      district: districtMapping[formData.district] || formData.district,
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
              {t('profileTitle')} {language === 'ml' ? 'വിവരങ്ങൾ' : 'Information'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('welcomeProfile')}, {profile.username || user?.email}!
            </p>
          </div>
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {language === 'ml' ? 'പ്രൊഫൈല് എഡിറ്റ് ചെയ്യുക' : 'Edit Profile'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('fullName')}</Label>
                <p className="text-lg font-medium">
                  {profile.full_name || (language === 'ml' ? 'നൽകിയിട്ടില്ല' : "Not provided")}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('location')}
                </Label>
                <p className="text-lg">
                  {parseLocationDisplay(profile.location)}
                </p>
                {profile.location && (
                  <p className="text-xs text-muted-foreground">
                    {language === 'ml' ? 'കാലാവസ്ഥയും പ്രാദേശിക ഉപദേശങ്ങൾക്കുള്ള കോങ്ക്രിക്രീേസുകൾ' : 'Coordinates for weather and regional advice'}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ml' ? 'കേരള ജില്ല' : 'Kerala District'}
                </Label>
                <p className="text-lg font-medium">
                  {profile.district 
                    ? (language === 'ml' ? districtDisplayMapping[profile.district] || profile.district : profile.district)
                    : (language === 'ml' ? 'നൽകിയിട്ടില്ല' : "Not provided")
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {t('farmSize')}
                </Label>
                <p className="text-lg font-medium">
                  {profile.farm_size 
                    ? `${profile.farm_size} ${language === 'ml' ? 'ഏക്കര്' : 'acres'}` 
                    : (language === 'ml' ? 'നൽകിയിട്ടില്ല' : "Not provided")
                  }
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t('soilType')}
                </Label>
                <div className="mt-2">
                  {profile.soil_type ? (
                    <Badge variant="secondary" className="text-sm">
                      {language === 'ml' 
                        ? soilTypeDisplayMapping[profile.soil_type] || profile.soil_type 
                        : profile.soil_type
                      }
                    </Badge>
                  ) : (
                    <p className="text-lg">{language === 'ml' ? 'നൽകിയിട്ടില്ല' : "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {(!profile.full_name || !profile.location || !profile.district || !profile.farm_size || !profile.soil_type) && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 {language === 'ml' 
                  ? 'വ്യക്തിഗത കൃഷി ഉപദേശങ്ങൾയും കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾയും ലഭിക്കാൻ നിങ്ങളുടെ പ്രൊഫൈല് പൂര്ത്തിയാക്കുക!' 
                  : 'Complete your profile to get personalized farming advice and weather alerts!'
                }
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
          {profile 
            ? (language === 'ml' ? 'പ്രൊഫൈല് എഡിറ്റ് ചെയ്യുക' : "Edit Profile")
            : (language === 'ml' ? 'നിങ്ങളുടെ പ്രൊഫൈല് പൂര്ത്തിയാക്കുക' : "Complete Your Profile")
          }
        </CardTitle>
        {profile && (
          <Button 
            onClick={() => setIsEditing(false)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {language === 'ml' ? 'റദ്ദുചെയ്യുക' : 'Cancel'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('fullName')}</Label>
            <Input 
              id="full_name" 
              placeholder={language === 'ml' ? 'നിങ്ങളുടെ പൂര്ണ്ണ നാമം നൽകുക' : "Enter your full name"} 
              value={formData.full_name} 
              onChange={handleChange} 
              disabled={isSubmitting} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t('location')}</Label>
            <div className="flex gap-2">
              <Input 
                id="location" 
                placeholder={language === 'ml' ? 'അക്ഷാംശ, രേഖാംശ' : "latitude, longitude"} 
                value={formData.location} 
                onChange={handleChange} 
                disabled={isSubmitting} 
              />
              <Button type="button" onClick={handleLocationCapture} disabled={isSubmitting}>
                {language === 'ml' ? 'സ്ഥലം കണ്ടെത്തുക' : 'Get Location'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ml' 
                ? '"സ്ഥലം കണ്ടെത്തുക" ക്ലിക്ക് ചെയ്ത് നിങ്ങളുടെ കോണാഇൻറ്റ്സ വിവരങ്ങൾ സ്വയങ്ക്രിയമായി ഭരിക്കാൻ.' 
                : 'Click "Get Location" to automatically fill your coordinates.'
              }
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">{language === 'ml' ? 'കേരള ജില്ല' : 'Kerala District'}</Label>
            <Select value={formData.district} onValueChange={handleDistrictChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ml' ? 'നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക' : "Select your district"} />
              </SelectTrigger>
              <SelectContent>
                {keralaDistricts[language].map((district, index) => (
                  <SelectItem key={district} value={language === 'ml' ? district : keralaDistricts.en[index]}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {language === 'ml' 
                ? 'പ്രാദേശിക കൃഷി ഉപദേശങ്ങൾക്കായി നിങ്ങളുടെ കേരള ജില്ല തിരഞ്ഞെടുക്കുക.' 
                : 'Select your Kerala district for region-specific farming advice.'
              }
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm_size">{t('farmSize')}</Label>
            <Input 
              id="farm_size" 
              type="number" 
              placeholder={language === 'ml' ? 'കൃഷിയിടത്തിന്റെ വലുപ്പം നൽകുക' : "Enter farm size"} 
              value={formData.farm_size} 
              onChange={handleChange} 
              disabled={isSubmitting} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soil_type">{t('soilType')}</Label>
            <Select value={formData.soil_type} onValueChange={handleSoilTypeChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ml' ? 'നിങ്ങളുടെ മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക' : "Select your soil type"} />
              </SelectTrigger>
              <SelectContent>
                {keralaSoilTypes[language].map((soil, index) => (
                  <SelectItem key={soil} value={language === 'ml' ? soil : keralaSoilTypes.en[index]}>
                    {soil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {language === 'ml' 
                ? 'നിങ്ങളുടെ കൃഷിയിടത്തിന് ഇണങ്ങുന്ന മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക.' 
                : 'Select the soil type that best matches your farm.'
              }
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1 flex items-center gap-2" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting 
                ? (language === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : "Saving...") 
                : (language === 'ml' ? 'പ്രൊഫൈല് സേവ് ചെയ്യുക' : "Save Profile")
              }
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
                {language === 'ml' ? 'റദ്ദുചെയ്യുക' : 'Cancel'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmProfileForm;