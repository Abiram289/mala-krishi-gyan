import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiClient, District } from "@/lib/apiClient";
import { Save } from "lucide-react";

interface AddFarmFormProps {
  onFarmAdded: () => void; // Callback to refresh the farm list
}

const AddFarmForm = ({ onFarmAdded }: AddFarmFormProps) => {
  const [farmName, setFarmName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch districts from the new master data endpoint
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const districtData = await apiClient.getDistricts();
        setDistricts(districtData);
      } catch (error) {
        console.error("Failed to fetch districts", error);
        toast({
          title: "Error",
          description: "Could not load districts. Please try again later.",
          variant: "destructive",
        });
      }
    };
    fetchDistricts();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName || !selectedDistrict) {
      toast({
        title: "Missing Information",
        description: "Please provide a farm name and select a district.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createFarm({
        farm_name: farmName,
        district_id: parseInt(selectedDistrict, 10),
      });

      toast({
        title: "Success!",
        description: `Farm '${farmName}' has been added.`,
      });
      
      // Clear the form and trigger the callback
      setFarmName("");
      setSelectedDistrict("");
      onFarmAdded();

    } catch (error) {
      console.error("Failed to create farm", error);
      toast({
        title: "Error",
        description: "Could not create the farm. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add a New Farm</CardTitle>
        <CardDescription>
          Add a new farm to your profile to start tracking its activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="farmName">Farm Name</Label>
            <Input
              id="farmName"
              placeholder="e.g., 'My Paddy Field'"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              disabled={isLoading || districts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem
                    key={district.district_id}
                    value={district.district_id.toString()}
                  >
                    {district.district_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full flex items-center gap-2" disabled={isLoading}>
            <Save className="h-4 w-4" />
            {isLoading ? "Adding Farm..." : "Add Farm"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddFarmForm;
