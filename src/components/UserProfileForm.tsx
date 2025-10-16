import React, { useState, useEffect } from 'react';
import { useAuth } from "@/App";
import { apiClient, District, SoilType } from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from '@/App'; // Import Profile interface

interface UserProfileFormProps {
  onProfileUpdated: () => void; // Callback to refresh profile data in parent
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onProfileUpdated }) => {
  const { profile, user, refetchProfile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: '',
    farm_size: null,
    district_id: null,
    soil_type_id: null,
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [soilTypes, setSoilTypes] = useState<SoilType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        farm_size: profile.farm_size || null,
        district_id: profile.district_id || null,
        soil_type_id: profile.soil_type_id || null,
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const fetchedDistricts = await apiClient.getDistricts();
        setDistricts(fetchedDistricts);
        const fetchedSoilTypes = await apiClient.getSoilTypes();
        setSoilTypes(fetchedSoilTypes);
      } catch (error) {
        console.error("Failed to fetch master data:", error);
        toast({
          title: "Error",
          description: "Could not load districts or soil types.",
          variant: "destructive",
        });
      }
    };
    fetchMasterData();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value, // Handle empty string for numbers/selects
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseInt(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.updateProfile(formData);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      refetchProfile(); // Refresh profile data in AuthProvider
      onProfileUpdated(); // Notify parent component
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name || ''}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="farm_size">Farm Size (acres)</Label>
            <Input
              id="farm_size"
              name="farm_size"
              type="number"
              step="0.1"
              value={formData.farm_size || ''}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="district_id">District</Label>
            <Select
              name="district_id"
              value={formData.district_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('district_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map(district => (
                  <SelectItem key={district.district_id} value={district.district_id.toString()}>
                    {district.district_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="soil_type_id">Soil Type</Label>
            <Select
              name="soil_type_id"
              value={formData.soil_type_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('soil_type_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your soil type" />
              </SelectTrigger>
              <SelectContent>
                {soilTypes.map(soilType => (
                  <SelectItem key={soilType.soil_type_id} value={soilType.soil_type_id.toString()}>
                    {soilType.soil_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserProfileForm;