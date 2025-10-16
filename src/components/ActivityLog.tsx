import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiClient, Activity } from "@/lib/apiClient";

// Define the props for our new component
interface ActivityLogProps {
  plantingId: number;
  farmName: string;
  plotName: string;
  cropName: string;
}

// The types of activities a user can log
const ACTIVITY_TYPES = [
    'land_preparation', 'planting', 'watering', 'fertilizing', 'pest_control', 'harvesting', 'post_harvest'
];

export const ActivityLog = ({ plantingId, farmName, plotName, cropName }: ActivityLogProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state for the 'Add Activity' dialog
  const [newActivity, setNewActivity] = useState({
    activity_type: '',
    activity_date: new Date().toISOString().split('T')[0],
    notes: '',
    cost: ''
  });

  const fetchActivities = useCallback(async () => {
    if (!plantingId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.getActivitiesForPlanting(plantingId);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities", error);
      toast({ title: "Error fetching activities", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [plantingId, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.activity_type || !newActivity.activity_date) {
        toast({ title: "Missing Fields", description: "Please select an activity type and date.", variant: "destructive" });
        return;
    }

    setIsCreating(true);
    try {
      await apiClient.createActivity({
        planting_id: plantingId,
        activity_type: newActivity.activity_type,
        activity_date: newActivity.activity_date,
        notes: newActivity.notes,
        cost: parseFloat(newActivity.cost) || undefined,
      });
      toast({ title: "Success", description: "Activity logged successfully." });
      fetchActivities(); // Refresh the list
      setIsAddDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to create activity", error);
      toast({ title: "Error creating activity", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription className="pt-2">
                    Showing activities for <span className="font-semibold text-primary">{cropName}</span>
                    {' in '}<span className="font-semibold text-primary">{plotName}</span>
                    {' at '}<span className="font-semibold text-primary">{farmName}</span>.
                </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log a New Activity</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddActivity} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Activity Type</Label>
                            <Select required value={newActivity.activity_type} onValueChange={(value) => setNewActivity(p => ({...p, activity_type: value}))}>
                                <SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger>
                                <SelectContent>
                                    {ACTIVITY_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="activity_date">Date</Label>
                            <Input id="activity_date" type="date" required value={newActivity.activity_date} onChange={(e) => setNewActivity(p => ({...p, activity_date: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost (Optional)</Label>
                            <Input id="cost" type="number" placeholder="e.g., 1500" value={newActivity.cost} onChange={(e) => setNewActivity(p => ({...p, cost: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input id="notes" placeholder="e.g., Used organic fertilizer" value={newActivity.notes} onChange={(e) => setNewActivity(p => ({...p, notes: e.target.value}))} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                            Log Activity
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center"><Loader2 className="h-6 w-6 animate-spin inline-block"/></div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No activities logged for this planting yet.</p>
        ) : (
          <ul className="space-y-4">
            {activities.map(activity => (
              <li key={activity.activity_id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                    <p className="font-semibold capitalize">{activity.activity_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(activity.activity_date).toLocaleDateString()}</p>
                    {activity.notes && <p className="text-sm">Notes: {activity.notes}</p>}
                </div>
                {activity.cost && <p className="font-semibold">₹{activity.cost}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
