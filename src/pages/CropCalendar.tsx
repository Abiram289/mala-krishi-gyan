import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Droplets, Sprout, Sun, CloudRain, Bug, Scissors, Loader, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

interface CropPrediction {
  id: string;
  crop: string;
  stage: string;
  action: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface WeatherPrediction {
  date: string;
  condition: string;
  impact: string;
  icon: string;
}

interface WeekActivity {
  text: string;
  icon: string;
}

interface Week {
  title: string;
  activities: WeekActivity[];
}

interface CalendarData {
  season: string;
  rainfall_period: string;
  month: string;
  predictions: CropPrediction[];
  weather_guidance: WeatherPrediction[];
  monthly_schedule: { weeks: Week[] };
  district_note: string;
}

export default function CropCalendar() {
  const { t } = useLanguage();
  
  const [currentMonth] = useState(new Date().getMonth());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch crop calendar data from API
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiClient.getCropCalendar(currentMonth + 1);
        setCalendarData(data);
        
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Failed to load crop calendar data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [currentMonth]);

  const getIcon = (iconName: string, size = "h-4 w-4") => {
    const className = size;
    switch (iconName) {
      case 'sprout': return <Sprout className={className} />;
      case 'droplets': return <Droplets className={className} />;
      case 'bug': return <Bug className={className} />;
      case 'scissors': return <Scissors className={className} />;
      case 'sun': return <Sun className={className} />;
      case 'cloud-rain': return <CloudRain className={className} />;
      default: return <Calendar className={className} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kerala-spice via-kerala-coconut to-kerala-rice p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="outline" size="sm" className="bg-white/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{t('calendar')}</h1>
          </div>
          
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <Loader className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Kerala crop calendar...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !calendarData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kerala-spice via-kerala-coconut to-kerala-rice p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="outline" size="sm" className="bg-white/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{t('calendar')}</h1>
          </div>
          
          <Card className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Calendar</h3>
              <p className="text-muted-foreground mb-4">{error || 'Failed to load crop calendar data'}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kerala-spice via-kerala-coconut to-kerala-rice p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('calendar')}</h1>
        </div>
        
        {/* Season and District Info */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{calendarData.season}</h2>
              <p className="text-sm text-muted-foreground">{calendarData.rainfall_period}</p>
            </div>
            {calendarData.district_note && (
              <div className="text-right max-w-md">
                <p className="text-xs text-muted-foreground font-medium">District Advice:</p>
                <p className="text-sm text-foreground">{calendarData.district_note}</p>
              </div>
            )}
          </div>
        </Card>

        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="weather">Weather Impact</TabsTrigger>
            <TabsTrigger value="schedule">Monthly Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                AI Farming Predictions for {calendarData.month}
              </h2>
              <div className="space-y-4">
                {calendarData.predictions && calendarData.predictions.map(prediction => (
                  <Card key={prediction.id} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-primary mt-1">
                          {getIcon(prediction.icon)}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{prediction.crop}</h3>
                            <p className="text-sm text-muted-foreground">{prediction.stage}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">{prediction.action}</h4>
                            <p className="text-sm text-muted-foreground">{prediction.description}</p>
                          </div>
                          <p className="text-sm font-medium">⏰ {prediction.timing}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(prediction.priority)}>
                        {prediction.priority} priority
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-primary" />
                Weather-Based Farming Guidance - {calendarData.season}
              </h2>
              <div className="space-y-4">
                {calendarData.weather_guidance.map((weather, index) => (
                  <Card key={index} className="p-4 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="text-primary">
                        {getIcon(weather.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{weather.date}</h3>
                          <Badge variant="outline">{weather.condition}</Badge>
                        </div>
                        <p className="text-muted-foreground">{weather.impact}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {calendarData.month} Farming Schedule
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {calendarData.monthly_schedule.weeks.map((week, index) => (
                  <Card key={index} className="p-4">
                    <h3 className="font-semibold text-primary mb-3">{week.title}</h3>
                    <ul className="space-y-2 text-sm">
                      {week.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-center gap-2">
                          {getIcon(activity.icon, "h-3 w-3")}
                          {activity.text}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
