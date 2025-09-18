import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, Plus, Sprout, Droplets, Bug, Scissors, Mic, MicOff, Volume2 } from "lucide-react";
import { useLanguage } from "./LanguageToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  type: 'planting' | 'watering' | 'fertilizing' | 'harvesting';
  status: 'completed' | 'pending' | 'scheduled';
  date: Date;
  notes?: string;
}

export const ActivityLog = () => {
  const { t, language } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      title: 'Plant rice seedlings',
      type: 'planting',
      status: 'completed',
      date: new Date('2024-09-12'),
      notes: 'Planted in north field'
    },
    {
      id: '2',
      title: 'Water coconut trees',
      type: 'watering',
      status: 'pending',
      date: new Date('2024-09-14'),
    },
    {
      id: '3',
      title: 'Apply organic fertilizer',
      type: 'fertilizing',
      status: 'scheduled',
      date: new Date('2024-09-15'),
      notes: 'Use compost from home preparation'
    },
    {
      id: '4',
      title: 'Harvest vegetables',
      type: 'harvesting',
      status: 'scheduled',
      date: new Date('2024-09-16'),
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'planting': return <Sprout className="h-4 w-4" />;
      case 'watering': return <Droplets className="h-4 w-4" />;
      case 'fertilizing': return <Bug className="h-4 w-4" />;
      case 'harvesting': return <Scissors className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'pending': return 'bg-accent text-accent-foreground';
      case 'scheduled': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const [newActivity, setNewActivity] = useState({
    title: '',
    type: 'planting' as Activity['type'],
    date: new Date().toISOString().split('T')[0]
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { 
    transcript, 
    isListening, 
    startListening, 
    stopListening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();
  const { speak } = useSpeechSynthesis();

  // Update activity title when transcript changes
  if (transcript && transcript !== newActivity.title) {
    setNewActivity(prev => ({ ...prev, title: transcript }));
  }

  const todayActivities = activities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.date);
    return activityDate.toDateString() === today.toDateString();
  });

  const handleAddActivity = () => {
    if (newActivity.title.trim()) {
      const activity: Activity = {
        id: Date.now().toString(),
        title: newActivity.title,
        type: newActivity.type,
        status: 'scheduled',
        date: new Date(newActivity.date)
      };
      setActivities([...activities, activity]);
      
      // Announce success in the user's selected language
      const successMessage = language === 'ml' 
        ? `${newActivity.title} പ്രവർത്തനം വിജയകരമായി ചേർക്കപ്പെട്ടു`
        : `Activity ${newActivity.title} added successfully`;
      
      speak(successMessage, language);
      
      toast({
        title: language === 'ml' ? "പ്രവർത്തനം ചേർക്കപ്പെട്ടു" : "Activity Added",
        description: language === 'ml' 
          ? "നിങ്ങളുടെ പ്രവർത്തനം വിജയകരമായി ചേർക്കപ്പെട്ടു" 
          : "Your activity has been added successfully",
      });

      setNewActivity({
        title: '',
        type: 'planting',
        date: new Date().toISOString().split('T')[0]
      });
      resetTranscript();
      setIsAddDialogOpen(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening(language);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold text-card-foreground">{t('activitiesTitle')}</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary-light flex-shrink-0 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t('addActivity')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('addActivity')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity Title</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter activity title..."
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      className="flex-1"
                    />
                    {browserSupportsSpeechRecognition && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleVoiceInput}
                        className={`px-3 ${isListening ? 'bg-destructive text-destructive-foreground' : ''}`}
                        title={isListening ? 'Stop recording' : 'Start voice input'}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  {isListening && (
                    <p className="text-sm text-primary animate-pulse">🎙️ Listening... Speak now</p>
                  )}
                  {transcript && (
                    <p className="text-sm text-muted-foreground">Detected: "{transcript}"</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(value: Activity['type']) => setNewActivity({...newActivity, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planting">Planting</SelectItem>
                      <SelectItem value="watering">Watering</SelectItem>
                      <SelectItem value="fertilizing">Fertilizing</SelectItem>
                      <SelectItem value="harvesting">Harvesting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddActivity} className="w-full">
                  Add Activity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {todayActivities.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-primary mb-3">{t('todayTasks')}</h4>
            <div className="space-y-2">
              {todayActivities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-kerala-coconut rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-primary">
                      {getActivityIcon(activity.type)}
                    </div>
                    <span className="font-medium">{activity.title}</span>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(activity.status)}
                      <span className="capitalize text-xs">{activity.status}</span>
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-primary">All Activities</h4>
          {activities.map(activity => (
            <Card key={activity.id} className="p-4 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <h5 className="font-medium text-card-foreground">{activity.title}</h5>
                    <p className="text-sm text-muted-foreground">
                      {activity.date.toLocaleDateString()}
                    </p>
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(activity.status)} variant="outline">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(activity.status)}
                    <span className="capitalize text-xs">{activity.status}</span>
                  </div>
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};