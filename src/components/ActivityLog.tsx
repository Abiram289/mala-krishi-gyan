import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, Plus, Sprout, Droplets, Bug, Scissors, Mic, MicOff, Volume2, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";
import { activityService, type Activity, type ActivityCreate } from "@/services/activityService";

export const ActivityLog = () => {
  const { t, language } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'planting': return <Sprout className="h-6 w-6" />;
      case 'watering': return <Droplets className="h-6 w-6" />;
      case 'fertilizing': return <Bug className="h-6 w-6" />;
      case 'harvesting': return <Scissors className="h-6 w-6" />;
      default: return <Clock className="h-6 w-6" />;
    }
  };

  const getActivityTypeText = (type: string) => {
    const types = {
      'planting': {
        en: 'Planting',
        ml: 'നടീൽ'
      },
      'watering': {
        en: 'Watering',
        ml: 'നനയ്ക്കൽ'
      },
      'fertilizing': {
        en: 'Fertilizing',
        ml: 'വളപ്രയോഗം'
      },
      'harvesting': {
        en: 'Harvesting',
        ml: 'വിളവെടുപ്പ്'
      }
    };
    return types[type as keyof typeof types]?.[language] || type;
  };

  const getStatusText = (status: string) => {
    const statuses = {
      'scheduled': {
        en: 'Scheduled',
        ml: 'ആസൂത്രിതം'
      },
      'pending': {
        en: 'Pending', 
        ml: 'തീർപ്പുകൽപ്പിക്കാത്തത്'
      },
      'completed': {
        en: 'Completed',
        ml: 'പൂർത്തിയായി'
      }
    };
    return statuses[status as keyof typeof statuses]?.[language] || status;
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

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const fetchedActivities = await activityService.getActivities();
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update activity title when transcript changes
  if (transcript && transcript !== newActivity.title) {
    setNewActivity(prev => ({ ...prev, title: transcript }));
  }

  const todayActivities = activities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.date);
    return activityDate.toDateString() === today.toDateString();
  });

  const handleAddActivity = async () => {
    if (newActivity.title.trim()) {
      try {
        setCreating(true);
        
        const activityData: ActivityCreate = {
          title: newActivity.title,
          type: newActivity.type,
          date: newActivity.date,
          notes: ''
        };
        
        const createdActivity = await activityService.createActivity(activityData);
        
        // Add to local state
        setActivities(prev => [createdActivity, ...prev]);
        
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

        // Reset form
        setNewActivity({
          title: '',
          type: 'planting',
          date: new Date().toISOString().split('T')[0]
        });
        resetTranscript();
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error('Error creating activity:', error);
        toast({
          title: "Error",
          description: "Failed to create activity. Please try again.",
          variant: "destructive"
        });
      } finally {
        setCreating(false);
      }
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'completed' | 'pending' | 'scheduled') => {
    try {
      await activityService.updateActivity(id, { status: newStatus });
      
      // Update local state
      setActivities(prev => prev.map(activity => 
        activity.id === id ? { ...activity, status: newStatus } : activity
      ));
      
      toast({
        title: "Updated",
        description: `Activity status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }
    
    try {
      await activityService.deleteActivity(id);
      
      // Remove from local state
      setActivities(prev => prev.filter(activity => activity.id !== id));
      
      toast({
        title: "Deleted",
        description: "Activity deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      // Use 'ml' for Malayalam voice recognition, undefined for English (defaults to 'en-US')
      const voiceLanguage = language === 'ml' ? 'ml' : undefined;
      console.log('🎤 Activity Log: Starting voice input in', language === 'ml' ? 'Malayalam (ml-IN)' : 'English (en-US)');
      startListening(voiceLanguage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading activities...</span>
          </div>
        </Card>
      </div>
    );
  }

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
                  <label className="text-sm font-medium">
                    {language === 'ml' ? 'പ്രവർത്തനത്തിന്റെ പേര്' : 'Activity Title'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'ml' ? 'പ്രവർത്തനത്തിന്റെ പേര് ടൈപ്പ് ചെയ്യുക...' : 'Enter activity title...'}
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
                    <p className="text-sm text-primary animate-pulse">
                      🎙️ {language === 'ml' ? 'കേൾക്കുന്നു... ഇപ്പോൾ സംസാരിക്കുക' : 'Listening... Speak now'}
                    </p>
                  )}
                  {transcript && (
                    <p className="text-sm text-muted-foreground">
                      {language === 'ml' ? 'കണ്ടെത്തി: "' : 'Detected: "'}{transcript}"
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'ml' ? 'പ്രവർത്തനത്തിന്റെ തരം' : 'Type'}
                  </label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(value: Activity['type']) => setNewActivity({...newActivity, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ml' ? 'പ്രവർത്തനത്തിന്റെ തരം തിരഞ്ഞെടുക്കുക' : 'Select activity type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planting">
                        <div className="flex items-center space-x-2">
                          <Sprout className="h-4 w-4" />
                          <span>{language === 'ml' ? 'നടീൽ' : 'Planting'}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="watering">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4" />
                          <span>{language === 'ml' ? 'നനയ്ക്കൽ' : 'Watering'}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fertilizing">
                        <div className="flex items-center space-x-2">
                          <Bug className="h-4 w-4" />
                          <span>{language === 'ml' ? 'വളപ്രയോഗം' : 'Fertilizing'}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="harvesting">
                        <div className="flex items-center space-x-2">
                          <Scissors className="h-4 w-4" />
                          <span>{language === 'ml' ? 'വിളവെടുപ്പ്' : 'Harvesting'}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'ml' ? 'തീയതി' : 'Date'}
                  </label>
                  <Input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={handleAddActivity} 
                  className="w-full" 
                  disabled={creating || !newActivity.title.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ml' ? 'ചേർക്കുന്നു...' : 'Adding...'}
                    </>
                  ) : (
                    language === 'ml' ? 'പ്രവർത്തനം ചേർക്കുക' : 'Add Activity'
                  )}
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
                    <div>
                      <div className="text-sm font-semibold text-primary mb-1">
                        {getActivityTypeText(activity.type)}
                      </div>
                      <span className="font-medium">{activity.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${getStatusColor(activity.status)} cursor-pointer`}
                      onClick={() => {
                        const nextStatus = activity.status === 'scheduled' ? 'pending' : 
                                         activity.status === 'pending' ? 'completed' : 'scheduled';
                        handleStatusUpdate(activity.id, nextStatus);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(activity.status)}
                        <span className="capitalize text-xs">{getStatusText(activity.status)}</span>
                      </div>
                    </Badge>
                  </div>
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
                    <div className="text-sm font-semibold text-primary mb-1">
                      {getActivityTypeText(activity.type)}
                    </div>
                    <h5 className="font-medium text-card-foreground">{activity.title}</h5>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={`${getStatusColor(activity.status)} cursor-pointer`} 
                    variant="outline"
                    onClick={() => {
                      const nextStatus = activity.status === 'scheduled' ? 'pending' : 
                                       activity.status === 'pending' ? 'completed' : 'scheduled';
                      handleStatusUpdate(activity.id, nextStatus);
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(activity.status)}
                      <span className="capitalize text-xs">{getStatusText(activity.status)}</span>
                    </div>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="p-1 h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};