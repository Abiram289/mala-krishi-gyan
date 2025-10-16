
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiClient, Activity, ActivityCreate, Planting, Crop, Plot, PlantingCreate } from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, PlusCircleIcon, WrenchIcon } from 'lucide-react';
import { format } from 'date-fns';

// --- Main Activities Page Component ---
function Activities() {
  const [view, setView] = useState<'scheduled' | 'done'>('scheduled');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refreshes in child components
  const { toast } = useToast();

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getActivities();
      setActivities(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch activities.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleDataUpdated = (message: string) => {
    toast({ title: "Success", description: message });
    fetchActivities();
    setRefreshKey(prev => prev + 1); // Increment key to trigger refresh
  };

  const filteredActivities = useMemo(() => activities.filter(a => a.status === view), [activities, view]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className='mb-4 md:mb-0'>
          <h1 className="text-3xl font-bold">Activity Scheduler</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your upcoming and completed farm tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManagePlantingsDialog onDataUpdated={() => handleDataUpdated("Plantings have been updated.")} />
          <AddTaskDialog key={refreshKey} onTaskAdded={() => handleDataUpdated("Your activities have been updated.")} />
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button variant={view === 'scheduled' ? 'secondary' : 'ghost'} onClick={() => setView('scheduled')}>
          Scheduled
        </Button>
        <Button variant={view === 'done' ? 'secondary' : 'ghost'} onClick={() => setView('done')}>
          Completed
        </Button>
      </div>

      {isLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <ActivityList
          activities={filteredActivities}
          onCompleteTask={() => handleDataUpdated("Task marked as complete.")}
        />
      )}
    </div>
  );
}

// --- Manage Plantings Dialog ---
function ManagePlantingsDialog({ onDataUpdated }: { onDataUpdated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]); // This will hold the farm-plots
  const [crops, setCrops] = useState<Crop[]>([]);
  const { toast } = useToast();

  // Form state
  const [selectedPlotId, setSelectedPlotId] = useState<string>(''); // This will hold the plot_id of the selected farm
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [plantingDate, setPlantingDate] = useState<Date | undefined>(new Date());

  const fetchPlantings = () => apiClient.getPlantings().then(setPlantings).catch(() => toast({ title: "Error fetching plantings", variant: "destructive" }));

  useEffect(() => {
    if (isOpen) {
      fetchPlantings();
      apiClient.getPlots().then(setPlots).catch(() => toast({ title: "Error fetching farms", variant: "destructive" }));
      apiClient.getCrops().then(setCrops).catch(() => toast({ title: "Error fetching crops", variant: "destructive" }));
    }
  }, [isOpen, toast]);

  const handleCreatePlanting = async () => {
    if (!selectedPlotId || !selectedCropId || !plantingDate) {
      toast({ title: "Missing Fields", description: "Please select a farm, crop, and date.", variant: "destructive" });
      return;
    }

    try {
      const newPlanting: PlantingCreate = {
        plot_id: parseInt(selectedPlotId),
        crop_id: parseInt(selectedCropId),
        planting_date: format(plantingDate, 'yyyy-MM-dd'),
      };

      await apiClient.createPlanting(newPlanting);
      fetchPlantings(); // Refresh list
      onDataUpdated(); // Refresh parent component
      setShowCreateForm(false); // Hide form
      // Reset form fields
      setSelectedPlotId('');
      setSelectedCropId('');
      setPlantingDate(new Date());
    } catch (error) { 
      console.error("Failed to create planting:", error);
      toast({ title: "Failed to create planting", description: "An unexpected error occurred.", variant: "destructive" }) 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button variant="outline"><WrenchIcon className="mr-2 h-4 w-4" /> Manage Plantings</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Manage Plantings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {plantings.length > 0 ? plantings.map(p => (
              <div key={p.planting_id} className="flex justify-between items-center rounded-md border p-3 text-sm">
                <span>{p.crop.crop_name}</span>
                <span className="text-gray-500">{format(new Date(p.planting_date), 'PPP')}</span>
              </div>
            )) : <p className="text-sm text-gray-500">No plantings found. Create one below.</p>}
          </div>
          {showCreateForm ? (
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="font-semibold">Create New Planting</h4>
              
              <div className="space-y-2">
                <Label>Select Farm</Label>
                <Select value={selectedPlotId} onValueChange={setSelectedPlotId}>
                  <SelectTrigger><SelectValue placeholder="Choose a farm..." /></SelectTrigger>
                  <SelectContent>
                    {plots.length > 0 ? plots.map(plot => (
                      <SelectItem key={plot.plot_id} value={plot.plot_id.toString()}>
                        {plot.farms.farm_name}
                      </SelectItem>
                    )) : <div className="p-4 text-sm text-center text-gray-500">No farms found.</div>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Crop</Label>
                <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                  <SelectTrigger><SelectValue placeholder="Choose a crop..." /></SelectTrigger>
                  <SelectContent>{crops.map(c => <SelectItem key={c.crop_id} value={c.crop_id.toString()}>{c.crop_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Planting Date</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{plantingDate ? format(plantingDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={plantingDate} onSelect={setPlantingDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button onClick={handleCreatePlanting}>Save Planting</Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setShowCreateForm(true)}><PlusCircleIcon className="mr-2 h-4 w-4" /> Create New Planting</Button>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Add Task Dialog Component ---
function AddTaskDialog({ onTaskAdded, ...props }: { onTaskAdded: () => void, [key: string]: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState<string>('');
  const [activityType, setActivityType] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      apiClient.getPlantings().then(setPlantings).catch(() => toast({ title: "Error", description: "Failed to fetch plantings.", variant: "destructive"}));
      apiClient.getCrops().then(setCrops).catch(() => toast({ title: "Error", description: "Failed to fetch crops.", variant: "destructive"}));
    }
  }, [isOpen, toast, props.key]);

  const getPlantingLabel = (planting: Planting) => {
    const crop = crops.find(c => c.crop_id === planting.crop_id);
    return `${crop?.crop_name || 'Unknown Crop'} (Planted: ${format(new Date(planting.planting_date), 'PPP')})`;
  };

  const handleSubmit = async () => {
    if (!selectedPlantingId || !activityType || !scheduledFor) {
      toast({ title: "Missing Fields", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    
    const newActivity: ActivityCreate = {
      planting_id: parseInt(selectedPlantingId),
      activity_type: activityType,
      notes,
      scheduled_for: scheduledFor.toISOString(),
    };

    try {
      await apiClient.createActivity(newActivity);
      onTaskAdded();
      setIsOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };

  const activityTypes = ['land_preparation', 'planting', 'watering', 'fertilizing', 'pest_control', 'harvesting', 'post_harvest'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircleIcon className="mr-2 h-4 w-4" /> Add New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Add a New Task</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planting" className="text-right">Planting</Label>
            <Select value={selectedPlantingId} onValueChange={setSelectedPlantingId}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a planting..." /></SelectTrigger>
                <SelectContent>
                    {plantings.length > 0 ? plantings.map(p => <SelectItem key={p.planting_id} value={p.planting_id.toString()}>{getPlantingLabel(p)}</SelectItem>) : <div className="p-4 text-sm text-center text-gray-500">No plantings found. Use the 'Manage Plantings' dialog to create one.</div>}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a type..." /></SelectTrigger>
                <SelectContent>
                    {activityTypes.map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="col-span-3 justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{scheduledFor ? format(scheduledFor, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={scheduledFor} onSelect={setScheduledFor} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Activity List & Item Components ---
interface ActivityListProps {
  activities: Activity[];
  onCompleteTask: () => void;
}

function ActivityList({ activities, onCompleteTask }: ActivityListProps) {
  if (activities.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 mt-4">No tasks in this view.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {activities.map(activity => (
        <ActivityItem key={activity.activity_id} activity={activity} onCompleteTask={onCompleteTask} />
      ))}
    </div>
  );
}

function ActivityItem({ activity, onCompleteTask }: { activity: Activity; onCompleteTask: () => void; }) {
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      await apiClient.completeActivity(activity.activity_id);
      onCompleteTask();
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark task as complete.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
        <CardDescription>
          {activity.status === 'scheduled' ? 'Scheduled for:' : 'Completed on:'}
          <br />
          {format(new Date(activity.status === 'scheduled' ? activity.scheduled_for : activity.completed_at!), 'PPP p')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.notes && <p className="text-sm text-gray-600">{activity.notes}</p>}
        <p className="text-xs text-gray-400 mt-2">Planting ID: {activity.planting_id}</p>
      </CardContent>
      {activity.status === 'scheduled' && (
        <CardFooter>
          <Button onClick={handleComplete} className="w-full">Mark as Done</Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default Activities;
