import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/App";
import AddFarmForm from "@/components/FarmProfileForm"; // We are reusing the file, but it now contains AddFarmForm
import UserProfileForm from "@/components/UserProfileForm";
import { apiClient, Farm } from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Wind } from 'lucide-react';

// A new component to display the list of farms
const FarmList = ({ farms }: { farms: Farm[] }) => {
  if (farms.length === 0) {
    return (
      <p className="text-center text-muted-foreground">You haven't added any farms yet. Add one below to get started!</p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {farms.map((farm) => (
        <Card key={farm.farm_id} className="flex flex-col">
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Map size={20}/>{farm.farm_name}</CardTitle>
            <CardDescription className='flex items-center gap-2 pt-1'><Wind size={16}/>{farm.district.district_name}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {/* In the future, we can add a button here to view plots for this farm */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // A callback function to refetch farms, which we will pass to the AddFarmForm
  const fetchFarms = useCallback(async () => {
    try {
      setIsLoading(true);
      const userFarms = await apiClient.getFarms();
      setFarms(userFarms);
    } catch (error) {
      console.error("Failed to fetch farms", error);
      toast({
        title: "Error",
        description: "Could not fetch your farms. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch farms when the component mounts
  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Farms</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome, {profile?.full_name || user?.email}! Here are all the farms in your profile.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Farm List</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : (
          <FarmList farms={farms} />
        )}
      </div>

      <div className="mt-8">
        <AddFarmForm onFarmAdded={fetchFarms} />
      </div>

      <div className="mt-8">
        <UserProfileForm onProfileUpdated={fetchFarms} /> {/* Pass fetchFarms as a callback */}
      </div>
    </div>
  );
}

export default Profile;