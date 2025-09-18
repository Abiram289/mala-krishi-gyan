import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FarmProfileForm = () => {
  const [farmDetails, setFarmDetails] = useState({
    landSize: "",
    soilType: "",
    cropsGrown: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFarmDetails((prevDetails) => ({
      ...prevDetails,
      [id]: value,
    }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setFarmDetails((prevDetails) => ({
      ...prevDetails,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Farm Details Submitted:", farmDetails);
    // In a real application, you would send this data to a backend API
    alert("Farm details submitted! (Check console for data)");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Farm Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="landSize">Land Size (e.g., acres, hectares)</Label>
            <Input
              id="landSize"
              type="text"
              placeholder="Enter land size"
              value={farmDetails.landSize}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soilType">Soil Type</Label>
            <Select value={farmDetails.soilType} onValueChange={(value) => handleSelectChange(value, "soilType")}>
              <SelectTrigger id="soilType">
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loamy">Loamy</SelectItem>
                <SelectItem value="sandy">Sandy</SelectItem>
                <SelectItem value="clay">Clay</SelectItem>
                <SelectItem value="silty">Silty</SelectItem>
                <SelectItem value="peaty">Peaty</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cropsGrown">Crops Grown (comma-separated)</Label>
            <Textarea
              id="cropsGrown"
              placeholder="e.g., Rice, Coconut, Spices"
              value={farmDetails.cropsGrown}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" className="w-full">
            Save Farm Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmProfileForm;